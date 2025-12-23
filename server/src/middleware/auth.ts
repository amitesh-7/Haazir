/**
 * Authentication Middleware for Haazir API
 * Handles JWT verification and role-based access control
 */

import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload, UserRole } from '../types/auth';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    logger.debug('Auth middleware: No token provided', { path: req.path });
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access denied. No token provided.',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
    };
    
    logger.debug('Auth middleware: Token verified', { 
      email: decoded.email, 
      role: decoded.role 
    });
    
    next();
  } catch (error: any) {
    logger.debug('Auth middleware: Invalid token', { error: error.message });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token.',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
};

/**
 * Role-based access control middleware factory
 * @param allowedRoles - Array of roles that can access the route
 */
export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required.',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied: insufficient permissions', {
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Insufficient permissions.',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    next();
  };
};

// Pre-configured role middlewares
export const coordinatorOnly = roleMiddleware(['coordinator']);
export const teacherOnly = roleMiddleware(['teacher']);
export const studentOnly = roleMiddleware(['student']);
export const teacherOrCoordinator = roleMiddleware(['teacher', 'coordinator']);
export const anyAuthenticated = roleMiddleware(['student', 'teacher', 'coordinator']);

export default authMiddleware;
