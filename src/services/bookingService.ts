import axios from 'axios';
import { logger } from '@/utils/logger';

// Use proxy in development, direct URL in production
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:4002');

export interface BookingData {
  hotelId: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  totalAmount: number;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  hotelId: string;
  hotelName: string;
  hotelCity: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  guestInfo?: any;
  totalAmount: number;
  commission: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmationCode: string;
  confirmedAt?: string;
  cancelledAt?: string;
  paymentId?: string;
}

class BookingService {
  async createBooking(data: BookingData): Promise<Booking> {
    try {
      const response = await axios.post(`${API_URL}/api/bookings`, data);
      if (response.data.success) {
        return response.data.booking;
      }
      throw new Error('Failed to create booking');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Booking failed');
    }
  }

  async getBookings(): Promise<Booking[]> {
    try {
      const response = await axios.get(`${API_URL}/api/bookings`);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      logger.error('Failed to fetch user bookings', {
        component: 'BookingService',
        method: 'getBookings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getBooking(id: string): Promise<Booking | null> {
    try {
      const response = await axios.get(`${API_URL}/api/bookings/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      logger.error('Failed to fetch individual booking', {
        component: 'BookingService',
        method: 'getBooking',
        bookingId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async cancelBooking(id: string): Promise<boolean> {
    try {
      const response = await axios.put(`${API_URL}/api/bookings/${id}/cancel`);
      return response.data.success;
    } catch (error) {
      logger.error('Booking cancellation failed', {
        component: 'BookingService',
        method: 'cancelBooking',
        bookingId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async confirmBooking(id: string): Promise<Booking | null> {
    try {
      const response = await axios.put(`${API_URL}/api/bookings/${id}/confirm`);
      if (response.data.success) {
        return response.data.booking;
      }
      return null;
    } catch (error) {
      logger.error('Booking confirmation failed', {
        component: 'BookingService',
        method: 'confirmBooking',
        bookingId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  calculateTotalAmount(pricePerNight: number, nights: number, guests: number): number {
    const baseAmount = pricePerNight * nights;
    const guestFee = guests > 2 ? (guests - 2) * 20 * nights : 0;
    const serviceFee = baseAmount * 0.1; // 10% service fee
    return baseAmount + guestFee + serviceFee;
  }

  calculateCommission(totalAmount: number): number {
    return totalAmount * 0.05; // 5% commission
  }
}

export const bookingService = new BookingService();