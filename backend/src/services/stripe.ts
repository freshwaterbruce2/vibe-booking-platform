import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getDb } from '../database';
import { payments, refunds, bookings } from '../database/schema';
import { eq, and } from 'drizzle-orm';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    // Skip Stripe initialization for local development
    if (process.env.LOCAL_SQLITE) {
      logger.info('Stripe service bypassed for local development');
      return;
    }
    
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    bookingId: string;
    userId?: string;
    metadata?: Record<string, string>;
    automaticPaymentMethods?: boolean;
  }) {
    try {
      const { amount, currency, bookingId, userId, metadata = {}, automaticPaymentMethods = true } = params;

      // Calculate commission (5% of booking amount)
      const commissionAmount = Math.round(amount * 0.05);
      const platformFee = commissionAmount;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: automaticPaymentMethods ? { enabled: true } : undefined,
        metadata: {
          bookingId,
          userId: userId || '',
          commissionAmount: commissionAmount.toString(),
          platformFee: platformFee.toString(),
          ...metadata,
        },
        receipt_email: metadata.guestEmail,
        description: `Vibe Booking payment for booking #${metadata.confirmationNumber || bookingId}`,
        statement_descriptor: 'VIBE BOOKING',
        application_fee_amount: Math.round(platformFee * 100), // Platform commission in cents
      });

      // Store payment record in database
      const db = await getDb();
      await db.insert(payments).values({
        bookingId,
        userId,
        amount: amount.toString(),
        currency: currency.toUpperCase(),
        status: 'pending',
        method: 'card',
        provider: 'stripe',
        transactionId: paymentIntent.id,
        metadata: {
          paymentIntentId: paymentIntent.id,
          commissionAmount,
          platformFee,
          clientSecret: paymentIntent.client_secret,
        },
      });

      logger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        bookingId,
        amount,
        currency,
        commissionAmount,
      });

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret,
        commissionAmount,
        platformFee,
      };
    } catch (error) {
      logger.error('Failed to create payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bookingId: params.bookingId,
        amount: params.amount,
      });
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${config.server.baseUrl}/payment/success`,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to confirm payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Failed to retrieve payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    bookingId: string;
    processedBy?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      const { paymentIntentId, amount, reason = 'requested_by_customer', bookingId, processedBy, metadata = {} } = params;

      // Get the original payment intent
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Cannot refund a payment that has not been successfully charged');
      }

      // Create refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
        reason,
        metadata: {
          bookingId,
          processedBy: processedBy || '',
          ...metadata,
        },
      });

      // Calculate refund amounts
      const refundAmount = refund.amount / 100; // Convert back to dollars
      const originalCommission = parseInt(paymentIntent.metadata?.commissionAmount || '0');
      const commissionRefund = amount ? Math.round(amount * 0.05) : originalCommission;

      // Store refund record in database
      const db = await getDb();
      await db.insert(refunds).values({
        paymentId: (await db.select().from(payments).where(eq(payments.transactionId, paymentIntentId)))[0]?.id,
        bookingId,
        amount: refundAmount.toString(),
        currency: refund.currency.toUpperCase(),
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
        transactionId: refund.id,
        reason,
        processedBy,
        processedAt: refund.status === 'succeeded' ? new Date() : null,
        metadata: {
          stripeRefundId: refund.id,
          originalPaymentIntentId: paymentIntentId,
          commissionRefund,
        },
      });

      logger.info('Refund created', {
        refundId: refund.id,
        paymentIntentId,
        bookingId,
        amount: refundAmount,
        commissionRefund,
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: params.paymentIntentId,
        bookingId: params.bookingId,
      });
      throw error;
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhook(body: string, signature: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );

      logger.info('Stripe webhook received', {
        eventType: event.type,
        eventId: event.id,
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        
        case 'refund.updated':
          await this.handleRefundUpdated(event.data.object as Stripe.Refund);
          break;
        
        default:
          logger.info('Unhandled webhook event type', { eventType: event.type });
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook handling failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.bookingId;
      
      // Update payment status
      const db = await getDb();
      await db.update(payments)
        .set({
          status: 'completed',
          processedAt: new Date(),
          metadata: {
            ...paymentIntent.metadata,
            stripeChargeId: paymentIntent.latest_charge,
          },
        })
        .where(eq(payments.transactionId, paymentIntent.id));

      // Update booking status
      await db.update(bookings)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      logger.info('Payment succeeded and booking confirmed', {
        paymentIntentId: paymentIntent.id,
        bookingId,
        amount: paymentIntent.amount / 100,
      });

      // TODO: Send confirmation email
      // TODO: Send booking confirmation to hotel
      // TODO: Update inventory if needed

    } catch (error) {
      logger.error('Failed to handle payment success', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.bookingId;
      
      // Update payment status
      const db = await getDb();
      await db.update(payments)
        .set({
          status: 'failed',
          errorCode: paymentIntent.last_payment_error?.code || 'unknown_error',
          errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
          updatedAt: new Date(),
        })
        .where(eq(payments.transactionId, paymentIntent.id));

      // Update booking status
      await db.update(bookings)
        .set({
          status: 'payment_failed',
          paymentStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      logger.warn('Payment failed', {
        paymentIntentId: paymentIntent.id,
        bookingId,
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message,
      });

      // TODO: Send payment failure notification
      // TODO: Release any held inventory

    } catch (error) {
      logger.error('Failed to handle payment failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.bookingId;
      
      // Update payment status
      const db = await getDb();
      await db.update(payments)
        .set({
          status: 'canceled',
          updatedAt: new Date(),
        })
        .where(eq(payments.transactionId, paymentIntent.id));

      // Update booking status
      await db.update(bookings)
        .set({
          status: 'canceled',
          paymentStatus: 'canceled',
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      logger.info('Payment canceled', {
        paymentIntentId: paymentIntent.id,
        bookingId,
      });

    } catch (error) {
      logger.error('Failed to handle payment cancellation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  /**
   * Handle dispute created
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    try {
      logger.warn('Dispute created', {
        disputeId: dispute.id,
        chargeId: dispute.charge,
        amount: dispute.amount / 100,
        reason: dispute.reason,
      });

      // TODO: Handle dispute logic
      // TODO: Notify administrators
      // TODO: Update booking status if needed

    } catch (error) {
      logger.error('Failed to handle dispute creation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        disputeId: dispute.id,
      });
    }
  }

  /**
   * Handle refund updated
   */
  private async handleRefundUpdated(refund: Stripe.Refund) {
    try {
      // Update refund status in database
      const db = await getDb();
      await db.update(refunds)
        .set({
          status: refund.status === 'succeeded' ? 'completed' : refund.status === 'failed' ? 'failed' : 'pending',
          processedAt: refund.status === 'succeeded' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(refunds.transactionId, refund.id));

      logger.info('Refund updated', {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      });

    } catch (error) {
      logger.error('Failed to handle refund update', {
        error: error instanceof Error ? error.message : 'Unknown error',
        refundId: refund.id,
      });
    }
  }

  /**
   * Get payment statistics for admin dashboard
   */
  async getPaymentStats(params: {
    startDate?: Date;
    endDate?: Date;
    currency?: string;
  }) {
    try {
      const { startDate, endDate, currency = 'USD' } = params;

      // This would typically involve complex database queries
      // For now, we'll return mock data structure
      return {
        totalRevenue: 0,
        totalCommission: 0,
        totalRefunds: 0,
        paymentCount: 0,
        refundCount: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        topPaymentMethods: [],
        dailyStats: [],
        currency,
        period: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      logger.error('Failed to get payment stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate,
        currency,
      });
      throw error;
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata || {},
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: params.email,
      });
      throw error;
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(customerId: string, metadata?: Record<string, string>) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: metadata || {},
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to create setup intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      throw error;
    }
  }
}

// Use mock service for local development, real Stripe for production
let stripeServiceInstance: any;
if (process.env.LOCAL_SQLITE) {
  const MockService = require('./stripeMock').StripeService;
  stripeServiceInstance = new MockService();
} else {
  stripeServiceInstance = new StripeService();
}

export const stripeService = stripeServiceInstance;