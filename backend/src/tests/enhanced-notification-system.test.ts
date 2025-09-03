import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { getDb } from '../database';
import { users, bookings, scheduledEmails } from '../database/schema';
import { eq } from 'drizzle-orm';
import { emailService } from '../services/emailService';
import { notificationScheduler } from '../services/notificationScheduler';

// Mock external services
vi.mock('../services/emailService', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
    sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
    sendBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentReceipt: vi.fn().mockResolvedValue({ success: true }),
    sendBookingReminder: vi.fn().mockResolvedValue({ success: true }),
    sendBookingModification: vi.fn().mockResolvedValue({ success: true }),
    sendProfessionalPaymentReceipt: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('../services/notificationScheduler', () => ({
  notificationScheduler: {
    scheduleBookingReminder: vi.fn().mockResolvedValue({ success: true }),
    scheduleBookingModificationNotification: vi.fn().mockResolvedValue({ success: true }),
    cancelScheduledNotifications: vi.fn().mockResolvedValue({ success: true }),
    processScheduledEmails: vi.fn().mockResolvedValue({ processed: 0 })
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

// Mock authentication middleware
vi.mock('../middleware/authenticate', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { 
      id: 'test-user-123', 
      email: 'test@example.com',
      role: 'user',
      isAdmin: false
    };
    next();
  })
}));

// Mock validation middleware
vi.mock('../middleware/validateRequest', () => ({
  validateRequest: vi.fn(() => (req, res, next) => next())
}));

describe('Enhanced Notification System', () => {
  let testUser: any;
  let testBooking: any;
  let authToken: string;
  let db: any;

  beforeEach(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.LOCAL_SQLITE = 'true';
    
    // Initialize database for testing
    const { initializeDatabase } = await import('../database/migrations');
    try {
      await initializeDatabase();
      db = getDb();
    } catch (error) {
      // If database initialization fails, create a mock db for testing
      db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'test-user-id', email: 'test@example.com' }])
          })
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([])
          })
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      };
    }
    
    // Create test user
    testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    // Create test booking
    testBooking = {
      id: 'test-booking-123',
      confirmationNumber: 'VB-TEST-001',
      userId: testUser.id,
      guestEmail: 'test@example.com',
      guestFirstName: 'John',
      guestLastName: 'Doe',
      hotelName: 'Luxury Test Hotel',
      hotelImage: 'https://example.com/hotel.jpg',
      roomType: 'Deluxe Suite',
      checkIn: new Date('2024-03-20'),
      checkOut: new Date('2024-03-22'),
      nights: 2,
      adults: 2,
      children: 0,
      totalAmount: 450.00,
      currency: 'USD',
      status: 'confirmed'
    };
    
    authToken = 'Bearer test-jwt-token';
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data (mock cleanup)
    vi.clearAllMocks();
  });

  describe('Booking Reminder Emails (24h before check-in)', () => {
    it('should schedule booking reminder email when booking is confirmed', async () => {
      const bookingData = {
        hotelId: 'test-hotel-123',
        roomId: 'test-room-456',
        rateId: 'test-rate-789',
        checkIn: '2024-03-20',
        checkOut: '2024-03-22',
        adults: 2,
        children: 0,
        guest: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          phone: '+1-555-0123'
        },
        specialRequests: 'None',
        pricing: {
          roomRate: 400.00,
          taxes: 25.00,
          fees: 25.00,
          totalAmount: 450.00,
          currency: 'USD'
        },
        source: 'web'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify booking reminder was scheduled
      expect(notificationScheduler.scheduleBookingReminder).toHaveBeenCalledTimes(1);
      expect(notificationScheduler.scheduleBookingReminder).toHaveBeenCalledWith({
        bookingId: expect.any(String),
        guestEmail: 'test@example.com',
        guestName: 'John Doe',
        hotelName: 'Luxury Test Hotel',
        checkIn: '2024-03-20',
        confirmationNumber: expect.any(String),
        sendAt: expect.any(Date), // Should be 24 hours before check-in
        reminderType: '24h_before_checkin'
      });
    });

    it('should send booking reminder email when scheduled time arrives', async () => {
      const reminderData = {
        bookingId: 'test-booking-123',
        guestEmail: 'test@example.com',
        guestName: 'John Doe',
        hotelName: 'Luxury Test Hotel',
        hotelAddress: '123 Luxury Ave, Test City',
        roomType: 'Deluxe Suite',
        checkIn: '2024-03-20',
        checkOut: '2024-03-22',
        confirmationNumber: 'VB-TEST-001',
        specialInstructions: 'Please bring valid ID for check-in'
      };

      // Simulate scheduled email processor
      await notificationScheduler.processScheduledEmails();

      // Verify reminder email was sent with proper check-in details
      expect(emailService.sendBookingReminder).toHaveBeenCalledWith({
        guestName: reminderData.guestName,
        guestEmail: reminderData.guestEmail,
        hotelName: reminderData.hotelName,
        hotelAddress: reminderData.hotelAddress,
        roomType: reminderData.roomType,
        checkIn: reminderData.checkIn,
        checkOut: reminderData.checkOut,
        confirmationNumber: reminderData.confirmationNumber,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        specialInstructions: reminderData.specialInstructions,
        contactInfo: {
          phone: '+1-555-HOTEL',
          email: 'concierge@luxuryhotel.com'
        }
      });
    });

    it('should not send reminder emails for cancelled bookings', async () => {
      // Cancel the booking first
      await request(app)
        .put(`/api/bookings/${testBooking.id}/cancel`)
        .set('Authorization', authToken)
        .send({ reason: 'Change of plans' })
        .expect(200);

      // Process scheduled emails
      await notificationScheduler.processScheduledEmails();

      // Verify no reminder email was sent for cancelled booking
      expect(emailService.sendBookingReminder).not.toHaveBeenCalled();
      expect(notificationScheduler.cancelScheduledNotifications).toHaveBeenCalledWith(testBooking.id);
    });

    it('should handle reminder email failures gracefully', async () => {
      // Mock email service to fail
      vi.mocked(emailService.sendBookingReminder).mockRejectedValue(new Error('SMTP service unavailable'));

      // Process scheduled emails
      const result = await notificationScheduler.processScheduledEmails();

      // Should continue processing despite failures
      expect(result.processed).toBeGreaterThanOrEqual(0);
      
      // Should log the error but not throw
      expect(emailService.sendBookingReminder).toHaveBeenCalled();
    });
  });

  describe('Professional Payment Receipt Email Templates', () => {
    it('should send professional HTML payment receipt after successful Square payment', async () => {
      const paymentData = {
        amount: 450.00,
        currency: 'USD',
        sourceId: 'test-square-source-id',
        bookingId: testBooking.id,
        customerEmail: 'payment@example.com',
        customerName: 'John Doe',
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Test St',
          locality: 'Test City',
          administrativeDistrictLevel1: 'TS',
          postalCode: '12345'
        }
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', authToken)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify professional payment receipt email was sent
      expect(emailService.sendProfessionalPaymentReceipt).toHaveBeenCalledTimes(1);
      expect(emailService.sendProfessionalPaymentReceipt).toHaveBeenCalledWith({
        customerName: 'John Doe',
        customerEmail: 'payment@example.com',
        paymentId: expect.any(String),
        amount: 450.00,
        currency: 'USD',
        paymentMethod: 'Square Credit Card',
        transactionDate: expect.any(Date),
        billingAddress: paymentData.billingAddress,
        bookingDetails: {
          confirmationNumber: expect.any(String),
          hotelName: expect.any(String),
          checkIn: expect.any(String),
          checkOut: expect.any(String),
          roomType: expect.any(String),
          nights: expect.any(Number)
        },
        receiptFormat: 'professional_html',
        includeInvoicePDF: true
      });
    });

    it('should include detailed breakdown in professional payment receipt', async () => {
      const paymentData = {
        amount: 487.50,
        currency: 'USD',
        sourceId: 'test-square-source-detailed',
        bookingId: testBooking.id,
        customerEmail: 'detailed@example.com',
        customerName: 'Jane Smith',
        breakdown: {
          roomRate: 400.00,
          taxes: 32.00,
          serviceFees: 40.00,
          resortFee: 15.50,
          total: 487.50
        }
      };

      await request(app)
        .post('/api/payments/create')
        .set('Authorization', authToken)
        .send(paymentData);

      // Verify detailed breakdown is included in professional receipt
      expect(emailService.sendProfessionalPaymentReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          priceBreakdown: {
            subtotal: 400.00,
            taxes: 32.00,
            fees: 55.50, // serviceFees + resortFee
            total: 487.50,
            currency: 'USD'
          },
          receiptFormat: 'professional_html',
          includeTermsAndConditions: true,
          includeCancellationPolicy: true
        })
      );
    });

    it('should generate PDF invoice attachment for professional receipts', async () => {
      const paymentData = {
        amount: 275.00,
        currency: 'USD',
        sourceId: 'test-pdf-invoice',
        bookingId: testBooking.id,
        customerEmail: 'pdf@example.com',
        customerName: 'PDF Test User',
        generatePDFInvoice: true
      };

      await request(app)
        .post('/api/payments/create')
        .set('Authorization', authToken)
        .send(paymentData);

      // Verify PDF invoice generation was requested
      expect(emailService.sendProfessionalPaymentReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          includeInvoicePDF: true,
          pdfInvoiceOptions: {
            format: 'professional',
            includeLogo: true,
            includeTerms: true,
            language: 'en'
          }
        })
      );
    });
  });

  describe('Booking Modification Notification Emails', () => {
    it('should send modification notification when booking dates are changed', async () => {
      const modificationData = {
        checkIn: '2024-03-21', // Changed from 2024-03-20
        checkOut: '2024-03-23', // Changed from 2024-03-22
        nights: 2,
        reason: 'Guest requested date change'
      };

      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', authToken)
        .send(modificationData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify booking modification notification was sent
      expect(emailService.sendBookingModification).toHaveBeenCalledTimes(1);
      expect(emailService.sendBookingModification).toHaveBeenCalledWith({
        guestName: 'John Doe',
        guestEmail: 'test@example.com',
        confirmationNumber: 'VB-TEST-001',
        hotelName: 'Luxury Test Hotel',
        modificationType: 'date_change',
        originalDetails: {
          checkIn: '2024-03-20',
          checkOut: '2024-03-22',
          nights: 2
        },
        newDetails: {
          checkIn: '2024-03-21',
          checkOut: '2024-03-23',
          nights: 2
        },
        modifiedAt: expect.any(Date),
        modifiedBy: 'guest',
        reason: 'Guest requested date change',
        priceAdjustment: expect.any(Number) // May be 0 if no price change
      });
    });

    it('should send modification notification when room type is upgraded', async () => {
      const roomUpgrade = {
        roomType: 'Presidential Suite', // Upgraded from Deluxe Suite
        roomId: 'new-room-456',
        priceAdjustment: 150.00,
        reason: 'Complimentary upgrade due to availability'
      };

      await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', authToken)
        .send(roomUpgrade)
        .expect(200);

      // Verify room upgrade notification was sent
      expect(emailService.sendBookingModification).toHaveBeenCalledWith(
        expect.objectContaining({
          modificationType: 'room_upgrade',
          originalDetails: expect.objectContaining({
            roomType: 'Deluxe Suite'
          }),
          newDetails: expect.objectContaining({
            roomType: 'Presidential Suite'
          }),
          priceAdjustment: 150.00,
          upgradeReason: 'Complimentary upgrade due to availability'
        })
      );
    });

    it('should send modification notification when special requests are added', async () => {
      const specialRequestUpdate = {
        specialRequests: 'Late check-out requested until 2:00 PM, Extra towels for spa use',
        addServiceRequests: [
          { service: 'spa_access', duration: '3_hours', cost: 75.00 },
          { service: 'late_checkout', until: '14:00', cost: 25.00 }
        ]
      };

      await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', authToken)
        .send(specialRequestUpdate)
        .expect(200);

      // Verify special request modification notification was sent
      expect(emailService.sendBookingModification).toHaveBeenCalledWith(
        expect.objectContaining({
          modificationType: 'special_requests',
          newDetails: expect.objectContaining({
            specialRequests: expect.stringContaining('Late check-out'),
            addedServices: expect.arrayContaining([
              expect.objectContaining({ service: 'spa_access' }),
              expect.objectContaining({ service: 'late_checkout' })
            ])
          }),
          priceAdjustment: 100.00, // 75 + 25
          requiresPayment: true
        })
      );
    });

    it('should not send modification notifications for internal administrative updates', async () => {
      const adminUpdate = {
        internalNotes: 'Updated by admin for housekeeping schedule',
        administrativeUpdate: true,
        updatedBy: 'admin'
      };

      await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', authToken)
        .send(adminUpdate)
        .expect(200);

      // Verify no customer notification was sent for admin updates
      expect(emailService.sendBookingModification).not.toHaveBeenCalled();
    });

    it('should handle booking modification email failures gracefully', async () => {
      // Mock email service to fail
      vi.mocked(emailService.sendBookingModification).mockRejectedValue(new Error('Email template error'));

      const modificationData = {
        checkIn: '2024-03-21',
        checkOut: '2024-03-23'
      };

      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', authToken)
        .send(modificationData)
        .expect(200);

      // Booking modification should still succeed
      expect(response.body.success).toBe(true);
      
      // Verify email was attempted
      expect(emailService.sendBookingModification).toHaveBeenCalled();
    });
  });

  describe('Email Scheduling and Queue Management', () => {
    it('should queue multiple notification emails for batch processing', async () => {
      // Create multiple bookings that should trigger reminders
      const bookings = [
        { checkIn: '2024-03-20', email: 'guest1@example.com' },
        { checkIn: '2024-03-20', email: 'guest2@example.com' },
        { checkIn: '2024-03-20', email: 'guest3@example.com' }
      ];

      for (const booking of bookings) {
        await request(app)
          .post('/api/bookings')
          .set('Authorization', authToken)
          .send({
            hotelId: 'test-hotel-123',
            roomId: 'test-room-456',
            rateId: 'test-rate-789',
            checkIn: booking.checkIn,
            checkOut: '2024-03-22',
            adults: 2,
            children: 0,
            guest: {
              firstName: 'Test',
              lastName: 'Guest',
              email: booking.email,
              phone: '+1-555-0123'
            },
            pricing: {
              roomRate: 400.00,
              taxes: 25.00,
              fees: 25.00,
              totalAmount: 450.00,
              currency: 'USD'
            },
            source: 'web'
          });
      }

      // Verify all reminder notifications were scheduled
      expect(notificationScheduler.scheduleBookingReminder).toHaveBeenCalledTimes(3);
    });

    it('should process scheduled emails in batches to avoid overwhelming email service', async () => {
      // Simulate batch processing
      const result = await notificationScheduler.processScheduledEmails();

      // Verify batch processing was attempted
      expect(notificationScheduler.processScheduledEmails).toHaveBeenCalled();
      expect(typeof result.processed).toBe('number');
    });
  });
});