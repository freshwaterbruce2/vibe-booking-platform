import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface EmailVerificationToken {
  userId: string;
  email: string;
  type: 'email_verification' | 'password_reset';
  expires: Date;
}

export const generateEmailVerificationToken = (userId: string, email: string): string => {
  const payload: EmailVerificationToken = {
    userId,
    email,
    type: 'email_verification',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
  
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '24h' });
};

export const generatePasswordResetToken = (userId: string, email: string): string => {
  const payload: EmailVerificationToken = {
    userId,
    email,
    type: 'password_reset',
    expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
  };
  
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '2h' });
};

export const verifyEmailToken = (token: string): EmailVerificationToken => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as EmailVerificationToken;
    
    // Check if token is expired
    if (new Date() > new Date(decoded.expires)) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};