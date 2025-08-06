import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getDb } from '../database';
import { payments, paymentMethods, refunds } from '../database/schema';
import { eq } from 'drizzle-orm';

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    bookingId: string;
    userId?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency || config.stripe.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: params.bookingId,
          userId: params.userId || '',
          ...params.metadata,
        },
      });

      // Store payment record in database
      const db = getDb();
      await db.insert(payments).values({
        bookingId: params.bookingId,
        userId: params.userId,
        amount: params.amount.toString(),
        currency: params.currency || config.stripe.currency,
        status: 'pending',
        method: 'card',
        provider: 'stripe',
        transactionId: paymentIntent.id,
        metadata: params.metadata || {},
      });

      logger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        bookingId: params.bookingId,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };

    } catch (error) {
      logger.error('Failed to create payment intent', { error, params });
      throw new Error('Failed to initialize payment. Please try again.');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{
    status: string;
    paymentId: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Update payment record in database
      const db = getDb();
      const [payment] = await db
        .update(payments)
        .set({
          status: this.mapStripeStatusToInternal(paymentIntent.status),
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.transactionId, paymentIntentId))
        .returning();

      logger.info('Payment confirmed', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return {
        status: payment.status,
        paymentId: payment.id,
      };

    } catch (error) {
      logger.error('Failed to confirm payment', { error, paymentIntentId });
      throw new Error('Failed to confirm payment.');
    }
  }

  async processRefund(params: {
    paymentId: string;
    amount?: number;
    reason: string;
    processedBy?: string;
  }): Promise<{
    refundId: string;
    status: string;
    amount: number;
  }> {
    try {
      const db = getDb();
      
      // Get payment details
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, params.paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Create Stripe refund
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId!,
        amount: params.amount ? Math.round(params.amount * 100) : undefined,
        reason: 'requested_by_customer',
        metadata: {
          internalReason: params.reason,
          processedBy: params.processedBy || 'system',
        },
      });

      // Store refund record
      const [refundRecord] = await db.insert(refunds).values({
        paymentId: params.paymentId,
        bookingId: payment.bookingId,
        amount: (stripeRefund.amount / 100).toString(),
        currency: stripeRefund.currency,
        status: this.mapStripeRefundStatus(stripeRefund.status),
        transactionId: stripeRefund.id,
        reason: params.reason,
        processedBy: params.processedBy,
        processedAt: new Date(),
      }).returning();

      logger.info('Refund processed', {
        refundId: refundRecord.id,
        stripeRefundId: stripeRefund.id,
        amount: stripeRefund.amount / 100,
      });

      return {
        refundId: refundRecord.id,
        status: refundRecord.status,
        amount: parseFloat(refundRecord.amount),
      };

    } catch (error) {
      logger.error('Failed to process refund', { error, params });
      throw new Error('Failed to process refund. Please contact support.');
    }
  }

  async savePaymentMethod(params: {
    userId: string;
    paymentMethodId: string;
    setAsDefault?: boolean;
  }): Promise<{
    paymentMethodId: string;
    last4: string;
    brand: string;
  }> {
    try {
      // Retrieve payment method from Stripe
      const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(params.paymentMethodId);

      // Attach to customer
      const customer = await this.findOrCreateStripeCustomer(params.userId);
      await this.stripe.paymentMethods.attach(params.paymentMethodId, {
        customer: customer.id,
      });

      const db = getDb();

      // If setting as default, update other methods
      if (params.setAsDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, params.userId));
      }

      // Save payment method
      const [savedMethod] = await db.insert(paymentMethods).values({
        userId: params.userId,
        type: stripePaymentMethod.type,
        provider: 'stripe',
        token: params.paymentMethodId,
        last4: stripePaymentMethod.card?.last4,
        brand: stripePaymentMethod.card?.brand,
        expMonth: stripePaymentMethod.card?.exp_month?.toString(),
        expYear: stripePaymentMethod.card?.exp_year?.toString(),
        isDefault: params.setAsDefault || false,
        billingAddress: stripePaymentMethod.billing_details || {},
      }).returning();

      logger.info('Payment method saved', {
        userId: params.userId,
        paymentMethodId: savedMethod.id,
      });

      return {
        paymentMethodId: savedMethod.id,
        last4: savedMethod.last4!,
        brand: savedMethod.brand!,
      };

    } catch (error) {
      logger.error('Failed to save payment method', { error, params });
      throw new Error('Failed to save payment method.');
    }
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    try {
      const db = getDb();
      const methods = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId));

      return methods.map(method => ({
        id: method.id,
        type: method.type,
        last4: method.last4,
        brand: method.brand,
        expMonth: method.expMonth,
        expYear: method.expYear,
        isDefault: method.isDefault,
        nickname: method.nickname,
      }));

    } catch (error) {
      logger.error('Failed to get user payment methods', { error, userId });
      throw new Error('Failed to retrieve payment methods.');
    }
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      const db = getDb();
      
      // Get payment method
      const [method] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, paymentMethodId))
        .limit(1);

      if (!method || method.userId !== userId) {
        throw new Error('Payment method not found');
      }

      // Detach from Stripe
      await this.stripe.paymentMethods.detach(method.token);

      // Delete from database
      await db
        .delete(paymentMethods)
        .where(eq(paymentMethods.id, paymentMethodId));

      logger.info('Payment method deleted', {
        userId,
        paymentMethodId,
      });

    } catch (error) {
      logger.error('Failed to delete payment method', { error, userId, paymentMethodId });
      throw new Error('Failed to delete payment method.');
    }
  }

  async handleWebhook(signature: string, payload: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      logger.info('Stripe webhook received', { type: event.type });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'refund.created':
        case 'refund.updated':
          await this.handleRefundUpdate(event.data.object as Stripe.Refund);
          break;
        
        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

    } catch (error) {
      logger.error('Failed to handle webhook', { error });
      throw error;
    }
  }

  private async findOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if customer already exists
    const customers = await this.stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return await this.stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone || undefined,
      metadata: {
        userId: user.id,
      },
    });
  }

  private mapStripeStatusToInternal(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'succeeded': 'completed',
      'processing': 'processing',
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'canceled': 'cancelled',
      'failed': 'failed',
    };

    return statusMap[stripeStatus] || 'pending';
  }

  private mapStripeRefundStatus(stripeStatus: string | null): string {
    const statusMap: Record<string, string> = {
      'succeeded': 'completed',
      'pending': 'processing',
      'failed': 'failed',
      'canceled': 'cancelled',
    };

    return statusMap[stripeStatus || ''] || 'pending';
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const db = getDb();
    await db
      .update(payments)
      .set({
        status: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.transactionId, paymentIntent.id));
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const db = getDb();
    await db
      .update(payments)
      .set({
        status: 'failed',
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message,
        updatedAt: new Date(),
      })
      .where(eq(payments.transactionId, paymentIntent.id));
  }

  private async handleRefundUpdate(refund: Stripe.Refund): Promise<void> {
    const db = getDb();
    await db
      .update(refunds)
      .set({
        status: this.mapStripeRefundStatus(refund.status),
        updatedAt: new Date(),
      })
      .where(eq(refunds.transactionId, refund.id));
  }
}

export const paymentService = new PaymentService();