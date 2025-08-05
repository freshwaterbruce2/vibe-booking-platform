import React, { useState } from 'react';

interface HotelImage {
  url: string;
  alt: string;
  type: 'exterior' | 'interior' | 'room' | 'amenity';
}

interface HotelAmenity {
  id: string;
  name: string;
  icon: string;
  category: 'general' | 'room' | 'dining' | 'recreation' | 'business';
}

interface HotelRoom {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedType: string;
  size: number;
  pricePerNight: number;
  images: string[];
  amenities: string[];
  availability: boolean;
}

interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  images: HotelImage[];
  amenities: HotelAmenity[];
  rooms: HotelRoom[];
  location: {
    lat: number;
    lng: number;
  };
  checkInTime: string;
  checkOutTime: string;
  policies: string[];
  nearbyAttractions: Array<{
    name: string;
    distance: string;
    type: string;
  }>;
}

interface HotelDetailsProps {
  hotel?: Hotel;
  isLoading?: boolean;
  onBookRoom?: (roomId: string) => void;
  onBackToResults?: () => void;
  className?: string;
}

const HotelDetails: React.FC<HotelDetailsProps> = ({
  hotel,
  isLoading = false,
  onBookRoom,
  onBackToResults,
  className = '',
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'amenities' | 'location'>('overview');

  // Mock data if no hotel provided
  const mockHotel: Hotel = {
    id: '1',
    name: 'Grand Palace Resort & Spa',
    description: 'Experience luxury and comfort at our premier resort destination. Nestled in the heart of paradise, our resort offers world-class amenities, exceptional service, and breathtaking views that will make your stay unforgettable.',
    address: '123 Paradise Avenue',
    city: 'Tropical Bay',
    country: 'Paradise Island',
    rating: 4.8,
    reviewCount: 1247,
    priceRange: '$200 - $800',
    images: [
      { url: '/hotels/grand-palace-1.jpg', alt: 'Hotel Exterior', type: 'exterior' },
      { url: '/hotels/grand-palace-2.jpg', alt: 'Lobby', type: 'interior' },
      { url: '/hotels/grand-palace-3.jpg', alt: 'Deluxe Room', type: 'room' },
      { url: '/hotels/grand-palace-4.jpg', alt: 'Swimming Pool', type: 'amenity' },
    ],
    amenities: [
      { id: '1', name: 'Free WiFi', icon: '📶', category: 'general' },
      { id: '2', name: 'Swimming Pool', icon: '🏊', category: 'recreation' },
      { id: '3', name: 'Fitness Center', icon: '💪', category: 'recreation' },
      { id: '4', name: 'Spa Services', icon: '💆', category: 'recreation' },
      { id: '5', name: 'Restaurant', icon: '🍽️', category: 'dining' },
      { id: '6', name: 'Room Service', icon: '🛎️', category: 'room' },
      { id: '7', name: 'Business Center', icon: '💼', category: 'business' },
      { id: '8', name: 'Concierge', icon: '🎩', category: 'general' },
    ],
    rooms: [
      {
        id: '1',
        name: 'Deluxe Ocean View',
        description: 'Spacious room with stunning ocean views and modern amenities',
        maxOccupancy: 2,
        bedType: 'King Bed',
        size: 45,
        pricePerNight: 299,
        images: ['/rooms/deluxe-1.jpg', '/rooms/deluxe-2.jpg'],
        amenities: ['Ocean View', 'Mini Bar', 'Coffee Machine', 'Balcony'],
        availability: true,
      },
      {
        id: '2',
        name: 'Family Suite',
        description: 'Perfect for families with separate living area and two bedrooms',
        maxOccupancy: 6,
        bedType: '2 Queen Beds + Sofa Bed',
        size: 75,
        pricePerNight: 459,
        images: ['/rooms/suite-1.jpg', '/rooms/suite-2.jpg'],
        amenities: ['Living Area', 'Kitchen', 'Two Bathrooms', 'City View'],
        availability: true,
      },
    ],
    location: { lat: 25.7617, lng: -80.1918 },
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM',
    policies: [
      'Pets are welcome with additional fee',
      'Smoking is prohibited in all rooms',
      'Cancellation free up to 24 hours before check-in',
      'Valid ID required at check-in',
    ],
    nearbyAttractions: [
      { name: 'Paradise Beach', distance: '0.2 km', type: 'Beach' },
      { name: 'Cultural Museum', distance: '1.5 km', type: 'Museum' },
      { name: 'Shopping District', distance: '2.0 km', type: 'Shopping' },
      { name: 'Adventure Park', distance: '3.2 km', type: 'Entertainment' },
    ],
  };

  const displayHotel = hotel || mockHotel;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        <span className="ml-2 text-gray-600">
          {rating} ({displayHotel.reviewCount} reviews)
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-64 bg-gray-300 rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Back Button */}
      {onBackToResults && (
        <button
          onClick={onBackToResults}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Results
        </button>
      )}

      {/* Hotel Images */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="lg:col-span-3">
          <img
            src={displayHotel.images[selectedImageIndex]?.url || '/placeholder-hotel.jpg'}
            alt={displayHotel.images[selectedImageIndex]?.alt || 'Hotel'}
            className="w-full h-96 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-hotel.jpg';
            }}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {displayHotel.images.slice(1, 4).map((image, index) => (
            <img
              key={index + 1}
              src={image.url}
              alt={image.alt}
              className="w-full h-28 lg:h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImageIndex(index + 1)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-hotel.jpg';
              }}
            />
          ))}
        </div>
      </div>

      {/* Hotel Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {displayHotel.name}
            </h1>
            <p className="text-gray-600 mb-2">
              {displayHotel.address}, {displayHotel.city}, {displayHotel.country}
            </p>
            {renderStars(displayHotel.rating)}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">From</div>
            <div className="text-2xl font-bold text-blue-600">{displayHotel.priceRange}</div>
            <div className="text-sm text-gray-500">per night</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'rooms', label: 'Rooms' },
            { id: 'amenities', label: 'Amenities' },
            { id: 'location', label: 'Location' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold mb-4">About This Hotel</h3>
              <p className="text-gray-700 mb-6">{displayHotel.description}</p>

              <h4 className="text-lg font-semibold mb-3">Hotel Policies</h4>
              <ul className="space-y-2">
                {displayHotel.policies.map((policy, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{policy}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Check-in Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Check-in:</span>
                    <span className="ml-2 text-gray-600">{displayHotel.checkInTime}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Check-out:</span>
                    <span className="ml-2 text-gray-600">{displayHotel.checkOutTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="grid gap-6">
            {displayHotel.rooms.map((room) => (
              <div key={room.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-1/3">
                    <img
                      src={room.images[0] || '/placeholder-room.jpg'}
                      alt={room.name}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-room.jpg';
                      }}
                    />
                  </div>

                  <div className="lg:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold mb-2">{room.name}</h4>
                        <p className="text-gray-600 mb-2">{room.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>👥 Up to {room.maxOccupancy} guests</span>
                          <span>🛏️ {room.bedType}</span>
                          <span>📐 {room.size} m²</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          ${room.pricePerNight}
                        </div>
                        <div className="text-sm text-gray-500">per night</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Room Amenities:</h5>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onBookRoom && onBookRoom(room.id)}
                      disabled={!room.availability}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {room.availability ? 'Book This Room' : 'Not Available'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(
              displayHotel.amenities.reduce((acc, amenity) => {
                if (!acc[amenity.category]) {
acc[amenity.category] = [];
}
                acc[amenity.category].push(amenity);
                return acc;
              }, {} as Record<string, HotelAmenity[]>),
            ).map(([category, amenities]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 capitalize">
                  {category.replace('_', ' ')} Amenities
                </h4>
                <div className="space-y-3">
                  {amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center">
                      <span className="text-2xl mr-3">{amenity.icon}</span>
                      <span className="text-gray-700">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Nearby Attractions</h4>
              <div className="space-y-3">
                {displayHotel.nearbyAttractions.map((attraction, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{attraction.name}</div>
                      <div className="text-sm text-gray-600">{attraction.type}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {attraction.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Map Location</h4>
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Interactive Map Coming Soon</span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <strong>Address:</strong> {displayHotel.address}, {displayHotel.city}, {displayHotel.country}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;