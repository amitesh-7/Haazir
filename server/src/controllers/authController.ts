import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Section from "../models/Section";

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
    console.log("📝 Registration request received:", {
      email,
      role,
      name,
      rollNumber,
      departmentId,
      sectionId,
      semester,
      contactNumber,
      parentName,
      parentContact,
      address
    });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log("❌ User already exists with email:", email);
      return res
        .status(400)
        .json({ 
          message: `A user with email '${email}' already exists. Please use a different email address.` 
        });
    }

    // Validate required fields
    if (!email || !password || !role) {
      console.log("❌ Missing basic required fields:", { email: !!email, password: !!password, role: !!role });
      return res
        .status(400)
        .json({ message: "Email, password, and role are required" });
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
      console.log("🎓 Creating student profile with data:", {
        name,
        rollNumber,
        departmentId,
        semester,
        sectionId
      });
      
      if (!name || !rollNumber || !departmentId || !semester) {
        console.log("❌ Missing student required fields:", {
          name: !!name,
          rollNumber: !!rollNumber,
          departmentId: !!departmentId,
          semester: !!semester
        });
        return res.status(400).json({
          message:
            "For student registration, name, rollNumber, departmentId and semester are required",
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
      
      console.log("📊 Student data to create:", studentData);
      
      await Student.create(studentData);
    } else if (role === "teacher" && name && departmentId) {
      await Teacher.create({
        user_id: newUser.user_id,
        name,
        department_id: departmentId,
      });
    }

    // Generate token
    const payload = {
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
    };
    const token = jwt.sign(payload, JWT_SECRET);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
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
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET);

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

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Logout user (client-side token invalidation)
export const logout = (req: Request, res: Response) => {
  res.json({ message: "User logged out successfully" });
};

// Get current user profile
export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId, {
      attributes: ["user_id", "email", "role"],
      include: [
        { model: Student, as: "student", required: false },
        { model: Teacher, as: "teacher", required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};

// Change password
export const changePassword = async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password_hash: hashedNewPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Error changing password",
      error: error.message,
    });
  }
};
