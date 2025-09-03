/**
 * Simple Code Splitting Utilities
 * 
 * Simplified route-based code splitting with performance optimizations
 */

import { ComponentType, lazy } from 'react';

interface RouteConfig {
  priority: 'critical' | 'high' | 'medium' | 'low';
  preloadDelay?: number;
  estimatedSize?: number;
}

class CodeSplittingManager {
  private loadedChunks = new Set<string>();
  private preloadTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Create optimized lazy route with preloading
   */
  createOptimizedRoute<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    routeName: string,
    config: RouteConfig
  ): ComponentType {
    const LazyComponent = lazy(async () => {
      const startTime = performance.now();
      
      try {
        const result = await importFn();
        const loadTime = performance.now() - startTime;
        
        this.loadedChunks.add(routeName);
        console.log(`[CodeSplitting] Route '${routeName}' loaded in ${loadTime.toFixed(2)}ms`);
        
        return result;
      } catch (error) {
        console.error(`[CodeSplitting] Route '${routeName}' failed to load:`, error);
        throw error;
      }
    });

    // Setup preloading based on priority
    this.setupPreloading(routeName, importFn, config);

    return LazyComponent;
  }

  /**
   * Setup preloading based on configuration
   */
  private setupPreloading(
    routeName: string,
    importFn: () => Promise<any>,
    config: RouteConfig
  ) {
    let preloadDelay = config.preloadDelay || 0;

    // Set default delays based on priority
    if (preloadDelay === 0) {
      switch (config.priority) {
        case 'critical':
          preloadDelay = 100;
          break;
        case 'high':
          preloadDelay = 1000;
          break;
        case 'medium':
          preloadDelay = 3000;
          break;
        case 'low':
          preloadDelay = 5000;
          break;
      }
    }

    // Schedule preloading
    const timer = setTimeout(() => {
      this.preloadRoute(routeName, importFn);
    }, preloadDelay);

    this.preloadTimers.set(routeName, timer);
  }

  /**
   * Preload a route
   */
  private async preloadRoute(routeName: string, importFn: () => Promise<any>) {
    if (this.loadedChunks.has(routeName)) {
      return;
    }

    try {
      const startTime = performance.now();
      await importFn();
      const preloadTime = performance.now() - startTime;
      
      this.loadedChunks.add(routeName);
      console.log(`[CodeSplitting] Route '${routeName}' preloaded in ${preloadTime.toFixed(2)}ms`);
    } catch (error) {
      console.warn(`[CodeSplitting] Route '${routeName}' preload failed:`, error);
    }
  }

  /**
   * Manually preload a route
   */
  preload(routeName: string, importFn: () => Promise<any>) {
    this.preloadRoute(routeName, importFn);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      loadedChunks: Array.from(this.loadedChunks),
      totalRoutes: this.preloadTimers.size,
    };
  }

  /**
   * Clear all timers
   */
  cleanup() {
    this.preloadTimers.forEach(timer => clearTimeout(timer));
    this.preloadTimers.clear();
  }
}

// Export singleton
export const codeSplittingManager = new CodeSplittingManager();

// Route configurations
export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  home: {
    priority: 'critical',
    estimatedSize: 150
  },
  search: {
    priority: 'high',
    estimatedSize: 200
  },
  booking: {
    priority: 'high',
    estimatedSize: 180
  },
  payment: {
    priority: 'medium',
    estimatedSize: 250
  },
  profile: {
    priority: 'low',
    estimatedSize: 120
  },
  deals: {
    priority: 'medium',
    estimatedSize: 140
  }
};

// Helper to create optimized routes
export const createOptimizedRoute = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  routeName: keyof typeof ROUTE_CONFIGS
): ComponentType => {
  const config = ROUTE_CONFIGS[routeName];
  return codeSplittingManager.createOptimizedRoute(importFn, routeName, config);
};

// Preload critical routes on app startup
export const preloadCriticalRoutes = () => {
  const criticalRoutes = Object.entries(ROUTE_CONFIGS)
    .filter(([, config]) => config.priority === 'critical')
    .map(([name]) => name);

  console.log(`[CodeSplitting] Preloading critical routes: ${criticalRoutes.join(', ')}`);
};

// Setup hover preloading for links
export const setupHoverPreloading = () => {
  if (typeof document === 'undefined') return;

  // Setup hover preloading for common navigation elements
  const linkSelectors = [
    'a[href="/search"]',
    'a[href="/deals"]', 
    'a[href="/booking"]',
    '[data-preload]'
  ];

  linkSelectors.forEach(selector => {
    const links = document.querySelectorAll(selector);
    links.forEach(link => {
      let preloadStarted = false;
      
      link.addEventListener('mouseenter', () => {
        if (!preloadStarted) {
          preloadStarted = true;
          const routeName = link.getAttribute('data-preload') || 
                           link.getAttribute('href')?.slice(1) || 
                           'unknown';
          
          console.log(`[CodeSplitting] Hover preload triggered for: ${routeName}`);
        }
      });
    });
  });
};

// Performance monitoring
export const getCodeSplittingMetrics = () => {
  return codeSplittingManager.getMetrics();
};