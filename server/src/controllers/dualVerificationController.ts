/**
 * Dual Verification Controller
 * Handles RetinaFace-based dual verification for attendance
 *
 * Flow:
 * 1. Student scans QR + takes selfie -> Self-verification (RetinaFace)
 * 2. Teacher captures class photo -> Class verification (RetinaFace)
 * 3. System matches selfie embeddings with class photo faces
 */

import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  AttendanceSession,
  StudentFace,
  StudentScanRecord,
  SmartAttendanceRecord,
  Student,
  ClassPhoto,
  ClassPhotoFace,
  VerificationLog,
} from "../models";
import { retinaFaceService, Face } from "../services/RetinaFaceService";
import {
  cosineSimilarity,
  matchFacesWithStudents,
  verifyFaceMatch,
  StudentWithEmbedding,
} from "../utils/faceMatching";

// Constants
const FACE_MATCH_THRESHOLD = 0.5; // Cosine similarity threshold for face matching

/**
 * Student self-verification using RetinaFace
 * POST /api/smart-attendance/dual-verify/self-verify
 * Body: { sessionId: string, studentId: number, imageBase64: string }
 */
export const selfVerifyWithRetinaFace = async (req: Request, res: Response) => {
  try {
    const { sessionId, studentId, imageBase64 } = req.body;

    // Validate required fields
    if (!sessionId || !studentId || !imageBase64) {
      return res.status(400).json({
        success: false,
        error: "sessionId, studentId, and imageBase64 are required",
      });
    }

    console.log(
      `🔍 Self-verification request for student ${studentId} in session ${sessionId}`
    );

    // 1. Validate session is active
    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "Session is not active",
      });
    }

    // Check session expiry
    if (new Date() > new Date(session.expires_at)) {
      return res.status(400).json({
        success: false,
        error: "Session has expired",
      });
    }

    // 2. Get student's registered face embedding
    const studentFaces = await StudentFace.findAll({
      where: {
        student_id: studentId,
        is_active: true,
      },
    });

    if (studentFaces.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Face not registered. Please complete face enrollment first.",
      });
    }

    // 3. Detect face in selfie using RetinaFace API
    console.log("📸 Calling RetinaFace API for selfie...");
    const detection = await retinaFaceService.detectSingleFace(imageBase64);

    if (!detection.success || !detection.face) {
      return res.status(400).json({
        success: false,
        error: detection.error || "Face detection failed",
      });
    }

    console.log(
      `✅ Face detected with confidence: ${detection.face.confidence}`
    );

    // 4. Compare with registered face embeddings
    let bestMatch = { similarity: 0 };
    let embeddingMismatch = false;

    for (const studentFace of studentFaces) {
      // Parse stored descriptor (stored as JSON string)
      const storedDescriptor =
        typeof studentFace.face_descriptor === "string"
          ? JSON.parse(studentFace.face_descriptor)
          : studentFace.face_descriptor;

      // Check embedding dimension - RetinaFace uses 512D, face-api.js uses 128D
      if (storedDescriptor.length !== detection.face.embedding.length) {
        console.warn(
          `⚠️ Embedding dimension mismatch: stored=${storedDescriptor.length}D, detected=${detection.face.embedding.length}D`
        );
        embeddingMismatch = true;
        continue; // Skip this face, try others
      }

      const similarity = cosineSimilarity(
        detection.face.embedding,
        storedDescriptor
      );

      if (similarity > bestMatch.similarity) {
        bestMatch = { similarity };
      }
    }

    // If all stored faces have dimension mismatch, prompt re-registration
    if (embeddingMismatch && bestMatch.similarity === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Your registered face uses an older format. Please re-register your face to use the new RetinaFace system.",
        needsReregistration: true,
      });
    }

    console.log(`📊 Best match similarity: ${bestMatch.similarity}`);

    if (bestMatch.similarity < FACE_MATCH_THRESHOLD) {
      // Log failed verification attempt
      await VerificationLog.create({
        session_id: sessionId,
        student_id: studentId,
        action: "self_verify_failed",
        match_score: bestMatch.similarity,
        metadata: {
          reason: "Face mismatch",
          confidence: detection.face.confidence,
        },
      });

      return res.status(400).json({
        success: false,
        error:
          "Face verification failed. The captured face does not match your registered face.",
        similarity: bestMatch.similarity,
      });
    }

    // 5. Get student info
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    // 6. Update or create scan record with self-verified status
    const [scanRecord, created] = await StudentScanRecord.findOrCreate({
      where: {
        session_id: sessionId,
        student_id: studentId,
      },
      defaults: {
        scan_id: uuidv4(),
        session_id: sessionId,
        student_id: studentId,
        status: "pending",
        face_verified: true,
        verification_status: "self_verified",
        face_match_score: bestMatch.similarity,
        scanned_at: new Date(),
      } as any,
    });

    if (!created) {
      // Update existing record
      await scanRecord.update({
        face_verified: true,
        verification_status: "self_verified",
        face_match_score: bestMatch.similarity,
      });
    }

    // Store the RetinaFace embedding for later matching with class photo
    // We'll store it in a JSON field for now
    await scanRecord.update({
      // Store RetinaFace embedding for class photo matching
      self_verification_embedding: JSON.stringify(detection.face.embedding),
      self_verification_confidence: detection.face.confidence,
      self_verification_bbox: JSON.stringify(detection.face.bbox),
    } as any);

    // 7. Create or update smart attendance record
    await SmartAttendanceRecord.findOrCreate({
      where: {
        session_id: sessionId,
        student_id: studentId,
      },
      defaults: {
        record_id: uuidv4(),
        session_id: sessionId,
        student_id: studentId,
        status: "self_verified",
        face_verified: true,
        face_match_score: bestMatch.similarity,
        marked_at: new Date(),
        verified_by_scan: true,
        verified_by_class_photo: false,
        manually_marked: false,
        notification_sent: false,
      } as any,
    });

    // 8. Log successful verification
    await VerificationLog.create({
      session_id: sessionId,
      student_id: studentId,
      action: "self_verify",
      old_status: "pending",
      new_status: "self_verified",
      match_score: bestMatch.similarity,
      metadata: {
        confidence: detection.face.confidence,
        bbox: detection.face.bbox,
        api: "retinaface",
      },
    });

    console.log(`✅ Self-verification successful for student ${studentId}`);

    return res.json({
      success: true,
      message:
        "Self-verification successful! Waiting for teacher verification.",
      data: {
        scanId: scanRecord.scan_id,
        status: "self_verified",
        similarity: Math.round(bestMatch.similarity * 100) + "%",
        studentName: student.name,
        confidence: detection.face.confidence,
      },
    });
  } catch (error: any) {
    console.error("❌ Self-verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Verification failed. Please try again.",
      details: error.message,
    });
  }
};

/**
 * Teacher class photo verification using RetinaFace
 * POST /api/smart-attendance/dual-verify/class-photo
 * Body: { sessionId: string, imageBase64: string }
 */
export const verifyClassPhotoWithRetinaFace = async (
  req: Request,
  res: Response
) => {
  const startTime = Date.now();

  try {
    const { sessionId, imageBase64 } = req.body;
    const teacherId = (req as any).user?.id || (req as any).user?.userId;

    // Validate required fields
    if (!sessionId || !imageBase64) {
      return res.status(400).json({
        success: false,
        error: "sessionId and imageBase64 are required",
      });
    }

    console.log(`🎓 Class photo verification for session ${sessionId}`);

    // 1. Validate session
    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    // 2. Get all self-verified students for this session
    const selfVerifiedRecords = await StudentScanRecord.findAll({
      where: {
        session_id: sessionId,
        verification_status: "self_verified",
      },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["student_id", "name", "roll_number"],
        },
      ],
    });

    if (selfVerifiedRecords.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No self-verified students to verify",
      });
    }

    console.log(
      `📋 Found ${selfVerifiedRecords.length} self-verified students`
    );

    // 3. Detect faces in class photo using RetinaFace API
    console.log("📸 Calling RetinaFace API for class photo...");
    const detection = await retinaFaceService.detectMultipleFaces(imageBase64);

    if (!detection.success) {
      return res.status(400).json({
        success: false,
        error: detection.error || "Face detection failed",
      });
    }

    if (detection.totalFaces === 0) {
      return res.status(400).json({
        success: false,
        error: "No faces detected in the class photo",
      });
    }

    console.log(`✅ Detected ${detection.totalFaces} faces in class photo`);

    // 4. Save class photo record
    const classPhoto = await ClassPhoto.create({
      id: uuidv4(),
      session_id: sessionId,
      teacher_id: teacherId,
      image_url: `class_photo_${sessionId}_${Date.now()}`, // Reference only
      total_faces_detected: detection.totalFaces,
      matched_faces: 0,
      unmatched_faces: 0,
    });

    // 5. Prepare data for matching
    const selfVerifiedStudents: StudentWithEmbedding[] = [];

    for (const record of selfVerifiedRecords) {
      // Get stored RetinaFace embedding
      const embeddingStr = (record as any).self_verification_embedding;
      if (embeddingStr) {
        const embedding =
          typeof embeddingStr === "string"
            ? JSON.parse(embeddingStr)
            : embeddingStr;

        selfVerifiedStudents.push({
          studentId: record.student_id,
          studentName:
            (record as any).student?.name || `Student ${record.student_id}`,
          embedding,
        });
      }
    }

    console.log(
      `📊 Matching ${detection.faces.length} faces with ${selfVerifiedStudents.length} students`
    );

    // 6. Match faces with students
    const matchResult = matchFacesWithStudents(
      detection.faces.map((f) => ({
        face_id: f.face_id,
        embedding: f.embedding,
      })),
      selfVerifiedStudents,
      FACE_MATCH_THRESHOLD
    );

    console.log(
      `✅ Matched ${matchResult.verified.length} students, ${matchResult.suspicious.length} suspicious`
    );

    // 7. Save face detection results
    for (const face of detection.faces) {
      const match = matchResult.verified.find((v) => v.faceId === face.face_id);

      await ClassPhotoFace.create({
        id: uuidv4(),
        class_photo_id: classPhoto.id,
        face_index: face.face_id,
        embedding: face.embedding,
        bbox: face.bbox,
        confidence: face.confidence,
        age: face.age,
        gender: face.gender,
        matched_student_id: match?.studentId,
        match_score: match?.similarity,
      });
    }

    // 8. Update attendance records
    // Mark verified students
    for (const v of matchResult.verified) {
      await StudentScanRecord.update(
        {
          verification_status: "verified",
          class_photo_match_score: v.similarity,
          class_photo_face_index: v.faceId,
        } as any,
        {
          where: {
            session_id: sessionId,
            student_id: v.studentId,
          },
        }
      );

      await SmartAttendanceRecord.update(
        { status: "verified" },
        {
          where: {
            session_id: sessionId,
            student_id: v.studentId,
          },
        }
      );

      // Log verification
      await VerificationLog.create({
        session_id: sessionId,
        student_id: v.studentId,
        action: "class_verify",
        old_status: "self_verified",
        new_status: "verified",
        match_score: v.similarity,
        performed_by: teacherId,
      });
    }

    // Mark suspicious students (self-verified but not found in class photo)
    for (const s of matchResult.suspicious) {
      await StudentScanRecord.update(
        { verification_status: "suspicious" } as any,
        {
          where: {
            session_id: sessionId,
            student_id: s.studentId,
          },
        }
      );

      await SmartAttendanceRecord.update(
        { status: "suspicious" },
        {
          where: {
            session_id: sessionId,
            student_id: s.studentId,
          },
        }
      );

      await VerificationLog.create({
        session_id: sessionId,
        student_id: s.studentId,
        action: "class_verify",
        old_status: "self_verified",
        new_status: "suspicious",
        performed_by: teacherId,
        metadata: { reason: "Not found in class photo" },
      });
    }

    // 9. Update class photo stats
    const processingTime = Date.now() - startTime;

    await classPhoto.update({
      matched_faces: matchResult.verified.length,
      unmatched_faces: matchResult.unmatched.length,
      processing_time_ms: processingTime,
    });

    // 10. Update session verification status
    await AttendanceSession.update(
      {
        verification_status: "completed",
        class_photo_id: classPhoto.id,
        verified_count: matchResult.verified.length,
        suspicious_count: matchResult.suspicious.length,
      } as any,
      { where: { session_id: sessionId } }
    );

    console.log(`✅ Class photo verification completed in ${processingTime}ms`);

    // 11. Return results
    return res.json({
      success: true,
      data: {
        classPhotoId: classPhoto.id,
        totalFacesDetected: detection.totalFaces,
        verifiedStudents: matchResult.verified.length,
        suspiciousStudents: matchResult.suspicious.length,
        unknownFaces: matchResult.unmatched.length,
        processingTimeMs: processingTime,
        verified: matchResult.verified.map((v) => ({
          studentId: v.studentId,
          studentName: v.studentName,
          similarity: Math.round(v.similarity * 100) + "%",
        })),
        suspicious: matchResult.suspicious.map((s) => ({
          studentId: s.studentId,
          studentName: s.studentName,
          reason: "Self-verified but not found in class photo",
        })),
        outputImage: detection.outputImage,
      },
    });
  } catch (error: any) {
    console.error("❌ Class photo verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Verification failed. Please try again.",
      details: error.message,
    });
  }
};

/**
 * Get dual verification status for a session
 * GET /api/smart-attendance/dual-verify/status/:sessionId
 */
export const getDualVerificationStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    // Get all attendance records for this session
    const records = await StudentScanRecord.findAll({
      where: { session_id: sessionId },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["student_id", "name", "roll_number"],
        },
      ],
      order: [["scanned_at", "DESC"]],
    });

    // Calculate stats
    const stats = {
      total: records.length,
      pending: records.filter(
        (r) => (r as any).verification_status === "pending"
      ).length,
      selfVerified: records.filter(
        (r) => (r as any).verification_status === "self_verified"
      ).length,
      verified: records.filter(
        (r) => (r as any).verification_status === "verified"
      ).length,
      suspicious: records.filter(
        (r) => (r as any).verification_status === "suspicious"
      ).length,
    };

    // Get class photo info if exists
    const classPhoto = await ClassPhoto.findOne({
      where: { session_id: sessionId },
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      data: {
        session: {
          sessionId: session.session_id,
          status: session.status,
          verificationStatus: (session as any).verification_status || "pending",
        },
        stats,
        classPhoto: classPhoto
          ? {
              id: classPhoto.id,
              totalFacesDetected: classPhoto.total_faces_detected,
              matchedFaces: classPhoto.matched_faces,
              unmatchedFaces: classPhoto.unmatched_faces,
              processingTimeMs: classPhoto.processing_time_ms,
            }
          : null,
        records: records.map((r) => ({
          studentId: r.student_id,
          studentName: (r as any).student?.name,
          rollNumber: (r as any).student?.roll_number,
          status: (r as any).verification_status,
          faceMatchScore: r.face_match_score,
          scannedAt: r.scanned_at,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error getting dual verification status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get verification status",
    });
  }
};

/**
 * Manual override for suspicious attendance
 * POST /api/smart-attendance/dual-verify/override
 * Body: { sessionId: string, studentId: number, status: 'verified' | 'rejected', reason: string }
 */
export const manualOverride = async (req: Request, res: Response) => {
  try {
    const { sessionId, studentId, status, reason } = req.body;
    const teacherId = (req as any).user?.id || (req as any).user?.userId;

    if (!sessionId || !studentId || !status || !reason) {
      return res.status(400).json({
        success: false,
        error: "sessionId, studentId, status, and reason are required",
      });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "verified" or "rejected"',
      });
    }

    // Get current record
    const record = await StudentScanRecord.findOne({
      where: { session_id: sessionId, student_id: studentId },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found",
      });
    }

    const oldStatus = (record as any).verification_status;

    // Update records
    await StudentScanRecord.update({ verification_status: status } as any, {
      where: { session_id: sessionId, student_id: studentId },
    });

    await SmartAttendanceRecord.update(
      { status },
      { where: { session_id: sessionId, student_id: studentId } }
    );

    // Log override
    await VerificationLog.create({
      session_id: sessionId,
      student_id: studentId,
      action: "manual_override",
      old_status: oldStatus,
      new_status: status,
      performed_by: teacherId,
      metadata: { reason },
    });

    return res.json({
      success: true,
      message: `Attendance ${
        status === "verified" ? "verified" : "rejected"
      } successfully`,
      data: {
        studentId,
        oldStatus,
        newStatus: status,
      },
    });
  } catch (error: any) {
    console.error("Error in manual override:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update attendance",
    });
  }
};

/**
 * Test RetinaFace API connectivity
 * GET /api/smart-attendance/dual-verify/health
 */
export const checkRetinaFaceHealth = async (req: Request, res: Response) => {
  try {
    const health = await retinaFaceService.healthCheck();

    return res.json({
      success: true,
      retinaFaceApi: {
        available: health.available,
        latency: health.latency ? `${health.latency}ms` : undefined,
        error: health.error,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Health check failed",
    });
  }
};
