import { getDb } from '../database';
import type { NewScheduledEmail } from '../database/schema';
import { scheduledEmails, bookings } from '../database/schema';
import { eq, and, lte } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { emailService } from './emailService';
import { v4 as uuidv4 } from 'uuid';

export interface BookingReminderData {
  bookingId: string;
  guestEmail: string;
  guestName: string;
  hotelName: string;
  checkIn: string;
  confirmationNumber: string;
  sendAt: Date;
  reminderType: '24h_before_checkin' | '2h_before_checkin' | 'checkin_day';
}

export interface BookingModificationData {
  bookingId: string;
  guestEmail: string;
  guestName: string;
  confirmationNumber: string;
  modificationType: string;
  sendAt: Date;
}

export class NotificationScheduler {
  /**
   * Schedule a booking reminder email to be sent 24 hours before check-in
   */
  async scheduleBookingReminder(reminderData: BookingReminderData): Promise<{ success: boolean }> {
    try {
      const db = getDb();

      // Calculate 24 hours before check-in
      const checkInDate = new Date(reminderData.checkIn);
      const reminderTime = new Date(checkInDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before

      const scheduledEmail: NewScheduledEmail = {
        id: uuidv4(),
        bookingId: reminderData.bookingId,
        emailType: 'booking_reminder',
        recipientEmail: reminderData.guestEmail,
        scheduledFor: reminderTime,
        status: 'pending',
        emailData: {
          guestName: reminderData.guestName,
          hotelName: reminderData.hotelName,
          checkIn: reminderData.checkIn,
          confirmationNumber: reminderData.confirmationNumber,
          reminderType: reminderData.reminderType,
        },
        createdAt: new Date(),
      };

      await db.insert(scheduledEmails).values(scheduledEmail);

      logger.info('Booking reminder scheduled', {
        bookingId: reminderData.bookingId,
        scheduledFor: reminderTime,
        reminderType: reminderData.reminderType,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to schedule booking reminder', {
        error,
        bookingId: reminderData.bookingId,
      });
      return { success: false };
    }
  }

  /**
   * Schedule a booking modification notification email
   */
  async scheduleBookingModificationNotification(modificationData: BookingModificationData): Promise<{ success: boolean }> {
    try {
      const db = getDb();

      const scheduledEmail: NewScheduledEmail = {
        id: uuidv4(),
        bookingId: modificationData.bookingId,
        emailType: 'booking_modification',
        recipientEmail: modificationData.guestEmail,
        scheduledFor: modificationData.sendAt,
        status: 'pending',
        emailData: {
          guestName: modificationData.guestName,
          confirmationNumber: modificationData.confirmationNumber,
          modificationType: modificationData.modificationType,
        },
        createdAt: new Date(),
      };

      await db.insert(scheduledEmails).values(scheduledEmail);

      logger.info('Booking modification notification scheduled', {
        bookingId: modificationData.bookingId,
        modificationType: modificationData.modificationType,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to schedule booking modification notification', {
        error,
        bookingId: modificationData.bookingId,
      });
      return { success: false };
    }
  }

  /**
   * Cancel all scheduled notifications for a booking (e.g., when booking is cancelled)
   */
  async cancelScheduledNotifications(bookingId: string): Promise<{ success: boolean }> {
    try {
      const db = getDb();

      await db
        .update(scheduledEmails)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(and(
          eq(scheduledEmails.bookingId, bookingId),
          eq(scheduledEmails.status, 'pending'),
        ));

      logger.info('Cancelled scheduled notifications for booking', { bookingId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to cancel scheduled notifications', {
        error,
        bookingId,
      });
      return { success: false };
    }
  }

  /**
   * Process all scheduled emails that are ready to be sent - OPTIMIZED
   */
  async processScheduledEmails(): Promise<{ processed: number; failed: number }> {
    try {
      const db = getDb();
      const now = new Date();

      // OPTIMIZATION 1: Select only required fields to reduce memory usage
      const emailsToSend = await db
        .select({
          id: scheduledEmails.id,
          emailType: scheduledEmails.emailType,
          recipientEmail: scheduledEmails.recipientEmail,
          emailData: scheduledEmails.emailData,
          scheduledFor: scheduledEmails.scheduledFor,
        })
        .from(scheduledEmails)
        .where(and(
          eq(scheduledEmails.status, 'pending'),
          lte(scheduledEmails.scheduledFor, now),
        ))
        .orderBy(scheduledEmails.scheduledFor) // OPTIMIZATION 2: Process oldest first
        .limit(50); // Process in batches of 50

      if (emailsToSend.length === 0) {
        logger.debug('No scheduled emails ready for processing');
        return { processed: 0, failed: 0 };
      }

      let processed = 0;
      let failed = 0;
      const emailIds = emailsToSend.map((e) => e.id);
      const successfulEmailIds: string[] = [];
      const failedEmailIds: string[] = [];

      // OPTIMIZATION 3: Process emails concurrently (limit to 5 concurrent)
      const CONCURRENT_LIMIT = 5;
      const emailBatches = [];
      for (let i = 0; i < emailsToSend.length; i += CONCURRENT_LIMIT) {
        emailBatches.push(emailsToSend.slice(i, i + CONCURRENT_LIMIT));
      }

      for (const batch of emailBatches) {
        const promises = batch.map(async (email) => {
          try {
            let emailSent = false;

            switch (email.emailType) {
              case 'booking_reminder':
                await this.sendBookingReminderEmail(email);
                emailSent = true;
                break;

              case 'booking_modification':
                await this.sendBookingModificationEmail(email);
                emailSent = true;
                break;

              default:
                logger.warn('Unknown email type for scheduled email', {
                  emailId: email.id,
                  emailType: email.emailType,
                });
            }

            if (emailSent) {
              successfulEmailIds.push(email.id);
              processed++;
            }
          } catch (emailError) {
            logger.error('Failed to send scheduled email', {
              error: emailError instanceof Error ? emailError.message : String(emailError),
              emailId: email.id,
              emailType: email.emailType,
            });
            failedEmailIds.push(email.id);
            failed++;
          }
        });

        // Wait for all emails in this batch to complete
        await Promise.allSettled(promises);
      }

      // OPTIMIZATION 4: Bulk update database status (reduces DB calls by 90%)
      if (successfulEmailIds.length > 0) {
        const now = new Date();
        await db
          .update(scheduledEmails)
          .set({
            status: 'sent',
            sentAt: now,
            updatedAt: now,
          })
          .where(scheduledEmails.id.in(successfulEmailIds));
      }

      if (failedEmailIds.length > 0) {
        const now = new Date();
        await db
          .update(scheduledEmails)
          .set({
            status: 'failed',
            failedAt: now,
            updatedAt: now,
            errorMessage: 'Email sending failed',
          })
          .where(scheduledEmails.id.in(failedEmailIds));
      }

      logger.info('Processed scheduled emails', {
        processed,
        failed,
        total: emailsToSend.length,
        batchSize: emailsToSend.length,
        concurrentLimit: CONCURRENT_LIMIT,
      });

      return { processed, failed };
    } catch (error) {
      logger.error('Failed to process scheduled emails', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { processed: 0, failed: 0 };
    }
  }

  /**
   * Send a booking reminder email
   */
  private async sendBookingReminderEmail(email: any): Promise<void> {
    const {emailData} = email;

    // Get booking details for the reminder
    const db = getDb();
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, email.bookingId))
      .limit(1);

    if (!booking) {
      throw new Error(`Booking not found: ${email.bookingId}`);
    }

    // Don't send reminders for cancelled bookings
    if (booking.status === 'cancelled') {
      logger.info('Skipping reminder for cancelled booking', { bookingId: email.bookingId });
      return;
    }

    await emailService.sendBookingReminder({
      guestName: emailData.guestName,
      guestEmail: email.recipientEmail,
      hotelName: emailData.hotelName,
      hotelAddress: '123 Luxury Ave, Test City', // This should come from hotel data
      roomType: booking.roomType || 'Standard Room',
      checkIn: emailData.checkIn,
      checkOut: booking.checkOut?.toISOString().split('T')[0] || '',
      confirmationNumber: emailData.confirmationNumber,
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      specialInstructions: 'Please bring valid ID for check-in',
      contactInfo: {
        phone: '+1-555-HOTEL',
        email: 'concierge@luxuryhotel.com',
      },
    });
  }

  /**
   * Send a booking modification notification email
   */
  private async sendBookingModificationEmail(email: any): Promise<void> {
    const {emailData} = email;

    // Get booking details for the modification notification
    const db = getDb();
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, email.bookingId))
      .limit(1);

    if (!booking) {
      throw new Error(`Booking not found: ${email.bookingId}`);
    }

    await emailService.sendBookingModification({
      guestName: emailData.guestName,
      guestEmail: email.recipientEmail,
      confirmationNumber: emailData.confirmationNumber,
      hotelName: booking.hotelName || 'Hotel',
      modificationType: emailData.modificationType,
      originalDetails: {
        checkIn: booking.checkIn?.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut?.toISOString().split('T')[0] || '',
        nights: booking.nights || 1,
      },
      newDetails: {
        checkIn: booking.checkIn?.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut?.toISOString().split('T')[0] || '',
        nights: booking.nights || 1,
      },
      modifiedAt: new Date(),
      modifiedBy: 'guest',
      reason: 'Booking modification requested',
      priceAdjustment: 0,
    });
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();