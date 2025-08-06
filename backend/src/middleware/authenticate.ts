import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isAdmin: boolean;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'No valid authentication token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid or expired token',
      });
    }

    // Get user from database to ensure they still exist and are active
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Account has been deactivated',
      });
    }

    // Check token version (for logout all functionality)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Token has been invalidated',
      });
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.role === 'admin' || user.role === 'super_admin',
    };

    next();

  } catch (error) {
    logger.error('Authentication middleware error', { error });
    res.status(500).json({
      error: 'Authentication Error',
      message: 'Authentication failed',
    });
  }
};

// Optional authentication - continues even if no token provided
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded: any = jwt.verify(token, config.jwt.secret);

      const db = getDb();
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          tokenVersion: users.tokenVersion,
        })
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (user && user.isActive && 
          (decoded.tokenVersion === undefined || decoded.tokenVersion === (user.tokenVersion || 0))) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isAdmin: user.role === 'admin' || user.role === 'super_admin',
        };
      }
    } catch (jwtError) {
      // Invalid token, but continue without authentication
    }

    next();

  } catch (error) {
    logger.error('Optional authentication middleware error', { error });
    next(); // Continue even on error
  }
};

// Admin role required
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Authentication required',
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Authorization Error',
      message: 'Admin access required',
    });
  }

  next();
};

// Role-based authorization
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Authorization Error',
        message: `One of the following roles is required: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

// Rate limiting based on user ID
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip; // Fallback to IP for unauthenticated users
    const now = Date.now();
    
    let userData = userRequests.get(userId);
    
    if (!userData || now > userData.resetTime) {
      userData = {
        count: 1,
        resetTime: now + windowMs,
      };
      userRequests.set(userId, userData);
      return next();
    }
    
    if (userData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000),
      });
    }
    
    userData.count++;
    next();
  };
};