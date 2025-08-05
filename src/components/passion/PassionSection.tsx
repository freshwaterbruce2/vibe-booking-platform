import React, { useState } from 'react';

interface Passion {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  color: string;
}

interface PassionSectionProps {
  selectedPassions?: string[];
  onPassionToggle?: (passionId: string) => void;
  onApplyPassions?: (passions: string[]) => void;
  isVisible?: boolean;
  className?: string;
}

const PassionSection: React.FC<PassionSectionProps> = ({
  selectedPassions = [],
  onPassionToggle,
  onApplyPassions,
  isVisible = true,
  className = '',
}) => {
  const [localSelectedPassions, setLocalSelectedPassions] = useState<string[]>(selectedPassions);

  const passions: Passion[] = [
    {
      id: 'gourmet-foodie',
      name: 'Gourmet Foodie',
      description: 'Fine dining, local cuisine, cooking classes, and culinary experiences',
      icon: '🍽️',
      keywords: ['restaurant', 'dining', 'culinary', 'food', 'chef', 'cuisine'],
      color: 'bg-orange-100 border-orange-300 text-orange-800',
    },
    {
      id: 'outdoor-adventure',
      name: 'Outdoor Adventure',
      description: 'Hiking, water sports, nature activities, and adventure tours',
      icon: '🏔️',
      keywords: ['hiking', 'adventure', 'outdoor', 'nature', 'sports', 'mountain'],
      color: 'bg-green-100 border-green-300 text-green-800',
    },
    {
      id: 'cultural-explorer',
      name: 'Cultural Explorer',
      description: 'Museums, historical sites, art galleries, and cultural experiences',
      icon: '🏛️',
      keywords: ['museum', 'culture', 'history', 'art', 'heritage', 'traditional'],
      color: 'bg-purple-100 border-purple-300 text-purple-800',
    },
    {
      id: 'wellness-spa',
      name: 'Wellness & Spa',
      description: 'Relaxation, spa treatments, wellness programs, and mindful experiences',
      icon: '🧘',
      keywords: ['spa', 'wellness', 'relaxation', 'massage', 'meditation', 'yoga'],
      color: 'bg-pink-100 border-pink-300 text-pink-800',
    },
    {
      id: 'business-luxury',
      name: 'Business & Luxury',
      description: 'Premium amenities, business facilities, and sophisticated experiences',
      icon: '💼',
      keywords: ['business', 'luxury', 'premium', 'executive', 'conference', 'upscale'],
      color: 'bg-blue-100 border-blue-300 text-blue-800',
    },
    {
      id: 'family-fun',
      name: 'Family Fun',
      description: 'Kid-friendly activities, family amenities, and entertainment options',
      icon: '👨‍👩‍👧‍👦',
      keywords: ['family', 'kids', 'children', 'playground', 'entertainment', 'activities'],
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    },
    {
      id: 'romantic-getaway',
      name: 'Romantic Getaway',
      description: 'Intimate settings, couples activities, and romantic experiences',
      icon: '💕',
      keywords: ['romantic', 'couples', 'honeymoon', 'intimate', 'private', 'cozy'],
      color: 'bg-red-100 border-red-300 text-red-800',
    },
  ];

  const handlePassionClick = (passionId: string) => {
    const newSelected = localSelectedPassions.includes(passionId)
      ? localSelectedPassions.filter((id) => id !== passionId)
      : [...localSelectedPassions, passionId];

    setLocalSelectedPassions(newSelected);
    onPassionToggle && onPassionToggle(passionId);
  };

  const handleApplyPassions = () => {
    onApplyPassions && onApplyPassions(localSelectedPassions);
  };

  const clearAllPassions = () => {
    setLocalSelectedPassions([]);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section className={`bg-gradient-to-br from-blue-50 to-purple-50 py-12 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What's Your Travel Passion?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tell us what excites you most about travel, and we'll match you with hotels that perfectly
            align with your interests and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {passions.map((passion) => {
            const isSelected = localSelectedPassions.includes(passion.id);
            return (
              <div
                key={passion.id}
                onClick={() => handlePassionClick(passion.id)}
                className={`
                  relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg
                  ${isSelected
                    ? `${passion.color} border-opacity-100 shadow-md transform scale-105`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-4xl mb-3">{passion.icon}</div>
                  <h3 className={`text-lg font-semibold mb-2 ${isSelected ? '' : 'text-gray-900'}`}>
                    {passion.name}
                  </h3>
                  <p className={`text-sm ${isSelected ? '' : 'text-gray-600'}`}>
                    {passion.description}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {passion.keywords.slice(0, 3).map((keyword, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${
                          isSelected
                            ? 'bg-white bg-opacity-60'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {localSelectedPassions.length} passion{localSelectedPassions.length !== 1 ? 's' : ''} selected
            </p>
            {localSelectedPassions.length > 0 && (
              <button
                onClick={clearAllPassions}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApplyPassions}
              disabled={localSelectedPassions.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Find Matching Hotels
            </button>
          </div>
        </div>

        {/* Selected Passions Summary */}
        {localSelectedPassions.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Your Selected Passions:</h4>
            <div className="flex flex-wrap gap-2">
              {localSelectedPassions.map((passionId) => {
                const passion = passions.find((p) => p.id === passionId);
                return passion ? (
                  <span
                    key={passionId}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${passion.color}`}
                  >
                    <span className="mr-1">{passion.icon}</span>
                    {passion.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePassionClick(passionId);
                      }}
                      className="ml-2 hover:bg-white hover:bg-opacity-30 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PassionSection;