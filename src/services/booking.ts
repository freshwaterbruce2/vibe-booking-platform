import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API client with authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationNumber: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingParams {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
}

export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(params: CreateBookingParams): Promise<Booking> {
    try {
      const response = await apiClient.post('/bookings/create', params);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create booking');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to create booking:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Booking creation failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get booking by ID
   */
  static async getBooking(bookingId: string): Promise<Booking> {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get booking');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to get booking:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to retrieve booking');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get booking by confirmation number
   */
  static async getBookingByConfirmation(confirmationNumber: string): Promise<Booking> {
    try {
      const response = await apiClient.get(`/bookings/confirmation/${confirmationNumber}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get booking');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to get booking by confirmation:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Booking not found');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string, 
    status: 'confirmed' | 'cancelled' | 'completed'
  ): Promise<Booking> {
    try {
      const response = await apiClient.patch(`/bookings/${bookingId}/status`, { status });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update booking');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to update booking status:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Status update failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/cancel`, { reason });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel booking');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Cancellation failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(
    userId?: string,
    status?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ bookings: Booking[]; total: number }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (userId) params.append('userId', userId);
      if (status) params.append('status', status);
      
      const response = await apiClient.get(`/bookings?${params}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get bookings');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to get user bookings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to retrieve bookings');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Calculate booking price
   */
  static calculatePrice(
    pricePerNight: number,
    checkIn: Date,
    checkOut: Date,
    rooms: number = 1
  ): number {
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return pricePerNight * nights * rooms;
  }

  /**
   * Format booking dates
   */
  static formatDateRange(checkIn: string | Date, checkOut: string | Date): string {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    
    return `${checkInDate.toLocaleDateString('en-US', options)} - ${checkOutDate.toLocaleDateString('en-US', options)}`;
  }

  /**
   * Calculate number of nights
   */
  static calculateNights(checkIn: string | Date, checkOut: string | Date): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get booking status color for UI
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600 bg-yellow-50',
      confirmed: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50',
      completed: 'text-blue-600 bg-blue-50',
    };
    
    return colors[status] || 'text-gray-600 bg-gray-50';
  }

  /**
   * Get booking status icon
   */
  static getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✅',
      cancelled: '❌',
      completed: '✓',
    };
    
    return icons[status] || '📋';
  }

  /**
   * Validate booking dates
   */
  static validateDates(checkIn: Date, checkOut: Date): { valid: boolean; message?: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      return { valid: false, message: 'Check-in date cannot be in the past' };
    }
    
    if (checkOut <= checkIn) {
      return { valid: false, message: 'Check-out date must be after check-in date' };
    }
    
    const maxStay = 30; // Maximum 30 nights
    const nights = this.calculateNights(checkIn, checkOut);
    if (nights > maxStay) {
      return { valid: false, message: `Maximum stay is ${maxStay} nights` };
    }
    
    return { valid: true };
  }
}

export default BookingService;