import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

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
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@vibebooking.com',
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.template.subject,
        html: options.template.html,
        text: options.template.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
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
      subject: `Booking Confirmed - ${bookingDetails.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Booking Confirmed!</h1>
          <p>Dear ${bookingDetails.guestName},</p>
          <p>Your booking has been confirmed. Here are your details:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
            <p><strong>Hotel:</strong> ${bookingDetails.hotelName}</p>
            <p><strong>Room Type:</strong> ${bookingDetails.roomType}</p>
            <p><strong>Check-in:</strong> ${bookingDetails.checkIn}</p>
            <p><strong>Check-out:</strong> ${bookingDetails.checkOut}</p>
            <p><strong>Total Amount:</strong> $${bookingDetails.totalAmount.toFixed(2)}</p>
          </div>
          
          <p>Thank you for choosing Vibe Booking!</p>
          <p>Best regards,<br>The Vibe Booking Team</p>
        </div>
      `,
      text: `
        Booking Confirmed!
        
        Dear ${bookingDetails.guestName},
        
        Your booking has been confirmed. Here are your details:
        
        Booking ID: ${bookingDetails.bookingId}
        Hotel: ${bookingDetails.hotelName}
        Room Type: ${bookingDetails.roomType}
        Check-in: ${bookingDetails.checkIn}
        Check-out: ${bookingDetails.checkOut}
        Total Amount: $${bookingDetails.totalAmount.toFixed(2)}
        
        Thank you for choosing Vibe Booking!
        
        Best regards,
        The Vibe Booking Team
      `,
    };

    return this.sendEmail({ to, template });
  }

  // Password reset email
  async sendPasswordReset(to: string, resetToken: string, userEmail: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const template: EmailTemplate = {
      subject: 'Password Reset Request - Vibe Booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hello,</p>
          <p>You requested a password reset for your Vibe Booking account (${userEmail}).</p>
          <p>Click the link below to reset your password:</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          
          <p>Best regards,<br>The Vibe Booking Team</p>
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
      subject: `Payment Receipt - ${paymentDetails.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Payment Received</h1>
          <p>Dear ${paymentDetails.guestName},</p>
          <p>We have successfully received your payment for booking ${paymentDetails.bookingId}.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Booking ID:</strong> ${paymentDetails.bookingId}</p>
            <p><strong>Hotel:</strong> ${paymentDetails.hotelName}</p>
            <p><strong>Amount:</strong> $${paymentDetails.amount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${paymentDetails.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>
          </div>
          
          <p>Thank you for your payment!</p>
          <p>Best regards,<br>The Vibe Booking Team</p>
        </div>
      `,
      text: `
        Payment Received
        
        Dear ${paymentDetails.guestName},
        
        We have successfully received your payment for booking ${paymentDetails.bookingId}.
        
        Payment Details:
        Booking ID: ${paymentDetails.bookingId}
        Hotel: ${paymentDetails.hotelName}
        Amount: $${paymentDetails.amount.toFixed(2)}
        Payment Method: ${paymentDetails.paymentMethod}
        Transaction ID: ${paymentDetails.transactionId}
        
        Thank you for your payment!
        
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
      subject: `Refund Processed - ${refundDetails.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Refund Processed</h1>
          <p>Dear ${refundDetails.guestName},</p>
          <p>Your refund request has been processed successfully.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Refund Details</h3>
            <p><strong>Booking ID:</strong> ${refundDetails.bookingId}</p>
            <p><strong>Refund Amount:</strong> $${refundDetails.refundAmount.toFixed(2)}</p>
            <p><strong>Reason:</strong> ${refundDetails.reason}</p>
            <p><strong>Processing Time:</strong> ${refundDetails.processingTime}</p>
          </div>
          
          <p>The refund will appear in your original payment method within the specified processing time.</p>
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Vibe Booking Team</p>
        </div>
      `,
      text: `
        Refund Processed
        
        Dear ${refundDetails.guestName},
        
        Your refund request has been processed successfully.
        
        Refund Details:
        Booking ID: ${refundDetails.bookingId}
        Refund Amount: $${refundDetails.refundAmount.toFixed(2)}
        Reason: ${refundDetails.reason}
        Processing Time: ${refundDetails.processingTime}
        
        The refund will appear in your original payment method within the specified processing time.
        If you have any questions, please contact our support team.
        
        Best regards,
        The Vibe Booking Team
      `,
    };

    return this.sendEmail({ to, template });
  }
}

export const emailService = new EmailService();
export default emailService;