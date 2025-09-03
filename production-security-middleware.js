import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * CRITICAL CSP FIX - Security middleware for Square payments
 * Updated: 2025-08-29T00:39:20.419Z
 */
export const securityMiddleware = [
  // Helmet WITHOUT CSP (to prevent meta tag injection)
  helmet({
    contentSecurityPolicy: false, // Disabled to prevent meta tag injection
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),

  // Custom CSP middleware (HTTP headers only)
  (req: Request, res: Response, next: NextFunction) => {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.squareup.com https://connect.squareup.com https://web.squarecdn.com https://sandbox.web.squarecdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: https://images.unsplash.com",
      "connect-src 'self' https://api.liteapi.travel https://connect.squareup.com wss://localhost:*",
      "frame-src 'self' https://js.squareup.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ];
    
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  },
];