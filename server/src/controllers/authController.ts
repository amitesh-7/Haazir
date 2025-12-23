import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Section from "../models/Section";
import logger from "../utils/logger";
import { AuthenticatedRequest, TokenPayload } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// Register a new user
export const register = async (req: Request, res: Response) => {
  const {
    email,
    password,
    role,
    name,
    rollNumber,
    departmentId,
    sectionId,
    semester,
    contactNumber,
    parentName,
    parentContact,
    address,
  } = req.body;

  try {
    logger.info("Registration request received", { email, role, name });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn("Registration failed: user already exists", { email });
      return res.status(400).json({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: `A user with email '${email}' already exists. Please use a different email address.`,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email, password, and role are required",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      email,
      password_hash: hashedPassword,
      role,
    });

    // Create role-specific profile
    if (role === "student") {
      logger.debug("Creating student profile", { name, rollNumber, departmentId, semester });

      if (!name || !rollNumber || !departmentId || !semester) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "For student registration, name, rollNumber, departmentId and semester are required",
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      const studentData = {
        user_id: newUser.user_id,
        name,
        roll_number: rollNumber,
        department_id: Number(departmentId),
        section_id: sectionId ? Number(sectionId) : null,
        semester: Number(semester),
        year: Number(semester), // Set year to same value as semester for backward compatibility
        contact_number: contactNumber ?? null,
        parent_name: parentName ?? null,
        parent_contact: parentContact ?? null,
        address: address ?? null,
      };

      await Student.create(studentData);
    } else if (role === "teacher" && name && departmentId) {
      await Teacher.create({
        user_id: newUser.user_id,
        name,
        department_id: departmentId,
      });
    }

    // Generate token
    const payload: TokenPayload = {
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role as any,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    logger.info("User registered successfully", { userId: newUser.user_id, email, role });

    res.status(201).json({
      success: true,
      data: {
        message: "User registered successfully",
        token,
        user: {
          user_id: newUser.user_id,
          email: newUser.email,
          role: newUser.role,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    logger.error("Registration error", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRATION_ERROR",
        message: "Error registering user",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Find user with associated profiles
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Student, as: "student", required: false },
        { model: Teacher, as: "teacher", required: false },
      ],
    });

    if (!user) {
      logger.warn("Login failed: user not found", { email });
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn("Login failed: invalid password", { email });
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Generate token
    const payload: TokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role as any,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    // Prepare user data
    const userData: any = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    // Add role-specific data
    if (user.role === "student" && (user as any).student) {
      userData.profile = (user as any).student;
      userData.studentId = (user as any).student.student_id;
    } else if (user.role === "teacher" && (user as any).teacher) {
      userData.profile = (user as any).teacher;
      userData.teacherId = (user as any).teacher.teacher_id;
      userData.name = (user as any).teacher.name;
    }

    logger.info("User logged in successfully", { userId: user.user_id, role: user.role });

    // Return response in both old and new format for backward compatibility
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
      data: {
        token,
        user: userData,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    logger.error("Login error", error);
    res.status(500).json({
      success: false,
      error: {
        code: "LOGIN_ERROR",
        message: "Error logging in",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
};

// Logout user (client-side token invalidation)
export const logout = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: "User logged out successfully" },
    meta: { timestamp: new Date().toISOString() },
  });
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ["user_id", "email", "role"],
      include: [
        { model: Student, as: "student", required: false },
        { model: Teacher, as: "teacher", required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    res.json({
      success: true,
      data: { user },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    logger.error("Get profile error", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PROFILE_ERROR",
        message: "Error fetching user profile",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
};

// Change password
export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Current password and new password are required",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const user = await User.findByPk(req.user?.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password_hash: hashedNewPassword });

    logger.info("Password changed successfully", { userId: user.user_id });

    res.json({
      success: true,
      data: { message: "Password changed successfully" },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    logger.error("Change password error", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PASSWORD_CHANGE_ERROR",
        message: "Error changing password",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
};
