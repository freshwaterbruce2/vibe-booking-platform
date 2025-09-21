/**
 * Cloudflare KV and D1 Cache Handler
 * Intelligent caching layer for API responses
 */

export async function getCachedResponse(key, env) {
  try {
    // First check KV for hot data
    const kvCache = await env.KV_CACHE.get(key);
    if (kvCache) {
      console.log(`KV cache hit for ${key}`);
      return kvCache;
    }

    // Then check D1 for larger datasets
    const d1Cache = await env.D1_DB.prepare(
      'SELECT data, expires_at FROM cache WHERE key = ? AND expires_at > ?'
    ).bind(key, Date.now()).first();

    if (d1Cache) {
      console.log(`D1 cache hit for ${key}`);
      // Promote to KV for faster access
      await env.KV_CACHE.put(key, d1Cache.data, {
        expirationTtl: Math.floor((d1Cache.expires_at - Date.now()) / 1000)
      });
      return d1Cache.data;
    }

    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCachedResponse(key, data, env, ttlSeconds = 3600) {
  try {
    // Store in KV for fast access (up to 25MB)
    if (data.length < 25 * 1024 * 1024) {
      await env.KV_CACHE.put(key, data, {
        expirationTtl: ttlSeconds
      });
    }

    // Always store in D1 for persistence
    await env.D1_DB.prepare(
      'INSERT OR REPLACE INTO cache (key, data, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).bind(
      key,
      data,
      Date.now() + (ttlSeconds * 1000),
      Date.now()
    ).run();

    // Update cache statistics
    await updateCacheStats(key, 'set', env);

  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCache(pattern, env) {
  try {
    // List and delete from KV
    const kvList = await env.KV_CACHE.list({ prefix: pattern });
    const deletePromises = kvList.keys.map(key => env.KV_CACHE.delete(key.name));
    await Promise.all(deletePromises);

    // Delete from D1
    await env.D1_DB.prepare(
      'DELETE FROM cache WHERE key LIKE ?'
    ).bind(`${pattern}%`).run();

    console.log(`Invalidated cache for pattern: ${pattern}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

async function updateCacheStats(key, operation, env) {
  try {
    const today = new Date().toISOString().split('T')[0];

    await env.D1_DB.prepare(`
      INSERT INTO cache_stats (date, operation, count, last_key)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(date, operation) DO UPDATE SET
        count = count + 1,
        last_key = excluded.last_key,
        updated_at = CURRENT_TIMESTAMP
    `).bind(today, operation, key).run();
  } catch (error) {
    console.error('Cache stats update error:', error);
  }
}

// Hotel-specific caching
export async function cacheHotelData(hotelId, data, env) {
  const key = `hotel:${hotelId}`;
  const ttl = 86400; // 24 hours for hotel data

  await setCachedResponse(key, JSON.stringify(data), env, ttl);

  // Also cache in searchable format
  await env.D1_DB.prepare(`
    INSERT OR REPLACE INTO hotels (
      hotel_id, name, city, country, rating, price_min,
      amenities, cached_data, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    hotelId,
    data.name,
    data.city,
    data.country,
    data.rating,
    data.priceMin,
    JSON.stringify(data.amenities),
    JSON.stringify(data),
    Date.now()
  ).run();
}

// Search result caching with passion tags
export async function cacheSearchResults(searchParams, results, env) {
  const key = `search:${JSON.stringify(searchParams)}`;
  const ttl = 3600; // 1 hour for search results

  await setCachedResponse(key, JSON.stringify(results), env, ttl);

  // Cache passion-based results for quick filtering
  if (searchParams.passions) {
    for (const passion of searchParams.passions) {
      const passionKey = `passion:${passion}:${searchParams.city || 'any'}`;
      await env.KV_CACHE.put(passionKey, JSON.stringify(results), {
        expirationTtl: ttl
      });
    }
  }
}

// User preference caching
export async function cacheUserPreferences(userId, preferences, env) {
  const key = `user:${userId}:preferences`;

  await env.KV_CACHE.put(key, JSON.stringify(preferences), {
    expirationTtl: 2592000 // 30 days
  });

  // Store in D1 for persistence
  await env.D1_DB.prepare(`
    INSERT OR REPLACE INTO user_preferences (
      user_id, preferences, updated_at
    ) VALUES (?, ?, ?)
  `).bind(userId, JSON.stringify(preferences), Date.now()).run();
}

// Booking draft auto-save
export async function saveBookingDraft(userId, bookingData, env) {
  const key = `draft:${userId}:${bookingData.hotelId}`;

  await env.KV_CACHE.put(key, JSON.stringify(bookingData), {
    expirationTtl: 604800 // 7 days
  });

  // Store in D1 with metadata
  await env.D1_DB.prepare(`
    INSERT OR REPLACE INTO booking_drafts (
      user_id, hotel_id, draft_data, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    userId,
    bookingData.hotelId,
    JSON.stringify(bookingData),
    Date.now(),
    Date.now() + 604800000
  ).run();
}