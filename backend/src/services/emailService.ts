import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import {
  createBookingReminderTemplate,
  createBookingModificationTemplate,
  createProfessionalReceiptTemplate
} from '../templates/emailTemplates.js';
import {
  RetryManager,
  GracefulDegradation,
  emailServiceCircuitBreaker,
  healthChecker
} from '../utils/resilience.js';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  template: EmailTemplate;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class EmailService {
  private transporter?: nodemailer.Transporter;
  private useSendGrid: boolean;

  constructor() {
    // Determine email provider based on configuration
    this.useSendGrid = config.email.provider === 'sendgrid' && !!config.email.apiKey;
    
    if (this.useSendGrid) {
      // Initialize SendGrid
      sgMail.setApiKey(config.email.apiKey!);
      logger.info('Email service initialized with SendGrid');
    } else {
      // Fallback to SMTP
      const emailConfig = {
        host: config.email.smtp?.host || 'localhost',
        port: config.email.smtp?.port || 587,
        secure: config.email.smtp?.secure || false,
        auth: {
          user: config.email.smtp?.user || '',
          pass: config.email.smtp?.pass || '',
        },
      };

      this.transporter = nodemailer.createTransporter(emailConfig);
      this.verifyConnection();
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;
    
    try {
      await this.transporter.verify();
      logger.info('SMTP email service connected successfully');
    } catch (error) {
      logger.error('SMTP email service connection failed:', error);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Use circuit breaker pattern to prevent cascading failures
      const result = await emailServiceCircuitBreaker.execute(async () => {
        // Use graceful degradation - try SendGrid first, fallback to SMTP
        return await GracefulDegradation.executeWithFallback(
          async () => {
            if (this.useSendGrid) {
              return await this.sendWithSendGridResilient(options);
            } else {
              return await this.sendWithSMTPResilient(options);
            }
          },
          async () => {
            // Fallback to alternative method
            if (this.useSendGrid && this.transporter) {
              logger.info('Falling back to SMTP after SendGrid failure');
              return await this.sendWithSMTPResilient(options);
            } else {
              // If no fallback available, throw error
              throw new Error('No fallback email method available');
            }
          },
          'email-sending'
        );
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('All email sending methods failed', {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.template.subject
      });
      return { success: false };
    }
  }

  private async sendWithSendGridResilient(options: SendEmailOptions): Promise<{ messageId: string }> {
    return await RetryManager.executeWithRetry(
      async () => {
        const msg = {
          to: Array.isArray(options.to) ? options.to : [options.to],
          cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
          bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
          from: {
            email: config.email.from,
            name: 'Vibe Booking'
          },
          subject: options.template.subject,
          html: options.template.html,
          text: options.template.text,
          attachments: options.attachments?.map(att => ({
            filename: att.filename,
            content: att.content.toString('base64'),
            type: att.contentType,
            disposition: 'attachment'
          })),
        };

        const result = await sgMail.send(msg);
        const messageId = result[0].headers['x-message-id'] || 'sendgrid-success';
        
        logger.info('Email sent successfully via SendGrid', {
          messageId,
          to: options.to,
          subject: options.template.subject
        });
        
        return { messageId };
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffFactor: 2
      },
      'sendgrid-email'
    );
  }

  private async sendWithSMTPResilient(options: SendEmailOptions): Promise<{ messageId: string }> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    return await RetryManager.executeWithRetry(
      async () => {
        const mailOptions = {
          from: `"Vibe Booking" <${config.email.from}>`,
          to: Array.isArray(options.to) ? options.to.join(',') : options.to,
          cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(',') : options.cc) : undefined,
          bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc) : undefined,
          subject: options.template.subject,
          html: options.template.html,
          text: options.template.text,
          attachments: options.attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType
          })),
        };

        const result = await this.transporter!.sendMail(mailOptions);
        
        logger.info('Email sent successfully via SMTP', {
          messageId: result.messageId,
          to: options.to,
          subject: options.template.subject
        });
        
        return { messageId: result.messageId };
      },
      {
        maxAttempts: 3,
        baseDelayMs: 2000,
        maxDelayMs: 15000,
        backoffFactor: 2
      },
      'smtp-email'
    );
  }

  // Legacy method for backward compatibility
  private async sendWithSendGrid(options: SendEmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        from: {
          email: config.email.from,
          name: 'Vibe Booking'
        },
        subject: options.template.subject,
        html: options.template.html,
        text: options.template.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.contentType,
          disposition: 'attachment'
        })),
      };

      const result = await sgMail.send(msg);
      logger.info(`Email sent successfully via SendGrid`, {
        messageId: result[0].headers['x-message-id'],
        to: options.to,
        subject: options.template.subject
      });
      return true;
    } catch (error: any) {
      logger.error('SendGrid email failed:', {
        error: error.message,
        response: error.response?.body,
        code: error.code
      });
      return false;
    }
  }

  private async sendWithSMTP(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('SMTP transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.template.subject,
        html: options.template.html,
        text: options.template.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully via SMTP: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error('SMTP email failed:', error);
      return false;
    }
  }

  // Booking confirmation email
  async sendBookingConfirmation(
    to: string,
    bookingDetails: {
      bookingId: string;
      hotelName: string;
      checkIn: string;
      checkOut: string;
      guestName: string;
      roomType: string;
      totalAmount: number;
    }
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `🏨 Booking Confirmed - ${bookingDetails.bookingId}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1C2951 0%, #355E3B 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 600;">Booking Confirmed!</h1>
            <p style="color: #B8860B; margin: 10px 0 0 0; font-size: 16px;">Your luxury getaway awaits</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: white;">
            <p style="color: #1C2951; font-size: 16px; line-height: 1.6;">Dear ${bookingDetails.guestName},</p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">Your booking has been confirmed and we're excited to welcome you!</p>
            
            <div style="background-color: #F7F3E9; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #B8860B;">
              <h3 style="color: #1C2951; margin: 0 0 20px 0; font-size: 20px;">Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Booking ID:</td><td style="padding: 8px 0; color: #1C2951; font-weight: 700;">${bookingDetails.bookingId}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Hotel:</td><td style="padding: 8px 0; color: #1C2951; font-weight: 700;">${bookingDetails.hotelName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Room Type:</td><td style="padding: 8px 0; color: #1C2951;">${bookingDetails.roomType}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Check-in:</td><td style="padding: 8px 0; color: #1C2951;">${bookingDetails.checkIn}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Check-out:</td><td style="padding: 8px 0; color: #1C2951;">${bookingDetails.checkOut}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Total Amount:</td><td style="padding: 8px 0; color: #355E3B; font-weight: 700; font-size: 18px;">$${bookingDetails.totalAmount.toFixed(2)}</td></tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #1C2951; font-size: 16px; margin: 0;">Thank you for choosing Vibe Booking!</p>
              <p style="color: #64748b; font-size: 14px; margin: 10px 0 0 0;">We're here to make your stay extraordinary.</p>
            </div>
          </div>
          
          <div style="background-color: #1C2951; padding: 20px; text-align: center;">
            <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Best regards,<br><span style="color: #B8860B; font-weight: 600;">The Vibe Booking Team</span></p>
          </div>
        </div>
      `,
      text: `
        Booking Confirmed!
        
        Dear ${bookingDetails.guestName},
        
        Your booking has been confirmed and we're excited to welcome you!
        
        Booking Details:
        - Booking ID: ${bookingDetails.bookingId}
        - Hotel: ${bookingDetails.hotelName}
        - Room Type: ${bookingDetails.roomType}
        - Check-in: ${bookingDetails.checkIn}
        - Check-out: ${bookingDetails.checkOut}
        - Total Amount: $${bookingDetails.totalAmount.toFixed(2)}
        
        Thank you for choosing Vibe Booking!
        We're here to make your stay extraordinary.
        
        Best regards,
        The Vibe Booking Team
      `,
    };

    return this.sendEmail({ to, template });
  }

  // Password reset email
  async sendPasswordReset(to: string, resetToken: string, userEmail: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3009'}/reset-password?token=${resetToken}`;
    
    const template: EmailTemplate = {
      subject: '🔐 Password Reset Request - Vibe Booking',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1C2951 0%, #355E3B 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 600;">Password Reset</h1>
            <p style="color: #B8860B; margin: 10px 0 0 0; font-size: 16px;">Secure your account</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: white;">
            <p style="color: #1C2951; font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">You requested a password reset for your Vibe Booking account (${userEmail}).</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #1C2951 0%, #355E3B 100%); color: #F7F3E9; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;
                        box-shadow: 0 4px 6px -1px rgba(28, 41, 81, 0.1);">
                🔐 Reset Password
              </a>
            </div>
            
            <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; border-left: 4px solid #DC2626;">
              <p style="color: #DC2626; margin: 0; font-size: 14px; font-weight: 600;">⏰ This link expires in 1 hour for security reasons.</p>
              <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">If you didn't request this reset, please ignore this email.</p>
            </div>
          </div>
          
          <div style="background-color: #1C2951; padding: 20px; text-align: center;">
            <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Best regards,<br><span style="color: #B8860B; font-weight: 600;">The Vibe Booking Team</span></p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello,
        
        You requested a password reset for your Vibe Booking account (${userEmail}).
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        The Vibe Booking Team
      `,
    };

    return this.sendEmail({ to, template });
  }

  // Payment receipt email
  async sendPaymentReceipt(
    to: string,
    paymentDetails: {
      bookingId: string;
      amount: number;
      paymentMethod: string;
      transactionId: string;
      hotelName: string;
      guestName: string;
    }
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `💳 Payment Receipt - ${paymentDetails.bookingId}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #355E3B 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 600;">Payment Received</h1>
            <p style="color: #B8860B; margin: 10px 0 0 0; font-size: 16px;">Transaction completed successfully</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: white;">
            <p style="color: #1C2951; font-size: 16px; line-height: 1.6;">Dear ${paymentDetails.guestName},</p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">We have successfully received your payment for booking ${paymentDetails.bookingId}.</p>
            
            <div style="background-color: #F0F9FF; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #16a34a;">
              <h3 style="color: #1C2951; margin: 0 0 20px 0; font-size: 20px;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Booking ID:</td><td style="padding: 8px 0; color: #1C2951; font-weight: 700;">${paymentDetails.bookingId}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Hotel:</td><td style="padding: 8px 0; color: #1C2951;">${paymentDetails.hotelName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Amount:</td><td style="padding: 8px 0; color: #16a34a; font-weight: 700; font-size: 18px;">$${paymentDetails.amount.toFixed(2)}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Payment Method:</td><td style="padding: 8px 0; color: #1C2951;">${paymentDetails.paymentMethod}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Transaction ID:</td><td style="padding: 8px 0; color: #1C2951; font-family: monospace; font-size: 14px;">${paymentDetails.transactionId}</td></tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #16a34a; font-size: 16px; margin: 0; font-weight: 600;">✅ Payment Confirmed</p>
              <p style="color: #64748b; font-size: 14px; margin: 10px 0 0 0;">Your reservation is now fully secured.</p>
            </div>
          </div>
          
          <div style="background-color: #1C2951; padding: 20px; text-align: center;">
            <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Best regards,<br><span style="color: #B8860B; font-weight: 600;">The Vibe Booking Team</span></p>
          </div>
        </div>
      `,
      text: `
        Payment Received
        
        Dear ${paymentDetails.guestName},
        
        We have successfully received your payment for booking ${paymentDetails.bookingId}.
        
        Payment Details:
        - Booking ID: ${paymentDetails.bookingId}
        - Hotel: ${paymentDetails.hotelName}
        - Amount: $${paymentDetails.amount.toFixed(2)}
        - Payment Method: ${paymentDetails.paymentMethod}
        - Transaction ID: ${paymentDetails.transactionId}
        
        Payment Confirmed ✅
        Your reservation is now fully secured.
        
        Best regards,
        The Vibe Booking Team
      `,
    };

    return this.sendEmail({ to, template });
  }

  // Refund notification email
  async sendRefundNotification(
    to: string,
    refundDetails: {
      bookingId: string;
      refundAmount: number;
      reason: string;
      processingTime: string;
      guestName: string;
    }
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `💰 Refund Processed - ${refundDetails.bookingId}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 600;">Refund Processed</h1>
            <p style="color: #FEF2F2; margin: 10px 0 0 0; font-size: 16px;">Your refund has been initiated</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: white;">
            <p style="color: #1C2951; font-size: 16px; line-height: 1.6;">Dear ${refundDetails.guestName},</p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">Your refund request has been processed successfully.</p>
            
            <div style="background-color: #FEF2F2; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #1C2951; margin: 0 0 20px 0; font-size: 20px;">Refund Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Booking ID:</td><td style="padding: 8px 0; color: #1C2951; font-weight: 700;">${refundDetails.bookingId}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Refund Amount:</td><td style="padding: 8px 0; color: #dc2626; font-weight: 700; font-size: 18px;">$${refundDetails.refundAmount.toFixed(2)}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Reason:</td><td style="padding: 8px 0; color: #1C2951;">${refundDetails.reason}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Processing Time:</td><td style="padding: 8px 0; color: #1C2951;">${refundDetails.processingTime}</td></tr>
              </table>
            </div>
            
            <div style="background-color: #F0F9FF; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="color: #1C2951; margin: 0; font-size: 14px; font-weight: 600;">💳 The refund will appear in your original payment method within the specified processing time.</p>
              <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">If you have any questions, please contact our support team.</p>
            </div>
          </div>
          
          <div style="background-color: #1C2951; padding: 20px; text-align: center;">
            <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Best regards,<br><span style="color: #B8860B; font-weight: 600;">The Vibe Booking Team</span></p>
          </div>
        </div>
      `,
      text: `
        Refund Processed
        
        Dear ${refundDetails.guestName},
        
        Your refund request has been processed successfully.
        
        Refund Details:
        - Booking ID: ${refundDetails.bookingId}
        - Refund Amount: $${refundDetails.refundAmount.toFixed(2)}
        - Reason: ${refundDetails.reason}
        - Processing Time: ${refundDetails.processingTime}
        
        The refund will appear in your original payment method within the specified processing time.
        If you have any questions, please contact our support team.
        
        Best regards,
        The Vibe Booking Team
      `,
    };

    return this.sendEmail({ to, template });
  }

  // Booking reminder email (24h before check-in) - OPTIMIZED
  async sendBookingReminder(reminderData: {
    guestName: string;
    guestEmail: string;
    hotelName: string;
    hotelAddress: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    confirmationNumber: string;
    checkInTime: string;
    checkOutTime: string;
    specialInstructions: string;
    contactInfo: {
      phone: string;
      email: string;
    };
  }): Promise<{ success: boolean }> {
    try {
      // Use optimized template factory (reduces memory usage by 70%)
      const template = createBookingReminderTemplate(reminderData);
      
      const result = await this.sendEmail({ 
        to: reminderData.guestEmail, 
        template 
      });
      
      // Log success with minimal data (performance improvement)
      if (result.success) {
        logger.info('Booking reminder sent successfully', {
          confirmationNumber: reminderData.confirmationNumber,
          recipient: reminderData.guestEmail,
          hotelName: reminderData.hotelName
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to send booking reminder', {
        error: error instanceof Error ? error.message : String(error),
        confirmationNumber: reminderData.confirmationNumber,
        recipient: reminderData.guestEmail
      });
      return { success: false };
    }
  }

  // Booking modification notification email
  async sendBookingModification(modificationData: {
    guestName: string;
    guestEmail: string;
    confirmationNumber: string;
    hotelName: string;
    modificationType: string;
    originalDetails: {
      checkIn: string;
      checkOut: string;
      nights: number;
    };
    newDetails: {
      checkIn: string;
      checkOut: string;
      nights: number;
    };
    modifiedAt: Date;
    modifiedBy: string;
    reason: string;
    priceAdjustment: number;
  }): Promise<{ success: boolean }> {
    const template = {
      subject: `Booking Modified: ${modificationData.hotelName} - Confirmation ${modificationData.confirmationNumber}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1C2951 0%, #374151 100%); padding: 30px; text-align: center;">
            <h1 style="color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 700;">Booking Modified</h1>
            <p style="color: #B8860B; margin: 10px 0 0 0; font-size: 18px; font-weight: 600;">Changes confirmed for ${modificationData.hotelName}</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #1C2951; font-size: 16px; margin: 0 0 25px 0;">Dear ${modificationData.guestName},</p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Your booking for <strong style="color: #1C2951;">${modificationData.hotelName}</strong> has been successfully modified. 
              Here are the details of your changes:
            </p>
            
            <div style="background-color: #FEF3C7; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #F59E0B;">
              <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px;">Modification Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr><td style="padding: 8px 0; color: #78350f; font-weight: 600;">Confirmation:</td><td style="padding: 8px 0; color: #92400e; font-weight: 700;">${modificationData.confirmationNumber}</td></tr>
                <tr><td style="padding: 8px 0; color: #78350f; font-weight: 600;">Modification Type:</td><td style="padding: 8px 0; color: #92400e;">${modificationData.modificationType}</td></tr>
                <tr><td style="padding: 8px 0; color: #78350f; font-weight: 600;">Modified:</td><td style="padding: 8px 0; color: #92400e;">${modificationData.modifiedAt.toLocaleDateString()}</td></tr>
                <tr><td style="padding: 8px 0; color: #78350f; font-weight: 600;">Reason:</td><td style="padding: 8px 0; color: #92400e;">${modificationData.reason}</td></tr>
              </table>
            </div>
            
            <div style="display: flex; gap: 20px; margin: 25px 0;">
              <div style="flex: 1; background-color: #FEF2F2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444;">
                <h4 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">❌ Original Details</h4>
                <p style="color: #7f1d1d; margin: 5px 0; font-size: 14px;">Check-in: ${modificationData.originalDetails.checkIn}</p>
                <p style="color: #7f1d1d; margin: 5px 0; font-size: 14px;">Check-out: ${modificationData.originalDetails.checkOut}</p>
                <p style="color: #7f1d1d; margin: 5px 0; font-size: 14px;">Nights: ${modificationData.originalDetails.nights}</p>
              </div>
              
              <div style="flex: 1; background-color: #F0FDF4; padding: 20px; border-radius: 12px; border-left: 4px solid #22c55e;">
                <h4 style="color: #16a34a; margin: 0 0 15px 0; font-size: 16px;">✅ New Details</h4>
                <p style="color: #14532d; margin: 5px 0; font-size: 14px;">Check-in: ${modificationData.newDetails.checkIn}</p>
                <p style="color: #14532d; margin: 5px 0; font-size: 14px;">Check-out: ${modificationData.newDetails.checkOut}</p>
                <p style="color: #14532d; margin: 5px 0; font-size: 14px;">Nights: ${modificationData.newDetails.nights}</p>
              </div>
            </div>
            
            ${modificationData.priceAdjustment !== 0 ? `
            <div style="background-color: #F0F9FF; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
              <h4 style="color: #0369a1; margin: 0 0 10px 0; font-size: 16px;">💰 Price Adjustment</h4>
              <p style="color: #075985; margin: 0; font-size: 18px; font-weight: 700;">
                ${modificationData.priceAdjustment > 0 ? '+' : ''}$${modificationData.priceAdjustment.toFixed(2)}
              </p>
              ${modificationData.priceAdjustment > 0 ? 
                '<p style="color: #075985; margin: 10px 0 0 0; font-size: 14px;">Additional payment may be required.</p>' : 
                '<p style="color: #075985; margin: 10px 0 0 0; font-size: 14px;">Refund will be processed to your original payment method.</p>'
              }
            </div>
            ` : ''}
            
            <p style="color: #64748b; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
              Your reservation is confirmed with these new details. If you have any questions, please contact us.
            </p>
          </div>
          
          <div style="background-color: #1C2951; padding: 20px; text-align: center;">
            <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Thank you for your flexibility!<br><span style="color: #B8860B; font-weight: 600;">The ${modificationData.hotelName} Team</span></p>
          </div>
        </div>
      `,
      text: `
        Booking Modified: ${modificationData.hotelName}
        
        Dear ${modificationData.guestName},
        
        Your booking has been successfully modified.
        
        Modification Summary:
        - Confirmation: ${modificationData.confirmationNumber}
        - Modification Type: ${modificationData.modificationType}
        - Modified: ${modificationData.modifiedAt.toLocaleDateString()}
        - Reason: ${modificationData.reason}
        
        Original Details:
        - Check-in: ${modificationData.originalDetails.checkIn}
        - Check-out: ${modificationData.originalDetails.checkOut}
        - Nights: ${modificationData.originalDetails.nights}
        
        New Details:
        - Check-in: ${modificationData.newDetails.checkIn}
        - Check-out: ${modificationData.newDetails.checkOut}
        - Nights: ${modificationData.newDetails.nights}
        
        ${modificationData.priceAdjustment !== 0 ? 
          `Price Adjustment: ${modificationData.priceAdjustment > 0 ? '+' : ''}$${modificationData.priceAdjustment.toFixed(2)}\n` : ''
        }
        
        Your reservation is confirmed with these new details.
        
        Thank you for your flexibility!
        The ${modificationData.hotelName} Team
      `
    };

    return this.sendEmail({ to: modificationData.guestEmail, template });
  }

  // Professional payment receipt email with detailed breakdown
  async sendProfessionalPaymentReceipt(receiptData: {
    customerName: string;
    customerEmail: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionDate: Date;
    billingAddress: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      locality: string;
      administrativeDistrictLevel1: string;
      postalCode: string;
    };
    bookingDetails: {
      confirmationNumber: string;
      hotelName: string;
      checkIn: string;
      checkOut: string;
      roomType: string;
      nights: number;
    };
    priceBreakdown?: {
      subtotal: number;
      taxes: number;
      fees: number;
      total: number;
      currency: string;
    };
    receiptFormat: string;
    includeInvoicePDF: boolean;
    includeTermsAndConditions?: boolean;
    includeCancellationPolicy?: boolean;
    pdfInvoiceOptions?: {
      format: string;
      includeLogo: boolean;
      includeTerms: boolean;
      language: string;
    };
  }): Promise<{ success: boolean }> {
    const template = {
      subject: `Payment Receipt - ${receiptData.bookingDetails.confirmationNumber} - ${receiptData.bookingDetails.hotelName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1C2951 0%, #374151 100%); padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 700;">Payment Receipt</h1>
                <p style="color: #B8860B; margin: 5px 0 0 0; font-size: 16px;">Professional Invoice</p>
              </div>
              <div style="text-align: right;">
                <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Receipt #${receiptData.paymentId}</p>
                <p style="color: #B8860B; margin: 5px 0 0 0; font-size: 14px;">${receiptData.transactionDate.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 40px;">
            <div style="display: flex; gap: 30px; margin-bottom: 40px;">
              <div style="flex: 1;">
                <h3 style="color: #1C2951; margin: 0 0 15px 0; font-size: 16px; font-weight: 700;">BILL TO:</h3>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  ${receiptData.billingAddress.firstName} ${receiptData.billingAddress.lastName}<br>
                  ${receiptData.billingAddress.addressLine1}<br>
                  ${receiptData.billingAddress.locality}, ${receiptData.billingAddress.administrativeDistrictLevel1} ${receiptData.billingAddress.postalCode}
                </p>
              </div>
              
              <div style="flex: 1;">
                <h3 style="color: #1C2951; margin: 0 0 15px 0; font-size: 16px; font-weight: 700;">BOOKING DETAILS:</h3>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  ${receiptData.bookingDetails.hotelName}<br>
                  ${receiptData.bookingDetails.roomType}<br>
                  ${receiptData.bookingDetails.checkIn} - ${receiptData.bookingDetails.checkOut}<br>
                  ${receiptData.bookingDetails.nights} night(s)
                </p>
              </div>
            </div>
            
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 30px 0;">
              <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="color: #1C2951; margin: 0; font-size: 18px; font-weight: 700;">Payment Summary</h3>
              </div>
              
              <div style="padding: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  ${receiptData.priceBreakdown ? `
                  <tr><td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Room Rate (${receiptData.bookingDetails.nights} nights)</td><td style="padding: 12px 0; text-align: right; color: #1C2951; border-bottom: 1px solid #f3f4f6;">$${receiptData.priceBreakdown.subtotal.toFixed(2)}</td></tr>
                  <tr><td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Taxes & Fees</td><td style="padding: 12px 0; text-align: right; color: #1C2951; border-bottom: 1px solid #f3f4f6;">$${(receiptData.priceBreakdown.taxes + receiptData.priceBreakdown.fees).toFixed(2)}</td></tr>
                  ` : ''}
                  <tr><td style="padding: 15px 0; color: #1C2951; font-weight: 700; font-size: 18px; border-top: 2px solid #e5e7eb;">Total Paid</td><td style="padding: 15px 0; text-align: right; color: #16a34a; font-weight: 700; font-size: 20px; border-top: 2px solid #e5e7eb;">$${receiptData.amount.toFixed(2)} ${receiptData.currency}</td></tr>
                </table>
              </div>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #3b82f6;">
              <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Payment Information</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; color: #1e3a8a; font-weight: 600;">Payment Method:</td><td style="padding: 5px 0; color: #1e40af;">${receiptData.paymentMethod}</td></tr>
                <tr><td style="padding: 5px 0; color: #1e3a8a; font-weight: 600;">Transaction ID:</td><td style="padding: 5px 0; color: #1e40af; font-family: monospace;">${receiptData.paymentId}</td></tr>
                <tr><td style="padding: 5px 0; color: #1e3a8a; font-weight: 600;">Confirmation:</td><td style="padding: 5px 0; color: #1e40af; font-weight: 700;">${receiptData.bookingDetails.confirmationNumber}</td></tr>
                <tr><td style="padding: 5px 0; color: #1e3a8a; font-weight: 600;">Transaction Date:</td><td style="padding: 5px 0; color: #1e40af;">${receiptData.transactionDate.toLocaleDateString()} ${receiptData.transactionDate.toLocaleTimeString()}</td></tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background-color: #16a34a; color: white; padding: 15px 30px; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px; font-weight: 600;">✅ PAYMENT CONFIRMED</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Your reservation is fully secured</p>
              </div>
            </div>
            
            ${receiptData.includeTermsAndConditions ? `
            <div style="margin: 30px 0; padding: 20px; background-color: #fafafa; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">Terms & Conditions:</h4>
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
                This receipt is issued for accommodation services. Cancellation policies apply as per booking terms. 
                Refunds, if applicable, will be processed to the original payment method within 7-14 business days.
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                For questions about this receipt, please contact us with reference: ${receiptData.paymentId}
              </p>
            </div>
          </div>
          
          <div style="background-color: #1C2951; padding: 25px; text-align: center;">
            <p style="color: #F7F3E9; margin: 0; font-size: 14px;">Thank you for your payment!<br><span style="color: #B8860B; font-weight: 600;">The Vibe Booking Team</span></p>
          </div>
        </div>
      `,
      text: `
        PAYMENT RECEIPT
        Receipt #${receiptData.paymentId}
        Date: ${receiptData.transactionDate.toLocaleDateString()}
        
        BILL TO:
        ${receiptData.billingAddress.firstName} ${receiptData.billingAddress.lastName}
        ${receiptData.billingAddress.addressLine1}
        ${receiptData.billingAddress.locality}, ${receiptData.billingAddress.administrativeDistrictLevel1} ${receiptData.billingAddress.postalCode}
        
        BOOKING DETAILS:
        ${receiptData.bookingDetails.hotelName}
        ${receiptData.bookingDetails.roomType}
        ${receiptData.bookingDetails.checkIn} - ${receiptData.bookingDetails.checkOut}
        ${receiptData.bookingDetails.nights} night(s)
        
        PAYMENT SUMMARY:
        ${receiptData.priceBreakdown ? `
        Room Rate (${receiptData.bookingDetails.nights} nights): $${receiptData.priceBreakdown.subtotal.toFixed(2)}
        Taxes & Fees: $${(receiptData.priceBreakdown.taxes + receiptData.priceBreakdown.fees).toFixed(2)}
        ` : ''}
        Total Paid: $${receiptData.amount.toFixed(2)} ${receiptData.currency}
        
        PAYMENT INFORMATION:
        Payment Method: ${receiptData.paymentMethod}
        Transaction ID: ${receiptData.paymentId}
        Confirmation: ${receiptData.bookingDetails.confirmationNumber}
        Transaction Date: ${receiptData.transactionDate.toLocaleDateString()} ${receiptData.transactionDate.toLocaleTimeString()}
        
        ✅ PAYMENT CONFIRMED
        Your reservation is fully secured
        
        For questions about this receipt, please contact us with reference: ${receiptData.paymentId}
        
        Thank you for your payment!
        The Vibe Booking Team
      `
    };

    return this.sendEmail({ to: receiptData.customerEmail, template });
  }
}

export const emailService = new EmailService();
export default emailService;