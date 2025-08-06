import { Router } from 'express';
import { authRouter } from './auth';
import { hotelsRouter } from './hotels';
import { bookingsRouter } from './bookings';
import { paymentsRouter } from './payments';
import { usersRouter } from './users';
import { reviewsRouter } from './reviews';
import { aiRouter } from './ai';
import { adminRouter } from './admin';
import { authenticate } from '../middleware/authenticate';

export const apiRouter = Router();

// Public routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/hotels', hotelsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/reviews', reviewsRouter);

// Protected routes
apiRouter.use('/bookings', authenticate, bookingsRouter);
apiRouter.use('/payments', authenticate, paymentsRouter);
apiRouter.use('/users', authenticate, usersRouter);

// Admin routes
apiRouter.use('/admin', authenticate, adminRouter);

// API health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler for API routes
apiRouter.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist',
    path: req.originalUrl,
  });
});