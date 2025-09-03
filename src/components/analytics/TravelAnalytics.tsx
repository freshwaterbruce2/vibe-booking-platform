import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Calendar, DollarSign, Clock, Star, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, type Booking } from '@/services/bookingService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

interface TravelAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  totalBookings: number;
  totalSpent: number;
  averageStayDuration: number;
  totalNights: number;
  uniqueDestinations: number;
  averageAdvanceBooking: number;
  seasonalBreakdown: Record<string, number>;
  monthlySpending: Array<{ month: number; amount: number; count: number }>;
  destinationBreakdown: Array<{ destination: string; count: number; amount: number }>;
  statusBreakdown: Record<string, number>;
  recentTrends: {
    spendingTrend: 'up' | 'down' | 'stable';
    bookingFrequency: 'increasing' | 'decreasing' | 'stable';
    averageStayTrend: 'longer' | 'shorter' | 'stable';
  };
}

const TravelAnalytics: React.FC<TravelAnalyticsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | '1year' | '6months' | '3months'>('1year');

  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData();
    }
  }, [user?.id, timeframe]);

  const loadAnalyticsData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const bookings = await bookingService.getUserBookings(user.id);

      // Filter bookings based on timeframe
      const filteredBookings = filterBookingsByTimeframe(bookings, timeframe);
      
      const analyticsData = calculateAnalytics(filteredBookings);
      
      setAnalytics(analyticsData);

      logger.info('Travel analytics loaded successfully', {
        userId: user.id,
        bookingCount: filteredBookings.length,
        timeframe
      });
    } catch (error) {
      logger.error('Failed to load travel analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookingsByTimeframe = (bookings: Booking[], timeframe: string): Booking[] => {
    if (timeframe === 'all') return bookings;

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeframe) {
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
    }

    return bookings.filter(booking => new Date(booking.createdAt) >= cutoffDate);
  };

  const calculateAnalytics = (bookings: Booking[]): AnalyticsData => {
    const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed');

    // Basic metrics
    const totalBookings = bookings.length;
    const totalSpent = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalNights = completedBookings.reduce((sum, b) => sum + b.nights, 0);
    const averageStayDuration = completedBookings.length > 0 ? Math.round(totalNights / completedBookings.length) : 0;

    // Unique destinations
    const destinations = new Set(completedBookings.map(b => b.hotelCity).filter(city => city));
    const uniqueDestinations = destinations.size;

    // Average advance booking
    const advanceBookingDays = bookings.map(b => {
      const bookingDate = new Date(b.createdAt);
      const checkInDate = new Date(b.checkIn);
      return Math.floor((checkInDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    const averageAdvanceBooking = advanceBookingDays.length > 0
      ? Math.round(advanceBookingDays.reduce((sum, days) => sum + days, 0) / advanceBookingDays.length)
      : 0;

    // Seasonal breakdown
    const seasonalBreakdown = completedBookings.reduce((acc: Record<string, number>, booking) => {
      const month = new Date(booking.checkIn).getMonth();
      let season = 'Spring';
      if (month >= 2 && month <= 4) season = 'Spring';
      else if (month >= 5 && month <= 7) season = 'Summer';
      else if (month >= 8 && month <= 10) season = 'Fall';
      else season = 'Winter';
      
      acc[season] = (acc[season] || 0) + 1;
      return acc;
    }, {});

    // Monthly spending
    const monthlySpending = Array.from({ length: 12 }, (_, index) => {
      const monthBookings = completedBookings.filter(b => new Date(b.checkIn).getMonth() === index);
      return {
        month: index,
        amount: monthBookings.reduce((sum, b) => sum + b.totalAmount, 0),
        count: monthBookings.length
      };
    }).filter(month => month.count > 0);

    // Destination breakdown
    const destinationCounts = completedBookings.reduce((acc: Record<string, { count: number; amount: number }>, booking) => {
      const destination = booking.hotelCity || 'Unknown';
      if (!acc[destination]) {
        acc[destination] = { count: 0, amount: 0 };
      }
      acc[destination].count += 1;
      acc[destination].amount += booking.totalAmount;
      return acc;
    }, {});

    const destinationBreakdown = Object.entries(destinationCounts)
      .map(([destination, data]) => ({ destination, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Status breakdown
    const statusBreakdown = bookings.reduce((acc: Record<string, number>, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate trends
    const recentBookings = bookings.slice(0, Math.floor(bookings.length / 2));
    const olderBookings = bookings.slice(Math.floor(bookings.length / 2));

    const recentAvgSpending = recentBookings.length > 0 
      ? recentBookings.reduce((sum, b) => sum + b.totalAmount, 0) / recentBookings.length
      : 0;
    const olderAvgSpending = olderBookings.length > 0
      ? olderBookings.reduce((sum, b) => sum + b.totalAmount, 0) / olderBookings.length
      : 0;

    const spendingTrend = recentAvgSpending > olderAvgSpending * 1.1 ? 'up' 
                        : recentAvgSpending < olderAvgSpending * 0.9 ? 'down' 
                        : 'stable';

    const bookingFrequency = recentBookings.length > olderBookings.length ? 'increasing' 
                           : recentBookings.length < olderBookings.length ? 'decreasing' 
                           : 'stable';

    const recentAvgStay = recentBookings.length > 0 
      ? recentBookings.reduce((sum, b) => sum + b.nights, 0) / recentBookings.length
      : 0;
    const olderAvgStay = olderBookings.length > 0
      ? olderBookings.reduce((sum, b) => sum + b.nights, 0) / olderBookings.length
      : 0;

    const averageStayTrend = recentAvgStay > olderAvgStay * 1.2 ? 'longer'
                           : recentAvgStay < olderAvgStay * 0.8 ? 'shorter'
                           : 'stable';

    return {
      totalBookings,
      totalSpent,
      averageStayDuration,
      totalNights,
      uniqueDestinations,
      averageAdvanceBooking,
      seasonalBreakdown,
      monthlySpending,
      destinationBreakdown,
      statusBreakdown,
      recentTrends: {
        spendingTrend,
        bookingFrequency,
        averageStayTrend
      }
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };


  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'increasing':
      case 'longer':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
      case 'decreasing':
      case 'shorter':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'increasing':
      case 'longer':
        return 'text-green-600';
      case 'down':
      case 'decreasing':
      case 'shorter':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!user) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Sign in to view analytics</h3>
          <p className="text-slate-600">Access detailed insights about your travel patterns and spending</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics || analytics.totalBookings === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No travel data yet
          </h3>
          <p className="text-slate-600 mb-6">
            Start booking to see detailed analytics about your travel patterns and preferences.
          </p>
          <Button size="lg" onClick={loadAnalyticsData}>
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timeframe Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Travel Analytics
        </h2>
        <div className="flex gap-2">
          {[
            { value: '3months', label: '3M' },
            { value: '6months', label: '6M' },
            { value: '1year', label: '1Y' },
            { value: 'all', label: 'All' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value as any)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeframe === option.value
                  ? 'bg-luxury-navy text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-luxury-navy" />
            {getTrendIcon(analytics.recentTrends.bookingFrequency)}
          </div>
          <div className="text-2xl font-bold text-luxury-navy mb-1">
            {analytics.totalBookings}
          </div>
          <div className="text-sm text-slate-600">Total Bookings</div>
          <div className={`text-xs mt-1 ${getTrendColor(analytics.recentTrends.bookingFrequency)}`}>
            {analytics.recentTrends.bookingFrequency}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-luxury-gold" />
            {getTrendIcon(analytics.recentTrends.spendingTrend)}
          </div>
          <div className="text-2xl font-bold text-luxury-gold mb-1">
            {formatCurrency(analytics.totalSpent)}
          </div>
          <div className="text-sm text-slate-600">Total Spent</div>
          <div className={`text-xs mt-1 ${getTrendColor(analytics.recentTrends.spendingTrend)}`}>
            spending trend {analytics.recentTrends.spendingTrend}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {getTrendIcon(analytics.recentTrends.averageStayTrend)}
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {analytics.averageStayDuration}
          </div>
          <div className="text-sm text-slate-600">Avg. Stay (nights)</div>
          <div className={`text-xs mt-1 ${getTrendColor(analytics.recentTrends.averageStayTrend)}`}>
            stays getting {analytics.recentTrends.averageStayTrend}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {analytics.uniqueDestinations}
          </div>
          <div className="text-sm text-slate-600">Destinations</div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics.totalNights} total nights
          </div>
        </div>
      </div>

      {/* Top Destinations */}
      {analytics.destinationBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-luxury-gold" />
            Top Destinations
          </h3>
          <div className="space-y-3">
            {analytics.destinationBreakdown.slice(0, 5).map((destination, index) => (
              <div key={destination.destination} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-luxury-navy text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{destination.destination}</div>
                    <div className="text-sm text-slate-600">{destination.count} booking{destination.count > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-luxury-gold">
                    {formatCurrency(destination.amount)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatCurrency(destination.amount / destination.count)} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal and Monthly Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seasonal Breakdown */}
        {Object.keys(analytics.seasonalBreakdown).length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-luxury-gold" />
              Seasonal Preferences
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.seasonalBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([season, count]) => (
                  <div key={season} className="flex items-center justify-between">
                    <span className="text-slate-900">{season}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-luxury-navy h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(analytics.seasonalBreakdown))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-8">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Booking Insights */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-luxury-gold" />
            Booking Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Average advance booking</span>
              <span className="font-semibold text-slate-900">
                {analytics.averageAdvanceBooking} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Average per night</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(analytics.totalSpent / Math.max(analytics.totalNights, 1))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Average per booking</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(analytics.totalSpent / Math.max(analytics.totalBookings, 1))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Completion rate</span>
              <span className="font-semibold text-slate-900">
                {Math.round((analytics.statusBreakdown.completed || 0) / analytics.totalBookings * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={loadAnalyticsData}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Refresh Analytics
        </Button>
      </div>
    </div>
  );
};

export default TravelAnalytics;