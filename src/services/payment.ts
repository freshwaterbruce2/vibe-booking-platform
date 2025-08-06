import axios from 'axios';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;
if (STRIPE_PUBLISHABLE_KEY) {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
} else {
  console.warn('Stripe publishable key not found. Payment functionality will be disabled.');
  stripePromise = Promise.resolve(null);
}

export { stripePromise };

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
export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  commissionAmount: number;
  platformFee: number;
}

export interface PaymentStatus {
  status: string;
  amount: number;
  currency: string;
  created: number;
  payment: any;
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

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface RefundResponse {
  refund: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reason: string;
  };
}

export interface BookingPayments {
  payments: Array<any>;
  refunds: Array<any>;
  summary: {
    totalPaid: number;
    totalRefunded: number;
    pendingPayments: number;
    pendingRefunds: number;
  };
}

export interface SetupIntent {
  clientSecret: string;
  setupIntentId: string;
}

export class PaymentService {
  /**
   * Create a payment intent for a booking
   */
  static async createPaymentIntent(
    bookingId: string,
    amount: number,
    currency = 'USD',
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      const response = await apiClient.post('/payments/create-intent', {
        bookingId,
        amount,
        currency,
        metadata,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment intent');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Payment setup failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<any> {
    try {
      const response = await apiClient.post('/payments/confirm', {
        paymentIntentId,
        paymentMethodId,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to confirm payment');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Payment confirmation failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      const response = await apiClient.get(`/payments/status/${paymentIntentId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get payment status');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to retrieve payment status');
      }
      throw new Error('Network error occurred');
    }
  }

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
  static async createRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await apiClient.post('/payments/refund', refundRequest);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create refund');
      }

      return response.data.data;
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
    endDate?: Date
  ): Promise<PaymentHistory> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

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
  static async createSetupIntent(metadata: Record<string, string> = {}): Promise<SetupIntent> {
    try {
      const response = await apiClient.post('/payments/setup-intent', { metadata });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create setup intent');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to create setup intent:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Setup intent creation failed');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Process payment with Stripe Elements
   */
  static async processPayment(
    stripe: Stripe,
    elements: StripeElements,
    clientSecret: string,
    billingDetails: {
      name: string;
      email: string;
      phone?: string;
      address?: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    }
  ) {
    try {
      const cardElement = elements.getElement('card');
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      return paymentIntent;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

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
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      diners: '💳',
      jcb: '💳',
      unionpay: '💳',
      unknown: '💳',
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