import React, { useState, useEffect } from 'react';
import { Star, DollarSign, MapPin, Calendar, Heart, Settings, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { personalizationService, type UserPreferences, type PersonalizationInsights } from '@/services/personalizationService';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { logger } from '@/utils/logger';

interface PersonalizationPreferencesProps {
  className?: string;
}

const PersonalizationPreferences: React.FC<PersonalizationPreferencesProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [insights, setInsights] = useState<PersonalizationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'preferences' | 'insights'>('preferences');

  useEffect(() => {
    if (user?.id) {
      loadPersonalizationData();
    }
  }, [user?.id]);

  const loadPersonalizationData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [userPrefs, userInsights] = await Promise.all([
        personalizationService.getUserPreferences(user.id),
        personalizationService.generatePersonalizationInsights(user.id)
      ]);

      setPreferences(userPrefs);
      setInsights(userInsights);

      logger.info('Personalization data loaded', {
        userId: user.id,
        hasPreferences: !!userPrefs,
        hasInsights: !!userInsights
      });
    } catch (error) {
      logger.error('Failed to load personalization data:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatBudgetRange = (min: number, max: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const getTravelStyleColor = (style: string) => {
    const colors = {
      luxury: 'bg-purple-100 text-purple-800 border-purple-200',
      business: 'bg-blue-100 text-blue-800 border-blue-200',
      leisure: 'bg-green-100 text-green-800 border-green-200',
      budget: 'bg-orange-100 text-orange-800 border-orange-200',
      adventure: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[style as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!preferences && !insights) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200">
          <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Build Your Travel Profile
          </h3>
          <p className="text-slate-600 mb-6">
            Make a few bookings to unlock personalized recommendations and insights about your travel preferences.
          </p>
          <Button size="lg" onClick={loadPersonalizationData}>
            Refresh Analysis
          </Button>
        </div>
      </div>
    );
  }

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      {preferences && (
        <>
          {/* Travel Style */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-luxury-gold" />
                Travel Style
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getTravelStyleColor(preferences.travelStyle)}`}>
                {preferences.travelStyle.charAt(0).toUpperCase() + preferences.travelStyle.slice(1)}
              </span>
              <p className="text-slate-600 text-sm">
                Based on your booking patterns and spending habits
              </p>
            </div>
          </div>

          {/* Budget Preferences */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-luxury-gold" />
                Budget Range
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Typical Range:</span>
                <span className="font-semibold text-luxury-navy">
                  {formatBudgetRange(preferences.budgetRange.min, preferences.budgetRange.max, preferences.budgetRange.currency)}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                Per night, based on your booking history
              </div>
            </div>
          </div>

          {/* Preferred Destinations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-luxury-gold" />
                Favorite Destinations
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.preferredRegions.slice(0, 8).map((region, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {region}
                </span>
              ))}
            </div>
          </div>

          {/* Booking Patterns */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-luxury-gold" />
                Booking Patterns
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Average Stay:</span>
                <span className="font-semibold text-slate-900">
                  {preferences.bookingPatterns.averageStayDuration} night{preferences.bookingPatterns.averageStayDuration > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Advance Booking:</span>
                <span className="font-semibold text-slate-900">
                  {preferences.bookingPatterns.advanceBookingDays} days
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Favorite Seasons:</span>
                <div className="flex gap-1">
                  {preferences.bookingPatterns.seasonalPreferences.map((season, index) => (
                    <span key={index} className="text-sm bg-slate-100 px-2 py-1 rounded text-slate-700">
                      {season}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Passion Categories */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-luxury-gold" />
                Travel Interests
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.passionCategories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-luxury-navy to-slate-600 text-white rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderInsightsSection = () => (
    <div className="space-y-6">
      {insights && (
        <>
          {/* Travel Patterns */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-luxury-gold" />
                Your Travel Patterns
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-luxury-navy mb-1">
                  {insights.travelPatterns.mostVisitedDestinations.length}
                </div>
                <div className="text-sm text-slate-600">Unique Destinations</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-luxury-navy mb-1">
                  {insights.travelPatterns.preferredStayDuration}
                </div>
                <div className="text-sm text-slate-600">Average Nights</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-luxury-navy mb-1">
                  {insights.travelPatterns.bookingLeadTime}
                </div>
                <div className="text-sm text-slate-600">Days in Advance</div>
              </div>
            </div>
          </div>

          {/* Budget Optimization */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-luxury-gold" />
                Budget Insights
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-600 mb-1">Average Nightly Rate</div>
                <div className="text-2xl font-bold text-slate-900">
                  ${Math.round(insights.budgetOptimization.averageNightlyRate).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Suggested Budget</div>
                <div className="text-2xl font-bold text-luxury-gold">
                  ${Math.round(insights.budgetOptimization.suggestedBudget).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  +10% for better options
                </div>
              </div>
            </div>
          </div>

          {/* Most Visited Destinations */}
          {insights.travelPatterns.mostVisitedDestinations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-luxury-gold" />
                  Top Destinations
                </h3>
              </div>
              <div className="space-y-3">
                {insights.travelPatterns.mostVisitedDestinations.slice(0, 5).map((destination, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-luxury-navy text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-slate-900">{destination}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Tabs */}
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveSection('preferences')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'preferences'
              ? 'border-luxury-navy text-luxury-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          My Preferences
        </button>
        <button
          onClick={() => setActiveSection('insights')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'insights'
              ? 'border-luxury-navy text-luxury-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Travel Insights
        </button>
      </div>

      {/* Content */}
      <div>
        {activeSection === 'preferences' && renderPreferencesSection()}
        {activeSection === 'insights' && renderInsightsSection()}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={loadPersonalizationData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Settings className="w-4 h-4" />}
          Refresh Analysis
        </Button>
      </div>
    </div>
  );
};

export default PersonalizationPreferences;