import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateStudent = [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('roll_number').isString().notEmpty().withMessage('Roll number is required'),
    body('department_id').isNumeric().withMessage('Department ID must be a number'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateTeacher = [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('department_id').isNumeric().withMessage('Department ID must be a number'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateCourse = [
    body('course_code').isString().notEmpty().withMessage('Course code is required'),
    body('course_name').isString().notEmpty().withMessage('Course name is required'),
    body('department_id').isNumeric().withMessage('Department ID must be a number'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateAttendance = [
    body('student_id').isNumeric().withMessage('Student ID must be a number'),
    body('schedule_id').isNumeric().withMessage('Schedule ID must be a number'),
    body('date').isDate().withMessage('Date must be a valid date'),
    body('status').isIn(['present', 'absent']).withMessage('Status must be either present or absent'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];