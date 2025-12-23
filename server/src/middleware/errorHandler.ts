/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log the error
  logger.error(`Error in ${req.method} ${req.path}`, err);

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = (err as any).errors?.map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired. Please login again.',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Handle Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      stack: isProduction ? undefined : err.stack,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};

/**
 * 404 Not Found handler
 * Must be registered after all routes but before error handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: { timestamp: new Date().toISOString() },
  });
};

export default { errorHandler, notFoundHandler };
