/**
 * Authentication Types for Haazir API
 * Provides strong typing for auth-related operations
 */

import { Request } from 'express';

export type UserRole = 'student' | 'teacher' | 'coordinator';

export interface JwtPayload {
  user_id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  user_id: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
  rollNumber?: string;
  departmentId?: number;
  sectionId?: number;
  semester?: number;
  contactNumber?: string;
  parentName?: string;
  parentContact?: string;
  address?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    user_id: number;
    email: string;
    role: UserRole;
    profile?: any;
    studentId?: number;
    teacherId?: number;
    name?: string;
  };
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role: UserRole;
}

export default {
  UserRole: ['student', 'teacher', 'coordinator'] as const,
};
