/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async function to catch errors and pass them to next()
 * This eliminates the need for try-catch blocks in every controller
 * 
 * @example
 * // Before:
 * export const getStudents = async (req, res) => {
 *   try {
 *     const students = await Student.findAll();
 *     res.json(students);
 *   } catch (error) {
 *     res.status(500).json({ message: 'Error' });
 *   }
 * };
 * 
 * // After:
 * export const getStudents = asyncHandler(async (req, res) => {
 *   const students = await Student.findAll();
 *   res.json(students);
 * });
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wraps multiple middleware functions with async error handling
 */
export const asyncMiddleware = (...handlers: AsyncRequestHandler[]): RequestHandler[] => {
  return handlers.map(handler => asyncHandler(handler));
};

export default asyncHandler;
