import express from "express";
import {
  generateAttendanceQR,
  validateQR,
  verifyFace,
  processClassPhoto,
  finalizeAttendance,
  getSessionStatus,
  registerStudentFace,
  getStudentFaces,
  deleteStudentFace,
} from "../controllers/smartAttendanceController";
import authMiddleware from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Teacher Routes
 */

// Generate QR code for attendance session (Teacher)
router.post("/generate-qr", generateAttendanceQR);

// Process class photo captured by teacher (Teacher)
router.post("/process-class-photo", processClassPhoto);

// Finalize attendance after cross-verification (Teacher)
router.post("/finalize", finalizeAttendance);

// Get session status and scanned students (Teacher)
router.get("/session/:sessionId/status", getSessionStatus);

/**
 * Student Routes
 */

// Validate QR code (Student)
router.post("/validate-qr", validateQR);

// Verify student face after QR scan (Student)
router.post("/verify-face", verifyFace);

// Register student face (Student - one-time setup)
router.post("/register-face", registerStudentFace);

// Get student's registered faces (Student)
router.get("/student/:studentId/faces", getStudentFaces);

// Delete a registered face (Student)
router.delete("/face/:faceId", deleteStudentFace);

export default router;
