import React, { useState } from 'react';

interface FilterOptions {
  priceRange: [number, number];
  starRating: number[];
  amenities: string[];
  hotelTypes: string[];
  sortBy: string;
}

interface SearchFiltersProps {
  filters?: FilterOptions;
  onFiltersChange?: (filters: FilterOptions) => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters = {
    priceRange: [0, 1000],
    starRating: [],
    amenities: [],
    hotelTypes: [],
    sortBy: 'relevance',
  },
  onFiltersChange,
  isVisible = true,
  onToggleVisibility,
  className = '',
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = localFilters.amenities;
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    handleFilterChange('amenities', newAmenities);
  };

  const handleStarRatingToggle = (rating: number) => {
    const currentRatings = localFilters.starRating;
    const newRatings = currentRatings.includes(rating)
      ? currentRatings.filter((r) => r !== rating)
      : [...currentRatings, rating];
    handleFilterChange('starRating', newRatings);
  };

  const clearFilters = () => {
    const clearedFilters = {
      priceRange: [0, 1000] as [number, number],
      starRating: [],
      amenities: [],
      hotelTypes: [],
      sortBy: 'relevance',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange && onFiltersChange(clearedFilters);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
        </svg>
        Show Filters
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Guest Rating</option>
            <option value="distance">Distance</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (per night)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="1000"
              value={localFilters.priceRange[0]}
              onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), localFilters.priceRange[1]])}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              min="0"
              max="1000"
              value={localFilters.priceRange[1]}
              onChange={(e) => handleFilterChange('priceRange', [localFilters.priceRange[0], parseInt(e.target.value)])}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Star Rating
          </label>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.starRating.includes(rating)}
                  onChange={() => handleStarRatingToggle(rating)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  {[...Array(rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">{rating} star{rating > 1 ? 's' : ''}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amenities
          </label>
          <div className="space-y-2">
            {[
              'Free WiFi',
              'Swimming Pool',
              'Gym/Fitness Center',
              'Spa',
              'Restaurant',
              'Room Service',
              'Pet Friendly',
              'Business Center',
              'Parking',
              'Airport Shuttle',
            ].map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hotel Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hotel Type
          </label>
          <div className="space-y-2">
            {['Hotel', 'Resort', 'Boutique', 'Business', 'Budget', 'Luxury'].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.hotelTypes.includes(type)}
                  onChange={() => {
                    const currentTypes = localFilters.hotelTypes;
                    const newTypes = currentTypes.includes(type)
                      ? currentTypes.filter((t) => t !== type)
                      : [...currentTypes, type];
                    handleFilterChange('hotelTypes', newTypes);
                  }}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;