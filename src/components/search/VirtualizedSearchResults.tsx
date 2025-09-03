/**
 * Virtualized Search Results Component
 * 
 * High-performance search results with virtual scrolling,
 * memoized hotel cards, and optimized rendering for large datasets
 */

import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Heart, Share2, Sparkles, Wifi, Car, Coffee, Camera } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '@/components/ui/Card';
import { TrustBadge } from '../ui/TrustBadge';
import { UrgencyIndicator } from '../ui/UrgencyIndicator';
import { useSearchStore } from '@/store/searchStore';
import { useHotelStore } from '@/store/hotelStore';
import { 
  useSortedHotels, 
  useFilteredHotels,
  usePaginatedHotels 
} from '@/store/selectors/searchSelectors';
import { 
  formatters, 
  useStarRating, 
  useVirtualScroll, 
  createListKey,
  usePerformanceMonitor,
  useInView,
  useOptimizedImage
} from '@/utils/frontendOptimization';
import type { Hotel } from '@/types/hotel';
import { cn } from '@/utils/cn';

interface VirtualizedSearchResultsProps {
  onHotelSelect?: (hotel: Hotel) => void;
  className?: string;
  sortBy?: 'price' | 'rating' | 'name' | 'relevance';
  itemHeight?: number;
  containerHeight?: number;
}

// Memoized hotel card with optimized rendering
const OptimizedHotelCard = memo<{ 
  hotel: Hotel; 
  onSelect: (hotel: Hotel) => void; 
  onNavigate: (hotelId: string) => void;
  style?: React.CSSProperties;
}>(({ hotel, onSelect, onNavigate, style }) => {
  usePerformanceMonitor(`HotelCard-${hotel.id}`);
  
  const [imageRef, imageInView] = useInView({ threshold: 0.1, rootMargin: '100px' });
  const starRating = useStarRating(hotel.starRating || 0);
  
  // Optimized price formatting with memoization
  const formattedPrice = useMemo(() => {
    if (!hotel.price?.amount) return null;
    return formatters.getCurrencyFormatter(hotel.price.currency || 'USD').format(hotel.price.amount);
  }, [hotel.price?.amount, hotel.price?.currency]);

  // Image optimization
  const primaryImage = hotel.images?.[0];
  const { isLoaded: imageLoaded, isError: imageError } = useOptimizedImage(primaryImage?.url || '');

  const handleSelect = useCallback(() => onSelect(hotel), [hotel, onSelect]);
  const handleNavigate = useCallback(() => onNavigate(hotel.id), [hotel.id, onNavigate]);

  // Memoized amenity icons
  const amenityIcons = useMemo(() => {
    const iconMap: Record<string, React.ComponentType> = {
      wifi: Wifi,
      parking: Car,
      breakfast: Coffee,
      spa: Sparkles
    };
    
    return hotel.amenities?.slice(0, 4).map((amenity, index) => {
      const key = amenity.toLowerCase();
      const IconComponent = Object.entries(iconMap).find(([k]) => 
        key.includes(k)
      )?.[1] || Wifi;
      
      return (
        <div key={index} className="flex items-center gap-1">
          <IconComponent className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{amenity}</span>
        </div>
      );
    }) || [];
  }, [hotel.amenities]);

  return (
    <div style={style}>
      <Card className="group hover:shadow-luxury-lg transition-all duration-300 cursor-pointer overflow-hidden mb-6">
        {/* Hotel image with optimized lazy loading */}
        <div 
          ref={imageRef}
          className="relative h-48 sm:h-56 overflow-hidden bg-gray-200"
        >
          {imageInView && (
            <>
              {!imageLoaded && !imageError && (
                <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
              )}
              
              {primaryImage && !imageError && (
                <img
                  src={primaryImage.url}
                  alt={hotel.name}
                  className={cn(
                    "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  loading="lazy"
                  decoding="async"
                />
              )}
              
              {imageError && (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </>
          )}
          
          {/* Overlay badges - only render when in view */}
          {imageInView && (
            <>
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <TrustBadge />
                {hotel.featured && (
                  <span className="bg-luxury-gold text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {/* Favorite button */}
              <button 
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle favorite logic
                }}
              >
                <Heart className="w-4 h-4 text-gray-600" />
              </button>

              {/* Urgency indicator */}
              <UrgencyIndicator className="absolute bottom-4 right-4" />
            </>
          )}
        </div>

        {/* Hotel content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-luxury-navy mb-1 truncate">
                {hotel.name}
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm truncate">
                  {hotel.address || `${hotel.city}, ${hotel.country}`}
                </span>
              </div>
            </div>
            
            {formattedPrice && (
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-2xl font-bold text-luxury-gold">
                  {formattedPrice}
                </div>
                <div className="text-sm text-gray-500">per night</div>
              </div>
            )}
          </div>

          {/* Star rating - Optimized */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: starRating.fullStars }, (_, i) => (
              <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
            {starRating.hasHalfStar && (
              <Star className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
            )}
            {Array.from({ length: starRating.emptyStars }, (_, i) => (
              <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
            ))}
            <span className="ml-1 text-sm font-medium text-gray-700">
              {starRating.ratingText}
            </span>
          </div>

          {/* Amenities - Optimized rendering */}
          {amenityIcons.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {amenityIcons}
              {hotel.amenities && hotel.amenities.length > 4 && (
                <span className="text-sm text-gray-500 col-span-2">
                  +{hotel.amenities.length - 4} more amenities
                </span>
              )}
            </div>
          )}

          {/* Passion score */}
          {hotel.passionScore && hotel.passionScore > 0 && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {Math.round(hotel.passionScore * 100)}% passion match
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleNavigate}
              className="flex-1 bg-luxury-navy hover:bg-luxury-navy/90 text-white"
            >
              View Details
            </Button>
            <Button
              onClick={handleSelect}
              variant="outline"
              className="flex-shrink-0 border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.hotel.id === nextProps.hotel.id &&
    prevProps.hotel.price?.amount === nextProps.hotel.price?.amount &&
    prevProps.hotel.passionScore === nextProps.hotel.passionScore &&
    prevProps.hotel.featured === nextProps.hotel.featured
  );
});

OptimizedHotelCard.displayName = 'OptimizedHotelCard';

// Main virtualized search results component
const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  onHotelSelect,
  className = '',
  sortBy = 'relevance',
  itemHeight = 420,
  containerHeight = 800
}) => {
  usePerformanceMonitor('VirtualizedSearchResults');
  
  const navigate = useNavigate();
  const { loading: isLoading } = useSearchStore();
  const { setSelectedHotel } = useHotelStore();
  
  // Use optimized selectors
  const filteredHotels = useFilteredHotels();
  const sortedHotels = useSortedHotels(sortBy);
  const { hotels: paginatedHotels, totalResults } = usePaginatedHotels(1, 20);

  // Virtual scrolling for performance
  const {
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    onScroll
  } = useVirtualScroll({
    items: sortedHotels,
    itemHeight,
    containerHeight,
    overscan: 3
  });

  // Memoized visible hotels
  const visibleHotels = useMemo(() => 
    sortedHotels.slice(startIndex, endIndex),
    [sortedHotels, startIndex, endIndex]
  );

  // Optimized callbacks
  const handleHotelSelect = useCallback((hotel: Hotel) => {
    setSelectedHotel(hotel);
    onHotelSelect?.(hotel);
  }, [setSelectedHotel, onHotelSelect]);

  const handleHotelNavigate = useCallback((hotelId: string) => {
    navigate(`/hotel/${hotelId}`);
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="h-96 bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedHotels.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="max-w-md mx-auto">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hotels found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or exploring different dates
          </p>
          <Button variant="outline" className="text-luxury-navy">
            Modify Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {totalResults} hotels found
          </h3>
          <p className="text-sm text-gray-600">
            Showing {visibleHotels.length} hotels with virtual scrolling
          </p>
        </div>
        
        <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
          ⚡ Performance: Virtualized rendering active
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div
        className="relative overflow-auto border rounded-lg"
        style={{ height: containerHeight }}
        onScroll={onScroll}
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items container */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleHotels.map((hotel, index) => (
              <OptimizedHotelCard
                key={createListKey(hotel, startIndex + index, 'hotel-')}
                hotel={hotel}
                onSelect={handleHotelSelect}
                onNavigate={handleHotelNavigate}
                style={{ height: itemHeight }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Virtual scrolling: {visibleHotels.length}/{sortedHotels.length} items rendered | 
          Scroll offset: {offsetY}px | 
          Visible range: {startIndex}-{endIndex}
        </div>
      )}
    </div>
  );
};

export { VirtualizedSearchResults };
export default memo(VirtualizedSearchResults);