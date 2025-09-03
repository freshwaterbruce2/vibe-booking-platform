/**
 * Advanced Search Middleware for Zustand
 * 
 * Implements caching, memoization, and performance optimizations
 * for search operations following TDD GREEN phase requirements
 */

import { StateCreator } from 'zustand';
import { SearchStore } from '../types';
import type { Hotel } from '@/types/hotel';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

interface SearchCacheEntry {
  key: string;
  results: Hotel[];
  timestamp: number;
  hitCount: number;
}

interface SearchMetrics {
  totalSearches: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
}

class SearchCache {
  private cache = new Map<string, SearchCacheEntry>();
  private metrics: SearchMetrics = {
    totalSearches: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0
  };

  private generateCacheKey(query: string, filters: any, dateRange: any, guestCount: any): string {
    return JSON.stringify({ query, filters, dateRange, guestCount });
  }

  get(query: string, filters: any, dateRange: any, guestCount: any): Hotel[] | null {
    this.metrics.totalSearches++;
    const key = this.generateCacheKey(query, filters, dateRange, guestCount);
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    // Update hit metrics
    entry.hitCount++;
    this.metrics.cacheHits++;
    return entry.results;
  }

  set(query: string, filters: any, dateRange: any, guestCount: any, results: Hotel[]): void {
    const key = this.generateCacheKey(query, filters, dateRange, guestCount);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      results: [...results],
      timestamp: Date.now(),
      hitCount: 0
    });
  }

  getCacheHitRate(): number {
    if (this.metrics.totalSearches === 0) return 0;
    return (this.metrics.cacheHits / this.metrics.totalSearches) * 100;
  }

  getMetrics(): SearchMetrics {
    return { ...this.metrics };
  }

  clear(): void {
    this.cache.clear();
    this.metrics = {
      totalSearches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    };
  }
}

// Global search cache instance
const searchCache = new SearchCache();

/**
 * Search middleware with caching and performance optimizations
 */
export const searchMiddleware = <T extends SearchStore>(
  config: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, api) => ({
  ...config(set, get, api),
  
  // Enhanced search with caching
  performSearch: async (searchParams?: {
    query?: string;
    useCache?: boolean;
    timeout?: number;
  }) => {
    const startTime = performance.now();
    const state = get() as SearchStore;
    const { query = state.query, useCache = true, timeout = 1000 } = searchParams || {};

    try {
      set({ loading: true, error: null } as Partial<T>);

      // Check cache first
      if (useCache) {
        const cachedResults = searchCache.get(
          query,
          state.filters,
          state.selectedDateRange,
          state.guestCount
        );

        if (cachedResults) {
          const endTime = performance.now();
          set({ 
            results: cachedResults, 
            loading: false,
            pagination: { 
              currentPage: 1, 
              totalPages: Math.ceil(cachedResults.length / 20),
              totalResults: cachedResults.length 
            }
          } as Partial<T>);

          console.log(`[Search Cache] Hit - ${cachedResults.length} results in ${(endTime - startTime).toFixed(2)}ms`);
          return;
        }
      }

      // Perform actual search with timeout
      const searchPromise = fetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: state.filters,
          dateRange: state.selectedDateRange,
          guestCount: state.guestCount
        })
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), timeout)
      );

      const response = await Promise.race([searchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.hotels || [];

      // Cache successful results
      if (useCache && results.length > 0) {
        searchCache.set(
          query,
          state.filters,
          state.selectedDateRange,
          state.guestCount,
          results
        );
      }

      const endTime = performance.now();
      
      set({
        results,
        loading: false,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(results.length / 20),
          totalResults: results.length
        }
      } as Partial<T>);

      console.log(`[Search API] Success - ${results.length} results in ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
      const endTime = performance.now();
      console.warn(`[Search] Error after ${(endTime - startTime).toFixed(2)}ms:`, error);
      
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      } as Partial<T>);
    }
  },

  // Get search performance metrics
  getSearchMetrics: () => searchCache.getMetrics(),

  // Get cache hit rate for performance monitoring
  getCacheHitRate: () => searchCache.getCacheHitRate(),

  // Clear search cache
  clearSearchCache: () => {
    searchCache.clear();
    set({ results: [] } as Partial<T>);
  },

  // Optimized filter update with debouncing
  updateFiltersOptimized: (newFilters: any, debounceMs: number = 300) => {
    const state = get() as SearchStore;
    const updatedFilters = { ...state.filters, ...newFilters };
    
    set({ filters: updatedFilters } as Partial<T>);

    // Debounce search trigger
    if (state.query) {
      clearTimeout((state as any)._filterDebounceTimer);
      (state as any)._filterDebounceTimer = setTimeout(() => {
        (state as any).performSearch?.();
      }, debounceMs);
    }
  }
});

export { searchCache };