import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { getDb } from '../database';
import { users, bookings } from '../database/schema';
import { eq } from 'drizzle-orm';
import { emailService } from '../services/emailService';

// Mock external services
vi.mock('../services/emailService', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
    sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
    sendBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentReceipt: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('square', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    SquareClient: vi.fn().mockImplementation(() => ({
      paymentsApi: {
        createPayment: vi.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'test-payment-id',
              status: 'COMPLETED',
              totalMoney: { amount: 45000, currency: 'USD' }
            }
          }
        })
      }
    })),
    Environment: {
      Sandbox: 'sandbox',
      Production: 'production'
    }
  };
});

vi.mock('../services/liteApiService', () => ({
  liteApiService: {
    searchHotels: vi.fn().mockResolvedValue([]),
    getHotelDetails: vi.fn().mockResolvedValue(null)
  }
}));

vi.mock('../services/cacheService', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(true)
  }
}));

describe('Booking Email Triggers', () => {
  let testUser: any;
  let authToken: string;
  let db: any;

  beforeEach(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.LOCAL_SQLITE = 'true';
    
    // Initialize database for testing
    const { initializeDatabase } = await import('../database/migrations');
    await initializeDatabase();
    
    // Get database instance
    db = getDb();
    
    // Create test user
    const userResult = await db.insert(users).values({
      email: 'test@example.com',
      password: 'hashedPassword123',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
      role: 'user'
    }).returning();
    
    testUser = userResult[0];
    
    // Generate auth token for requests
    authToken = 'Bearer test-jwt-token';
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(bookings).where(eq(bookings.userEmail, 'test@example.com'));
    await db.delete(users).where(eq(users.email, 'test@example.com'));
  });

  describe('Booking Confirmation Email Triggers', () => {
    it('should send booking confirmation email when booking is created successfully', async () => {
      const bookingData = {
        hotelId: 'test-hotel-123',
        hotelName: 'Luxury Test Hotel',
        hotelImage: 'https://example.com/hotel.jpg',
        roomType: 'Deluxe Suite',
        checkIn: '2024-03-15',
        checkOut: '2024-03-17',
        nights: 2,
        guests: { adults: 2, children: 0 },
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          phone: '+1-555-0123'
        },
        totalAmount: 450.00,
        currency: 'USD',
        paymentToken: 'test-payment-token-123',
        userId: testUser.id
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.confirmationNumber).toBeDefined();

      // Verify booking confirmation email was sent
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledTimes(1);
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledWith({
        guestName: 'John Doe',
        email: 'test@example.com',
        confirmationNumber: expect.any(String),
        hotelName: 'Luxury Test Hotel',
        hotelImage: 'https://example.com/hotel.jpg',
        roomType: 'Deluxe Suite',
        checkIn: '2024-03-15',
        checkOut: '2024-03-17',
        nights: 2,
        guests: { adults: 2, children: 0 },
        totalAmount: 450.00,
        currency: 'USD',
        specialRequests: undefined
      });
    });

    it('should send booking confirmation email for guest bookings (no userId)', async () => {
      const guestBookingData = {
        hotelId: 'test-hotel-456',
        hotelName: 'Guest Hotel',
        hotelImage: 'https://example.com/guest-hotel.jpg',
        roomType: 'Standard Room',
        checkIn: '2024-04-01',
        checkOut: '2024-04-03',
        nights: 2,
        guests: { adults: 1, children: 1 },
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1-555-0456'
        },
        specialRequests: 'Early check-in if possible',
        totalAmount: 320.00,
        currency: 'USD',
        paymentToken: 'guest-payment-token-456'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(guestBookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      // Verify booking confirmation email was sent for guest
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledTimes(1);
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledWith({
        guestName: 'Jane Smith',
        email: 'jane@example.com',
        confirmationNumber: expect.any(String),
        hotelName: 'Guest Hotel',
        hotelImage: 'https://example.com/guest-hotel.jpg',
        roomType: 'Standard Room',
        checkIn: '2024-04-01',
        checkOut: '2024-04-03',
        nights: 2,
        guests: { adults: 1, children: 1 },
        totalAmount: 320.00,
        currency: 'USD',
        specialRequests: 'Early check-in if possible'
      });
    });

    it('should not send booking confirmation email if booking creation fails', async () => {
      const invalidBookingData = {
        // Missing required fields to trigger failure
        hotelId: 'test-hotel-invalid',
        totalAmount: 'invalid-amount' // Invalid type
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send(invalidBookingData)
        .expect(400);

      // Verify no email was sent on failed booking
      expect(emailService.sendBookingConfirmation).not.toHaveBeenCalled();
    });

    it('should handle email service failures gracefully without breaking booking creation', async () => {
      // Mock email service to fail
      vi.mocked(emailService.sendBookingConfirmation).mockRejectedValue(new Error('Email service unavailable'));

      const bookingData = {
        hotelId: 'test-hotel-email-fail',
        hotelName: 'Email Test Hotel',
        hotelImage: 'https://example.com/email-fail.jpg',
        roomType: 'Standard Room',
        checkIn: '2024-05-01',
        checkOut: '2024-05-03',
        nights: 2,
        guests: { adults: 2, children: 0 },
        guestInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test-email-fail@example.com',
          phone: '+1-555-0789'
        },
        totalAmount: 280.00,
        currency: 'USD',
        paymentToken: 'test-payment-token-email-fail',
        userId: testUser.id
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send(bookingData)
        .expect(201);

      // Booking should still succeed even if email fails
      expect(response.body.success).toBe(true);
      expect(response.body.booking).toBeDefined();
      
      // Verify email service was attempted
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Welcome Email Integration', () => {
    it('should send welcome email when new user registers during booking flow', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        phone: '+1-555-0999'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();

      // Verify welcome email was sent
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'New',
        'User',
        'newuser@example.com'
      );
    });

    it('should not send duplicate welcome emails for existing users', async () => {
      // Try to register with existing email
      const duplicateUserData = {
        email: 'test@example.com', // Already exists from beforeEach
        password: 'AnotherPass123!',
        firstName: 'Duplicate',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(duplicateUserData)
        .expect(409); // Conflict - user already exists

      // Verify no welcome email was sent
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('Payment Receipt Email Automation', () => {
    it('should send payment receipt email after successful Square payment processing', async () => {
      const paymentData = {
        amount: 450.00,
        currency: 'USD',
        sourceId: 'test-square-source-id',
        bookingId: 'test-booking-123',
        customerEmail: 'payment@example.com',
        customerName: 'Payment Test User'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', authToken)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();

      // Verify payment receipt email was sent
      expect(emailService.sendPaymentReceipt).toHaveBeenCalledTimes(1);
      expect(emailService.sendPaymentReceipt).toHaveBeenCalledWith({
        customerName: 'Payment Test User',
        customerEmail: 'payment@example.com',
        paymentId: expect.any(String),
        amount: 450.00,
        currency: 'USD',
        bookingId: 'test-booking-123',
        paymentMethod: 'Square',
        transactionDate: expect.any(Date)
      });
    });

    it('should send payment receipt email for PayPal payments', async () => {
      const paypalPaymentData = {
        amount: 275.50,
        currency: 'USD',
        paypalOrderId: 'test-paypal-order-123',
        bookingId: 'test-booking-paypal',
        customerEmail: 'paypal@example.com',
        customerName: 'PayPal User'
      };

      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .set('Authorization', authToken)
        .send(paypalPaymentData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify PayPal payment receipt email was sent
      expect(emailService.sendPaymentReceipt).toHaveBeenCalledTimes(1);
      expect(emailService.sendPaymentReceipt).toHaveBeenCalledWith({
        customerName: 'PayPal User',
        customerEmail: 'paypal@example.com',
        paymentId: expect.any(String),
        amount: 275.50,
        currency: 'USD',
        bookingId: 'test-booking-paypal',
        paymentMethod: 'PayPal',
        transactionDate: expect.any(Date)
      });
    });

    it('should not send payment receipt email if payment processing fails', async () => {
      const invalidPaymentData = {
        amount: -100, // Invalid negative amount
        currency: 'USD',
        sourceId: 'invalid-source',
        bookingId: 'test-booking-fail',
        customerEmail: 'fail@example.com',
        customerName: 'Fail User'
      };

      await request(app)
        .post('/api/payments/create')
        .set('Authorization', authToken)
        .send(invalidPaymentData)
        .expect(400);

      // Verify no payment receipt email was sent
      expect(emailService.sendPaymentReceipt).not.toHaveBeenCalled();
    });
  });
});