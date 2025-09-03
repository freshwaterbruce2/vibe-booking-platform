/**
 * Optimized Hotel Store Selectors
 * 
 * Memoized selectors to prevent unnecessary re-renders
 * and improve hotel store performance
 */

import { useMemo } from 'react';
import { useHotelStore } from '../hotelStore';
import type { Hotel, HotelDetails } from '@/types/hotel';

// Base selectors
export const useSelectedHotel = () => useHotelStore(state => state.selectedHotel);
export const useHotelDetails = () => useHotelStore(state => state.hotelDetails);
export const useHotelAvailability = () => useHotelStore(state => state.availability);
export const useHotelCache = () => useHotelStore(state => state.cache);
export const useHotelLoading = () => useHotelStore(state => state.loading);
export const useHotelErrors = () => useHotelStore(state => state.errors);

// Computed selectors
export const useHotelDetailsById = (hotelId: string | null) => {
  const hotelDetails = useHotelDetails();
  
  return useMemo(() => {
    if (!hotelId) return null;
    return hotelDetails[hotelId] || null;
  }, [hotelDetails, hotelId]);
};

export const useHotelAvailabilityById = (hotelId: string | null) => {
  const availability = useHotelAvailability();
  
  return useMemo(() => {
    if (!hotelId) return null;
    return availability[hotelId] || null;
  }, [availability, hotelId]);
};

export const useIsHotelLoading = (hotelId: string | null) => {
  const loading = useHotelLoading();
  
  return useMemo(() => {
    if (!hotelId) return false;
    return loading[hotelId] || false;
  }, [loading, hotelId]);
};

export const useHotelError = (hotelId: string | null) => {
  const errors = useHotelErrors();
  
  return useMemo(() => {
    if (!hotelId) return null;
    return errors[hotelId] || null;
  }, [errors, hotelId]);
};

// Cache selectors
export const useCachedHotel = (hotelId: string | null) => {
  const cache = useHotelCache();
  
  return useMemo(() => {
    if (!hotelId) return null;
    return cache.hotels[hotelId] || null;
  }, [cache.hotels, hotelId]);
};

export const useIsHotelCached = (hotelId: string | null, maxAge: number = 5 * 60 * 1000) => {
  const cache = useHotelCache();
  
  return useMemo(() => {
    if (!hotelId || !cache.lastUpdated[hotelId]) return false;
    
    const lastUpdated = new Date(cache.lastUpdated[hotelId]);
    const now = new Date();
    return (now.getTime() - lastUpdated.getTime()) < maxAge;
  }, [cache.lastUpdated, hotelId, maxAge]);
};

// Complex computed selectors
export const useHotelWithDetails = (hotelId: string | null) => {
  const selectedHotel = useSelectedHotel();
  const hotelDetails = useHotelDetailsById(hotelId);
  const cachedHotel = useCachedHotel(hotelId);
  
  return useMemo(() => {
    if (!hotelId) return null;
    
    // Merge hotel data from different sources
    let hotel: Hotel | null = null;
    
    if (selectedHotel?.id === hotelId) {
      hotel = selectedHotel;
    } else if (cachedHotel) {
      hotel = cachedHotel;
    }
    
    if (!hotel) return null;
    
    // Enhance with details if available
    if (hotelDetails) {
      return {
        ...hotel,
        ...hotelDetails,
        // Preserve original hotel properties that shouldn't be overwritten
        id: hotel.id,
        name: hotel.name,
        images: hotelDetails.images || hotel.images,
      };
    }
    
    return hotel;
  }, [selectedHotel, hotelDetails, cachedHotel, hotelId]);
};

// Hotel comparison selector
export const useHotelComparison = (hotelIds: string[]) => {
  const cache = useHotelCache();
  
  return useMemo(() => {
    return hotelIds
      .map(id => cache.hotels[id])
      .filter(Boolean)
      .map(hotel => ({
        ...hotel,
        comparisonScore: calculateComparisonScore(hotel)
      }));
  }, [cache.hotels, hotelIds]);
};

// Similar hotels selector
export const useSimilarHotels = (baseHotelId: string | null, maxResults: number = 5) => {
  const cache = useHotelCache();
  const baseHotel = useCachedHotel(baseHotelId);
  
  return useMemo(() => {
    if (!baseHotel) return [];
    
    const allHotels = Object.values(cache.hotels);
    
    return allHotels
      .filter(hotel => hotel.id !== baseHotelId)
      .map(hotel => ({
        ...hotel,
        similarityScore: calculateSimilarityScore(baseHotel, hotel)
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, maxResults);
  }, [cache.hotels, baseHotel, baseHotelId, maxResults]);
};

// Price range selector for cached hotels
export const useHotelPriceRange = () => {
  const cache = useHotelCache();
  
  return useMemo(() => {
    const hotels = Object.values(cache.hotels);
    if (hotels.length === 0) return { min: 0, max: 1000, average: 0 };
    
    const prices = hotels
      .map(hotel => hotel.price?.amount || 0)
      .filter(price => price > 0);
    
    if (prices.length === 0) return { min: 0, max: 1000, average: 0 };
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return { min, max, average: Math.round(average) };
  }, [cache.hotels]);
};

// Hotel availability summary
export const useHotelAvailabilitySummary = (hotelId: string | null) => {
  const availability = useHotelAvailabilityById(hotelId);
  
  return useMemo(() => {
    if (!availability) return null;
    
    const rooms = availability.rooms || [];
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(room => room.available).length;
    const lowestPrice = rooms
      .filter(room => room.available)
      .reduce((min, room) => Math.min(min, room.price?.amount || Infinity), Infinity);
    
    return {
      totalRooms,
      availableRooms,
      occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0,
      lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
      hasAvailability: availableRooms > 0
    };
  }, [availability]);
};

// Performance metrics selector
export const useHotelStoreMetrics = () => {
  const cache = useHotelCache();
  const loading = useHotelLoading();
  const errors = useHotelErrors();
  
  return useMemo(() => {
    const cachedHotels = Object.keys(cache.hotels).length;
    const loadingOperations = Object.values(loading).filter(Boolean).length;
    const errorCount = Object.values(errors).filter(Boolean).length;
    const cacheSize = JSON.stringify(cache).length; // Rough size estimate
    
    return {
      cachedHotels,
      loadingOperations,
      errorCount,
      cacheSize,
      cacheSizeKB: Math.round(cacheSize / 1024)
    };
  }, [cache, loading, errors]);
};

// Helper functions
const calculateComparisonScore = (hotel: Hotel): number => {
  // Simple scoring algorithm for hotel comparison
  let score = 0;
  
  if (hotel.starRating) score += hotel.starRating * 20;
  if (hotel.price?.amount) score += Math.max(0, 1000 - hotel.price.amount) / 10;
  if (hotel.amenities) score += hotel.amenities.length * 5;
  
  return Math.round(score);
};

const calculateSimilarityScore = (baseHotel: Hotel, compareHotel: Hotel): number => {
  let score = 0;
  
  // Star rating similarity
  if (baseHotel.starRating && compareHotel.starRating) {
    const ratingDiff = Math.abs(baseHotel.starRating - compareHotel.starRating);
    score += Math.max(0, 5 - ratingDiff) * 20;
  }
  
  // Price similarity
  if (baseHotel.price?.amount && compareHotel.price?.amount) {
    const priceDiff = Math.abs(baseHotel.price.amount - compareHotel.price.amount);
    const priceScore = Math.max(0, 500 - priceDiff) / 10;
    score += priceScore;
  }
  
  // Location similarity (same city)
  if (baseHotel.city === compareHotel.city) {
    score += 30;
  }
  
  // Amenity similarity
  if (baseHotel.amenities && compareHotel.amenities) {
    const commonAmenities = baseHotel.amenities.filter(amenity =>
      compareHotel.amenities?.some(compareAmenity =>
        compareAmenity.toLowerCase().includes(amenity.toLowerCase())
      )
    ).length;
    score += commonAmenities * 10;
  }
  
  return Math.round(score);
};