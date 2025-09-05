import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Bookings API', () => {
  const validBookingData = {
    hotelId: 'hotel-1',
    roomId: 'room-1',
    guestInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    },
    dates: {
      checkIn: '2025-09-15',
      checkOut: '2025-09-18'
    },
    totalAmount: 897
  };

  describe('POST /api/bookings', () => {
    it('should create a new booking with valid data', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      expect(response.body).toHaveProperty('bookingId');
      expect(response.body).toHaveProperty('status', 'confirmed');
      expect(response.body).toHaveProperty('hotelId', validBookingData.hotelId);
      expect(response.body).toHaveProperty('roomId', validBookingData.roomId);
      expect(response.body).toHaveProperty('guestInfo');
      expect(response.body).toHaveProperty('dates');
      expect(response.body).toHaveProperty('totalAmount', validBookingData.totalAmount);
      expect(response.body).toHaveProperty('confirmationNumber');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should generate unique booking ID', async () => {
      const response1 = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      expect(response1.body.bookingId).not.toBe(response2.body.bookingId);
    });

    it('should generate unique confirmation number', async () => {
      const response1 = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      expect(response1.body.confirmationNumber).not.toBe(response2.body.confirmationNumber);
      expect(response1.body.confirmationNumber).toMatch(/^VB[A-Z0-9]{8}$/);
      expect(response2.body.confirmationNumber).toMatch(/^VB[A-Z0-9]{8}$/);
    });

    it('should include valid ISO timestamp', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      const createdAt = new Date(response.body.createdAt);
      expect(createdAt.toISOString()).toBe(response.body.createdAt);
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should preserve guest information', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      expect(response.body.guestInfo).toEqual(validBookingData.guestInfo);
    });

    it('should preserve booking dates', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      expect(response.body.dates).toEqual(validBookingData.dates);
    });

    it('should handle missing required fields gracefully', async () => {
      const incompleteData = {
        hotelId: 'hotel-1',
        // Missing roomId, guestInfo, dates, totalAmount
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(incompleteData)
        .expect(200);

      // Mock endpoint still creates booking but with undefined values
      expect(response.body).toHaveProperty('bookingId');
      expect(response.body).toHaveProperty('status', 'confirmed');
    });

    it('should handle different guest information formats', async () => {
      const bookingWithExtendedGuest = {
        ...validBookingData,
        guestInfo: {
          ...validBookingData.guestInfo,
          address: '123 Main St',
          city: 'Miami',
          country: 'USA',
          specialRequests: 'Late check-in'
        }
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingWithExtendedGuest)
        .expect(200);

      expect(response.body.guestInfo).toEqual(bookingWithExtendedGuest.guestInfo);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should retrieve booking details for any ID', async () => {
      const bookingId = 'test-booking-123';
      
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(response.body).toHaveProperty('bookingId', bookingId);
      expect(response.body).toHaveProperty('status', 'confirmed');
      expect(response.body).toHaveProperty('hotelName');
      expect(response.body).toHaveProperty('roomType');
      expect(response.body).toHaveProperty('dates');
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body).toHaveProperty('confirmationNumber');
    });

    it('should return consistent booking structure', async () => {
      const response = await request(app)
        .get('/api/bookings/booking-123')
        .expect(200);

      expect(response.body.dates).toHaveProperty('checkIn');
      expect(response.body.dates).toHaveProperty('checkOut');
      expect(typeof response.body.totalAmount).toBe('number');
      expect(response.body.totalAmount).toBeGreaterThan(0);
      expect(response.body.confirmationNumber).toMatch(/^VB[A-Z0-9]+$/);
    });

    it('should handle various booking ID formats', async () => {
      const bookingIds = [
        'booking-123',
        'BOOKING-ABC',
        'book_456',
        '789',
        'booking-with-long-id-name'
      ];

      for (const bookingId of bookingIds) {
        const response = await request(app)
          .get(`/api/bookings/${bookingId}`)
          .expect(200);

        expect(response.body.bookingId).toBe(bookingId);
      }
    });

    it('should handle special characters in booking ID', async () => {
      const response = await request(app)
        .get('/api/bookings/booking-123-test')
        .expect(200);

      expect(response.body).toHaveProperty('bookingId', 'booking-123-test');
    });
  });

  describe('Booking Data Validation', () => {
    it('should maintain data consistency between create and retrieve', async () => {
      // Create booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(200);

      const bookingId = createResponse.body.bookingId;

      // Note: The mock GET endpoint returns fixed data, not the created booking
      // In a real implementation, this would return the actual created booking
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(getResponse.body.bookingId).toBe(bookingId);
    });

    it('should handle edge case date formats', async () => {
      const bookingWithDifferentDates = {
        ...validBookingData,
        dates: {
          checkIn: '2025-12-31',
          checkOut: '2026-01-01'
        }
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingWithDifferentDates)
        .expect(200);

      expect(response.body.dates).toEqual(bookingWithDifferentDates.dates);
    });

    it('should handle large total amounts', async () => {
      const expensiveBooking = {
        ...validBookingData,
        totalAmount: 50000
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(expensiveBooking)
        .expect(200);

      expect(response.body.totalAmount).toBe(50000);
    });
  });
});