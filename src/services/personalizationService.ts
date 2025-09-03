import { logger } from '@/utils/logger';
import { bookingService, type Booking } from './bookingService';

export interface UserPreferences {
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  preferredRegions: string[];
  hotelTypes: string[];
  amenities: string[];
  bookingPatterns: {
    averageStayDuration: number;
    preferredDaysOfWeek: number[];
    seasonalPreferences: string[];
    advanceBookingDays: number;
  };
  travelStyle: 'luxury' | 'business' | 'leisure' | 'budget' | 'adventure';
  passionCategories: string[];
}

export interface PersonalizationInsights {
  recommendedHotels: any[];
  budgetOptimization: {
    averageNightlyRate: number;
    suggestedBudget: number;
    seasonalTrends: any[];
  };
  travelPatterns: {
    mostVisitedDestinations: string[];
    preferredStayDuration: number;
    bookingLeadTime: number;
  };
  preferences: UserPreferences;
}

class PersonalizationService {
  async analyzeUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Get user's booking history
      const bookings = await bookingService.getUserBookings(userId);
      
      if (bookings.length === 0) {
        logger.info('No booking history for personalization analysis', { userId });
        return null;
      }

      // Analyze budget patterns
      const amounts = bookings
        .filter(b => b.status === 'completed' || b.status === 'confirmed')
        .map(b => b.totalAmount);
      
      const budgetRange = amounts.length > 0 ? {
        min: Math.min(...amounts) * 0.8, // 20% below minimum
        max: Math.max(...amounts) * 1.2, // 20% above maximum
        currency: bookings[0].currency || 'USD'
      } : {
        min: 100,
        max: 500,
        currency: 'USD'
      };

      // Analyze stay duration patterns
      const stayDurations = bookings.map(b => b.nights);
      const averageStayDuration = stayDurations.length > 0 
        ? Math.round(stayDurations.reduce((sum, nights) => sum + nights, 0) / stayDurations.length)
        : 2;

      // Analyze booking advance time
      const advanceBookingTimes = bookings.map(b => {
        const bookingDate = new Date(b.createdAt);
        const checkInDate = new Date(b.checkIn);
        return Math.floor((checkInDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
      });
      
      const averageAdvanceBooking = advanceBookingTimes.length > 0
        ? Math.round(advanceBookingTimes.reduce((sum, days) => sum + days, 0) / advanceBookingTimes.length)
        : 14;

      // Extract preferred regions/cities
      const cities = bookings.map(b => b.hotelCity).filter(city => city);
      const regionCounts = cities.reduce((acc: Record<string, number>, city) => {
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});
      
      const preferredRegions = Object.entries(regionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([city]) => city);

      // Determine travel style based on spending patterns
      const averageAmount = amounts.length > 0 
        ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length 
        : 250;
      
      let travelStyle: UserPreferences['travelStyle'] = 'leisure';
      if (averageAmount > 800) travelStyle = 'luxury';
      else if (averageAmount > 400) travelStyle = 'business';
      else if (averageAmount < 150) travelStyle = 'budget';

      // Analyze day-of-week preferences
      const checkInDays = bookings.map(b => new Date(b.checkIn).getDay());
      const dayPreferences = checkInDays.reduce((acc: Record<number, number>, day) => {
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
      
      const preferredDaysOfWeek = Object.entries(dayPreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([day]) => parseInt(day));

      const preferences: UserPreferences = {
        budgetRange,
        preferredRegions,
        hotelTypes: this.inferHotelTypes(travelStyle),
        amenities: this.inferPreferredAmenities(travelStyle, averageStayDuration),
        bookingPatterns: {
          averageStayDuration,
          preferredDaysOfWeek,
          seasonalPreferences: this.analyzeSeasonalPreferences(bookings),
          advanceBookingDays: averageAdvanceBooking
        },
        travelStyle,
        passionCategories: this.inferPassionCategories(travelStyle, preferredRegions)
      };

      logger.info('User preferences analyzed successfully', {
        userId,
        travelStyle,
        averageAmount,
        bookingCount: bookings.length
      });

      return preferences;
    } catch (error) {
      logger.error('Failed to analyze user preferences:', error);
      return null;
    }
  }

  async generatePersonalizationInsights(userId: string): Promise<PersonalizationInsights | null> {
    try {
      const [preferences, bookings] = await Promise.all([
        this.analyzeUserPreferences(userId),
        bookingService.getUserBookings(userId)
      ]);

      if (!preferences) {
        return null;
      }

      // Generate travel patterns
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const destinationCounts = completedBookings.reduce((acc: Record<string, number>, booking) => {
        const destination = booking.hotelCity;
        if (destination) {
          acc[destination] = (acc[destination] || 0) + 1;
        }
        return acc;
      }, {});

      const mostVisitedDestinations = Object.entries(destinationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([destination]) => destination);

      // Calculate budget optimization suggestions
      const amounts = completedBookings.map(b => b.totalAmount);
      const averageNightlyRate = amounts.length > 0 
        ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
        : 200;

      const suggestedBudget = Math.round(averageNightlyRate * 1.1); // 10% increase for better options

      const insights: PersonalizationInsights = {
        recommendedHotels: [], // Will be populated by hotel recommendation logic
        budgetOptimization: {
          averageNightlyRate,
          suggestedBudget,
          seasonalTrends: this.analyzeSeasonalTrends(bookings)
        },
        travelPatterns: {
          mostVisitedDestinations,
          preferredStayDuration: preferences.bookingPatterns.averageStayDuration,
          bookingLeadTime: preferences.bookingPatterns.advanceBookingDays
        },
        preferences
      };

      logger.info('Personalization insights generated', {
        userId,
        insightsGenerated: true,
        destinationCount: mostVisitedDestinations.length
      });

      return insights;
    } catch (error) {
      logger.error('Failed to generate personalization insights:', error);
      return null;
    }
  }

  private inferHotelTypes(travelStyle: string): string[] {
    const hotelTypes = [];
    
    switch (travelStyle) {
      case 'luxury':
        hotelTypes.push('5-star', 'boutique', 'resort', 'luxury suite');
        break;
      case 'business':
        hotelTypes.push('business hotel', '4-star', 'conference hotel', 'city center');
        break;
      case 'leisure':
        hotelTypes.push('3-star', '4-star', 'family-friendly', 'resort');
        break;
      case 'budget':
        hotelTypes.push('2-star', '3-star', 'budget hotel', 'hostel');
        break;
      case 'adventure':
        hotelTypes.push('eco-lodge', 'mountain resort', 'adventure hotel', 'camping');
        break;
    }

    return hotelTypes;
  }

  private inferPreferredAmenities(travelStyle: string, averageStayDuration: number): string[] {
    const amenities = ['free-wifi', 'parking'];
    
    if (travelStyle === 'luxury') {
      amenities.push('spa', 'concierge', 'fine-dining', 'premium-bedding');
    }
    
    if (travelStyle === 'business') {
      amenities.push('business-center', 'meeting-rooms', 'express-checkout');
    }
    
    if (averageStayDuration > 3) {
      amenities.push('room-service', 'laundry', 'kitchenette');
    }
    
    return amenities;
  }

  private inferPassionCategories(travelStyle: string, preferredRegions: string[]): string[] {
    const categories = [];
    
    // Infer from travel style
    if (travelStyle === 'luxury') categories.push('luxury', 'fine-dining');
    if (travelStyle === 'adventure') categories.push('adventure', 'nature');
    if (travelStyle === 'business') categories.push('business', 'city-break');
    
    // Infer from destinations (basic city-to-category mapping)
    const cityCategories: Record<string, string[]> = {
      'New York': ['culture', 'city-break', 'business'],
      'Paris': ['romance', 'culture', 'fine-dining'],
      'Tokyo': ['culture', 'business', 'adventure'],
      'London': ['culture', 'business', 'city-break'],
      'Miami': ['beach', 'nightlife', 'luxury'],
      'Barcelona': ['culture', 'beach', 'architecture'],
      'Rome': ['culture', 'history', 'fine-dining']
    };
    
    preferredRegions.forEach(region => {
      const regionCategories = cityCategories[region];
      if (regionCategories) {
        categories.push(...regionCategories);
      }
    });
    
    return [...new Set(categories)];
  }

  private analyzeSeasonalPreferences(bookings: Booking[]): string[] {
    const seasonCounts = bookings.reduce((acc: Record<string, number>, booking) => {
      const month = new Date(booking.checkIn).getMonth();
      let season = 'spring';
      
      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'fall';
      else season = 'winter';
      
      acc[season] = (acc[season] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(seasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([season]) => season);
  }

  private analyzeSeasonalTrends(bookings: Booking[]): any[] {
    const monthlySpending = bookings.reduce((acc: Record<number, number[]>, booking) => {
      const month = new Date(booking.checkIn).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(booking.totalAmount);
      return acc;
    }, {});

    return Object.entries(monthlySpending).map(([month, amounts]) => ({
      month: parseInt(month),
      averageSpending: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
      bookingCount: amounts.length
    }));
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      // In a real implementation, this would save to a database
      // For now, we'll store in localStorage as a demo
      const existingPrefs = await this.analyzeUserPreferences(userId);
      const updatedPrefs = { ...existingPrefs, ...preferences };
      
      localStorage.setItem(`user-preferences-${userId}`, JSON.stringify(updatedPrefs));
      
      logger.info('User preferences updated', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      return false;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Try to get from localStorage first (for demo purposes)
      const stored = localStorage.getItem(`user-preferences-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Otherwise analyze from booking history
      return this.analyzeUserPreferences(userId);
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return null;
    }
  }
}

export const personalizationService = new PersonalizationService();
export default personalizationService;