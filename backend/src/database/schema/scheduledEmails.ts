import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const scheduledEmails = pgTable('scheduled_emails', {
  id: uuid('id').primaryKey(),
  bookingId: uuid('booking_id').notNull(),
  emailType: varchar('email_type', { length: 50 }).notNull(), // 'booking_reminder', 'booking_modification', etc.
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'sent', 'failed', 'cancelled'
  emailData: jsonb('email_data').notNull(), // Store email template data
  sentAt: timestamp('sent_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  retryCount: varchar('retry_count', { length: 10 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Zod schemas for validation
export const insertScheduledEmailSchema = createInsertSchema(scheduledEmails, {
  emailType: z.enum(['booking_reminder', 'booking_modification', 'payment_receipt', 'cancellation_confirmation']),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).default('pending'),
  recipientEmail: z.string().email(),
  emailData: z.record(z.any()),
});

export const selectScheduledEmailSchema = createSelectSchema(scheduledEmails);

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type NewScheduledEmail = typeof scheduledEmails.$inferInsert;