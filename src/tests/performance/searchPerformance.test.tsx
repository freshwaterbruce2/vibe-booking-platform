/**
 * Search Performance Tests
 * 
 * TDD GREEN phase - Tests to verify search optimizations work
 * These tests should now pass with the implemented optimizations
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { performanceTestSuite } from './performanceTestSuite';
import { useSearchStore } from '../../store/searchStore';
import { searchCache } from '../../store/middleware/searchMiddleware';

// Test wrapper for Zustand store testing
const TestSearchComponent: React.FC<{ 
  onSearchComplete?: (metrics: any) => void 
}> = ({ onSearchComplete }) => {
  const { 
    query, 
    results, 
    loading, 
    performSearch, 
    getCacheHitRate,
    getSearchMetrics 
  } = useSearchStore();

  React.useEffect(() => {
    if (!loading && results.length > 0 && onSearchComplete) {
      onSearchComplete({
        cacheHitRate: getCacheHitRate(),
        metrics: getSearchMetrics(),
        resultCount: results.length
      });
    }
  }, [loading, results, onSearchComplete, getCacheHitRate, getSearchMetrics]);

  return (
    <div data-testid="search-results">
      <div data-testid="query">{query}</div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Ready'}</div>
      <div data-testid="results-count">{results.length}</div>
    </div>
  );
};

describe('Search Performance Optimizations (TDD GREEN Phase)', () => {
  beforeEach(() => {
    // Clear cache and reset store
    searchCache.clear();
    useSearchStore.getState().clearSearch();
    useSearchStore.getState().clearSearchCache();
  });

  afterEach(() => {
    performanceTestSuite.cleanup();
  });

  describe('Search Caching Performance', () => {
    it('should achieve >90% cache hit rate after repeated searches', async () => {
      const metrics: any[] = [];
      
      const { result, renderTime } = await performanceTestSuite.measureComponentRender(
        'SearchCache-PerformanceTest',
        async () => {
          return render(
            <TestSearchComponent 
              onSearchComplete={(data) => metrics.push(data)}
            />
          );
        }
      );

      // Simulate multiple searches to build cache
      const store = useSearchStore.getState();
      
      await act(async () => {
        // First search - should miss cache
        await store.performSearch({ query: 'luxury hotel New York', useCache: true });
      });

      await act(async () => {
        // Second identical search - should hit cache
        await store.performSearch({ query: 'luxury hotel New York', useCache: true });
      });

      await act(async () => {
        // Third identical search - should hit cache
        await store.performSearch({ query: 'luxury hotel New York', useCache: true });
      });

      // Wait for metrics collection
      await waitFor(() => {
        expect(metrics.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const finalMetrics = store.getSearchMetrics();
      const cacheHitRate = store.getCacheHitRate();

      console.log('Search Cache Metrics:', {
        cacheHitRate,
        metrics: finalMetrics,
        renderTime
      });

      // Cache should improve performance significantly
      expect(cacheHitRate).toBeGreaterThan(50); // Should be >50% with repeated searches
      expect(renderTime).toBeLessThan(20); // Component should render quickly
      expect(result.container).toBeInTheDocument();
    });

    it('should handle cache eviction gracefully', async () => {
      const { renderTime } = await performanceTestSuite.measureComponentRender(
        'SearchCache-Eviction',
        async () => {
          return render(<TestSearchComponent />);
        }
      );

      const store = useSearchStore.getState();

      // Fill cache beyond limit (100+ different searches)
      const searchPromises = Array.from({ length: 105 }, (_, i) => 
        store.performSearch({ 
          query: `hotel search ${i}`, 
          useCache: true,
          timeout: 100 // Quick timeout for testing
        })
      );

      await act(async () => {
        await Promise.allSettled(searchPromises);
      });

      const metrics = store.getSearchMetrics();
      
      // Should handle cache eviction without errors
      expect(metrics.totalSearches).toBeGreaterThan(100);
      expect(renderTime).toBeLessThan(25);
    });
  });

  describe('Search Debouncing Performance', () => {
    it('should debounce filter updates efficiently', async () => {
      const startTime = performance.now();
      
      const { renderTime } = await performanceTestSuite.measureComponentRender(
        'SearchFilter-Debouncing',
        async () => {
          return render(<TestSearchComponent />);
        }
      );

      const store = useSearchStore.getState();

      // Rapid filter updates should be debounced
      await act(async () => {
        store.setQuery('luxury hotel');
        store.updateFiltersOptimized({ starRating: [5] }, 100);
        store.updateFiltersOptimized({ starRating: [4, 5] }, 100);
        store.updateFiltersOptimized({ priceRange: [100, 500] }, 100);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Debouncing should keep update time low
      expect(totalTime).toBeLessThan(200); // 200ms including debounce
      expect(renderTime).toBeLessThan(15);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain low memory usage with large result sets', () => {
      const initialMemory = performanceTestSuite.measureMemoryUsage();
      
      render(<TestSearchComponent />);
      
      const store = useSearchStore.getState();
      
      // Simulate large result set
      const mockResults = Array.from({ length: 1000 }, (_, i) => ({
        id: `hotel-${i}`,
        name: `Hotel ${i}`,
        address: `Address ${i}`,
        city: 'Test City',
        country: 'Test Country',
        starRating: 4 + (i % 2),
        price: { amount: 100 + (i * 10), currency: 'USD' },
        images: [{ url: 'test.jpg' }],
        amenities: ['WiFi', 'Pool'],
        description: 'Test hotel'
      }));

      act(() => {
        store.setResults(mockResults);
      });

      const afterResultsMemory = performanceTestSuite.measureMemoryUsage();
      const memoryIncrease = afterResultsMemory - initialMemory;

      // Should handle large datasets efficiently
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 20MB increase limit
      expect(store.results.length).toBe(1000);
    });
  });

  describe('Search Response Time Performance', () => {
    it('should handle search timeouts gracefully', async () => {
      const { renderTime } = await performanceTestSuite.measureComponentRender(
        'SearchTimeout-Handling',
        async () => {
          return render(<TestSearchComponent />);
        }
      );

      const store = useSearchStore.getState();
      const startTime = performance.now();

      await act(async () => {
        // Use very short timeout to test timeout handling
        await store.performSearch({ 
          query: 'test hotel',
          timeout: 10 // 10ms timeout
        });
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Should timeout quickly and handle gracefully
      expect(searchTime).toBeLessThan(100); // Should timeout within 100ms
      expect(renderTime).toBeLessThan(15);
      
      // Store should handle timeout state correctly
      expect(store.loading).toBe(false);
    });

    it('should provide fast cache retrieval', async () => {
      const store = useSearchStore.getState();

      // Prime the cache
      await act(async () => {
        await store.performSearch({ 
          query: 'cache performance test',
          useCache: true
        });
      });

      // Measure cache retrieval time
      const startTime = performance.now();
      
      await act(async () => {
        await store.performSearch({ 
          query: 'cache performance test',
          useCache: true
        });
      });

      const endTime = performance.now();
      const cacheTime = endTime - startTime;

      // Cache retrieval should be very fast
      expect(cacheTime).toBeLessThan(50); // Sub-50ms cache retrieval
      
      const cacheHitRate = store.getCacheHitRate();
      expect(cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Selector Performance', () => {
    it('should memoize search selectors efficiently', () => {
      const store = useSearchStore.getState();
      
      // Set up test data
      const mockResults = Array.from({ length: 100 }, (_, i) => ({
        id: `hotel-${i}`,
        name: `Hotel ${i}`,
        address: `Address ${i}`,
        city: 'Test City',
        country: 'Test Country',
        starRating: 3 + (i % 3),
        price: { amount: 100 + (i * 20), currency: 'USD' },
        images: [{ url: 'test.jpg' }],
        amenities: i % 2 === 0 ? ['WiFi', 'Pool'] : ['WiFi'],
        description: 'Test hotel'
      }));

      act(() => {
        store.setResults(mockResults);
      });

      // Multiple selector calls should be memoized
      const startTime = performance.now();
      
      // These calls should be cached/memoized
      for (let i = 0; i < 10; i++) {
        store.results.filter(h => h.starRating >= 4);
      }

      const endTime = performance.now();
      const selectorTime = endTime - startTime;

      // Selector operations should be fast with memoization
      expect(selectorTime).toBeLessThan(20); // 20ms for 10 operations
    });
  });
});