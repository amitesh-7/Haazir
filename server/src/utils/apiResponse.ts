/**
 * Standardized API Response Utilities
 * Ensures consistent response format across all endpoints
 */

import { Response } from 'express';
import { AppError } from './errors';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponseMeta {
  timestamp: string;
  pagination?: PaginationMeta;
  requestId?: string;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta: ApiResponseMeta;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: ApiResponseMeta;
}

/**
 * Send a successful response
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  pagination?: PaginationMeta
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  if (message) response.message = message;
  if (pagination) response.meta.pagination = pagination;

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const errorResponse = (
  res: Response,
  error: AppError | Error,
  statusCode?: number
): Response => {
  const isAppError = error instanceof AppError;
  
  const response: ErrorResponse = {
    success: false,
    error: {
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: isAppError ? error.details : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  const status = statusCode || (isAppError ? error.statusCode : 500);
  return res.status(status).json(response);
};

/**
 * Send a created response (201)
 */
export const createdResponse = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): Response => {
  return successResponse(res, data, 201, message);
};

/**
 * Send a no content response (204)
 */
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Send a paginated response
 */
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit);
  return successResponse(res, data, 200, undefined, {
    page,
    limit,
    total,
    totalPages,
  });
};

export default {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
};
