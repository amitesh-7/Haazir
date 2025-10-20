import { Request, Response } from 'express';

// Utility function to send a success response
export const sendSuccessResponse = (res: Response, data: any, message: string = 'Success') => {
    res.status(200).json({
        status: 'success',
        message,
        data,
    });
};

// Utility function to send an error response
export const sendErrorResponse = (res: Response, message: string, statusCode: number = 400) => {
    res.status(statusCode).json({
        status: 'error',
        message,
    });
};

// Utility function to validate request body against a schema
export const validateRequestBody = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return sendErrorResponse(res, error.details[0].message, 422);
        }
        next();
    };
};