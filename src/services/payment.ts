import { z } from 'zod';
import axios from 'axios';
// NOTE: Legacy Stripe intent logic removed; focusing on Square & PayPal unified flows.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
// Stripe removed for current scope; reintroduce when provider abstraction in place.

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

// Payment service interface
export interface CreatedPayment {
  success: boolean;
  paymentId?: string;
  receiptUrl?: string;
  message?: string;
}

export interface PaymentHistory {
  payments: Array<{
    id: string;
    bookingId: string;
    amount: string;
    currency: string;
    status: string;
    method: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type RefundRequest = SharedRefundRequest;
export type RefundResponse = SharedRefundResponse;

export interface BasicPaymentRecord {
  id?: string;
  transactionId?: string;
  bookingId?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BasicRefundRecord {
  id?: string;
  bookingId?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingPayments {
  payments: Array<BasicPaymentRecord>;
  refunds: Array<BasicRefundRecord>;
  summary: {
    totalPaid: number;
    totalRefunded: number;
    pendingPayments: number;
    pendingRefunds: number;
  };
}

// Removed SetupIntent for Stripe.

export class PaymentService {
  /**
   * Create a payment intent for a booking
   */
  static async createSquarePayment(payload: {
    bookingId: string;
    amount: number;
    currency?: string;
    sourceId: string;
    billingAddress?: Record<string, unknown>;
  }): Promise<CreatedPayment> {
    try {
      const candidate = { provider: 'square', currency: 'USD', ...payload };
      const parsed = CreatePaymentRequestSchema.safeParse(candidate);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
      }
      const response = await apiClient.post('/payments/create', {
        ...parsed.data,
        billingAddress: payload.billingAddress,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create Square payment:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Square payment failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Confirm a payment intent
   */
  // confirmPaymentIntent removed (Stripe).

  /**
   * Get payment status
   */
  // getPaymentStatus removed (Stripe-specific path); could poll /payments/booking/:id if needed.

  /**
   * Get payments for a specific booking
   */
  static async getBookingPayments(bookingId: string): Promise<BookingPayments> {
    try {
      const response = await apiClient.get(`/payments/booking/${bookingId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get booking payments');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get booking payments:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to retrieve booking payments');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const legacy = request as unknown as {
        paymentId?: string;
        paymentIntentId?: string;
        bookingId?: string;
      };
      const parsed = RefundRequestSchema.safeParse({
        paymentId: legacy.paymentId || legacy.paymentIntentId,
  bookingId: legacy.bookingId || '',
        amount: request.amount,
        reason: request.reason,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
      }
      const response = await apiClient.post('/payments/refund', parsed.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create refund:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Refund request failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get payment history for the current user
   */
  static async getPaymentHistory(
    page = 1,
    limit = 10,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentHistory> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) {
        params.append('status', status);
      }
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }

      const response = await apiClient.get(`/payments/history?${params}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get payment history');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get payment history:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to retrieve payment history');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  // createSetupIntent removed.

  /**
   * Process payment with Stripe Elements
   */
  // processPayment removed (Stripe Elements specific).

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Calculate commission amount (5%)
   */
  static calculateCommission(amount: number): number {
    return Math.round(amount * 0.05 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get payment method icon based on brand
   */
  static getPaymentMethodIcon(brand: string): string {
    const icons: Record<string, string> = {
      visa: 'ðŸ’³',
      mastercard: 'ðŸ’³',
      amex: 'ðŸ’³',
      discover: 'ðŸ’³',
      diners: 'ðŸ’³',
      jcb: 'ðŸ’³',
      unionpay: 'ðŸ’³',
      unknown: 'ðŸ’³',
    };

    return icons[brand.toLowerCase()] || icons.unknown;
  }

  /**
   * Get payment status color for UI
   */
  static getPaymentStatusColor(status: string): string {
    const colors: Record<string, string> = {
      completed: 'text-green-600',
      pending: 'text-yellow-600',
      failed: 'text-red-600',
      canceled: 'text-gray-600',
      processing: 'text-blue-600',
    };

    return colors[status] || 'text-gray-600';
  }

  /**
   * Validate payment amount
   */
  static validatePaymentAmount(amount: number, currency = 'USD'): boolean {
    // Minimum amounts vary by currency (Stripe requirements)
    const minimums: Record<string, number> = {
      USD: 0.50,
      EUR: 0.50,
      GBP: 0.30,
      CAD: 0.50,
      AUD: 0.50,
    };

    const minimum = minimums[currency.toUpperCase()] || 0.50;
    return amount >= minimum && amount <= 999999; // Max $999,999
  }
}

export default PaymentService;