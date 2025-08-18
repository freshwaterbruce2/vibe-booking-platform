// Square payment integration with 2025 standards
import { Client, Environment } from 'square';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getDb } from '../database';
import { payments, paymentMethods, refunds } from '../database/schema';
import { eq } from 'drizzle-orm';

export class SquarePaymentService {
  private client: Client;

  constructor() {
    this.client = new Client({
      accessToken: config.square.accessToken,
      environment: config.square.environment === 'production' ? Environment.Production : Environment.Sandbox,
    });
  }

  /**
   * Create a Square payment
   */
  async createPayment(params: {
    sourceId: string; // Payment method token from frontend
    amount: number;
    currency?: string;
    bookingId: string;
    userId?: string;
    metadata?: Record<string, string>;
    billingAddress?: {
      firstName?: string;
      lastName?: string;
      addressLine1?: string;
      addressLine2?: string;
      locality?: string;
      administrativeDistrictLevel1?: string;
      postalCode?: string;
      country?: string;
    };
  }): Promise<{
    success: boolean;
    paymentId?: string;
    receiptUrl?: string;
    errorMessage?: string;
  }> {
    try {
      const idempotencyKey = randomUUID();
      const amountMoney = {
        amount: BigInt(Math.round(params.amount * 100)), // Convert to cents
        currency: params.currency || 'USD',
      };

      const createPaymentRequest = {
        sourceId: params.sourceId,
        idempotencyKey,
        amountMoney,
        referenceId: params.bookingId,
        note: `Vibe Booking payment for booking ${params.bookingId}`,
        buyerEmailAddress: params.metadata?.email,
        billingAddress: params.billingAddress ? {
          firstName: params.billingAddress.firstName,
          lastName: params.billingAddress.lastName,
          addressLine1: params.billingAddress.addressLine1,
          addressLine2: params.billingAddress.addressLine2,
          locality: params.billingAddress.locality,
          administrativeDistrictLevel1: params.billingAddress.administrativeDistrictLevel1,
          postalCode: params.billingAddress.postalCode,
          country: params.billingAddress.country || 'US',
        } : undefined,
      };

      const { result } = await this.client.paymentsApi.createPayment(createPaymentRequest);
      
      if (result.payment) {
        // Store payment record in database
        const db = await getDb();
        await db.insert(payments).values({
          bookingId: params.bookingId,
          userId: params.userId,
          amount: params.amount.toString(),
          currency: params.currency || 'USD',
            status: result.payment.status === 'COMPLETED' ? 'succeeded' : 'pending',
          method: 'card',
          provider: 'square',
          transactionId: result.payment.id,
          referenceNumber: result.payment.orderId || undefined,
          cardLast4: result.payment.cardDetails?.card?.last4,
          cardBrand: result.payment.cardDetails?.card?.cardBrand,
          metadata: {
            ...params.metadata,
            squarePaymentId: result.payment.id,
            receiptUrl: result.payment.receiptUrl,
          },
        } as any); // cast to any to bypass potential numeric precision issues

        logger.info('Square payment created successfully', {
          paymentId: result.payment.id,
          bookingId: params.bookingId,
          amount: params.amount,
          status: result.payment.status,
        });

        return {
          success: true,
          paymentId: result.payment.id,
          receiptUrl: result.payment.receiptUrl,
        };
      } else {
        logger.error('Square payment creation failed - no payment returned');
        return {
          success: false,
          errorMessage: 'Payment creation failed',
        };
      }
    } catch (error) {
      logger.error('Square payment creation error', { error, bookingId: params.bookingId });
      
      if (error instanceof Error) {
        const squareErr: any = error as any;
        const errorMessage = squareErr.errors?.[0]?.detail || squareErr.message || 'Payment processing failed';
        return {
          success: false,
          errorMessage,
        };
      }

      return {
        success: false,
        errorMessage: 'Payment processing failed. Please try again.',
      };
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<{
    success: boolean;
    payment?: any;
    errorMessage?: string;
  }> {
    try {
      const { result } = await this.client.paymentsApi.getPayment(paymentId);
      
      return {
        success: true,
        payment: result.payment,
      };
    } catch (error) {
      logger.error('Error fetching Square payment', { error, paymentId });
      
      if (error instanceof Error) {
        const squareErr: any = error as any;
        return {
          success: false,
          errorMessage: squareErr.errors?.[0]?.detail || squareErr.message || 'Failed to fetch payment details',
        };
      }

      return {
        success: false,
        errorMessage: 'Failed to fetch payment details',
      };
    }
  }

  /**
   * Process refund
   */
  async createRefund(params: {
    paymentId: string;
    amount?: number; // If not provided, refunds full amount
    reason?: string;
    bookingId: string;
  }): Promise<{
    success: boolean;
    refundId?: string;
    errorMessage?: string;
  }> {
    try {
      const idempotencyKey = randomUUID();
      
      // Get original payment to determine refund amount
      const paymentResult = await this.getPayment(params.paymentId);
      if (!paymentResult.success || !paymentResult.payment) {
        return {
          success: false,
          errorMessage: 'Original payment not found',
        };
      }

      const refundAmount = params.amount 
        ? { amount: BigInt(Math.round(params.amount * 100)), currency: paymentResult.payment.amountMoney.currency }
        : paymentResult.payment.amountMoney;

      const createRefundRequest = {
        idempotencyKey,
        amountMoney: refundAmount,
        paymentId: params.paymentId,
        reason: params.reason || 'Vibe Booking cancellation',
      };

      const { result } = await this.client.refundsApi.refundPayment(createRefundRequest);

      if (result.refund) {
        // Store refund record in database
        const db = await getDb();
        await db.insert(refunds).values({
          bookingId: params.bookingId,
          paymentId: params.paymentId,
          amount: (Number(refundAmount.amount) / 100).toString(),
          currency: refundAmount.currency,
          status: result.refund.status === 'COMPLETED' ? 'succeeded' : 'pending',
          transactionId: result.refund.id,
          reason: params.reason || 'Vibe Booking cancellation',
          metadata: { squareRefundId: result.refund.id },
        } as any);

        logger.info('Square refund created successfully', {
          refundId: result.refund.id,
          paymentId: params.paymentId,
          bookingId: params.bookingId,
          amount: Number(refundAmount.amount) / 100,
        });

        return {
          success: true,
          refundId: result.refund.id,
        };
      } else {
        logger.error('Square refund creation failed - no refund returned');
        return {
          success: false,
          errorMessage: 'Refund creation failed',
        };
      }
    } catch (error) {
      logger.error('Square refund creation error', { error, paymentId: params.paymentId });
      
      if (error instanceof Error) {
        const squareErr: any = error as any;
        const errorMessage = squareErr.errors?.[0]?.detail || squareErr.message || 'Refund processing failed';
        return {
          success: false,
          errorMessage,
        };
      }

      return {
        success: false,
        errorMessage: 'Refund processing failed. Please try again.',
      };
    }
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(params: {
    sourceId: string;
    userId: string;
    customerId?: string;
  }): Promise<{
    success: boolean;
    cardId?: string;
    errorMessage?: string;
  }> {
    try {
      const idempotencyKey = randomUUID();
      
      const createCardRequest = {
        idempotencyKey,
        sourceId: params.sourceId,
        card: {
          customerId: params.customerId,
        },
      };

      const { result } = await this.client.cardsApi.createCard(createCardRequest);

      if (result.card) {
        // Store payment method in database
        const db = await getDb();
        await db.insert(paymentMethods).values({
          userId: params.userId,
          provider: 'square',
          type: 'card',
          token: result.card.id,
          last4: result.card.last4 || '',
          brand: result.card.cardBrand || '',
          metadata: { squareCardId: result.card.id, customerId: params.customerId },
        } as any);

        logger.info('Square payment method saved successfully', {
          cardId: result.card.id,
          userId: params.userId,
          last4: result.card.last4,
        });

        return {
          success: true,
          cardId: result.card.id,
        };
      } else {
        logger.error('Square card creation failed - no card returned');
        return {
          success: false,
          errorMessage: 'Failed to save payment method',
        };
      }
    } catch (error) {
      logger.error('Square card creation error', { error, userId: params.userId });
      
      if (error instanceof Error) {
        const squareErr: any = error as any;
        const errorMessage = squareErr.errors?.[0]?.detail || squareErr.message || 'Failed to save payment method';
        return {
          success: false,
          errorMessage,
        };
      }

      return {
        success: false,
        errorMessage: 'Failed to save payment method',
      };
    }
  }

  /**
   * Create customer for saved payment methods
   */
  async createCustomer(params: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
  }): Promise<{
    success: boolean;
    customerId?: string;
    errorMessage?: string;
  }> {
    try {
      const createCustomerRequest = {
        givenName: params.givenName,
        familyName: params.familyName,
        emailAddress: params.emailAddress,
        phoneNumber: params.phoneNumber,
      };

      const { result } = await this.client.customersApi.createCustomer(createCustomerRequest);

      if (result.customer) {
        logger.info('Square customer created successfully', {
          customerId: result.customer.id,
          email: params.emailAddress,
        });

        return {
          success: true,
          customerId: result.customer.id,
        };
      } else {
        logger.error('Square customer creation failed - no customer returned');
        return {
          success: false,
          errorMessage: 'Customer creation failed',
        };
      }
    } catch (error) {
      logger.error('Square customer creation error', { error, email: params.emailAddress });
      
      if (error instanceof Error) {
        const squareErr: any = error as any;
        const errorMessage = squareErr.errors?.[0]?.detail || squareErr.message || 'Customer creation failed';
        return {
          success: false,
          errorMessage,
        };
      }

      return {
        success: false,
        errorMessage: 'Customer creation failed',
      };
    }
  }

  /**
   * Webhook handler for Square events
   */
  async handleWebhook(payload: any, signature: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify signature if key present
      if (config.square.webhookSignatureKey) {
        // Square spec: signature = Base64( HMAC_SHA256( signatureKey, notificationUrl + body ) )
        // We currently only have parsed JSON body; to be fully compliant we need raw body & full URL.
        // TODO: capture raw body in middleware (e.g. bodyParser.raw) and pass original URL.
        try {
          const bodyString = JSON.stringify(payload);
          const hmac = crypto.createHmac('sha256', config.square.webhookSignatureKey);
          hmac.update(bodyString);
          const expectedFallback = hmac.digest('base64');
          if (signature !== expectedFallback) {
            logger.warn('Square webhook signature mismatch (fallback body-only check)');
            return { success: false, message: 'Invalid signature' };
          }
        } catch (sigErr) {
          logger.error('Webhook signature verification error', { sigErr });
          return { success: false, message: 'Signature verification failed' };
        }
      }
      
  const eventType = payload.type;
  const eventData = payload.data;

      switch (eventType) {
        case 'payment.updated':
          await this.handlePaymentUpdated(eventData);
          break;
        case 'refund.updated':
          await this.handleRefundUpdated(eventData);
          break;
        default:
          logger.info('Unhandled Square webhook event', { eventType });
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      logger.error('Square webhook processing error', { error, payload });
      return {
        success: false,
        message: 'Webhook processing failed',
      };
    }
  }

  // Raw variant with proper signature (URL + body)
  async handleWebhookRaw(rawBody: Buffer, signature: string, url: string): Promise<{ success: boolean; message: string; }> {
    try {
      if (config.square.webhookSignatureKey) {
        const hmac = crypto.createHmac('sha256', config.square.webhookSignatureKey);
        hmac.update(url + rawBody.toString());
        const expected = hmac.digest('base64');
        if (signature !== expected) {
          logger.warn('Square webhook signature mismatch (raw variant)');
          return { success: false, message: 'Invalid signature' };
        }
      }
      const payload = JSON.parse(rawBody.toString());
      return this.handleWebhook(payload, signature);
    } catch (err) {
      logger.error('Square raw webhook error', { err });
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  private async handlePaymentUpdated(data: any): Promise<void> {
    try {
      const payment = data.object?.payment;
      if (!payment) return;

      const db = await getDb();
      await db
        .update(payments)
        .set({
          status: payment.status === 'COMPLETED' ? 'succeeded' : 'failed',
          updatedAt: new Date(),
        })
  .where(eq(payments.transactionId, payment.id));

      logger.info('Payment status updated from Square webhook', {
        paymentId: payment.id,
        status: payment.status,
      });
    } catch (error) {
      logger.error('Error handling Square payment updated webhook', { error, data });
    }
  }

  private async handleRefundUpdated(data: any): Promise<void> {
    try {
      const refund = data.object?.refund;
      if (!refund) return;

      const db = await getDb();
      await db
        .update(refunds)
        .set({
          status: refund.status === 'COMPLETED' ? 'succeeded' : 'failed',
          updatedAt: new Date(),
        })
  .where(eq(refunds.transactionId, refund.id));

      logger.info('Refund status updated from Square webhook', {
        refundId: refund.id,
        status: refund.status,
      });
    } catch (error) {
      logger.error('Error handling Square refund updated webhook', { error, data });
    }
  }
}

// Export singleton instance
export const squarePaymentService = new SquarePaymentService();