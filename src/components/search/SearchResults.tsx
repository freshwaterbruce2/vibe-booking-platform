import React from 'react';

interface Hotel {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  amenities: string[];
}

interface SearchResultsProps {
  hotels?: Hotel[];
  isLoading?: boolean;
  onHotelSelect?: (hotel: Hotel) => void;
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  hotels = [],
  isLoading = false,
  onHotelSelect,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-xl font-semibold text-gray-800">Searching hotels...</h3>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hotels found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-800">
        {hotels.length} hotels found
      </h3>

      <div className="grid gap-4">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onHotelSelect && onHotelSelect(hotel)}
          >
            <div className="flex gap-4 p-6">
              <img
                src={hotel.image || '/placeholder-hotel.jpg'}
                alt={hotel.name}
                className="w-32 h-24 object-cover rounded-lg"
              />

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {hotel.name}
                  </h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${hotel.price}
                    </div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                </div>

                <p className="text-gray-600 mb-2">{hotel.location}</p>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(hotel.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">
                      {hotel.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.slice(0, 3).map((amenity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{hotel.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;