import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { logger } from '../../utils/logger';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  srcSet?: string;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  webpSupport?: boolean;
  retries?: number;
  placeholder?: string;
  cacheStrategy?: 'aggressive' | 'normal' | 'minimal';
}

// Performance-optimized image cache
const imageCache = new Map<string, { blob: Blob; timestamp: number; url: string }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

// WebP support detection
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
})();

// Preload cache
const preloadPromises = new Map<string, Promise<void>>();

function getCachedImageUrl(src: string): string | null {
  const cached = imageCache.get(src);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }
  if (cached) {
    URL.revokeObjectURL(cached.url);
    imageCache.delete(src);
  }
  return null;
}

async function cacheImage(src: string): Promise<string> {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('Network response was not ok');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Manage cache size
    if (imageCache.size >= MAX_CACHE_SIZE) {
      const oldestEntry = imageCache.entries().next().value;
      if (oldestEntry) {
        URL.revokeObjectURL(oldestEntry[1].url);
        imageCache.delete(oldestEntry[0]);
      }
    }

    imageCache.set(src, { blob, timestamp: Date.now(), url });
    return url;
  } catch (error) {
    throw error;
  }
}

function generateOptimizedSrc(
  src: string,
  width?: number,
  height?: number,
  quality: number = 85,
  webpSupport: boolean = true
): string {
  if (!src) return src;

  // Return cached version if available
  const cached = getCachedImageUrl(src);
  if (cached) return cached;

  const params = new URLSearchParams();

  // High-DPI support
  const dpr = window.devicePixelRatio || 1;
  if (width) params.append('w', Math.ceil(width * dpr).toString());
  if (height) params.append('h', Math.ceil(height * dpr).toString());

  params.append('q', quality.toString());
  params.append('fm', webpSupport && supportsWebP ? 'webp' : 'jpg');
  params.append('fit', 'crop');
  params.append('auto', 'enhance,compress');

  // For Unsplash and similar services
  if (src.includes('unsplash.com') || src.includes('images.')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}${params.toString()}`;
  }

  return src;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
  priority = false,
  onLoad,
  onError,
  loading = 'lazy',
  sizes,
  srcSet,
  aspectRatio,
  objectFit = 'cover',
  quality = 85,
  webpSupport = true,
  retries = 2,
  placeholder: _placeholder,
  cacheStrategy = 'normal'
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced intersection observer for lazy loading
  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold: 0.01,
    rootMargin: priority ? '0px' : '200px', // Larger margin for better UX
  });

  // Generate optimized source
  const optimizedSrc = React.useMemo(() => {
    return generateOptimizedSrc(src, width, height, quality, webpSupport);
  }, [src, width, height, quality, webpSupport]);

  // Aggressive caching for performance
  useEffect(() => {
    if (cacheStrategy === 'aggressive' && optimizedSrc && !getCachedImageUrl(optimizedSrc)) {
      cacheImage(optimizedSrc)
        .then(url => setCachedUrl(url))
        .catch(() => {/* Silent fail */});
    }
  }, [optimizedSrc, cacheStrategy]);

  // Preload critical images
  useEffect(() => {
    if (priority && optimizedSrc && !preloadPromises.has(optimizedSrc)) {
      const preloadPromise = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = optimizedSrc;
      });
      preloadPromises.set(optimizedSrc, preloadPromise);
    }
  }, [priority, optimizedSrc]);

  // Start loading image when it becomes visible or if priority is set
  useEffect(() => {
    if ((isIntersecting || priority) && !imageSrc && !imageError) {
      setLoadStartTime(Date.now());
      const sourceToUse = cachedUrl || optimizedSrc;
      setImageSrc(sourceToUse);

      logger.debug('Image loading started', {
        component: 'OptimizedImage',
        src: sourceToUse,
        priority,
        isIntersecting,
        cached: !!cachedUrl,
        webpSupport: webpSupport && supportsWebP
      });
    }
  }, [isIntersecting, priority, optimizedSrc, cachedUrl, imageSrc, imageError]);

  const handleLoad = useCallback((_event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    const loadTime = Date.now() - loadStartTime;

    logger.debug('Image loaded successfully', {
      component: 'OptimizedImage',
      src: imageSrc,
      loadTime: `${loadTime}ms`,
      retryCount,
      webpUsed: webpSupport && supportsWebP
    });

    onLoad?.();
  }, [imageSrc, loadStartTime, retryCount, webpSupport, onLoad]);

  const handleError = useCallback((_event: React.SyntheticEvent<HTMLImageElement>) => {
    const loadTime = Date.now() - loadStartTime;

    if (retryCount < retries) {
      // Exponential backoff retry
      const delay = Math.pow(2, retryCount) * 500;
      setRetryCount(prev => prev + 1);

      logger.warn('Image failed to load, retrying...', {
        component: 'OptimizedImage',
        src: imageSrc,
        attempt: retryCount + 1,
        maxRetries: retries,
        loadTime: `${loadTime}ms`
      });

      retryTimeoutRef.current = setTimeout(() => {
        setImageLoaded(false);
        // Force reload with cache-busting parameter
        const retryUrl = `${optimizedSrc}${optimizedSrc.includes('?') ? '&' : '?'}retry=${retryCount + 1}`;
        setImageSrc(retryUrl);
      }, delay);
    } else {
      // All retries exhausted, try fallback
      logger.warn('Image failed to load after retries, using fallback', {
        component: 'OptimizedImage',
        originalSrc: src,
        fallbackSrc,
        loadTime: `${loadTime}ms`,
        totalRetries: retryCount
      });

      if (imageSrc !== fallbackSrc && fallbackSrc) {
        setImageSrc(fallbackSrc);
        setRetryCount(0);
      } else {
        setImageError(true);
      }
    }

    onError?.(_event.nativeEvent);
  }, [imageSrc, loadStartTime, retryCount, retries, optimizedSrc, src, fallbackSrc, onError]);

  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };

  const imageStyle: React.CSSProperties = {
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageLoaded ? 1 : 0,
  };

  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={containerStyle}
    >
      {/* Placeholder/Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="flex flex-col items-center text-gray-400">
            <svg 
              className="w-8 h-8 animate-pulse" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-xs mt-1">Loading...</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          sizes={sizes}
          srcSet={srcSet}
          style={imageStyle}
          className="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      )}

      {/* Error state */}
      {imageError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="flex flex-col items-center text-gray-500">
            <svg 
              className="w-8 h-8" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-xs mt-1">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility functions for cache management
export const clearImageCache = () => {
  imageCache.forEach(({ url }) => URL.revokeObjectURL(url));
  imageCache.clear();
  preloadPromises.clear();
  logger.info('Image cache cleared');
};

export const getImageCacheStats = () => {
  const totalSize = Array.from(imageCache.values())
    .reduce((total, { blob }) => total + blob.size, 0);

  return {
    cacheSize: imageCache.size,
    preloadCount: preloadPromises.size,
    totalMemoryUsage: totalSize,
    supportsWebP,
    cacheKeys: Array.from(imageCache.keys())
  };
};

// Auto-cleanup on memory pressure (browser support required)
if (typeof window !== 'undefined' && 'memory' in performance) {
  const checkMemoryPressure = () => {
    const memInfo = (performance as any).memory;
    if (memInfo && memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.85) {
      logger.warn('Memory pressure detected, clearing image cache');
      clearImageCache();
    }
  };

  // Check every minute
  setInterval(checkMemoryPressure, 60000);
}

export default OptimizedImage;