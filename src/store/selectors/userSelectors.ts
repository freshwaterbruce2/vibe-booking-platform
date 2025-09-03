/**
 * Optimized User Store Selectors
 * 
 * Memoized selectors for user state and preferences
 */

import { useMemo } from 'react';
import { useUserStore } from '../userStore';

// Base selectors
export const useUserPreferences = () => useUserStore(state => state.preferences);
export const useUserPassions = () => useUserStore(state => state.passions);
export const useUserSearchHistory = () => useUserStore(state => state.searchHistory);
export const useUserBookingHistory = () => useUserStore(state => state.bookingHistory);
export const useUserSavedHotels = () => useUserStore(state => state.savedHotels);
export const useUserRecentlyViewed = () => useUserStore(state => state.recentlyViewed);

// Preference-based selectors
export const useUserBudgetRange = () => {
  const preferences = useUserPreferences();
  
  return useMemo(() => ({
    min: preferences.budget?.min || 0,
    max: preferences.budget?.max || 1000,
    currency: preferences.budget?.currency || 'USD'
  }), [preferences.budget]);
};

export const useUserLocationPreferences = () => {
  const preferences = useUserPreferences();
  
  return useMemo(() => ({
    preferredRegions: preferences.location?.preferredRegions || [],
    avoidedRegions: preferences.location?.avoidedRegions || [],
    searchRadius: preferences.location?.searchRadius || 50
  }), [preferences.location]);
};

export const useUserAccommodationPreferences = () => {
  const preferences = useUserPreferences();
  
  return useMemo(() => ({
    roomTypes: preferences.accommodation?.roomTypes || [],
    amenities: preferences.accommodation?.amenities || [],
    starRating: {
      min: preferences.accommodation?.starRating?.min || 1,
      max: preferences.accommodation?.starRating?.max || 5
    },
    hotelTypes: preferences.accommodation?.hotelTypes || []
  }), [preferences.accommodation]);
};

// Passion-based selectors
export const useTopPassions = (limit: number = 5) => {
  const passions = useUserPassions();
  
  return useMemo(() => {
    if (!passions.weights) return [];
    
    return Object.entries(passions.weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([passion, weight]) => ({
        name: passion,
        weight,
        percentage: Math.round(weight * 100)
      }));
  }, [passions.weights, limit]);
};

export const usePassionScore = (passion: string) => {
  const passions = useUserPassions();
  
  return useMemo(() => {
    return passions.weights?.[passion] || 0;
  }, [passions.weights, passion]);
};

export const usePersonalizedRecommendations = () => {
  const topPassions = useTopPassions(3);
  const budgetRange = useUserBudgetRange();
  const accommodationPrefs = useUserAccommodationPreferences();
  
  return useMemo(() => ({
    passionFilters: topPassions.map(p => p.name),
    priceRange: [budgetRange.min, budgetRange.max],
    starRating: accommodationPrefs.starRating,
    amenities: accommodationPrefs.amenities,
    roomTypes: accommodationPrefs.roomTypes
  }), [topPassions, budgetRange, accommodationPrefs]);
};

// History-based selectors
export const useRecentSearches = (limit: number = 10) => {
  const searchHistory = useUserSearchHistory();
  
  return useMemo(() => {
    return [...searchHistory]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [searchHistory, limit]);
};

export const useFrequentDestinations = (limit: number = 5) => {
  const searchHistory = useUserSearchHistory();
  
  return useMemo(() => {
    const destinationCounts = searchHistory.reduce((acc, search) => {
      const destination = search.destination;
      acc[destination] = (acc[destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([destination, count]) => ({
        destination,
        count,
        percentage: Math.round((count / searchHistory.length) * 100)
      }));
  }, [searchHistory, limit]);
};

export const useRecentBookings = (limit: number = 5) => {
  const bookingHistory = useUserBookingHistory();
  
  return useMemo(() => {
    return [...bookingHistory]
      .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
      .slice(0, limit);
  }, [bookingHistory, limit]);
};

export const useBookingStatistics = () => {
  const bookingHistory = useUserBookingHistory();
  
  return useMemo(() => {
    if (bookingHistory.length === 0) {
      return {
        totalBookings: 0,
        totalSpent: 0,
        averageSpent: 0,
        favoriteDestinations: [],
        bookingsByStatus: {},
        currency: 'USD'
      };
    }
    
    const totalSpent = bookingHistory.reduce((sum, booking) => 
      sum + (booking.totalAmount || 0), 0
    );
    
    const destinationCounts = bookingHistory.reduce((acc, booking) => {
      const destination = `${booking.hotel.city}, ${booking.hotel.country}`;
      acc[destination] = (acc[destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteDestinations = Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([destination, count]) => ({ destination, count }));
    
    const bookingsByStatus = bookingHistory.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalBookings: bookingHistory.length,
      totalSpent,
      averageSpent: Math.round(totalSpent / bookingHistory.length),
      favoriteDestinations,
      bookingsByStatus,
      currency: bookingHistory[0]?.currency || 'USD'
    };
  }, [bookingHistory]);
};

// Saved hotels selectors
export const useIsHotelSaved = (hotelId: string) => {
  const savedHotels = useUserSavedHotels();
  
  return useMemo(() => {
    return savedHotels.includes(hotelId);
  }, [savedHotels, hotelId]);
};

export const useSavedHotelsCount = () => {
  const savedHotels = useUserSavedHotels();
  
  return useMemo(() => savedHotels.length, [savedHotels]);
};

// Recently viewed selectors
export const useRecentlyViewedHotels = (limit: number = 10) => {
  const recentlyViewed = useUserRecentlyViewed();
  
  return useMemo(() => {
    return [...recentlyViewed].reverse().slice(0, limit);
  }, [recentlyViewed, limit]);
};

// User activity metrics
export const useUserActivityMetrics = () => {
  const searchHistory = useUserSearchHistory();
  const bookingHistory = useUserBookingHistory();
  const savedHotels = useUserSavedHotels();
  const recentlyViewed = useUserRecentlyViewed();
  
  return useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentSearches = searchHistory.filter(search => 
      new Date(search.timestamp) > thirtyDaysAgo
    ).length;
    
    const recentBookings = bookingHistory.filter(booking => 
      new Date(booking.bookedAt) > thirtyDaysAgo
    ).length;
    
    // Calculate activity score
    let activityScore = 0;
    activityScore += Math.min(recentSearches * 2, 20); // Max 20 points for searches
    activityScore += Math.min(recentBookings * 10, 30); // Max 30 points for bookings
    activityScore += Math.min(savedHotels.length * 1, 10); // Max 10 points for saved hotels
    activityScore += Math.min(recentlyViewed.length * 0.5, 5); // Max 5 points for views
    
    let activityLevel: 'low' | 'medium' | 'high';
    if (activityScore >= 40) activityLevel = 'high';
    else if (activityScore >= 20) activityLevel = 'medium';
    else activityLevel = 'low';
    
    return {
      recentSearches,
      recentBookings,
      totalSaved: savedHotels.length,
      totalViewed: recentlyViewed.length,
      activityScore: Math.round(activityScore),
      activityLevel
    };
  }, [searchHistory, bookingHistory, savedHotels, recentlyViewed]);
};

// Personalization effectiveness selector
export const usePersonalizationEffectiveness = () => {
  const passions = useUserPassions();
  const searchHistory = useUserSearchHistory();
  const bookingHistory = useUserBookingHistory();
  
  return useMemo(() => {
    const hasPassions = Object.keys(passions.weights || {}).length > 0;
    const hasSearchHistory = searchHistory.length > 0;
    const hasBookingHistory = bookingHistory.length > 0;
    
    let effectiveness = 0;
    if (hasPassions) effectiveness += 40;
    if (hasSearchHistory) effectiveness += 30;
    if (hasBookingHistory) effectiveness += 30;
    
    return {
      effectiveness: Math.round(effectiveness),
      hasPassions,
      hasSearchHistory,
      hasBookingHistory,
      canPersonalize: effectiveness > 50
    };
  }, [passions.weights, searchHistory.length, bookingHistory.length]);
};