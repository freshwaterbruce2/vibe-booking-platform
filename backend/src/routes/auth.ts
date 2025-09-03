import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateRequest } from '../middleware/validateRequest';
import { logger } from '../utils/logger';
import { getDb } from '../database';
import { users, NewUser } from '../database/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import { emailService } from '../services/emailService.js';
import { generateEmailVerificationToken, verifyEmailToken } from '../utils/emailTokens.js';
import { createEmailVerificationTemplate } from '../templates/emailVerification.js';
import { createPasswordResetEmailTemplate } from '../templates/passwordResetEmail.js';

export const authRouter = Router();

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().min(5).max(20).optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(5).max(20).optional(),
});

const updatePreferencesSchema = z.object({
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
    marketing: z.boolean(),
  }),
});

const sendVerificationSchema = z.object({
  email: z.string().email(),
  resend: z.boolean().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// Helper functions
const generateTokens = (user: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(
    { id: user.id, tokenVersion: user.tokenVersion || 0 },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// POST /api/auth/register - User registration
authRouter.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const db = getDb();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({
        error: 'Registration Error',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser: NewUser = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      phone,
      role: 'user',
      emailVerified: false,
      preferences: {},
      metadata: {
        registrationIp: req.ip,
        registrationUserAgent: req.get('User-Agent'),
      },
    };

    const [createdUser] = await db.insert(users).values(newUser).returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(createdUser);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(
        createdUser.firstName,
        createdUser.lastName,
        createdUser.email
      );
      
      logger.info('Welcome email sent', { 
        userId: createdUser.id,
        email: createdUser.email 
      });
    } catch (emailError) {
      // Don't fail registration if email fails - just log the error
      logger.error('Failed to send welcome email', { 
        error: emailError,
        userId: createdUser.id,
        email: createdUser.email 
      });
    }

    logger.info('User registered successfully', {
      userId: createdUser.id,
      email: createdUser.email,
    });

    res.status(201).json({
      success: true,
      data: {
        user: createdUser,
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    logger.error('User registration failed', { error, body: req.body });
    res.status(500).json({
      error: 'Registration Error',
      message: 'Failed to create account. Please try again.',
    });
  }
});

// POST /api/auth/login - User login
authRouter.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const db = getDb();

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Your account has been deactivated',
      });
    }

    // Update last login
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        metadata: {
          ...user.metadata,
          lastLoginIp: req.ip,
          lastLoginUserAgent: req.get('User-Agent'),
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      lastLoginAt: new Date(),
    };

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      rememberMe,
    });

    res.json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    logger.error('User login failed', { error, body: req.body });
    res.status(500).json({
      error: 'Authentication Error',
      message: 'Login failed. Please try again.',
    });
  }
});

// POST /api/auth/refresh - Refresh access token
authRouter.post('/refresh', validateRequest(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid refresh token',
      });
    }

    const db = getDb();

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not found or inactive',
      });
    }

    // Check token version (for logout all functionality)
    if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Token has been invalidated',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

  } catch (error) {
    logger.error('Token refresh failed', { error });
    res.status(500).json({
      error: 'Authentication Error',
      message: 'Failed to refresh token',
    });
  }
});

// POST /api/auth/logout - Logout user
authRouter.post('/logout', async (req, res) => {
  try {
    // For JWT-based auth, logout is handled client-side by removing tokens
    // If you want to invalidate tokens server-side, you could:
    // 1. Maintain a blacklist of tokens
    // 2. Increment user's tokenVersion to invalidate all refresh tokens

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({
      error: 'Logout Error',
      message: 'Failed to logout',
    });
  }
});

// POST /api/auth/logout-all - Logout from all devices
authRouter.post('/logout-all', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not authenticated',
      });
    }

    const db = getDb();

    // Increment token version to invalidate all refresh tokens
    await db
      .update(users)
      .set({
        tokenVersion: sql`COALESCE(token_version, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info('User logged out from all devices', { userId });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
    });

  } catch (error) {
    logger.error('Logout all failed', { error });
    res.status(500).json({
      error: 'Logout Error',
      message: 'Failed to logout from all devices',
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
authRouter.post('/forgot-password', validateRequest(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const db = getDb();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.resetSecret,
      { expiresIn: '1h' }
    );

    // Update user with reset token
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Create password reset email template
    const frontendUrl = config.app.frontendUrl || 'https://vibe-booking.netlify.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const emailTemplate = createPasswordResetEmailTemplate(user.firstName || 'Valued Customer', resetUrl, 1);
    
    // Send password reset email
    await emailService.sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    logger.info('Password reset requested', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });

  } catch (error) {
    logger.error('Password reset request failed', { error });
    res.status(500).json({
      error: 'Reset Error',
      message: 'Failed to process password reset request',
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.resetSecret);
    } catch (jwtError) {
      return res.status(400).json({
        error: 'Token Expired',
        message: 'Invalid or expired reset token',
      });
    }

    const db = getDb();

    // Find user and verify token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || user.passwordResetToken !== token) {
      return res.status(400).json({
        error: 'Token Expired',
        message: 'Invalid or expired reset token',
      });
    }

    // Check if token is expired
    if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
      return res.status(400).json({
        error: 'Token Expired',
        message: 'Reset token has expired',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: sql`COALESCE(token_version, 0) + 1`, // Invalidate existing sessions
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    logger.info('Password reset completed', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error) {
    logger.error('Password reset failed', { error });
    res.status(500).json({
      error: 'Reset Error',
      message: 'Failed to reset password',
    });
  }
});

// POST /api/auth/change-password - Change password (authenticated)
authRouter.post('/change-password', validateRequest(changePasswordSchema), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not authenticated',
      });
    }

    const db = getDb();

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found',
      });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Authentication Error',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info('Password changed successfully', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    logger.error('Password change failed', { error });
    res.status(500).json({
      error: 'Change Password Error',
      message: 'Failed to change password',
    });
  }
});

// GET /api/auth/me - Get current user info
authRouter.get('/me', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not authenticated',
      });
    }

    const db = getDb();

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        emailVerified: users.emailVerified,
        preferences: users.preferences,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });

  } catch (error) {
    logger.error('Failed to get user info', { error });
    res.status(500).json({
      error: 'User Error',
      message: 'Failed to get user information',
    });
  }
});

// POST /api/auth/send-verification - Send email verification
authRouter.post('/send-verification', validateRequest(sendVerificationSchema), async (req, res) => {
  try {
    const { email, resend } = req.body;

    const db = getDb();

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found with this email address',
      });
    }

    // Check if already verified (unless resending)
    if (user.emailVerified && !resend) {
      return res.status(400).json({
        error: 'Verification Error',
        message: 'Email is already verified',
      });
    }

    // Generate verification token
    const verificationToken = generateEmailVerificationToken(user.id, user.email);
    
    // Update user with verification token
    await db
      .update(users)
      .set({
        emailVerificationToken: verificationToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Create verification URL
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailTemplate = createEmailVerificationTemplate(
      user.firstName,
      verificationUrl
    );

    await emailService.sendEmail({
      to: user.email,
      template: emailTemplate,
    });

    logger.info('Verification email sent', {
      userId: user.id,
      email: user.email,
      resend: !!resend,
    });

    res.json({
      success: true,
      message: resend ? 'Verification email resent' : 'Verification email sent',
    });

  } catch (error) {
    logger.error('Failed to send verification email', { error });
    res.status(500).json({
      error: 'Email Error',
      message: 'Failed to send verification email',
    });
  }
});

// POST /api/auth/verify-email - Verify email with token
authRouter.post('/verify-email', validateRequest(verifyEmailSchema), async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token
    let tokenData;
    try {
      tokenData = verifyEmailToken(token);
    } catch (tokenError) {
      const message = tokenError instanceof Error ? tokenError.message : 'Invalid token';
      return res.status(400).json({
        error: message.includes('expired') ? 'Token Expired' : 'Invalid Token',
        message: message.includes('expired') ? 'Verification token has expired' : 'Invalid verification token',
      });
    }

    if (tokenData.type !== 'email_verification') {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid token type',
      });
    }

    const db = getDb();

    // Find user and check token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found',
      });
    }

    // Check if token matches stored token
    if (user.emailVerificationToken !== token) {
      return res.status(400).json({
        error: 'Token Already Used',
        message: 'This verification token has already been used',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Already Verified',
        message: 'Email address is already verified',
      });
    }

    // Update user as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null, // Clear the token
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Generate new auth tokens
    const tokens = generateTokens({
      ...user,
      emailVerified: true,
    });

    logger.info('Email verified successfully', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          emailVerified: true,
        },
        accessToken: tokens.accessToken,
      },
    });

  } catch (error) {
    logger.error('Email verification failed', { error });
    res.status(500).json({
      error: 'Verification Error',
      message: 'Failed to verify email',
    });
  }
});

// PUT /api/auth/profile - Update user profile
authRouter.put('/profile', validateRequest(updateProfileSchema), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not authenticated',
      });
    }

    const db = getDb();

    // Update user profile
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info('User profile updated', {
      userId,
      updatedFields: ['firstName', 'lastName', 'phone'],
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    logger.error('Profile update failed', { error });
    res.status(500).json({
      error: 'Profile Update Error',
      message: 'Failed to update profile',
    });
  }
});

// PUT /api/auth/preferences - Update user preferences
authRouter.put('/preferences', validateRequest(updatePreferencesSchema), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { preferences } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not authenticated',
      });
    }

    const db = getDb();

    // Update user preferences
    await db
      .update(users)
      .set({
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info('User preferences updated', {
      userId,
      preferences,
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });

  } catch (error) {
    logger.error('Preferences update failed', { error });
    res.status(500).json({
      error: 'Preferences Update Error',
      message: 'Failed to update preferences',
    });
  }
});