import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Payments API', () => {
  const validPaymentData = {
    amount: 897,
    bookingId: 'booking-123',
    paymentMethod: 'card'
  };

  describe('POST /api/payments/create', () => {
    it('should process payment successfully', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send(validPaymentData)
        .expect(200);

      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('amount', validPaymentData.amount);
      expect(response.body).toHaveProperty('bookingId', validPaymentData.bookingId);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('processedAt');
    });

    it('should generate unique payment ID', async () => {
      const response1 = await request(app)
        .post('/api/payments/create')
        .send(validPaymentData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/payments/create')
        .send(validPaymentData)
        .expect(200);

      expect(response1.body.paymentId).not.toBe(response2.body.paymentId);
      expect(response1.body.paymentId).toMatch(/^payment-\d+$/);
      expect(response2.body.paymentId).toMatch(/^payment-\d+$/);
    });

    it('should generate unique transaction ID', async () => {
      const response1 = await request(app)
        .post('/api/payments/create')
        .send(validPaymentData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/payments/create')
        .send(validPaymentData)
        .expect(200);

      expect(response1.body.transactionId).not.toBe(response2.body.transactionId);
      expect(response1.body.transactionId).toMatch(/^txn_[a-z0-9]{10}$/);
      expect(response2.body.transactionId).toMatch(/^txn_[a-z0-9]{10}$/);
    });

    it('should include valid timestamp', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send(validPaymentData)
        .expect(200);

      const processedAt = new Date(response.body.processedAt);
      expect(processedAt.toISOString()).toBe(response.body.processedAt);
      expect(processedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should handle different payment amounts', async () => {
      const amounts = [1, 100, 999.99, 5000, 10000];

      for (const amount of amounts) {
        const paymentData = { ...validPaymentData, amount };
        const response = await request(app)
          .post('/api/payments/create')
          .send(paymentData)
          .expect(200);

        expect(response.body.amount).toBe(amount);
        expect(response.body.status).toBe('completed');
      }
    });

    it('should handle different payment methods', async () => {
      const paymentMethods = ['card', 'paypal', 'apple_pay', 'google_pay'];

      for (const paymentMethod of paymentMethods) {
        const paymentData = { ...validPaymentData, paymentMethod };
        const response = await request(app)
          .post('/api/payments/create')
          .send(paymentData)
          .expect(200);

        expect(response.body.status).toBe('completed');
      }
    });

    it('should handle different booking ID formats', async () => {
      const bookingIds = [
        'booking-123',
        'BOOK_456',
        'reservation-abc-def',
        '789-xyz'
      ];

      for (const bookingId of bookingIds) {
        const paymentData = { ...validPaymentData, bookingId };
        const response = await request(app)
          .post('/api/payments/create')
          .send(paymentData)
          .expect(200);

        expect(response.body.bookingId).toBe(bookingId);
      }
    });

    it('should handle missing optional fields', async () => {
      const minimalPaymentData = {
        amount: 299,
        bookingId: 'booking-minimal'
        // paymentMethod is optional
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(minimalPaymentData)
        .expect(200);

      expect(response.body.amount).toBe(299);
      expect(response.body.bookingId).toBe('booking-minimal');
      expect(response.body.status).toBe('completed');
    });

    it('should handle zero amount', async () => {
      const zeroAmountPayment = {
        ...validPaymentData,
        amount: 0
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(zeroAmountPayment)
        .expect(200);

      expect(response.body.amount).toBe(0);
      expect(response.body.status).toBe('completed');
    });

    it('should handle large amounts', async () => {
      const largeAmountPayment = {
        ...validPaymentData,
        amount: 99999.99
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(largeAmountPayment)
        .expect(200);

      expect(response.body.amount).toBe(99999.99);
      expect(response.body.status).toBe('completed');
    });

    it('should handle decimal amounts correctly', async () => {
      const decimalAmounts = [1.99, 299.50, 1234.67];

      for (const amount of decimalAmounts) {
        const paymentData = { ...validPaymentData, amount };
        const response = await request(app)
          .post('/api/payments/create')
          .send(paymentData)
          .expect(200);

        expect(response.body.amount).toBe(amount);
      }
    });
  });

  describe('Payment Data Validation', () => {
    it('should maintain consistent payment ID format', async () => {
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/payments/create')
          .send(validPaymentData)
          .expect(200);
        responses.push(response.body);
      }

      responses.forEach((payment) => {
        expect(payment.paymentId).toMatch(/^payment-\d+$/);
        expect(payment.transactionId).toMatch(/^txn_[a-z0-9]{10}$/);
        expect(payment.status).toBe('completed');
      });
    });

    it('should handle concurrent payment requests', async () => {
      const promises = Array(3).fill(null).map(() => 
        request(app)
          .post('/api/payments/create')
          .send(validPaymentData)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('completed');
      });

      // All payment IDs should be unique
      const paymentIds = responses.map(r => r.body.paymentId);
      const uniqueIds = [...new Set(paymentIds)];
      expect(uniqueIds.length).toBe(paymentIds.length);
    });

    it('should preserve all input data in response', async () => {
      const detailedPaymentData = {
        amount: 1299.99,
        bookingId: 'booking-luxury-suite-456',
        paymentMethod: 'premium_card',
        currency: 'USD',
        description: 'Luxury hotel booking payment'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(detailedPaymentData)
        .expect(200);

      expect(response.body.amount).toBe(detailedPaymentData.amount);
      expect(response.body.bookingId).toBe(detailedPaymentData.bookingId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('status', 'completed');
    });

    it('should handle null values', async () => {
      const nullPaymentData = {
        amount: null,
        bookingId: null,
        paymentMethod: null
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(nullPaymentData)
        .expect(200);

      expect(response.body.status).toBe('completed');
    });

    it('should handle undefined values', async () => {
      const undefinedPaymentData = {
        amount: undefined,
        bookingId: undefined,
        paymentMethod: undefined
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(undefinedPaymentData)
        .expect(200);

      expect(response.body.status).toBe('completed');
    });
  });
});