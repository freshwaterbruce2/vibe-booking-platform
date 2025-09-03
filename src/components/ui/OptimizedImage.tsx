/**
 * Optimized Image Component
 * 
 * Advanced image optimization with lazy loading, progressive enhancement,
 * and performance monitoring
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Camera, AlertTriangle, Loader2 } from 'lucide-react';
import { useInView, usePerformanceMonitor } from '@/utils/frontendOptimization';
import { cn } from '@/utils/cn';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: 'square' | '4:3' | '16:9' | '3:2';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  fallbackSrc,
  priority = false,
  quality = 75,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover'
}) => {
  usePerformanceMonitor(`OptimizedImage-${alt}`);

  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  // Intersection observer for lazy loading
  const [inViewRef, inView] = useInView({
    threshold: 0.1,
    rootMargin: priority ? '0px' : '100px'
  });

  // Optimize image URL
  const optimizedSrc = useMemo(() => {
    if (!src) return '';

    try {
      const url = new URL(src);
      
      // For Unsplash images, add optimization parameters
      if (url.hostname.includes('unsplash.com')) {
        url.searchParams.set('w', width.toString());
        url.searchParams.set('h', height.toString());
        url.searchParams.set('q', quality.toString());
        url.searchParams.set('fit', 'crop');
        return url.toString();
      }

      return src;
    } catch {
      return src;
    }
  }, [src, width, height, quality]);

  // Generate placeholder
  const placeholder = useMemo(() => {
    return `data:image/svg+xml;base64,${btoa(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="14">
          Loading...
        </text>
      </svg>`
    )}`;
  }, [width, height]);

  // Handle image loading
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setIsError(true);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsError(false);
      return;
    }
    
    onError?.();
  }, [fallbackSrc, currentSrc, onError]);

  // Set up image loading when in view or priority
  React.useEffect(() => {
    if ((inView || priority) && !currentSrc && optimizedSrc) {
      setCurrentSrc(optimizedSrc);
    }
  }, [inView, priority, optimizedSrc, currentSrc]);

  // Calculate aspect ratio styles
  const containerStyle = useMemo(() => {
    if (!aspectRatio) return { width, height };
    
    const ratios = {
      'square': 1,
      '4:3': 4/3,
      '16:9': 16/9,
      '3:2': 3/2
    };
    
    const ratio = ratios[aspectRatio];
    const paddingTop = `${(1 / ratio) * 100}%`;
    
    return {
      position: 'relative' as const,
      width: '100%',
      paddingTop
    };
  }, [aspectRatio, width, height]);

  const imageStyle = aspectRatio ? {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit
  } : { width, height, objectFit };

  return (
    <div
      ref={inViewRef}
      style={containerStyle}
      className={cn('relative overflow-hidden bg-gray-100 rounded-lg', className)}
    >
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <img
          src={placeholder}
          alt=""
          style={imageStyle}
          className="absolute inset-0 animate-pulse"
        />
      )}

      {/* Main image */}
      {currentSrc && !isError && (
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          style={imageStyle}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Loading state */}
      {currentSrc && !isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <AlertTriangle className="w-6 h-6 mb-2" />
          <span className="text-xs">Failed to load</span>
        </div>
      )}

      {/* Lazy loading placeholder */}
      {!currentSrc && !priority && !inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <Camera className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export { OptimizedImage };
export default OptimizedImage;