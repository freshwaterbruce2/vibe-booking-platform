import React from 'react';
import { Star, MapPin, Heart, Share2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSearchStore } from '@/store/searchStore';
import type { Hotel } from '@/types/hotel';
import { cn } from '@/utils/cn';

interface SearchResultsProps {
  onHotelSelect?: (hotel: Hotel) => void;
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  onHotelSelect,
  className = '',
}) => {
  const { results: hotels, loading: isLoading, pagination } = useSearchStore();
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < Math.floor(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            )}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

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
                <div className="w-full lg:w-80 h-48 lg:h-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
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
          const primaryImage = hotel.images?.find(img => img.isPrimary) || hotel.images?.[0];
          const passionScore = hotel.passionScore ? Math.max(...Object.values(hotel.passionScore)) : 0;
          
          return (
            <Card
              key={hotel.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 shadow-lg"
              onClick={() => onHotelSelect && onHotelSelect(hotel)}
            >
              <div className="flex flex-col lg:flex-row gap-0">
                {/* Hotel Image */}
                <div className="relative w-full lg:w-80 h-48 lg:h-40 overflow-hidden">
                  <img
                    src={primaryImage?.url || '/placeholder-hotel.jpg'}
                    alt={primaryImage?.alt || hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-hotel.jpg';
                    }}
                  />
                  
                  {/* Passion Score Badge */}
                  {passionScore > 0.7 && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {Math.round(passionScore * 100)}% Match
                    </div>
                  )}
                  
                  {/* Availability Badge */}
                  {hotel.availability.lowAvailability && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Only {Math.floor(Math.random() * 3) + 1} left!
                    </div>
                  )}
                  
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

                {/* Hotel Information */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                          {hotel.name}
                        </h4>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {hotel.location.neighborhood || hotel.location.city}, {hotel.location.country}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(hotel.priceRange.avgNightly, hotel.priceRange.currency)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">per night</div>
                        {hotel.availability.priceChange && (
                          <div className={cn(
                            'text-xs font-medium',
                            hotel.availability.priceChange > 0 ? 'text-red-500' : 'text-green-500'
                          )}>
                            {hotel.availability.priceChange > 0 ? '+' : ''}
                            {formatPrice(hotel.availability.priceChange, hotel.priceRange.currency)}
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

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hotel.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          {amenity.icon && <span>{amenity.icon}</span>}
                          {amenity.name}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {hotel.virtualTourUrl && (
                          <button className="hover:text-primary-600 transition-colors">
                            Virtual Tour
                          </button>
                        )}
                        <button className="hover:text-primary-600 transition-colors">
                          View on Map
                        </button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:text-primary-700 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
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
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
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
export default SearchResults;