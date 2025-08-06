import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { squarePaymentService } from '../services/squarePaymentService';
import { getDb } from '../database';
import { payments, refunds, bookings, paymentMethods } from '../database/schema';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';

export const paymentsRouter = Router();

// Validation schemas for Square
const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  sourceId: z.string(), // Square payment token from frontend
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  metadata: z.record(z.string()).optional(),
  billingAddress: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    locality: z.string().optional(),
    administrativeDistrictLevel1: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

const createRefundSchema = z.object({
  paymentId: z.string(), // Square payment ID
  amount: z.number().positive().optional(),
  reason: z.string().default('Hotel booking cancellation'),
  bookingId: z.string().uuid(),
});

const paymentStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  currency: z.string().length(3).default('USD'),
});

/**
 * POST /api/payments/create
 * Process a Square payment for a booking
 */
paymentsRouter.post('/create', validateRequest(createPaymentSchema), async (req: Request, res: Response) => {
  try {
    const { bookingId, sourceId, amount, currency, metadata = {}, billingAddress } = req.body;
    const userId = req.user?.id;

    // Verify booking exists and belongs to user (or is accessible)
    const db = getDb();
    const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    
    if (!booking.length) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The specified booking does not exist',
      });
    }

    const bookingData = booking[0];

    // Check if user has access to this booking
    if (userId && bookingData.userId && bookingData.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to make payment for this booking',
      });
    }

    // Check if booking is in a payable state
    if (!['pending', 'payment_failed'].includes(bookingData.status)) {
      return res.status(400).json({
        error: 'Invalid booking status',
        message: `Cannot make payment for booking with status: ${bookingData.status}`,
      });
    }

    // Process Square payment
    const result = await squarePaymentService.createPayment({
      sourceId,
      amount,
      currency,
      bookingId,
      userId,
      billingAddress,
      metadata: {
        ...metadata,
        email: bookingData.guestEmail,
        confirmationNumber: bookingData.confirmationNumber,
        guestName: `${bookingData.guestFirstName} ${bookingData.guestLastName}`,
      },
    });

    if (result.success) {
      // Update booking status to confirmed
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      res.json({
        success: true,
        paymentId: result.paymentId,
        receiptUrl: result.receiptUrl,
        message: 'Payment processed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.errorMessage || 'Payment processing failed',
      });
  } catch (error) {
    logger.error('Failed to process Square payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment intent
 */
paymentsRouter.post('/confirm', validateRequest(confirmPaymentSchema), async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

    res.json({
      success: true,
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      },
    });

  } catch (error) {
    logger.error('Failed to confirm payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentIntentId: req.body.paymentIntentId,
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Payment confirmation failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/payments/status/:paymentIntentId
 * Get payment status
 */
paymentsRouter.get('/status/:paymentIntentId', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
    
    // Get payment record from database
    const payment = await db.select()
      .from(payments)
      .where(eq(payments.transactionId, paymentIntentId))
      .limit(1);

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        payment: payment.length > 0 ? payment[0] : null,
      },
    });

  } catch (error) {
    logger.error('Failed to get payment status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentIntentId: req.params.paymentIntentId,
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Failed to retrieve payment status',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/payments/booking/:bookingId
 * Get payments for a specific booking
 */
paymentsRouter.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    // Verify booking access
    const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    
    if (!booking.length) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The specified booking does not exist',
      });
    }

    const bookingData = booking[0];

    // Check user access
    if (userId && bookingData.userId && bookingData.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view payments for this booking',
      });
    }

    // Get payments for booking
    const bookingPayments = await db.select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt));

    // Get refunds for booking
    const bookingRefunds = await db.select()
      .from(refunds)
      .where(eq(refunds.bookingId, bookingId))
      .orderBy(desc(refunds.createdAt));

    res.json({
      success: true,
      data: {
        payments: bookingPayments,
        refunds: bookingRefunds,
        summary: {
          totalPaid: bookingPayments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
          totalRefunded: bookingRefunds
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + parseFloat(r.amount), 0),
          pendingPayments: bookingPayments.filter(p => p.status === 'pending').length,
          pendingRefunds: bookingRefunds.filter(r => r.status === 'pending').length,
        },
      },
    });

  } catch (error) {
    logger.error('Failed to get booking payments', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bookingId: req.params.bookingId,
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Failed to retrieve booking payments',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/payments/refund
 * Create a refund for a payment
 */
paymentsRouter.post('/refund', validateRequest(createRefundSchema), async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, amount, reason, metadata = {} } = req.body;
    const userId = req.user?.id;

    // Get payment record to find booking
    const payment = await db.select()
      .from(payments)
      .where(eq(payments.transactionId, paymentIntentId))
      .limit(1);

    if (!payment.length) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'The specified payment does not exist',
      });
    }

    const paymentData = payment[0];

    // Verify booking access
    const booking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, paymentData.bookingId))
      .limit(1);

    if (!booking.length) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The associated booking does not exist',
      });
    }

    const bookingData = booking[0];

    // Check user access (users can only refund their own bookings, admins can refund any)
    if (userId && bookingData.userId && bookingData.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to refund this payment',
      });
    }

    // Check if refund is allowed based on cancellation policy
    if (bookingData.cancellationDeadline && new Date() > new Date(bookingData.cancellationDeadline)) {
      return res.status(400).json({
        error: 'Refund not allowed',
        message: 'Cancellation deadline has passed',
      });
    }

    // Create refund
    const refund = await stripeService.createRefund({
      paymentIntentId,
      amount,
      reason,
      bookingId: paymentData.bookingId,
      processedBy: userId,
      metadata,
    });

    res.json({
      success: true,
      data: {
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
        },
      },
    });

  } catch (error) {
    logger.error('Failed to create refund', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentIntentId: req.body.paymentIntentId,
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Refund creation failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
paymentsRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = '1', limit = '10', status, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    let conditions = eq(payments.userId, userId!);
    
    if (status) {
      conditions = and(conditions, eq(payments.status, status as string))!;
    }
    
    if (startDate) {
      conditions = and(conditions, gte(payments.createdAt, new Date(startDate as string)))!;
    }
    
    if (endDate) {
      conditions = and(conditions, lte(payments.createdAt, new Date(endDate as string)))!;
    }

    const userPayments = await db.select()
      .from(payments)
      .where(conditions)
      .orderBy(desc(payments.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db.select({ count: payments.id })
      .from(payments)
      .where(conditions);

    res.json({
      success: true,
      data: {
        payments: userPayments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limitNum),
        },
      },
    });

  } catch (error) {
    logger.error('Failed to get payment history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      query: req.query,
    });

    res.status(500).json({
      error: 'Failed to retrieve payment history',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhooks (public endpoint, no authentication required)
 */
paymentsRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        error: 'Missing stripe-signature header',
      });
    }

    await paymentService.handleWebhook(signature, req.body);

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      signature: req.headers['stripe-signature'],
    });

    res.status(400).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Invalid webhook signature',
    });
  }
});

/**
 * GET /api/payments/stats
 * Get payment statistics (admin only)
 */
paymentsRouter.get('/stats', authenticate, validateRequest(paymentStatsSchema, 'query'), async (req: Request, res: Response) => {
  try {
    // Check admin access
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required',
      });
    }

    const { startDate, endDate, currency } = req.query;

    const stats = await stripeService.getPaymentStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      currency: currency as string,
    });

    res.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    logger.error('Failed to get payment stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      query: req.query,
    });

    res.status(500).json({
      error: 'Failed to retrieve payment statistics',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/payments/setup-intent
 * Create a setup intent for saving payment methods
 */
paymentsRouter.post('/setup-intent', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { metadata = {} } = req.body;

    // Create or get Stripe customer
    let stripeCustomerId = req.user?.metadata?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer({
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
        phone: req.user!.phone || undefined,
        metadata: {
          userId: userId!,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // TODO: Update user record with Stripe customer ID
    }

    const setupIntent = await stripeService.createSetupIntent(stripeCustomerId, {
      userId: userId!,
      ...metadata,
    });

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      },
    });

  } catch (error) {
    logger.error('Failed to create setup intent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Setup intent creation failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

// Remove authentication from webhook endpoint
paymentsRouter.use('/webhook', (req, res, next) => {
  // Skip authentication for webhook endpoint
  req.user = undefined;
  next();
});