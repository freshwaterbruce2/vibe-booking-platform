﻿import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Heart, Share2, Sparkles, Camera, Wifi, Car, Coffee } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '@/components/ui/Card';
import { TrustBadge } from '../ui/TrustBadge';
import { UrgencyIndicator } from '../ui/UrgencyIndicator';
import { useSearchStore } from '@/store/searchStore';
import { useHotelStore } from '@/store/hotelStore';
import type { Hotel } from '@/types/hotel';
import { cn } from '@/utils/cn';
import { 
  formatters, 
  useStarRating, 
  useVirtualScroll, 
  createListKey,
  usePerformanceMonitor,
  createMemoizedComponent
} from '@/utils/frontendOptimization';

interface SearchResultsProps {
  onHotelSelect?: (hotel: Hotel) => void;
  className?: string;
}

// OPTIMIZATION: Memoized hotel card component
const HotelCard = memo<{ hotel: Hotel; onSelect: (hotel: Hotel) => void; onNavigate: (hotelId: string) => void }>(
  ({ hotel, onSelect, onNavigate }) => {
    // Use optimized star rating hook
    const starRating = useStarRating(hotel.starRating || 0);
    
    // Memoized price formatting
    const formattedPrice = useMemo(() => {
      if (!hotel.price?.amount) return null;
      return formatters.getCurrencyFormatter(hotel.price.currency || 'USD').format(hotel.price.amount);
    }, [hotel.price?.amount, hotel.price?.currency]);

    const handleSelect = useCallback(() => onSelect(hotel), [hotel, onSelect]);
    const handleNavigate = useCallback(() => onNavigate(hotel.id), [hotel.id, onNavigate]);

    return (
      <Card className="group hover:shadow-luxury-lg transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Hotel image with lazy loading */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={hotel.images?.[0]?.url || '/placeholder-hotel.jpg'}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
          
          {/* Overlay badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <TrustBadge />
            {hotel.featured && (
              <span className="bg-luxury-gold text-white text-xs font-semibold px-2 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>

          {/* Urgency indicator */}
          <UrgencyIndicator className="absolute bottom-4 right-4" />
        </div>

        {/* Hotel content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-luxury-navy mb-1 line-clamp-1">
                {hotel.name}
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm line-clamp-1">
                  {hotel.address || `${hotel.city}, ${hotel.country}`}
                </span>
              </div>
            </div>
            {formattedPrice && (
              <div className="text-right">
                <div className="text-2xl font-bold text-luxury-gold">
                  {formattedPrice}
                </div>
                <div className="text-sm text-gray-500">per night</div>
              </div>
            )}
          </div>

          {/* Star rating - Optimized */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(starRating.fullStars)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
            {starRating.hasHalfStar && (
              <Star className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
            )}
            {[...Array(starRating.emptyStars)].map((_, i) => (
              <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
            ))}
            <span className="ml-1 text-sm font-medium text-gray-700">
              {starRating.ratingText}
            </span>
          </div>

          {/* Amenities - Limited to prevent layout shift */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex items-center gap-4 mb-4 text-gray-600">
              {hotel.amenities.slice(0, 4).map((amenity, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="text-sm text-gray-500">+{hotel.amenities.length - 4} more</span>
              )}
            </div>
          )}

          {/* Passion score */}
          {hotel.passionScore && hotel.passionScore > 0 && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {hotel.passionScore}% passion match
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleNavigate}
              className="flex-1 bg-luxury-navy hover:bg-luxury-navy/90"
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
    );
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.hotel.id === nextProps.hotel.id &&
      prevProps.hotel.price?.amount === nextProps.hotel.price?.amount &&
      prevProps.hotel.passionScore === nextProps.hotel.passionScore
    );
  }
);

HotelCard.displayName = 'HotelCard';

const SearchResults: React.FC<SearchResultsProps> = ({
  onHotelSelect,
  className = '',
}) => {
  usePerformanceMonitor('SearchResults');
  
  const navigate = useNavigate();
  const { results: hotels, loading: isLoading, pagination } = useSearchStore();
  const { setSelectedHotel } = useHotelStore();

  // Memoized callbacks to prevent unnecessary re-renders
  const handleHotelSelect = useCallback((hotel: Hotel) => {
    setSelectedHotel(hotel);
    onHotelSelect?.(hotel);
  }, [setSelectedHotel, onHotelSelect]);

  const handleHotelNavigate = useCallback((hotelId: string) => {
    navigate(`/hotel/${hotelId}`);
  }, [navigate]);

  // Virtual scrolling for large result sets
  const { startIndex, endIndex, offsetY, totalHeight, onScroll } = useVirtualScroll({
    items: hotels,
    itemHeight: 420, // Approximate height of each hotel card
    containerHeight: 800, // Visible container height
    overscan: 2
  });

  const visibleHotels = useMemo(() => {
    return hotels.slice(startIndex, endIndex);
  }, [hotels, startIndex, endIndex]);

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Searching hotels...</h3>
          <div className="animate-pulse h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex flex-col lg:flex-row gap-6 p-6">
                <div className="w-full lg:w-96 h-48 sm:h-56 lg:h-48 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                    ))}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hotels found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your search criteria or explore different dates
          </p>
          <Button variant="outline" className="text-primary-600">
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
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {pagination?.total || hotels.length} hotels found
          </h3>
          {pagination && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
          )}
        </div>

        {/* Sort Options - You can move this to a separate component */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Guest Rating</option>
            <option value="passion">Passion Match</option>
          </select>
        </div>
      </div>

      {/* Hotel Cards */}
      <div className="grid gap-6">
        {hotels.map((hotel) => {
          const primaryImage = hotel.images?.find((img) => img.isPrimary) || hotel.images?.[0];
          const passionScore = hotel.passionScore ? Math.max(...Object.values(hotel.passionScore)) : 0;

          return (
            <Card
              key={hotel.id}
              className={cn(
                'group hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer overflow-hidden shadow-lg bg-white transform animate-fadeInUp',
                passionScore > 0.8 ? 'border-2 border-primary ring-2 ring-primary/20' : 'border-0',
              )}
              onClick={() => onHotelSelect && onHotelSelect(hotel)}
            >
              {/* Featured Deal Banner */}
              {passionScore > 0.8 && (
                <div className="bg-gradient-to-r from-primary to-primary-600 text-white px-4 py-2 text-center">
                  <span className="text-sm font-bold">⭐ FEATURED DEAL - Perfect Match for You!</span>
                </div>
              )}
              <div className="flex flex-col lg:flex-row gap-0">
                {/* Hotel Image - Mobile optimized */}
                <div className="relative w-full lg:w-96 h-48 sm:h-56 lg:h-48 overflow-hidden">
                  <img
                    src={primaryImage?.url || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop'}
                    alt={primaryImage?.alt || hotel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    width="384"
                    height="192"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop';
                    }}
                  />

                  {/* Urgency Indicators */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {passionScore > 0.7 && (
                      <TrustBadge
                        type="favorite"
                        text={`${Math.round(passionScore * 100)}% Match`}
                        className="shadow-lg"
                      />
                    )}
                    <UrgencyIndicator
                      type="viewing"
                      count={Math.floor(Math.random() * 15) + 5}
                      className="shadow-lg"
                    />
                  </div>

                  {/* Availability Badge */}
                  {hotel.availability.lowAvailability && (
                    <div className="absolute top-3 right-3">
                      <UrgencyIndicator
                        type="limited"
                        count={Math.floor(Math.random() * 3) + 1}
                        className="shadow-lg"
                      />
                    </div>
                  )}

                  {/* Recently Booked */}
                  <div className="absolute bottom-3 left-3">
                    <UrgencyIndicator
                      type="recently_booked"
                      timeframe={`${Math.floor(Math.random() * 6) + 1} hours ago`}
                      className="shadow-lg"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle save/favorite
                      }}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle share
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Hotel Information - Mobile optimized */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex flex-col h-full">
                    {/* Header - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                          {hotel.name}
                        </h4>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">
                            {hotel.location.neighborhood || hotel.location.city}, {hotel.location.country}
                          </span>
                        </div>
                      </div>

                      {/* Price - Centered on mobile */}
                      <div className="text-center sm:text-right sm:ml-4 order-first sm:order-last">
                        {/* Deal Badge */}
                        {hotel.deals && hotel.deals.length > 0 && (
                          <div className="mb-2">
                            <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                              {hotel.deals[0].discountPercent}% OFF TODAY
                            </span>
                          </div>
                        )}

                        {/* Original Price (if discounted) */}
                        {hotel.priceRange.originalPrice && hotel.priceRange.originalPrice > hotel.priceRange.avgNightly && (
                          <div className="text-sm text-gray-400 line-through">
                            {formatPrice(hotel.priceRange.originalPrice, hotel.priceRange.currency)}
                          </div>
                        )}

                        {/* Current Price */}
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(hotel.priceRange.avgNightly, hotel.priceRange.currency)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">per night</div>

                        {/* Total Price Hint */}
                        <div className="text-xs text-gray-400 mt-1">
                          {formatPrice(hotel.priceRange.avgNightly * 3, hotel.priceRange.currency)} total (3 nights)
                        </div>

                        {/* Savings Amount */}
                        {hotel.priceRange.originalPrice && hotel.priceRange.originalPrice > hotel.priceRange.avgNightly && (
                          <div className="text-xs font-medium text-accent mt-1">
                            Save {formatPrice(hotel.priceRange.originalPrice - hotel.priceRange.avgNightly, hotel.priceRange.currency)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-3">
                      {renderStars(hotel.rating)}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({hotel.reviewCount.toLocaleString()} reviews)
                      </span>
                      {hotel.sustainabilityScore && hotel.sustainabilityScore > 0.8 && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Eco-Friendly
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {hotel.description}
                    </p>

                    {/* Key Amenities */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {/* Top amenities with icons */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Wifi className="w-4 h-4 text-blue-500" />
                        <span>Free WiFi</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Car className="w-4 h-4 text-green-500" />
                        <span>Free Parking</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Coffee className="w-4 h-4 text-amber-500" />
                        <span>Breakfast</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>Spa</span>
                      </div>
                    </div>

                    {/* Additional Amenities */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {hotel.amenities.slice(0, 3).map((amenity) => (
                        <span
                          key={amenity.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                        >
                          {amenity.name}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200">
                          +{hotel.amenities.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Quote & Actions */}
                    <div className="flex flex-col gap-3 mt-auto">
                      {/* Best Review Quote */}
                      {hotel.topReview && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm italic text-gray-700 dark:text-gray-300 line-clamp-2">
                            "{hotel.topReview.quote}"
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            - {hotel.topReview.author}
                          </p>
                        </div>
                      )}

                      {/* Actions Row - Mobile optimized */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        {/* Secondary Actions - Hidden on mobile, visible on tablet+ */}
                        <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {hotel.virtualTourUrl && (
                            <button className="hover:text-primary-600 transition-colors flex items-center gap-1">
                              <Camera className="w-4 h-4" />
                              Virtual Tour
                            </button>
                          )}
                          <button className="hover:text-primary-600 transition-colors">
                            View on Map
                          </button>
                        </div>

                        {/* Primary Actions - Full width on mobile */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="sm:hidden w-full text-gray-600 hover:text-primary-600 order-2 sm:order-1"
                          >
                            View Details & Map
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:block text-gray-600 hover:text-primary-600"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto bg-primary text-white hover:bg-primary-600 px-6 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 order-1 sm:order-2 h-12 sm:h-auto text-lg sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHotel(hotel);
                              navigate('/booking');
                            }}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => {
              // Handle previous page
            }}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  className="w-10"
                  onClick={() => {
                    // Handle page change
                  }}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => {
              // Handle next page
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export { SearchResults };
export default memo(SearchResults);
