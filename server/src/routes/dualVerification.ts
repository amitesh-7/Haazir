/**
 * Dual Verification Routes
 * Routes for RetinaFace-based dual verification system
 *
 * Base path: /api/smart-attendance/dual-verify
 */

import express from "express";
import {
  selfVerifyWithRetinaFace,
  verifyClassPhotoWithRetinaFace,
  getDualVerificationStatus,
  manualOverride,
  checkRetinaFaceHealth,
} from "../controllers/dualVerificationController";
import authMiddleware from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Health Check
 */

// Check RetinaFace API health
// GET /api/smart-attendance/dual-verify/health
router.get("/health", checkRetinaFaceHealth);

/**
 * Student Routes
 */

// Student self-verification with RetinaFace
// POST /api/smart-attendance/dual-verify/self-verify
// Body: { sessionId: string, studentId: number, imageBase64: string }
router.post("/self-verify", selfVerifyWithRetinaFace);

/**
 * Teacher Routes
 */

// Verify class photo with RetinaFace
// POST /api/smart-attendance/dual-verify/class-photo
// Body: { sessionId: string, imageBase64: string }
router.post("/class-photo", verifyClassPhotoWithRetinaFace);

// Get dual verification status for a session
// GET /api/smart-attendance/dual-verify/status/:sessionId
router.get("/status/:sessionId", getDualVerificationStatus);

// Manual override for suspicious attendance
// POST /api/smart-attendance/dual-verify/override
// Body: { sessionId: string, studentId: number, status: 'verified' | 'rejected', reason: string }
router.post("/override", manualOverride);

export default router;
