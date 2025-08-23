import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../database';
import { bookings, bookingStatusHistory, payments, refunds, users, auditLog } from '../database/schema';
import { sendBookingConfirmation, sendPaymentFailureNotification, sendRefundConfirmation } from '../services/emailService';
import { logger } from '../utils/logger';

const router = Router();

// Square webhook event schema
const SquareWebhookEventSchema = z.object({
  merchant_id: z.string(),
  type: z.string(),
  event_id: z.string(),
  created_at: z.string(),
  data: z.object({
    type: z.string(),
    id: z.string(),
    object: z.record(z.any())
  })
});

// Verify Square webhook signature
function verifySquareWebhookSignature(
  body: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Process payment completed event
async function handlePaymentCompleted(data: any) {
  const payment = data.object.payment;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const status = payment.status;
  const amount = payment.amount_money;
  
  logger.info(`Payment completed: ${paymentId} for order ${orderId}`);
  logger.info(`Amount: ${amount.amount} ${amount.currency}`);
  logger.info(`Status: ${status}`);
  
  const db = await getDb();
  
  // Update payment record
  await db.update(payments)
    .set({
      status: 'completed',
      transactionId: paymentId,
      processedAt: new Date(),
      metadata: { squarePayment: payment },
      updatedAt: new Date()
    })
    .where(eq(payments.transactionId, orderId));
  
  // Get the booking associated with this payment
  const [paymentRecord] = await db.select()
    .from(payments)
    .where(eq(payments.transactionId, orderId))
    .limit(1);
  
  if (paymentRecord) {
    // Update booking status
    await db.update(bookings)
      .set({
        status: 'confirmed',
        paymentStatus: 'paid',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, paymentRecord.bookingId));
    
    // Add status history
    await db.insert(bookingStatusHistory).values({
      bookingId: paymentRecord.bookingId,
      previousStatus: 'pending',
      newStatus: 'confirmed',
      reason: 'Payment completed successfully',
      metadata: { paymentId, amount: amount.amount / 100 }
    });
    
    // Get booking details for email
    const [booking] = await db.select()
      .from(bookings)
      .where(eq(bookings.id, paymentRecord.bookingId))
      .limit(1);
    
    if (booking) {
      // Send confirmation email
      await sendBookingConfirmation({
        email: booking.guestEmail,
        bookingId: booking.id,
        confirmationNumber: booking.confirmationNumber,
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalAmount: Number(booking.totalAmount),
        currency: booking.currency
      });
    }
  }
  
  return {
    processed: true,
    paymentId,
    orderId,
    amount: amount.amount / 100 // Convert from cents
  };
}

// Process payment failed event
async function handlePaymentFailed(data: any) {
  const payment = data.object.payment;
  const paymentId = payment.id;
  const orderId = payment.order_id;
  const errorCode = payment.error_code;
  const errorMessage = payment.error_message;
  
  logger.error(`Payment failed: ${paymentId} for order ${orderId}`);
  logger.error(`Error: ${errorCode} - ${errorMessage}`);
  
  const db = await getDb();
  
  // Update payment record as failed
  await db.update(payments)
    .set({
      status: 'failed',
      errorCode,
      errorMessage,
      processedAt: new Date(),
      metadata: { squarePayment: payment },
      updatedAt: new Date()
    })
    .where(eq(payments.transactionId, orderId));
  
  // Get the booking associated with this payment
  const [paymentRecord] = await db.select()
    .from(payments)
    .where(eq(payments.transactionId, orderId))
    .limit(1);
  
  if (paymentRecord) {
    // Update booking status
    await db.update(bookings)
      .set({
        status: 'payment_failed',
        paymentStatus: 'failed',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, paymentRecord.bookingId));
    
    // Add status history
    await db.insert(bookingStatusHistory).values({
      bookingId: paymentRecord.bookingId,
      previousStatus: 'pending',
      newStatus: 'payment_failed',
      reason: `Payment failed: ${errorCode}`,
      metadata: { paymentId, errorCode, errorMessage }
    });
    
    // Get booking details for email
    const [booking] = await db.select()
      .from(bookings)
      .where(eq(bookings.id, paymentRecord.bookingId))
      .limit(1);
    
    if (booking) {
      // Send failure notification email
      await sendPaymentFailureNotification({
        email: booking.guestEmail,
        bookingId: booking.id,
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        errorMessage: errorMessage || 'Payment processing failed',
        errorCode
      });
    }
  }
  
  // Log error for monitoring
  logger.error('Payment failure webhook processed', {
    paymentId,
    orderId,
    errorCode,
    errorMessage
  });
  
  return {
    processed: true,
    paymentId,
    orderId,
    error: errorCode
  };
}

// Process refund event
async function handleRefundCreated(data: any) {
  const refund = data.object.refund;
  const refundId = refund.id;
  const paymentId = refund.payment_id;
  const amount = refund.amount_money;
  const reason = refund.reason;
  
  logger.info(`Refund created: ${refundId} for payment ${paymentId}`);
  logger.info(`Amount: ${amount.amount} ${amount.currency}`);
  logger.info(`Reason: ${reason}`);
  
  const db = await getDb();
  
  // Find the payment record
  const [paymentRecord] = await db.select()
    .from(payments)
    .where(eq(payments.transactionId, paymentId))
    .limit(1);
  
  if (paymentRecord) {
    // Create refund record in database
    await db.insert(refunds).values({
      paymentId: paymentRecord.id,
      bookingId: paymentRecord.bookingId,
      amount: String(amount.amount / 100),
      currency: amount.currency,
      status: 'completed',
      transactionId: refundId,
      reason: reason || 'Customer requested refund',
      processedAt: new Date(),
      metadata: { squareRefund: refund }
    });
    
    // Update booking status
    await db.update(bookings)
      .set({
        status: 'refunded',
        paymentStatus: 'refunded',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, paymentRecord.bookingId));
    
    // Add status history
    await db.insert(bookingStatusHistory).values({
      bookingId: paymentRecord.bookingId,
      previousStatus: 'confirmed',
      newStatus: 'refunded',
      reason: `Refund processed: ${reason}`,
      metadata: { refundId, amount: amount.amount / 100 }
    });
    
    // Get booking details for email
    const [booking] = await db.select()
      .from(bookings)
      .where(eq(bookings.id, paymentRecord.bookingId))
      .limit(1);
    
    if (booking) {
      // Send refund confirmation email
      await sendRefundConfirmation({
        email: booking.guestEmail,
        bookingId: booking.id,
        confirmationNumber: booking.confirmationNumber,
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        refundAmount: amount.amount / 100,
        currency: amount.currency,
        reason
      });
    }
  }
  
  return {
    processed: true,
    refundId,
    paymentId,
    amount: amount.amount / 100
  };
}

// Process customer created event
async function handleCustomerCreated(data: any) {
  const customer = data.object.customer;
  const customerId = customer.id;
  const email = customer.email_address;
  const givenName = customer.given_name;
  const familyName = customer.family_name;
  
  logger.info(`Customer created: ${customerId} with email ${email}`);
  
  const db = await getDb();
  
  if (email) {
    // Check if user exists
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser) {
      // Update existing user with Square customer ID
      await db.update(users)
        .set({
          metadata: {
            ...existingUser.metadata,
            squareCustomerId: customerId
          },
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id));
    } else {
      // Create new user record
      await db.insert(users).values({
        email,
        firstName: givenName || '',
        lastName: familyName || '',
        role: 'customer',
        isActive: true,
        metadata: { squareCustomerId: customerId }
      });
    }
  }
  
  return {
    processed: true,
    customerId,
    email
  };
}

// Square webhook endpoint
router.post('/square', async (req: Request, res: Response) => {
  try {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-square-hmacsha256-signature'] as string;
    const webhookSecret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifySquareWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid Square webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Parse and validate webhook event
    const event = SquareWebhookEventSchema.parse(req.body);
    
    logger.info(`Received Square webhook: ${event.type} (${event.event_id})`);
    
    const db = await getDb();
    
    // Check if we've already processed this event (idempotency)
    const [existingEvent] = await db.select()
      .from(auditLog)
      .where(eq(auditLog.eventId, event.event_id))
      .limit(1);
    
    if (existingEvent) {
      logger.info(`Event ${event.event_id} already processed, skipping`);
      return res.status(200).json({ 
        success: true, 
        eventId: event.event_id,
        processed: false,
        reason: 'Duplicate event'
      });
    }
    
    let result;
    
    // Process event based on type
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        if (event.data.object.payment?.status === 'COMPLETED') {
          result = await handlePaymentCompleted(event.data);
        } else if (event.data.object.payment?.status === 'FAILED') {
          result = await handlePaymentFailed(event.data);
        }
        break;
        
      case 'refund.created':
      case 'refund.updated':
        result = await handleRefundCreated(event.data);
        break;
        
      case 'customer.created':
        result = await handleCustomerCreated(event.data);
        break;
        
      case 'invoice.payment_made':
        // Handle subscription payments
        console.log('Subscription payment received');
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Store event in database for audit trail
    await db.insert(auditLog).values({
      action: 'webhook_received',
      entityType: 'webhook',
      entityId: event.event_id,
      eventId: event.event_id,
      details: {
        type: event.type,
        merchantId: event.merchant_id,
        processed: result?.processed || false,
        result
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      eventId: event.event_id,
      processed: result?.processed || false
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log error but return 200 to prevent retries for malformed events
    res.status(200).json({ 
      success: false, 
      error: 'Event processing failed' 
    });
  }
});

// PayPal webhook endpoint
router.post('/paypal', async (req: Request, res: Response) => {
  try {
    // PayPal webhook verification would require PayPal SDK
    // For now, we'll process the events as-is in non-production
    if (process.env.NODE_ENV === 'production') {
      // In production, implement proper PayPal webhook verification
      // using PayPal SDK and webhook signature
      logger.warn('PayPal webhook verification not yet implemented for production');
    }
    
    const event = req.body;
    logger.info(`PayPal webhook received: ${event.event_type}`);
    
    const db = await getDb();
    
    // Process PayPal events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Handle payment completion
        logger.info('PayPal payment captured', { 
          paymentId: event.resource?.id 
        });
        break;
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        // Handle refund
        logger.info('PayPal payment refunded', { 
          refundId: event.resource?.id 
        });
        break;
        
      default:
        logger.info(`Unhandled PayPal event type: ${event.event_type}`);
    }
    
    // Store event for audit
    await db.insert(auditLog).values({
      action: 'paypal_webhook_received',
      entityType: 'webhook',
      entityId: event.id || 'unknown',
      eventId: event.id,
      details: event,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('PayPal webhook error:', error);
    res.status(200).json({ success: false });
  }
});

// Health check endpoint for webhook monitoring
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhooks: {
      square: 'enabled',
      paypal: 'placeholder'
    }
  });
});

export default router;