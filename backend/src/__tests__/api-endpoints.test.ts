import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createSimpleServer } from '../simpleServer';
import { Express } from 'express';

// Mock data factories
interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
}

interface MockHotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  starRating: number;
  priceMin: number;
  priceMax: number;
  currency: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
}

interface MockRoom {
  id: string;
  hotelId: string;
  name: string;
  type: string;
  description: string;
  maxOccupancy: number;
  adults: number;
  children: number;
  basePrice: number;
  currency: string;
  isActive: boolean;
}

interface MockBooking {
  id: string;
  confirmationNumber: string;
  guestEmail: string;
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  hotelId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  roomRate: number;
  taxes: number;
  fees: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

// Test data factories
const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  passwordHash: '$2a$10$hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'user',
  isActive: true,
  emailVerified: true,
  ...overrides,
});

const createMockHotel = (overrides: Partial<MockHotel> = {}): MockHotel => ({
  id: 'hotel-' + Math.random().toString(36).substr(2, 9),
  name: 'Luxury Resort & Spa',
  slug: 'luxury-resort-spa',
  description: 'A beautiful luxury resort with world-class amenities',
  address: '123 Resort Boulevard',
  city: 'Miami',
  country: 'US',
  latitude: 25.7617,
  longitude: -80.1918,
  rating: 4.5,
  reviewCount: 245,
  starRating: 5,
  priceMin: 150,
  priceMax: 500,
  currency: 'USD',
  amenities: ['pool', 'spa', 'restaurant', 'gym', 'wifi'],
  images: ['hotel1.jpg', 'hotel2.jpg'],
  isActive: true,
  ...overrides,
});

const createMockRoom = (hotelId: string, overrides: Partial<MockRoom> = {}): MockRoom => ({
  id: 'room-' + Math.random().toString(36).substr(2, 9),
  hotelId,
  name: 'Deluxe Ocean View',
  type: 'deluxe',
  description: 'Spacious room with stunning ocean views',
  maxOccupancy: 4,
  adults: 2,
  children: 2,
  basePrice: 250,
  currency: 'USD',
  isActive: true,
  ...overrides,
});

const createMockBooking = (hotelId: string, roomId: string, overrides: Partial<MockBooking> = {}): MockBooking => {
  const checkIn = new Date('2024-01-15');
  const checkOut = new Date('2024-01-18');
  const nights = 3;
  const roomRate = 250;
  const taxes = roomRate * nights * 0.15;
  const fees = 25;
  const totalAmount = (roomRate * nights) + taxes + fees;

  return {
    id: 'booking-' + Math.random().toString(36).substr(2, 9),
    confirmationNumber: 'VB' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    guestEmail: 'guest@example.com',
    guestFirstName: 'Jane',
    guestLastName: 'Smith',
    guestPhone: '+1987654321',
    hotelId,
    roomId,
    checkIn,
    checkOut,
    nights,
    adults: 2,
    children: 0,
    roomRate,
    taxes,
    fees,
    totalAmount,
    currency: 'USD',
    status: 'confirmed',
    paymentStatus: 'paid',
    ...overrides,
  };
};

describe('API Endpoints', () => {
  let app: Express;
  let mockHotel: MockHotel;
  let mockRoom: MockRoom;
  let mockUser: MockUser;
  let mockBooking: MockBooking;

  beforeAll(async () => {
    // Set environment variables for SQLite testing
    process.env.LOCAL_SQLITE = 'true';
    process.env.NODE_ENV = 'test';

    // Create the test server
    app = createSimpleServer();

    // Create mock data for tests
    mockHotel = createMockHotel();
    mockRoom = createMockRoom(mockHotel.id);
    mockUser = createMockUser();
    mockBooking = createMockBooking(mockHotel.id, mockRoom.id);
  });

  afterAll(async () => {
    // Cleanup can be added here if needed
  });

  beforeEach(() => {
    // Reset any state before each test if needed
  });

  describe('GET /api/health', () => {
    it('should return health status successfully', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        api: 'ready',
      });

      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/hotels', () => {
    it('should return hotel search results successfully', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .query({
          destination: 'Miami',
          checkIn: '2024-01-15',
          checkOut: '2024-01-18',
          adults: 2,
          children: 0,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('hotels');
      expect(Array.isArray(response.body.data.hotels)).toBe(true);
    });

    it('should return filtered hotels by destination', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .query({
          destination: 'New York',
          checkIn: '2024-02-01',
          checkOut: '2024-02-03',
          adults: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hotels).toBeDefined();
    });

    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .query({
          // Missing destination, dates, guests
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .query({
          destination: 'Miami',
          checkIn: 'invalid-date',
          checkOut: '2024-01-18',
          adults: 2,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('date');
    });

    it('should validate guest count limits', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .query({
          destination: 'Miami',
          checkIn: '2024-01-15',
          checkOut: '2024-01-18',
          adults: 20, // Exceeds typical limit
          children: 15,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('guests');
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/hotels')
          .query({
            destination: 'Miami',
            checkIn: '2024-01-15',
            checkOut: '2024-01-18',
            adults: 2,
          })
      );

      const responses = await Promise.all(requests);

      // Some requests should succeed, but rate limiting might kick in
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitedCount).toBe(10);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'validpassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('credentials');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });

    it('should handle account lockout after failed attempts', async () => {
      // Simulate multiple failed login attempts
      const failedAttempts = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: mockUser.email,
            password: 'wrongpassword',
          })
      );

      await Promise.all(failedAttempts);

      // Next attempt should be locked out
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'validpassword123',
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('locked');
    });
  });

  describe('POST /api/bookings', () => {
    it('should create booking successfully', async () => {
      const bookingData = {
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        adults: 2,
        children: 0,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
        },
        paymentInfo: {
          method: 'card',
          token: 'mock-payment-token',
        },
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data.booking).toHaveProperty('confirmationNumber');
      expect(response.body.data.booking).toHaveProperty('status', 'confirmed');
      expect(response.body.data.booking.guestEmail).toBe(bookingData.guestInfo.email);
    });

    it('should validate required booking fields', async () => {
      const incompleteBooking = {
        hotelId: mockHotel.id,
        // Missing roomId, dates, guest info, etc.
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(incompleteBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should validate date logic (check-out after check-in)', async () => {
      const invalidDatesBooking = {
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
        checkIn: '2024-01-18',
        checkOut: '2024-01-15', // Before check-in
        adults: 2,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
        },
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidDatesBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('date');
    });

    it('should validate guest capacity against room limits', async () => {
      const exceededCapacityBooking = {
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        adults: 10, // Exceeds room capacity
        children: 5,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
        },
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(exceededCapacityBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('capacity');
    });

    it('should handle room availability conflicts', async () => {
      const bookingData = {
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        adults: 2,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
        },
      };

      // Create first booking
      await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      // Try to create conflicting booking
      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('available');
    });

    it('should handle payment processing failures', async () => {
      const bookingWithFailedPayment = {
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        adults: 2,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
        },
        paymentInfo: {
          method: 'card',
          token: 'invalid-payment-token',
        },
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingWithFailedPayment)
        .expect(402);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('payment');
    });
  });

  describe('GET /api/bookings', () => {
    it('should retrieve user bookings successfully', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer mock-valid-token`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authorization');
    });

    it('should handle invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should filter bookings by status', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .query({ status: 'confirmed' })
        .set('Authorization', `Bearer mock-valid-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer mock-valid-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bookings');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should retrieve booking by confirmation number', async () => {
      const response = await request(app)
        .get(`/api/bookings/${mockBooking.confirmationNumber}`)
        .set('Authorization', `Bearer mock-valid-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.confirmationNumber).toBe(mockBooking.confirmationNumber);
    });

    it('should handle non-existent booking lookup', async () => {
      const response = await request(app)
        .get('/api/bookings/NONEXISTENT123')
        .set('Authorization', `Bearer mock-valid-token`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should enforce user access control for bookings', async () => {
      // Try to access another user's booking
      const response = await request(app)
        .get(`/api/bookings/${mockBooking.confirmationNumber}`)
        .set('Authorization', `Bearer mock-other-user-token`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('access');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('JSON');
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('email=test@example.com&password=test123')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle extremely large request payloads', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'test123',
        extra: 'x'.repeat(10000000), // 10MB string
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload)
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('payload');
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousPayload = {
        email: "'; DROP TABLE users; --",
        password: 'test123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent booking requests', async () => {
      const bookingData = {
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
        checkIn: '2024-02-15',
        checkOut: '2024-02-18',
        adults: 2,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
        },
      };

      // Send multiple concurrent booking requests
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/bookings')
          .send(bookingData)
      );

      const responses = await Promise.all(requests);

      // Only one should succeed, others should fail with conflict
      const successCount = responses.filter(r => r.status === 201).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);
    });

    it('should handle database connection failures gracefully', async () => {
      // This would typically involve mocking database failures
      // For now, we'll test that the endpoint exists and handles errors
      const response = await request(app)
        .get('/api/hotels')
        .query({
          destination: 'Test',
          checkIn: '2024-01-15',
          checkOut: '2024-01-18',
          adults: 2,
        });

      // Should either succeed or fail gracefully with proper error response
      expect([200, 500, 503]).toContain(response.status);
      if (response.status !== 200) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Performance & Load Testing', () => {
    it('should handle multiple concurrent health checks', async () => {
      const requests = Array(50).fill(null).map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });

    it('should respond to health check within reasonable time', async () => {
      const start = Date.now();

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.status).toBe('healthy');
    });
  });
});