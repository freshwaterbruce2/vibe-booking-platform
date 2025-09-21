/**
 * Cloudflare R2 Image Handler
 * Manages hotel images with automatic optimization and zero egress fees
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle image uploads
    if (path.startsWith('/upload') && request.method === 'POST') {
      return await handleImageUpload(request, env);
    }

    // Handle image retrieval with optimization
    if (path.startsWith('/images/')) {
      return await handleImageRequest(request, env);
    }

    // Handle image deletion
    if (path.startsWith('/delete/') && request.method === 'DELETE') {
      return await handleImageDeletion(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleImageUpload(request, env) {
  try {
    // Validate authentication
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const hotelId = formData.get('hotelId');
    const imageType = formData.get('type') || 'gallery'; // main, gallery, room

    if (!file || !hotelId) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `hotels/${hotelId}/${imageType}/${crypto.randomUUID()}.${fileExt}`;

    // Process image before storage
    const processedImage = await processImage(file, {
      maxWidth: 2048,
      maxHeight: 1536,
      quality: 85
    });

    // Upload to R2
    await env.R2_IMAGES.put(fileName, processedImage, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000' // 1 year cache
      },
      customMetadata: {
        hotelId: hotelId,
        type: imageType,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    // Generate variants for different sizes
    await generateImageVariants(fileName, processedImage, env);

    // Store metadata in D1
    await env.D1_DB.prepare(`
      INSERT INTO hotel_images (
        hotel_id, image_url, image_type, variants, uploaded_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      hotelId,
      fileName,
      imageType,
      JSON.stringify({
        thumb: `${fileName}?w=150&h=150`,
        small: `${fileName}?w=400&h=300`,
        medium: `${fileName}?w=800&h=600`,
        large: `${fileName}?w=1600&h=1200`
      }),
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      url: `/images/${fileName}`,
      variants: {
        thumb: `/images/${fileName}?w=150&h=150`,
        small: `/images/${fileName}?w=400&h=300`,
        medium: `/images/${fileName}?w=800&h=600`,
        large: `/images/${fileName}?w=1600&h=1200`
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return new Response('Upload failed', { status: 500 });
  }
}

async function handleImageRequest(request, env) {
  try {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/images/', '');

    // Parse query parameters for transformations
    const width = parseInt(url.searchParams.get('w') || '0');
    const height = parseInt(url.searchParams.get('h') || '0');
    const quality = parseInt(url.searchParams.get('q') || '85');
    const format = url.searchParams.get('f') || 'auto';

    // Generate cache key for transformed image
    const cacheKey = `${imagePath}:w${width}:h${height}:q${quality}:f${format}`;

    // Check KV cache first
    const cached = await env.KV_CACHE.get(cacheKey, { type: 'arrayBuffer' });
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': getContentType(format),
          'Cache-Control': 'public, max-age=31536000',
          'X-Cache': 'HIT'
        }
      });
    }

    // Get original image from R2
    const object = await env.R2_IMAGES.get(imagePath);

    if (!object) {
      // Try to fetch from backup CDN if configured
      if (env.BACKUP_CDN_URL) {
        const backupResponse = await fetch(`${env.BACKUP_CDN_URL}/${imagePath}`);
        if (backupResponse.ok) {
          const imageData = await backupResponse.arrayBuffer();
          // Store in R2 for future requests
          await env.R2_IMAGES.put(imagePath, imageData);
          return new Response(imageData, {
            headers: {
              'Content-Type': backupResponse.headers.get('Content-Type'),
              'Cache-Control': 'public, max-age=31536000',
              'X-Cache': 'BACKUP'
            }
          });
        }
      }
      return new Response('Image not found', { status: 404 });
    }

    const imageBuffer = await object.arrayBuffer();

    // Apply transformations if requested
    let transformedImage = imageBuffer;
    if (width || height || format !== 'auto') {
      transformedImage = await transformImage(imageBuffer, {
        width,
        height,
        quality,
        format
      });

      // Cache transformed image in KV (up to 25MB)
      if (transformedImage.byteLength < 25 * 1024 * 1024) {
        await env.KV_CACHE.put(cacheKey, transformedImage, {
          expirationTtl: 86400 // 24 hours
        });
      }
    }

    // Update access statistics
    await updateImageStats(imagePath, env);

    return new Response(transformedImage, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'X-Cache': 'MISS',
        'ETag': object.httpEtag,
        'Last-Modified': object.uploaded.toUTCString()
      }
    });

  } catch (error) {
    console.error('Image request error:', error);
    return new Response('Failed to retrieve image', { status: 500 });
  }
}

async function handleImageDeletion(request, env) {
  try {
    // Validate authentication
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/delete/', '');

    // Delete from R2
    await env.R2_IMAGES.delete(imagePath);

    // Delete variants
    const variants = ['thumb', 'small', 'medium', 'large'];
    const deletePromises = variants.map(variant =>
      env.R2_IMAGES.delete(`${imagePath}_${variant}`)
    );
    await Promise.all(deletePromises);

    // Remove from D1 database
    await env.D1_DB.prepare(
      'DELETE FROM hotel_images WHERE image_url = ?'
    ).bind(imagePath).run();

    // Clear from KV cache
    const kvList = await env.KV_CACHE.list({ prefix: imagePath });
    const kvDeletePromises = kvList.keys.map(key =>
      env.KV_CACHE.delete(key.name)
    );
    await Promise.all(kvDeletePromises);

    return new Response(JSON.stringify({
      success: true,
      message: 'Image deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return new Response('Deletion failed', { status: 500 });
  }
}

async function processImage(file, options) {
  // Use Cloudflare Image Resizing API if available
  if (self.cf?.image) {
    const response = await fetch(URL.createObjectURL(file), {
      cf: {
        image: {
          width: options.maxWidth,
          height: options.maxHeight,
          quality: options.quality,
          format: 'auto'
        }
      }
    });
    return await response.arrayBuffer();
  }

  // Fallback to original file if Image Resizing not available
  return await file.arrayBuffer();
}

async function transformImage(imageBuffer, options) {
  // Use Cloudflare Image Resizing API
  if (self.cf?.image) {
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const response = await fetch(URL.createObjectURL(blob), {
      cf: {
        image: {
          width: options.width,
          height: options.height,
          quality: options.quality,
          format: options.format === 'auto' ? 'webp' : options.format,
          fit: 'cover'
        }
      }
    });
    return await response.arrayBuffer();
  }

  return imageBuffer;
}

async function generateImageVariants(fileName, imageBuffer, env) {
  const variants = [
    { name: 'thumb', width: 150, height: 150 },
    { name: 'small', width: 400, height: 300 },
    { name: 'medium', width: 800, height: 600 },
    { name: 'large', width: 1600, height: 1200 }
  ];

  const variantPromises = variants.map(async variant => {
    const transformed = await transformImage(imageBuffer, {
      width: variant.width,
      height: variant.height,
      quality: 85,
      format: 'webp'
    });

    const variantPath = `${fileName}_${variant.name}`;
    await env.R2_IMAGES.put(variantPath, transformed, {
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        variant: variant.name,
        originalFile: fileName
      }
    });
  });

  await Promise.all(variantPromises);
}

async function updateImageStats(imagePath, env) {
  try {
    const today = new Date().toISOString().split('T')[0];

    await env.D1_DB.prepare(`
      INSERT INTO image_stats (date, image_path, view_count)
      VALUES (?, ?, 1)
      ON CONFLICT(date, image_path) DO UPDATE SET
        view_count = view_count + 1,
        last_viewed = CURRENT_TIMESTAMP
    `).bind(today, imagePath).run();
  } catch (error) {
    console.error('Stats update error:', error);
  }
}

function getContentType(format) {
  const types = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    avif: 'image/avif',
    auto: 'image/webp'
  };
  return types[format] || 'image/jpeg';
}

// Batch upload handler for multiple images
export async function handleBatchUpload(request, env) {
  try {
    const formData = await request.formData();
    const hotelId = formData.get('hotelId');
    const files = formData.getAll('files');

    if (!hotelId || files.length === 0) {
      return new Response('Missing required fields', { status: 400 });
    }

    const uploadPromises = files.map(async file => {
      const fileExt = file.name.split('.').pop();
      const fileName = `hotels/${hotelId}/gallery/${crypto.randomUUID()}.${fileExt}`;

      const processedImage = await processImage(file, {
        maxWidth: 2048,
        maxHeight: 1536,
        quality: 85
      });

      await env.R2_IMAGES.put(fileName, processedImage, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000'
        }
      });

      return {
        originalName: file.name,
        url: `/images/${fileName}`,
        size: processedImage.byteLength
      };
    });

    const results = await Promise.all(uploadPromises);

    return new Response(JSON.stringify({
      success: true,
      uploaded: results.length,
      images: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    return new Response('Batch upload failed', { status: 500 });
  }
}