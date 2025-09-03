import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { liteApiService } from '../services/liteApiService';
import { paymentService } from '../services/paymentService';
import { emailService } from '../services/emailService';
import { notificationScheduler } from '../services/notificationScheduler';
import { logger } from '../utils/logger';
import { getDb } from '../database';
import type {
  NewBooking} from '../database/schema';
import {
  bookings,
  bookingStatusHistory,
  bookingGuests,
  bookingAddons,
  payments,
  NewBookingStatusHistory,
} from '../database/schema';
import { eq, and, desc, or, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const bookingsRouter = Router();

// Validation schemas
const createBookingSchema = z.object({
  hotelId: z.string().uuid(),
  roomId: z.string().uuid(),
  rateId: z.string(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(8).default(0),
  guest: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(5).max(20),
  }),
  additionalGuests: z.array(z.object({
    type: z.enum(['adult', 'child']),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    age: z.number().min(0).max(120).optional(),
    specialNeeds: z.record(z.any()).optional(),
  })).optional(),
  specialRequests: z.string().max(1000).optional(),
  addons: z.array(z.object({
    type: z.string(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
  pricing: z.object({
    roomRate: z.number().min(0),
    taxes: z.number().min(0),
    fees: z.number().min(0),
    totalAmount: z.number().min(0),
    currency: z.string().length(3).default('USD'),
  }),
  paymentMethodId: z.string().optional(),
  source: z.string().default('website'),
});

const updateBookingSchema = z.object({
  specialRequests: z.string().max(1000).optional(),
  guestPreferences: z.record(z.any()).optional(),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']).optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().min(1).max(500),
  processRefund: z.boolean().default(true),
});

const searchBookingsSchema = z.object({
  status: z.string().optional(),
  email: z.string().optional(),
  confirmationNumber: z.string().optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Helper functions
const generateConfirmationNumber = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const calculateNights = (checkIn: string, checkOut: string): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
};

const addBookingStatusHistory = async (
  bookingId: string,
  newStatus: string,
  previousStatus?: string,
  reason?: string,
  changedBy?: string,
) => {
  const db = getDb();
  await db.insert(bookingStatusHistory).values({
    bookingId,
    previousStatus,
    newStatus,
    reason,
    changedBy,
  });
};

// POST /api/bookings - Create a new booking
bookingsRouter.post('/', validateRequest(createBookingSchema), async (req, res) => {
  try {
    const bookingData = req.body;
    const userId = req.user?.id; // From authentication middleware

    logger.info('Creating new booking', { bookingData, userId });

    // Validate dates
    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Check-in date cannot be in the past',
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Check-out date must be after check-in date',
      });
    }

    // Check room availability
    try {
      const availability = await liteApiService.checkAvailability({
        hotelId: bookingData.hotelId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        adults: bookingData.adults,
        children: bookingData.children,
        rooms: 1,
      });

      if (!availability.available) {
        return res.status(400).json({
          error: 'Availability Error',
          message: 'The selected room is no longer available for these dates',
        });
      }
    } catch (availabilityError) {
      logger.warn('Could not verify availability', { error: availabilityError });
      // Continue with booking - availability check failure shouldn't block booking
    }

    const db = getDb();
    const confirmationNumber = generateConfirmationNumber();
    const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);

    // Create booking record
    const newBooking: NewBooking = {
      confirmationNumber,
      userId,
      guestEmail: bookingData.guest.email,
      guestFirstName: bookingData.guest.firstName,
      guestLastName: bookingData.guest.lastName,
      guestPhone: bookingData.guest.phone,
      hotelId: bookingData.hotelId,
      roomId: bookingData.roomId,
      checkIn: new Date(bookingData.checkIn),
      checkOut: new Date(bookingData.checkOut),
      nights,
      adults: bookingData.adults,
      children: bookingData.children,
      roomRate: bookingData.pricing.roomRate.toString(),
      taxes: bookingData.pricing.taxes.toString(),
      fees: bookingData.pricing.fees.toString(),
      totalAmount: bookingData.pricing.totalAmount.toString(),
      currency: bookingData.pricing.currency,
      status: 'pending',
      paymentStatus: 'pending',
      specialRequests: bookingData.specialRequests,
      source: bookingData.source,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        rateId: bookingData.rateId,
        userAgent: req.get('User-Agent'),
        createdVia: 'api',
      },
    };

    const [createdBooking] = await db.insert(bookings).values(newBooking).returning();

    // Add status history
    await addBookingStatusHistory(createdBooking.id, 'pending', undefined, 'Booking created');

    // Add additional guests if provided
    if (bookingData.additionalGuests && bookingData.additionalGuests.length > 0) {
      const guestRecords = bookingData.additionalGuests.map((guest) => ({
        bookingId: createdBooking.id,
        type: guest.type,
        firstName: guest.firstName,
        lastName: guest.lastName,
        age: guest.age,
        specialNeeds: guest.specialNeeds || {},
      }));

      await db.insert(bookingGuests).values(guestRecords);
    }

    // Add addons if provided
    if (bookingData.addons && bookingData.addons.length > 0) {
      const addonRecords = bookingData.addons.map((addon) => ({
        bookingId: createdBooking.id,
        type: addon.type,
        name: addon.name,
        description: addon.description,
        quantity: addon.quantity,
        unitPrice: addon.unitPrice.toString(),
        totalPrice: (addon.unitPrice * addon.quantity).toString(),
        currency: bookingData.pricing.currency,
      }));

      await db.insert(bookingAddons).values(addonRecords);
    }

    // Create payment intent if payment method is provided
    let paymentIntent = null;
    if (bookingData.paymentMethodId) {
      try {
        paymentIntent = await paymentService.createPaymentIntent({
          amount: bookingData.pricing.totalAmount,
          currency: bookingData.pricing.currency,
          bookingId: createdBooking.id,
          userId,
          metadata: {
            confirmationNumber: createdBooking.confirmationNumber,
            hotelId: bookingData.hotelId,
          },
        });
      } catch (paymentError) {
        logger.error('Failed to create payment intent', { error: paymentError });
        // Don't fail the booking creation, just note the payment issue
      }
    }

    // Try to create booking with LiteAPI (if configured)
    let liteApiBooking = null;
    try {
      liteApiBooking = await liteApiService.createBooking({
        hotelId: bookingData.hotelId,
        roomId: bookingData.roomId,
        rateId: bookingData.rateId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guest: bookingData.guest,
        adults: bookingData.adults,
        children: bookingData.children,
        specialRequests: bookingData.specialRequests,
      });

      // Update booking with LiteAPI details
      if (liteApiBooking) {
        await db
          .update(bookings)
          .set({
            metadata: {
              ...createdBooking.metadata,
              liteApiBookingId: liteApiBooking.bookingId,
              liteApiConfirmation: liteApiBooking.confirmationNumber,
            },
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, createdBooking.id));
      }
    } catch (liteApiError) {
      logger.warn('LiteAPI booking failed, but continuing with local booking', { error: liteApiError });
    }

    // Get complete booking with related data
    const completeBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, createdBooking.id))
      .limit(1);

    // Send booking confirmation email
    try {
      await emailService.sendBookingConfirmation({
        guestName: `${bookingData.guest.firstName} ${bookingData.guest.lastName}`,
        email: bookingData.guest.email,
        confirmationNumber: createdBooking.confirmationNumber,
        hotelName: bookingData.hotelName || 'Hotel',
        hotelImage: bookingData.hotelImage || '',
        roomType: bookingData.roomType || 'Room',
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        nights,
        guests: { adults: bookingData.adults, children: bookingData.children },
        totalAmount: bookingData.pricing.totalAmount,
        currency: bookingData.pricing.currency,
        specialRequests: bookingData.specialRequests,
      });

      logger.info('Booking confirmation email sent', {
        confirmationNumber: createdBooking.confirmationNumber,
        email: bookingData.guest.email,
      });
    } catch (emailError) {
      // Don't fail booking if email fails - just log the error
      logger.error('Failed to send booking confirmation email', {
        error: emailError,
        confirmationNumber: createdBooking.confirmationNumber,
      });
    }

    // Schedule booking reminder email (24h before check-in)
    try {
      const checkInDate = new Date(bookingData.checkIn);
      const reminderTime = new Date(checkInDate.getTime() - (24 * 60 * 60 * 1000));

      // Only schedule reminder if check-in is more than 24 hours away
      if (reminderTime > new Date()) {
        await notificationScheduler.scheduleBookingReminder({
          bookingId: createdBooking.id,
          guestEmail: bookingData.guest.email,
          guestName: `${bookingData.guest.firstName} ${bookingData.guest.lastName}`,
          hotelName: bookingData.hotelName || 'Hotel',
          checkIn: bookingData.checkIn,
          confirmationNumber: createdBooking.confirmationNumber,
          sendAt: reminderTime,
          reminderType: '24h_before_checkin',
        });

        logger.info('Booking reminder scheduled', {
          confirmationNumber: createdBooking.confirmationNumber,
          scheduledFor: reminderTime,
        });
      }
    } catch (reminderError) {
      // Don't fail booking if reminder scheduling fails - just log the error
      logger.error('Failed to schedule booking reminder', {
        error: reminderError,
        confirmationNumber: createdBooking.confirmationNumber,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        booking: completeBooking[0],
        paymentIntent,
        liteApiBooking,
      },
    });

  } catch (error) {
    logger.error('Failed to create booking', { error, body: req.body });
    res.status(500).json({
      error: 'Booking Error',
      message: 'Failed to create booking. Please try again.',
    });
  }
});

// GET /api/bookings - Get user's bookings
bookingsRouter.get('/', validateRequest(searchBookingsSchema, 'query'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, email, confirmationNumber, checkIn, checkOut, limit, offset } = req.query;

    const db = getDb();
    let query = db.select().from(bookings);

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(bookings.userId, userId));
    }

    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    if (email) {
      conditions.push(ilike(bookings.guestEmail, `%${email}%`));
    }

    if (confirmationNumber) {
      conditions.push(eq(bookings.confirmationNumber, confirmationNumber));
    }

    if (checkIn) {
      conditions.push(eq(bookings.checkIn, new Date(checkIn)));
    }

    if (checkOut) {
      conditions.push(eq(bookings.checkOut, new Date(checkOut)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const userBookings = await query
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: sql`count(*)` }).from(bookings);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    res.json({
      success: true,
      data: {
        bookings: userBookings,
        pagination: {
          total: parseInt(count),
          offset,
          limit,
          hasMore: parseInt(count) > offset + limit,
        },
      },
    });

  } catch (error) {
    logger.error('Failed to get bookings', { error, query: req.query });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to retrieve bookings.',
    });
  }
});

// GET /api/bookings/:bookingId - Get specific booking
bookingsRouter.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    const db = getDb();

    // Get booking with related data
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check ownership (users can only see their own bookings unless admin)
    if (booking.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own bookings',
      });
    }

    // Get additional guests
    const guests = await db
      .select()
      .from(bookingGuests)
      .where(eq(bookingGuests.bookingId, bookingId));

    // Get addons
    const addons = await db
      .select()
      .from(bookingAddons)
      .where(eq(bookingAddons.bookingId, bookingId));

    // Get status history
    const statusHistory = await db
      .select()
      .from(bookingStatusHistory)
      .where(eq(bookingStatusHistory.bookingId, bookingId))
      .orderBy(desc(bookingStatusHistory.createdAt));

    res.json({
      success: true,
      data: {
        booking,
        guests,
        addons,
        statusHistory,
      },
    });

  } catch (error) {
    logger.error('Failed to get booking details', { error, bookingId: req.params.bookingId });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to get booking details.',
    });
  }
});

// PUT /api/bookings/:bookingId - Update booking
bookingsRouter.put('/:bookingId', validateRequest(updateBookingSchema), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    const db = getDb();

    // Get existing booking
    const [existingBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!existingBooking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (existingBooking.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own bookings',
      });
    }

    // Check if booking can be modified
    if (['cancelled', 'checked_out'].includes(existingBooking.status)) {
      return res.status(400).json({
        error: 'Update Error',
        message: 'This booking cannot be modified',
      });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.specialRequests !== undefined) {
      updateData.specialRequests = updates.specialRequests;
    }

    if (updates.guestPreferences !== undefined) {
      updateData.guestPreferences = updates.guestPreferences;
    }

    // Status change requires additional logic
    if (updates.status && updates.status !== existingBooking.status) {
      updateData.status = updates.status;

      // Add status history
      await addBookingStatusHistory(
        bookingId,
        updates.status,
        existingBooking.status,
        'Status updated via API',
        userId,
      );
    }

    // Update booking
    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    // Send booking modification notification (except for internal admin updates)
    if (!updates.administrativeUpdate && updatedBooking.guestEmail) {
      try {
        let modificationType = 'general_update';

        if (updates.checkIn || updates.checkOut) {
          modificationType = 'date_change';
        } else if (updates.roomType || updates.roomId) {
          modificationType = 'room_upgrade';
        } else if (updates.specialRequests || updates.addServiceRequests) {
          modificationType = 'special_requests';
        }

        await emailService.sendBookingModification({
          guestName: `${updatedBooking.guestFirstName} ${updatedBooking.guestLastName}`,
          guestEmail: updatedBooking.guestEmail,
          confirmationNumber: updatedBooking.confirmationNumber,
          hotelName: updatedBooking.hotelName || 'Hotel',
          modificationType,
          originalDetails: {
            checkIn: existingBooking.checkIn?.toISOString().split('T')[0] || '',
            checkOut: existingBooking.checkOut?.toISOString().split('T')[0] || '',
            nights: existingBooking.nights || 1,
          },
          newDetails: {
            checkIn: updatedBooking.checkIn?.toISOString().split('T')[0] || '',
            checkOut: updatedBooking.checkOut?.toISOString().split('T')[0] || '',
            nights: updatedBooking.nights || 1,
          },
          modifiedAt: new Date(),
          modifiedBy: updates.updatedBy || 'guest',
          reason: updates.reason || 'Booking modification requested',
          priceAdjustment: updates.priceAdjustment || 0,
        });

        logger.info('Booking modification notification sent', {
          confirmationNumber: updatedBooking.confirmationNumber,
          modificationType,
        });
      } catch (emailError) {
        // Don't fail booking update if email fails - just log the error
        logger.error('Failed to send booking modification notification', {
          error: emailError,
          confirmationNumber: updatedBooking.confirmationNumber,
        });
      }
    }

    res.json({
      success: true,
      data: {
        booking: updatedBooking,
      },
    });

  } catch (error) {
    logger.error('Failed to update booking', { error, bookingId: req.params.bookingId });
    res.status(500).json({
      error: 'Update Error',
      message: 'Failed to update booking.',
    });
  }
});

// POST /api/bookings/:bookingId/cancel - Cancel booking
bookingsRouter.post('/:bookingId/cancel', validateRequest(cancelBookingSchema), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason, processRefund } = req.body;
    const userId = req.user?.id;

    const db = getDb();

    // Get existing booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (booking.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own bookings',
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cancellation Error',
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'checked_out') {
      return res.status(400).json({
        error: 'Cancellation Error',
        message: 'Cannot cancel a completed booking',
      });
    }

    // Check cancellation policy
    if (!booking.isCancellable) {
      return res.status(400).json({
        error: 'Cancellation Error',
        message: 'This booking is non-cancellable',
      });
    }

    if (booking.cancellationDeadline && new Date() > booking.cancellationDeadline) {
      return res.status(400).json({
        error: 'Cancellation Error',
        message: 'Cancellation deadline has passed',
      });
    }

    // Try to cancel with LiteAPI first
    let liteApiCancellation = null;
    if (booking.metadata?.liteApiBookingId) {
      try {
        liteApiCancellation = await liteApiService.cancelBooking(
          booking.metadata.liteApiBookingId,
          reason,
        );
      } catch (liteApiError) {
        logger.warn('LiteAPI cancellation failed', { error: liteApiError });
      }
    }

    // Update booking status
    const [cancelledBooking] = await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Add status history
    await addBookingStatusHistory(
      bookingId,
      'cancelled',
      booking.status,
      reason,
      userId,
    );

    // Process refund if requested and booking was paid
    let refund = null;
    if (processRefund && booking.paymentStatus === 'completed') {
      try {
        // Find the payment record
        const db = getDb();
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.bookingId, bookingId))
          .limit(1);

        if (payment) {
          refund = await paymentService.processRefund({
            paymentId: payment.id,
            reason: `Booking cancellation: ${reason}`,
            processedBy: userId || 'system',
          });
        }
      } catch (refundError) {
        logger.error('Failed to process refund', { error: refundError });
        // Don't fail the cancellation if refund fails
      }
    }

    res.json({
      success: true,
      data: {
        booking: cancelledBooking,
        liteApiCancellation,
        refund,
      },
    });

  } catch (error) {
    logger.error('Failed to cancel booking', { error, bookingId: req.params.bookingId });
    res.status(500).json({
      error: 'Cancellation Error',
      message: 'Failed to cancel booking.',
    });
  }
});

// GET /api/bookings/user/:userId - Get user's bookings
bookingsRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const requestingUserId = req.user?.id;

    // Check ownership (users can only see their own bookings unless admin)
    if (userId !== requestingUserId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own bookings',
      });
    }

    const db = getDb();
    let query = db.select().from(bookings).where(eq(bookings.userId, userId));

    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.where(eq(bookings.status, status));
    }

    // Order by creation date (newest first)
    const userBookings = await query.orderBy(desc(bookings.createdAt));

    logger.info('Retrieved user bookings', {
      userId,
      count: userBookings.length,
      requestedBy: requestingUserId,
    });

    res.json({
      success: true,
      bookings: userBookings,
    });

  } catch (error) {
    logger.error('Failed to fetch user bookings', {
      error,
      userId: req.params.userId,
      requestedBy: req.user?.id,
    });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to fetch user bookings.',
    });
  }
});

// GET /api/bookings/user/:userId/stats - Get user's booking statistics
bookingsRouter.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;

    // Check ownership (users can only see their own stats unless admin)
    if (userId !== requestingUserId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own booking statistics',
      });
    }

    const db = getDb();

    // Get all bookings for the user
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId));

    // Calculate statistics
    const stats = {
      totalBookings: userBookings.length,
      upcomingBookings: userBookings.filter((b) =>
        ['confirmed', 'pending'].includes(b.status) &&
        new Date(b.checkIn) > new Date(),
      ).length,
      completedBookings: userBookings.filter((b) =>
        b.status === 'completed' || b.status === 'checked_out',
      ).length,
      cancelledBookings: userBookings.filter((b) => b.status === 'cancelled').length,
      totalSpent: userBookings
        .filter((b) => b.paymentStatus === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      currency: userBookings[0]?.currency || 'USD',
    };

    logger.info('Retrieved user booking stats', {
      userId,
      stats,
      requestedBy: requestingUserId,
    });

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Failed to fetch user booking stats', {
      error,
      userId: req.params.userId,
      requestedBy: req.user?.id,
    });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to fetch booking statistics.',
    });
  }
});

// GET /api/bookings/confirmation/:confirmationNumber - Get booking by confirmation number
bookingsRouter.get('/confirmation/:confirmationNumber', async (req, res) => {
  try {
    const { confirmationNumber } = req.params;

    const db = getDb();

    // Get booking by confirmation number
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.confirmationNumber, confirmationNumber))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found with this confirmation number',
      });
    }

    logger.info('Retrieved booking by confirmation number', {
      confirmationNumber,
      bookingId: booking.id,
    });

    res.json({
      success: true,
      booking,
    });

  } catch (error) {
    logger.error('Failed to get booking by confirmation number', {
      error,
      confirmationNumber: req.params.confirmationNumber,
    });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to retrieve booking.',
    });
  }
});

// GET /api/bookings/:bookingId/confirmation - Get booking confirmation details
bookingsRouter.get('/:bookingId/confirmation', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    const db = getDb();

    // Get booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (booking.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own booking confirmations',
      });
    }

    // Get hotel details for confirmation
    let hotelDetails = null;
    try {
      hotelDetails = await liteApiService.getHotelDetails(booking.hotelId);
    } catch (error) {
      logger.warn('Failed to get hotel details for confirmation', { error });
    }

    // Get payment details
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .limit(1);

    res.json({
      success: true,
      data: {
        booking,
        hotel: hotelDetails,
        payment,
        confirmation: {
          number: booking.confirmationNumber,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          canCancel: booking.isCancellable &&
                     !['cancelled', 'checked_out'].includes(booking.status) &&
                     (!booking.cancellationDeadline || new Date() < booking.cancellationDeadline),
        },
      },
    });

  } catch (error) {
    logger.error('Failed to get booking confirmation', { error, bookingId: req.params.bookingId });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to get booking confirmation.',
    });
  }
});