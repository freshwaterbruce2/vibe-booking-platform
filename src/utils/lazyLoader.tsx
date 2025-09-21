/**
 * Performance-Optimized Lazy Loading Utility
 * Features: timeout handling, preloading, error boundaries, caching, and metrics
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { logger } from './logger';

// Error Boundary Component
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Lazy component error', { error: error.message, errorInfo });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback />;
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold">Component failed to load</h3>
            <p className="text-sm text-gray-600">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component cache for performance
const componentCache = new Map<string, any>();
const preloadPromises = new Map<string, Promise<any>>();
const loadMetrics = new Map<string, { loadTime: number; attempts: number }>();

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  preload?: boolean;
  loadingMessage?: string;
  errorBoundary?: boolean;
  timeout?: number;
  retries?: number;
  cacheKey?: string;
  priority?: 'high' | 'low';
}

interface LazyComponentProps {
  component: ComponentType<any>;
  fallback?: React.ComponentType;
  loadingMessage?: string;
}

/**
 * Enhanced lazy loading with aggressive performance optimizations
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const {
    timeout = 8000,
    retries = 2,
    cacheKey,
    priority = 'low',
    preload = false,
    errorBoundary = true
  } = options;

  const LazyComponent = lazy(() => {
    const startTime = Date.now();

    // Check cache first
    if (cacheKey && componentCache.has(cacheKey)) {
      return Promise.resolve(componentCache.get(cacheKey));
    }

    // Check if already loading
    if (cacheKey && preloadPromises.has(cacheKey)) {
      return preloadPromises.get(cacheKey)!;
    }

    const loadWithRetry = async (attemptsLeft: number): Promise<{ default: T }> => {
      try {
        const result = await Promise.race([
          importFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Component load timeout after ${timeout}ms`)), timeout)
          ),
        ]);

        // Cache successful result
        if (cacheKey) {
          componentCache.set(cacheKey, result);
          loadMetrics.set(cacheKey, {
            loadTime: Date.now() - startTime,
            attempts: retries - attemptsLeft + 1
          });
        }

        logger.debug('Component loaded successfully', {
          cacheKey,
          loadTime: Date.now() - startTime,
          attempts: retries - attemptsLeft + 1
        });

        return result;
      } catch (error) {
        if (attemptsLeft > 0) {
          logger.warn(`Component load failed, retrying... (${attemptsLeft} attempts left)`, {
            cacheKey,
            error: error instanceof Error ? error.message : String(error)
          });
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, (retries - attemptsLeft + 1) * 500));
          return loadWithRetry(attemptsLeft - 1);
        }

        logger.error('Component load failed after all retries', {
          cacheKey,
          error: error instanceof Error ? error.message : String(error),
          totalTime: Date.now() - startTime
        });
        throw error;
      }
    };

    const promise = loadWithRetry(retries);

    if (cacheKey) {
      preloadPromises.set(cacheKey, promise);
      promise.finally(() => preloadPromises.delete(cacheKey));
    }

    return promise;
  });

  // Intelligent preloading
  if (preload) {
    const preloadFn = () => {
      if (cacheKey && (componentCache.has(cacheKey) || preloadPromises.has(cacheKey))) {
        return;
      }

      importFn().catch((error) => {
        logger.warn('Component preload failed', {
          cacheKey,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    };

    if (priority === 'high') {
      // Immediate preload for critical components
      preloadFn();
    } else {
      // Delayed preload for non-critical components
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(preloadFn, { timeout: 2000 });
      } else {
        setTimeout(preloadFn, 1000);
      }
    }
  }

  const WrappedComponent = (props: any) => {
    const content = (
      <Suspense
        fallback={
          options.fallback ? (
            <options.fallback />
          ) : (
            <div className="flex items-center justify-center min-h-[200px]">
              <LoadingSpinner size="lg" />
              {options.loadingMessage && (
                <p className="ml-3 text-sm text-gray-600">{options.loadingMessage}</p>
              )}
            </div>
          )
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );

    if (errorBoundary) {
      return (
        <LazyErrorBoundary
          fallback={options.fallback}
          onError={(error) => {
            logger.error('Lazy component error boundary triggered', {
              cacheKey,
              error: error.message
            });
          }}
        >
          {content}
        </LazyErrorBoundary>
      );
    }

    return content;
  };

  return WrappedComponent;
}

/**
 * Intersection Observer-based lazy loading for components
 */
export const LazyIntersectionComponent: React.FC<LazyComponentProps> = ({
  component: Component,
  fallback: Fallback,
  loadingMessage: _loadingMessage = "Loading component...",
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();

          logger.debug('Lazy component loaded via intersection', {
            component: 'LazyIntersectionComponent',
            componentName: Component.name || 'Anonymous',
          });
        }
      },
      {
        threshold: 0.05, // More sensitive trigger
        rootMargin: '200px', // Start loading 200px before component is visible
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [Component.name, hasLoaded]);

  return (
    <div ref={containerRef} className="min-h-[50px]">
      {isVisible ? (
        <Component />
      ) : Fallback ? (
        <Fallback />
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse bg-gray-200 rounded-lg w-full h-32"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Intelligent preloading system
 */
export const preloadComponent = (
  importFn: () => Promise<{ default: any }>,
  cacheKey: string,
  priority: 'high' | 'low' = 'low'
): void => {
  if (preloadPromises.has(cacheKey) || componentCache.has(cacheKey)) {
    return;
  }

  const preload = () => {
    const promise = importFn()
      .then(module => {
        componentCache.set(cacheKey, module);
        logger.debug('Component preloaded successfully', { cacheKey });
        return module;
      })
      .catch(error => {
        logger.warn(`Preload failed for ${cacheKey}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      });

    preloadPromises.set(cacheKey, promise);
    promise.finally(() => preloadPromises.delete(cacheKey));
  };

  if (priority === 'high') {
    preload();
  } else {
    // Use idle time for low priority preloads
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(preload, { timeout: 2000 });
    } else {
      setTimeout(preload, 500);
    }
  }
};

/**
 * Preload critical components with intelligent batching
 */
export const preloadCriticalComponents = () => {
  const criticalComponents = [
    { importFn: () => import('../components/search/SearchResults').then(m => ({ default: m.SearchResults })), key: 'SearchResults' },
    { importFn: () => import('../components/booking/BookingFlow').then(m => ({ default: m.BookingFlow })), key: 'BookingFlow' },
    { importFn: () => import('../components/payment/SquarePaymentForm').then(m => ({ default: m.SquarePaymentForm })), key: 'SquarePaymentForm' },
    { importFn: () => import('../components/search/VirtualizedHotelList'), key: 'VirtualizedHotelList' },
  ];

  logger.info('Starting intelligent component preloading', {
    count: criticalComponents.length
  });

  // Preload in batches to avoid overwhelming the network
  criticalComponents.forEach(({ importFn, key }, index) => {
    const delay = index * 100; // Stagger by 100ms
    setTimeout(() => {
      preloadComponent(importFn, key, 'high');
    }, delay);
  });
};

/**
 * Performance monitoring and cache management
 */
export const getLazyLoadMetrics = () => {
  return {
    cachedComponents: componentCache.size,
    activePreloads: preloadPromises.size,
    cacheKeys: Array.from(componentCache.keys()),
    loadMetrics: Object.fromEntries(loadMetrics),
    memoryUsage: {
      cacheSize: componentCache.size,
      preloadSize: preloadPromises.size
    }
  };
};

export const clearLazyLoadCache = () => {
  componentCache.clear();
  preloadPromises.clear();
  loadMetrics.clear();
  logger.info('Lazy load cache cleared');
};

// Auto-cleanup on memory pressure
if (typeof window !== 'undefined' && 'memory' in performance) {
  const checkMemoryPressure = () => {
    const memInfo = (performance as any).memory;
    if (memInfo && memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.9) {
      logger.warn('Memory pressure detected, clearing component cache');
      clearLazyLoadCache();
    }
  };

  setInterval(checkMemoryPressure, 30000); // Check every 30 seconds
}

/**
 * Route-based code splitting helper with route-specific optimizations
 */
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  routeName: string,
  options: Partial<LazyLoadOptions> = {}
) => {
  return createLazyComponent(importFn, {
    loadingMessage: `Loading ${routeName}...`,
    preload: false, // Don't preload routes by default
    cacheKey: `route-${routeName}`,
    timeout: 10000, // Longer timeout for routes
    retries: 3, // More retries for critical routes
    errorBoundary: true,
    ...options
  });
};

// Pre-built optimized lazy components with specific configurations
export const LazySearchResults = createLazyComponent(
  () => import('../components/search/SearchResults').then(m => ({ default: m.SearchResults })),
  {
    cacheKey: 'SearchResults',
    preload: true,
    priority: 'high',
    loadingMessage: 'Loading search results...'
  }
);

export const LazyBookingFlow = createLazyComponent(
  () => import('../components/booking/BookingFlow').then(m => ({ default: m.BookingFlow })),
  {
    cacheKey: 'BookingFlow',
    preload: true,
    priority: 'high',
    loadingMessage: 'Loading booking form...'
  }
);

export const LazySquarePaymentForm = createLazyComponent(
  () => import('../components/payment/SquarePaymentForm').then(m => ({ default: m.SquarePaymentForm })),
  {
    cacheKey: 'SquarePaymentForm',
    timeout: 12000, // Longer timeout for payment
    retries: 3,
    loadingMessage: 'Loading secure payment form...'
  }
);

export const LazyVirtualizedHotelList = createLazyComponent(
  () => import('../components/search/VirtualizedHotelList'),
  {
    cacheKey: 'VirtualizedHotelList',
    preload: true,
    priority: 'high',
    loadingMessage: 'Loading hotel list...'
  }
);

// MapView will be implemented later
// export const LazyMapView = createLazyComponent(
//   () => import('../components/hotels/MapView').then(m => ({ default: m.MapView })),
//   {
//     cacheKey: 'MapView',
//     timeout: 15000,
//     loadingMessage: 'Loading map...'
//   }
// );

export const LazyRoomComparison = createLazyComponent(
  () => import('../components/hotels/RoomComparison'),
  {
    cacheKey: 'RoomComparison',
    loadingMessage: 'Loading room comparison...'
  }
);

// Initialize preloading on app start
if (typeof window !== 'undefined') {
  // Preload critical components after page load
  window.addEventListener('load', () => {
    setTimeout(preloadCriticalComponents, 1000);
  });

  // Preload on first user interaction
  const preloadOnInteraction = () => {
    preloadComponent(() => import('../components/booking/BookingFlow').then(m => ({ default: m.BookingFlow })), 'BookingFlow', 'high');
    preloadComponent(() => import('../components/payment/SquarePaymentForm').then(m => ({ default: m.SquarePaymentForm })), 'SquarePaymentForm', 'low');
  };

  ['mousedown', 'touchstart', 'keydown', 'scroll'].forEach(event => {
    document.addEventListener(event, preloadOnInteraction, { once: true, passive: true });
  });
}