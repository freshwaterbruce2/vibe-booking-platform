export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: {
    name: string;
    email: string;
  };
}

export interface EmailSender {
  name: string;
  email: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: EmailSender;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export interface EmailVerificationData {
  firstName: string;
  verificationUrl: string;
  expiresInHours: number;
}

export interface PasswordResetData {
  firstName: string;
  resetUrl: string;
  expiresInHours: number;
}

export interface BookingConfirmationData {
  firstName: string;
  lastName: string;
  bookingId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  confirmationUrl: string;
}