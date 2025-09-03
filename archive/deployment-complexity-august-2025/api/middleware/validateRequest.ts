import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request data using Zod schemas
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Request validation failed', {
          source,
          errors,
          data,
          path: req.path,
          method: req.method,
        });

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request data validation failed',
          details: errors,
        });
      }

      // Replace request data with validated and transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation processing failed',
      });
    }
  };
}

/**
 * Validate multiple sources in a single middleware
 */
export function validateMultiple(validations: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ source: string; field: string; message: string; code: string }> = [];

      // Validate body
      if (validations.body) {
        const result = validations.body.safeParse(req.body);
        if (!result.success) {
          errors.push(
            ...result.error.errors.map(err => ({
              source: 'body',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          );
        } else {
          req.body = result.data;
        }
      }

      // Validate query
      if (validations.query) {
        const result = validations.query.safeParse(req.query);
        if (!result.success) {
          errors.push(
            ...result.error.errors.map(err => ({
              source: 'query',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          );
        } else {
          req.query = result.data;
        }
      }

      // Validate params
      if (validations.params) {
        const result = validations.params.safeParse(req.params);
        if (!result.success) {
          errors.push(
            ...result.error.errors.map(err => ({
              source: 'params',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          );
        } else {
          req.params = result.data;
        }
      }

      if (errors.length > 0) {
        logger.warn('Multi-source validation failed', {
          errors,
          path: req.path,
          method: req.method,
        });

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request data validation failed',
          details: errors,
        });
      }

      next();
    } catch (error) {
      logger.error('Multi-validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation processing failed',
      });
    }
  };
}