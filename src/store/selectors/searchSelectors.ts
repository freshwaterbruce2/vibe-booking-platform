/**
 * Optimized Selectors for Search Store
 * 
 * Implements memoized selectors to prevent unnecessary re-renders
 * and improve component performance following TDD requirements
 */

import { useMemo } from 'react';
import { useSearchStore } from '../searchStore';
import type { Hotel, SearchFilters } from '@/types/hotel';

// Base selectors with memoization
export const useSearchQuery = () => useSearchStore(state => state.query);
export const useSearchResults = () => useSearchStore(state => state.results);
export const useSearchLoading = () => useSearchStore(state => state.loading);
export const useSearchError = () => useSearchStore(state => state.error);
export const useSearchFilters = () => useSearchStore(state => state.filters);

// Computed selectors with performance optimizations
export const useFilteredHotels = () => {
  const results = useSearchResults();
  const filters = useSearchFilters();

  return useMemo(() => {
    if (!results.length) return [];

    return results.filter(hotel => {
      // Price range filter
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange;
        if (hotel.price.amount < minPrice || hotel.price.amount > maxPrice) {
          return false;
        }
      }

      // Star rating filter
      if (filters.starRating && filters.starRating.length > 0) {
        if (!filters.starRating.includes(hotel.starRating)) {
          return false;
        }
      }

      // Amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        const hotelAmenities = hotel.amenities || [];
        const hasRequiredAmenities = filters.amenities.every(amenity =>
          hotelAmenities.some(hotelAmenity => 
            hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
        if (!hasRequiredAmenities) {
          return false;
        }
      }

      // Accessibility filters
      if (filters.accessibility) {
        const { wheelchairAccessible, hearingAccessible, visualAccessible } = filters.accessibility;
        const accessibilityAmenities = hotel.amenities || [];
        
        if (wheelchairAccessible && !accessibilityAmenities.some(a => 
          a.toLowerCase().includes('wheelchair') || a.toLowerCase().includes('accessible')
        )) {
          return false;
        }
        
        if (hearingAccessible && !accessibilityAmenities.some(a => 
          a.toLowerCase().includes('hearing') || a.toLowerCase().includes('deaf')
        )) {
          return false;
        }
        
        if (visualAccessible && !accessibilityAmenities.some(a => 
          a.toLowerCase().includes('visual') || a.toLowerCase().includes('blind')
        )) {
          return false;
        }
      }

      return true;
    });
  }, [results, filters]);
};

// Sorted hotels with performance optimization
export const useSortedHotels = (sortBy: 'price' | 'rating' | 'name' | 'relevance' = 'relevance') => {
  const filteredHotels = useFilteredHotels();

  return useMemo(() => {
    if (!filteredHotels.length) return [];

    const sorted = [...filteredHotels];

    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => a.price.amount - b.price.amount);
      
      case 'rating':
        return sorted.sort((a, b) => b.starRating - a.starRating);
      
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'relevance':
      default:
        // Keep original relevance order from search API
        return sorted;
    }
  }, [filteredHotels, sortBy]);
};

// Paginated results for virtualization
export const usePaginatedHotels = (page: number = 1, pageSize: number = 20) => {
  const sortedHotels = useSortedHotels();

  return useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      hotels: sortedHotels.slice(startIndex, endIndex),
      totalResults: sortedHotels.length,
      totalPages: Math.ceil(sortedHotels.length / pageSize),
      currentPage: page,
      hasNextPage: endIndex < sortedHotels.length,
      hasPrevPage: page > 1
    };
  }, [sortedHotels, page, pageSize]);
};

// Search suggestions based on current results
export const useSearchSuggestions = () => {
  const query = useSearchQuery();
  const results = useSearchResults();

  return useMemo(() => {
    if (!results.length || query.length < 2) return [];

    // Extract unique cities and hotel names for suggestions
    const cities = new Set<string>();
    const hotelNames = new Set<string>();
    
    results.forEach(hotel => {
      if (hotel.city) cities.add(hotel.city);
      if (hotel.name && hotel.name.toLowerCase().includes(query.toLowerCase())) {
        hotelNames.add(hotel.name);
      }
    });

    return [
      ...Array.from(cities).slice(0, 5),
      ...Array.from(hotelNames).slice(0, 5)
    ].slice(0, 8);
  }, [query, results]);
};

// Price range statistics for filters
export const usePriceRangeStats = () => {
  const results = useSearchResults();

  return useMemo(() => {
    if (!results.length) {
      return { min: 0, max: 1000, average: 0, median: 0 };
    }

    const prices = results.map(hotel => hotel.price.amount).sort((a, b) => a - b);
    const sum = prices.reduce((acc, price) => acc + price, 0);
    
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      average: Math.round(sum / prices.length),
      median: prices[Math.floor(prices.length / 2)]
    };
  }, [results]);
};

// Available amenities from current results
export const useAvailableAmenities = () => {
  const results = useSearchResults();

  return useMemo(() => {
    if (!results.length) return [];

    const amenitiesSet = new Set<string>();
    results.forEach(hotel => {
      hotel.amenities?.forEach(amenity => {
        amenitiesSet.add(amenity);
      });
    });

    return Array.from(amenitiesSet).sort();
  }, [results]);
};

// Search performance metrics selector
export const useSearchMetrics = () => {
  return useSearchStore(state => ({
    cacheHitRate: state.getCacheHitRate?.() || 0,
    metrics: state.getSearchMetrics?.() || {
      totalSearches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    }
  }));
};

// Complex filter state for UI components
export const useActiveFiltersCount = () => {
  const filters = useSearchFilters();

  return useMemo(() => {
    let count = 0;
    
    if (filters.starRating && filters.starRating.length > 0) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) count++;
    if (filters.accessibility) {
      const { wheelchairAccessible, hearingAccessible, visualAccessible } = filters.accessibility;
      if (wheelchairAccessible || hearingAccessible || visualAccessible) count++;
    }
    if (filters.sustainability) count++;
    if (filters.passions && filters.passions.length > 0) count++;

    return count;
  }, [filters]);
};

// Hotel comparison selector for detailed views
export const useHotelComparison = (selectedIds: string[]) => {
  const results = useSearchResults();

  return useMemo(() => {
    if (!selectedIds.length) return [];
    
    return results.filter(hotel => selectedIds.includes(hotel.id));
  }, [results, selectedIds]);
};