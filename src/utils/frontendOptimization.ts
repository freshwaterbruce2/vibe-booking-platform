/**
 * Frontend Performance Optimization Utilities
 * 
 * Provides React-specific performance optimizations including
 * memoization, virtualization, lazy loading, and efficient rendering.
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Debounced hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled hook for high-frequency events
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - (Date.now() - lastExecuted.current));

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useInView(options?: IntersectionObserverInit): [
  React.RefObject<HTMLElement>,
  boolean
] {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, inView];
}

/**
 * Optimized image loading with lazy loading and placeholder
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Memoized formatters to prevent recreation
 */
export const formatters = {
  currency: new Map<string, Intl.NumberFormat>(),
  
  getCurrencyFormatter: (currency: string = 'USD') => {
    if (!formatters.currency.has(currency)) {
      formatters.currency.set(
        currency,
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        })
      );
    }
    return formatters.currency.get(currency)!;
  },

  percentage: new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }),

  compact: new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }),
};

/**
 * Optimized star rating component props
 */
export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Memoized star rating calculation
 */
export const useStarRating = (rating: number, maxRating: number = 5) => {
  return useMemo(() => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    
    return {
      fullStars,
      hasHalfStar,
      emptyStars,
      ratingText: rating.toFixed(1)
    };
  }, [rating, maxRating]);
};

/**
 * Virtual scrolling utilities
 */
export interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll({ items, itemHeight, containerHeight, overscan = 5 }: VirtualScrollProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleRange,
    onScroll,
    totalHeight: items.length * itemHeight,
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number>(performance.now());

  useEffect(() => {
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (duration > 16) { // Warn if slower than 16ms (60fps)
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }, [name]);
}

/**
 * Optimized search filtering
 */
export function useOptimizedFilter<T>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, term: string) => boolean,
  deps: React.DependencyList = []
) {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  return useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;
    
    const startTime = performance.now();
    const filtered = items.filter(item => filterFn(item, debouncedSearchTerm));
    const duration = performance.now() - startTime;
    
    if (duration > 50) {
      console.warn(`[Performance] Filter operation took ${duration.toFixed(2)}ms for ${items.length} items`);
    }
    
    return filtered;
  }, [items, debouncedSearchTerm, filterFn, ...deps]);
}

/**
 * Image loading optimization
 */
export function useOptimizedImage(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>();

  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsError(true);
    img.src = src;
    imgRef.current = img;

    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
      }
    };
  }, [src]);

  return { isLoaded, isError };
}

/**
 * Batch state updates to prevent multiple renders
 */
export function useBatchedUpdates<T>() {
  const [updates, setUpdates] = useState<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const scheduleUpdate = useCallback((update: Partial<T>) => {
    setUpdates(prev => ({ ...prev, ...update }));
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates({});
    }, 0);
  }, []);

  return { updates, scheduleUpdate };
}

/**
 * Memoized component factory
 */
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Efficient list key generator
 */
export const createListKey = (item: any, index: number, prefix: string = '') => {
  const id = item.id || item._id || item.key;
  return id ? `${prefix}${id}` : `${prefix}item-${index}`;
};

/**
 * Bundle splitting helper for dynamic imports
 */
export async function loadChunk<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Failed to load chunk:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}