import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { cacheService } from './cacheService';

// LiteAPI response schemas
const LiteAPIHotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  starRating: z.number(),
  description: z.string(),
  images: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
  })),
  amenities: z.array(z.string()),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
});

const LiteAPIAvailabilitySchema = z.object({
  hotelId: z.string(),
  available: z.boolean(),
  rooms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    currency: z.string(),
    available: z.number(),
    maxOccupancy: z.number(),
    amenities: z.array(z.string()),
  })),
});

export class LiteAPIService {
  private client: AxiosInstance;
  private cachePrefix = 'liteapi:';
  private cacheTTL = 300; // 5 minutes

  constructor() {
    this.client = axios.create({
      baseURL: config.liteapi.baseUrl,
      timeout: config.liteapi.timeout,
      headers: {
        'X-API-Key': config.liteapi.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (request) => {
        logger.debug('LiteAPI request', {
          method: request.method,
          url: request.url,
          params: request.params,
        });
        return request;
      },
      (error) => {
        logger.error('LiteAPI request error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('LiteAPI response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('LiteAPI response error', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  async searchHotels(params: {
    destination: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    rooms?: number;
    priceMin?: number;
    priceMax?: number;
    starRating?: number[];
    amenities?: string[];
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const cacheKey = `${this.cachePrefix}search:${JSON.stringify(params)}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get('/hotels/search', {
        params: {
          destination: params.destination,
          checkin: params.checkIn,
          checkout: params.checkOut,
          adults: params.adults,
          children: params.children || 0,
          rooms: params.rooms || 1,
          price_min: params.priceMin,
          price_max: params.priceMax,
          star_rating: params.starRating?.join(','),
          amenities: params.amenities?.join(','),
          limit: params.limit || 20,
          offset: params.offset || 0,
        },
      });

      const hotels = response.data.data || [];
      await cacheService.set(cacheKey, hotels, this.cacheTTL);

      return hotels;

    } catch (error) {
      logger.error('Failed to search hotels', { error, params });
      throw new Error('Failed to search hotels. Please try again.');
    }
  }

  async getHotelDetails(hotelId: string): Promise<any> {
    try {
      const cacheKey = `${this.cachePrefix}hotel:${hotelId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/hotels/${hotelId}`);
      const hotel = response.data.data;

      await cacheService.set(cacheKey, hotel, this.cacheTTL);

      return hotel;

    } catch (error) {
      logger.error('Failed to get hotel details', { error, hotelId });
      throw new Error('Failed to get hotel details.');
    }
  }

  async checkAvailability(params: {
    hotelId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    rooms?: number;
  }): Promise<any> {
    try {
      const response = await this.client.get(`/hotels/${params.hotelId}/availability`, {
        params: {
          checkin: params.checkIn,
          checkout: params.checkOut,
          adults: params.adults,
          children: params.children || 0,
          rooms: params.rooms || 1,
        },
      });

      return response.data.data;

    } catch (error) {
      logger.error('Failed to check availability', { error, params });
      throw new Error('Failed to check room availability.');
    }
  }

  async getRoomRates(params: {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
  }): Promise<any> {
    try {
      const response = await this.client.get(`/hotels/${params.hotelId}/rooms/${params.roomId}/rates`, {
        params: {
          checkin: params.checkIn,
          checkout: params.checkOut,
          adults: params.adults,
          children: params.children || 0,
        },
      });

      return response.data.data;

    } catch (error) {
      logger.error('Failed to get room rates', { error, params });
      throw new Error('Failed to get room rates.');
    }
  }

  async createBooking(bookingData: {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guest: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    adults: number;
    children?: number;
    specialRequests?: string;
    rateId: string;
  }): Promise<{
    bookingId: string;
    confirmationNumber: string;
    status: string;
  }> {
    try {
      const response = await this.client.post('/bookings', {
        hotel_id: bookingData.hotelId,
        room_id: bookingData.roomId,
        rate_id: bookingData.rateId,
        checkin: bookingData.checkIn,
        checkout: bookingData.checkOut,
        guest: {
          first_name: bookingData.guest.firstName,
          last_name: bookingData.guest.lastName,
          email: bookingData.guest.email,
          phone: bookingData.guest.phone,
        },
        adults: bookingData.adults,
        children: bookingData.children || 0,
        special_requests: bookingData.specialRequests,
      });

      return {
        bookingId: response.data.data.booking_id,
        confirmationNumber: response.data.data.confirmation_number,
        status: response.data.data.status,
      };

    } catch (error) {
      logger.error('Failed to create booking', { error, bookingData });
      throw new Error('Failed to create booking. Please try again.');
    }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<{
    status: string;
    refundAmount?: number;
  }> {
    try {
      const response = await this.client.delete(`/bookings/${bookingId}`, {
        data: { reason },
      });

      return {
        status: response.data.data.status,
        refundAmount: response.data.data.refund_amount,
      };

    } catch (error) {
      logger.error('Failed to cancel booking', { error, bookingId });
      throw new Error('Failed to cancel booking.');
    }
  }

  async getBookingDetails(bookingId: string): Promise<any> {
    try {
      const response = await this.client.get(`/bookings/${bookingId}`);
      return response.data.data;

    } catch (error) {
      logger.error('Failed to get booking details', { error, bookingId });
      throw new Error('Failed to get booking details.');
    }
  }

  async syncHotelData(hotelIds: string[]): Promise<void> {
    try {
      const batchSize = 10;
      for (let i = 0; i < hotelIds.length; i += batchSize) {
        const batch = hotelIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (hotelId) => {
            try {
              const hotelData = await this.getHotelDetails(hotelId);
              // Store in database
              await this.storeHotelData(hotelData);
            } catch (error) {
              logger.error('Failed to sync hotel', { error, hotelId });
            }
          })
        );
      }

      logger.info('Hotel data sync completed', { count: hotelIds.length });

    } catch (error) {
      logger.error('Failed to sync hotel data', { error });
      throw error;
    }
  }

  private async storeHotelData(hotelData: any): Promise<void> {
    // Implementation would store hotel data in the database
    // This is a placeholder for the actual implementation
    logger.info('Storing hotel data', { hotelId: hotelData.id });
  }
}

export const liteApiService = new LiteAPIService();