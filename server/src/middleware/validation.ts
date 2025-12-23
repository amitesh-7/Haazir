/**
 * Input Validation Middleware
 * Provides validation rules for all API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

/**
 * Generic validation result handler
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
  next();
};

/**
 * Create validation middleware chain
 */
export const createValidator = (validations: ValidationChain[]) => {
  return [...validations, validate];
};

// ==================== AUTH VALIDATIONS ====================

export const loginValidation = createValidator([
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]);

export const registerValidation = createValidator([
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('role')
    .isIn(['student', 'teacher', 'coordinator'])
    .withMessage('Role must be student, teacher, or coordinator'),
]);

// ==================== STUDENT VALIDATIONS ====================

export const validateStudent = createValidator([
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('roll_number')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Roll number is required'),
  body('department_id')
    .isInt({ min: 1 })
    .withMessage('Valid department ID is required'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('section_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid section ID is required'),
]);

export const validateStudentUpdate = createValidator([
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('department_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid department ID is required'),
]);

// ==================== TEACHER VALIDATIONS ====================

export const validateTeacher = createValidator([
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('department_id')
    .isInt({ min: 1 })
    .withMessage('Valid department ID is required'),
]);

// ==================== COURSE VALIDATIONS ====================

export const validateCourse = createValidator([
  body('course_code')
    .isString()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters'),
  body('course_name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Course name must be between 2 and 200 characters'),
  body('department_id')
    .isInt({ min: 1 })
    .withMessage('Valid department ID is required'),
]);

// ==================== ATTENDANCE VALIDATIONS ====================

export const validateAttendance = createValidator([
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  body('schedule_id')
    .isInt({ min: 1 })
    .withMessage('Valid schedule ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date in ISO format is required'),
  body('status')
    .isIn(['present', 'absent'])
    .withMessage('Status must be either present or absent'),
]);


// ==================== SMART ATTENDANCE VALIDATIONS ====================

export const validateFaceEnrollment = createValidator([
  body('face_descriptors')
    .isArray({ min: 3 })
    .withMessage('At least 3 face samples are required for enrollment'),
  body('face_descriptors.*')
    .isArray({ min: 128, max: 128 })
    .withMessage('Each face descriptor must be a 128-dimensional array'),
]);

export const validateQRScan = createValidator([
  body('qr_token')
    .isString()
    .notEmpty()
    .withMessage('QR token is required'),
  body('student_location')
    .optional()
    .isObject()
    .withMessage('Location must be an object with latitude and longitude'),
  body('student_location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('student_location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
]);

export const validateFaceVerification = createValidator([
  body('face_descriptor')
    .isArray({ min: 128, max: 128 })
    .withMessage('Face descriptor must be a 128-dimensional array'),
  body('session_id')
    .isString()
    .notEmpty()
    .withMessage('Session ID is required'),
]);

// ==================== TIMETABLE VALIDATIONS ====================

export const validateTimetableEntry = createValidator([
  body('course_id')
    .isInt({ min: 1 })
    .withMessage('Valid course ID is required'),
  body('teacher_id')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required'),
  body('day_of_week')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Valid day of week is required'),
  body('start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('classroom')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Classroom must be less than 50 characters'),
]);

// ==================== PAGINATION VALIDATIONS ====================

export const validatePagination = createValidator([
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
]);

// ==================== ID PARAMETER VALIDATION ====================

export const validateIdParam = createValidator([
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
]);

export default {
  validate,
  createValidator,
  loginValidation,
  registerValidation,
  validateStudent,
  validateStudentUpdate,
  validateTeacher,
  validateCourse,
  validateAttendance,
  validateFaceEnrollment,
  validateQRScan,
  validateFaceVerification,
  validateTimetableEntry,
  validatePagination,
  validateIdParam,
};
