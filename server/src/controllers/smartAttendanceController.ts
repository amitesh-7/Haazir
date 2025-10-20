import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import {
  AttendanceSession,
  StudentFace,
  StudentScanRecord,
  TeacherClassCapture,
  DetectedClassFace,
  SmartAttendanceRecord,
  Timetable,
  Student,
  User,
  Course,
  Department,
  Section,
} from "../models";
import { Op, QueryTypes } from "sequelize";
import sequelize from "../config/database";
import NotificationService from "../services/NotificationService";

// JWT Secret for QR encryption (use env variable in production)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Constants
const QR_EXPIRY_SECONDS = 300; // QR code expires in 300 seconds (5 minutes) - increased for testing
const GRACE_PERIOD_SECONDS = 30; // Grace period for network latency and time sync (increased)
const LOCATION_RADIUS_METERS = 100000; // 100km for testing (change to 100 in production)
const FACE_MATCH_THRESHOLD = 0.6; // Cosine similarity threshold (0-1, higher is better)
const SCAN_TIMEOUT_SECONDS = 60; // Face verification timeout in 60 seconds (increased for testing)
const DISABLE_LOCATION_CHECK = true; // Set to false in production ⚠️

/**
 * Haversine formula to calculate distance between two coordinates in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate cosine similarity between two face descriptors
 */
function cosineSimilarity(
  descriptor1: number[],
  descriptor2: number[]
): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error("Descriptors must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < descriptor1.length; i++) {
    dotProduct += descriptor1[i] * descriptor2[i];
    magnitude1 += descriptor1[i] * descriptor1[i];
    magnitude2 += descriptor2[i] * descriptor2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate Euclidean distance between two face descriptors
 */
function euclideanDistance(
  descriptor1: number[],
  descriptor2: number[]
): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error("Descriptors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Generate QR code for attendance session
 * POST /api/smart-attendance/generate-qr
 * Body: { scheduleId: number, teacherId: number, locationLat: number, locationLng: number }
 */
export const generateAttendanceQR = async (req: Request, res: Response) => {
  try {
    const { scheduleId, teacherId, locationLat, locationLng, forceNew } =
      req.body;

    // Validate input
    if (
      !scheduleId ||
      !teacherId ||
      locationLat === undefined ||
      locationLng === undefined
    ) {
      return res.status(400).json({
        error:
          "scheduleId, teacherId, locationLat, and locationLng are required",
      });
    }

    // Verify schedule exists
    const schedule = await Timetable.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // First, mark any expired sessions as expired
    const expiredCount = await AttendanceSession.update(
      { status: "expired" },
      {
        where: {
          schedule_id: scheduleId,
          status: "active",
          expires_at: { [Op.lte]: new Date() },
        },
      }
    );

    console.log(
      `🧹 Marked ${expiredCount[0]} expired sessions as expired for schedule ${scheduleId}`
    );

    // If forceNew is true, expire ALL active sessions for this schedule
    if (forceNew) {
      await AttendanceSession.update(
        { status: "expired" },
        {
          where: {
            schedule_id: scheduleId,
            status: "active",
          },
        }
      );
      console.log("🔄 Force new session - expired all active sessions");
    }

    // Check if there's already an active session for this schedule
    const existingSession = await AttendanceSession.findOne({
      where: {
        schedule_id: scheduleId,
        status: "active",
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (existingSession) {
      // Return existing session with properly formatted expiry
      const expiresAtISO =
        existingSession.expires_at instanceof Date
          ? existingSession.expires_at.toISOString()
          : new Date(existingSession.expires_at).toISOString();

      console.log("♻️ Returning existing session - Expires At:", expiresAtISO);
      console.log("♻️ Current Time:", new Date().toISOString());

      return res.status(200).json({
        message: "Active session already exists",
        session: {
          sessionId: existingSession.session_id,
          scheduleId: existingSession.schedule_id,
          expiresAt: expiresAtISO,
          status: existingSession.status,
        },
        qrCode: await QRCode.toDataURL(existingSession.qr_token),
      });
    }

    // Create new session
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QR_EXPIRY_SECONDS * 1000); // seconds to milliseconds

    console.log("🕐 Current Time (Date.now()):", new Date().toISOString());
    console.log("🕐 Current Time (now):", now.toISOString());
    console.log("🕐 Expires At (calculated):", expiresAt.toISOString());
    console.log("🕐 Seconds to add:", QR_EXPIRY_SECONDS);

    // Generate JWT token with session data
    // Add extra time to JWT to ensure it doesn't expire before our validation logic
    const qrToken = jwt.sign(
      {
        sessionId,
        scheduleId,
        teacherId,
        locationLat,
        locationLng,
        expiresAt: expiresAt.toISOString(),
      },
      JWT_SECRET,
      { expiresIn: `${QR_EXPIRY_SECONDS + GRACE_PERIOD_SECONDS + 60}s` } // JWT expires after QR + grace + buffer
    );

    // Save session to database
    const session = await AttendanceSession.create({
      session_id: sessionId,
      schedule_id: scheduleId,
      teacher_id: teacherId,
      location_lat: locationLat,
      location_lng: locationLng,
      qr_token: qrToken,
      status: "active",
      expires_at: expiresAt,
    });

    console.log("💾 Saved to DB - expires_at:", session.expires_at);
    console.log("💾 Saved to DB - expires_at type:", typeof session.expires_at);
    console.log(
      "💾 Saved to DB - expires_at ISO:",
      new Date(session.expires_at).toISOString()
    );

    // Generate QR code image as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrToken);

    // Ensure expiresAt is properly formatted as ISO string
    // Use the original expiresAt we calculated, not the one from database
    const expiresAtISO = expiresAt.toISOString();

    console.log("✅ QR Generated - Expires At:", expiresAtISO);
    console.log("✅ QR Generated - Current Time:", new Date().toISOString());
    console.log(
      "✅ QR Generated - Time Difference (seconds):",
      Math.floor((new Date(expiresAtISO).getTime() - Date.now()) / 1000)
    );

    return res.status(201).json({
      message: "QR code generated successfully",
      session: {
        sessionId: session.session_id,
        scheduleId: session.schedule_id,
        expiresAt: expiresAtISO,
        status: session.status,
      },
      qrCode: qrCodeDataUrl,
      expiresIn: QR_EXPIRY_SECONDS, // in seconds
    });
  } catch (error: any) {
    console.error("Error generating QR code:", error);
    return res.status(500).json({ error: "Failed to generate QR code" });
  }
};

/**
 * Validate QR code and return session info
 * POST /api/smart-attendance/validate-qr
 * Body: { qrToken: string }
 */
export const validateQR = async (req: Request, res: Response) => {
  try {
    const { qrToken } = req.body;

    console.log("🔍 QR Validation Request Received");
    console.log("QR Token Length:", qrToken?.length || 0);

    if (!qrToken) {
      console.log("❌ No QR token provided");
      return res.status(400).json({ error: "QR token is required" });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(qrToken, JWT_SECRET);
      console.log("✅ QR Token decoded successfully:", {
        sessionId: decoded.sessionId,
        scheduleId: decoded.scheduleId,
      });
    } catch (error) {
      console.log("❌ Invalid JWT token:", error);
      return res.status(401).json({ error: "Invalid or expired QR code" });
    }

    // Extract expiry time from JWT token (always in UTC)
    const {
      sessionId,
      scheduleId,
      locationLat,
      locationLng,
      expiresAt: jwtExpiresAt,
    } = decoded;

    console.log("🔍 Looking for session:", sessionId);

    // Find session in database (without include to avoid association errors)
    const session = await AttendanceSession.findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      console.log("❌ Session not found in database");
      return res.status(404).json({ error: "Session not found" });
    }

    console.log("✅ Session found:", {
      sessionId: session.session_id,
      status: session.status,
      expiresAt: session.expires_at,
    });

    // Check if session is expired or completed
    if (session.status !== "active") {
      console.log(`❌ Session is ${session.status}`);
      return res.status(403).json({ error: `Session is ${session.status}` });
    }

    // Use JWT expiry time (UTC) instead of DB timestamp to avoid timezone issues
    const now = new Date();
    const expiresAt = new Date(jwtExpiresAt); // Use JWT token's UTC timestamp
    const graceExpiresAt = new Date(
      expiresAt.getTime() + GRACE_PERIOD_SECONDS * 1000
    );

    // Calculate time differences in seconds
    const timeSinceExpiry = (now.getTime() - expiresAt.getTime()) / 1000;
    const timeSinceGraceExpiry =
      (now.getTime() - graceExpiresAt.getTime()) / 1000;
    const timeUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000;

    console.log("⏰ Time Check:");
    console.log("  Current Time (UTC):", now.toISOString());
    console.log("  JWT Expires At (UTC):", expiresAt.toISOString());
    console.log(
      "  DB Expires At (may differ due to timezone):",
      new Date(session.expires_at).toISOString()
    );
    console.log("  Grace Expires At (UTC):", graceExpiresAt.toISOString());
    console.log("  Time Until Expiry (seconds):", timeUntilExpiry.toFixed(2));
    console.log("  Time Since Expiry (seconds):", timeSinceExpiry.toFixed(2));
    console.log(
      "  Time Since Grace Expiry (seconds):",
      timeSinceGraceExpiry.toFixed(2)
    );

    // Check if expired beyond grace period
    if (now > graceExpiresAt) {
      // Update session status
      console.log("❌ QR code expired at:", expiresAt.toISOString());
      console.log(
        "  Expired by:",
        timeSinceGraceExpiry.toFixed(2),
        "seconds (even after grace period)"
      );
      await session.update({ status: "expired" });
      return res.status(403).json({
        error: "QR code has expired",
        expiredBy: Math.floor(timeSinceGraceExpiry),
        expiresAt: expiresAt.toISOString(),
      });
    }

    // Within valid time or grace period
    if (now > expiresAt) {
      console.log("⚠️ QR code technically expired, but within grace period");
      console.log(
        "  Grace period remaining:",
        (graceExpiresAt.getTime() - now.getTime()) / 1000,
        "seconds"
      );
    } else {
      console.log("✅ QR code is still valid");
      console.log("  Time remaining:", timeUntilExpiry.toFixed(2), "seconds");
    }

    console.log("✅ QR code is valid! Sending session data...");
    console.log("Total Scans in DB:", (session as any).total_scans);
    console.log("Total Verified in DB:", (session as any).total_verified);

    return res.status(200).json({
      message: "QR code is valid",
      session: {
        sessionId: session.session_id,
        scheduleId: session.schedule_id,
        locationLat: session.location_lat,
        locationLng: session.location_lng,
        expiresAt: session.expires_at,
        scanTimeout: SCAN_TIMEOUT_SECONDS,
      },
    });
  } catch (error: any) {
    console.error("❌❌❌ FATAL ERROR validating QR code:", error);
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return res.status(500).json({
      error: "Failed to validate QR code",
      details: error.message, // Send error details to help debug
    });
  }
};

/**
 * Verify student face and create scan record
 * POST /api/smart-attendance/verify-face
 * Body: { sessionId: string, studentId: number, faceDescriptor: number[], faceImageBase64: string, locationLat: number, locationLng: number }
 */
export const verifyFace = async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      studentId,
      faceDescriptor,
      faceImageBase64,
      locationLat,
      locationLng,
    } = req.body;

    // Validate input
    if (
      !sessionId ||
      !studentId ||
      !faceDescriptor ||
      !faceImageBase64 ||
      locationLat === undefined ||
      locationLng === undefined
    ) {
      return res.status(400).json({
        error:
          "sessionId, studentId, faceDescriptor, faceImageBase64, locationLat, and locationLng are required",
      });
    }

    // Find session
    const session = await AttendanceSession.findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if session is active
    if (session.status !== "active") {
      return res
        .status(403)
        .json({ error: "Session is not active or has expired" });
    }

    // Don't check expiry time for face verification
    // QR validation already checked expiry, and face capture might take extra time
    // Just ensure session is still "active" status
    console.log("⏰ Face Verification - Session Status Check:");
    console.log("  Session ID:", session.session_id);
    console.log("  Status:", session.status);
    console.log("  ✅ Session is active, proceeding with face verification...");

    // Check if student already scanned for this session
    const existingScan = await StudentScanRecord.findOne({
      where: {
        session_id: sessionId,
        student_id: studentId,
      },
    });

    if (existingScan) {
      return res.status(409).json({
        error: "You have already scanned for this session",
        scan: existingScan,
      });
    }

    // Verify location proximity
    const distance = calculateDistance(
      locationLat,
      locationLng,
      session.location_lat || 0,
      session.location_lng || 0
    );

    // Skip location check if disabled for testing
    if (!DISABLE_LOCATION_CHECK && distance > LOCATION_RADIUS_METERS) {
      return res.status(403).json({
        error: `You are too far from the class location (${Math.round(
          distance
        )}m away, must be within ${LOCATION_RADIUS_METERS}m)`,
        distance: Math.round(distance),
      });
    }

    if (DISABLE_LOCATION_CHECK) {
      console.log(
        `⚠️ Location check disabled for testing. Distance: ${Math.round(
          distance
        )}m`
      );
    } else {
      console.log(
        `✅ Location verified. Distance: ${Math.round(
          distance
        )}m (within ${LOCATION_RADIUS_METERS}m)`
      );
    }

    // Get student's registered faces
    const registeredFaces = await StudentFace.findAll({
      where: {
        student_id: studentId,
        is_active: true,
      },
    });

    if (registeredFaces.length === 0) {
      return res.status(404).json({
        error: "No registered faces found. Please register your face first.",
      });
    }

    // Compare face with registered faces
    let maxConfidence = 0;
    let matchedFaceId: number | null = null;

    for (const registeredFace of registeredFaces) {
      const registeredDescriptor = JSON.parse(registeredFace.face_descriptor);
      const similarity = cosineSimilarity(faceDescriptor, registeredDescriptor);

      if (similarity > maxConfidence) {
        maxConfidence = similarity;
        matchedFaceId = registeredFace.face_id;
      }
    }

    // Check if face matches (above threshold)
    if (maxConfidence < FACE_MATCH_THRESHOLD) {
      // Create rejected scan record
      const scanRecord = await StudentScanRecord.create({
        session_id: sessionId,
        student_id: studentId,
        face_image_url: undefined, // Don't save rejected face
        face_descriptor: JSON.stringify(faceDescriptor),
        location_lat: locationLat,
        location_lng: locationLng,
        distance_from_class: distance,
        face_match_confidence: maxConfidence,
        status: "rejected",
      });

      return res.status(403).json({
        error: "Face verification failed. Face does not match registered face.",
        confidence: maxConfidence,
        threshold: FACE_MATCH_THRESHOLD,
        scan: scanRecord,
      });
    }

    // Face verified! Save image to storage (in production, upload to Supabase Storage)
    // For now, we'll just store a placeholder URL
    // TODO: Upload faceImageBase64 to Supabase Storage and get URL
    const faceImageUrl = `storage/attendance-images/${sessionId}/${studentId}_${Date.now()}.jpg`;

    // Create verified scan record
    const scanRecord = await StudentScanRecord.create({
      session_id: sessionId,
      student_id: studentId,
      face_image_url: faceImageUrl,
      face_descriptor: JSON.stringify(faceDescriptor),
      location_lat: locationLat,
      location_lng: locationLng,
      distance_from_class: distance,
      face_match_confidence: maxConfidence,
      status: "verified",
    });

    return res.status(201).json({
      message: "Face verified successfully!",
      scan: {
        scanId: scanRecord.scan_id,
        confidence: scanRecord.face_match_confidence,
        distance: Math.round(distance),
        status: scanRecord.status,
      },
      matchedFaceId,
    });
  } catch (error: any) {
    console.error("Error verifying face:", error);
    return res.status(500).json({ error: "Failed to verify face" });
  }
};

/**
 * Process teacher's class photo and detect faces
 * POST /api/smart-attendance/process-class-photo
 * Body: { sessionId: string, imageBase64: string, detectedFaces: Array<{ descriptor: number[], bbox: object }> }
 */
export const processClassPhoto = async (req: Request, res: Response) => {
  try {
    const { sessionId, imageBase64, detectedFaces } = req.body;

    // Validate input
    if (
      !sessionId ||
      !imageBase64 ||
      !detectedFaces ||
      !Array.isArray(detectedFaces)
    ) {
      return res.status(400).json({
        error: "sessionId, imageBase64, and detectedFaces array are required",
      });
    }

    // Find session
    const session = await AttendanceSession.findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if session is active
    if (session.status !== "active") {
      return res.status(403).json({ error: "Session is not active" });
    }

    // Save class photo (TODO: Upload to Supabase Storage in production)
    const imageUrl = `storage/attendance-images/${sessionId}/class_photo_${Date.now()}.jpg`;

    // Create capture record
    const capture = await TeacherClassCapture.create({
      session_id: sessionId,
      image_url: imageUrl,
      detected_faces_count: detectedFaces.length,
      processed: false,
    });

    // Get all registered student faces for this class
    // TODO: Filter by students enrolled in the course
    const registeredFaces = await StudentFace.findAll({
      where: { is_active: true },
      // Removed Student include - association not defined
    });

    // Match each detected face with registered faces
    const detectedFaceRecords: DetectedClassFace[] = [];
    const matchedStudentIds = new Set<number>();

    for (const detectedFace of detectedFaces) {
      const { descriptor, bbox } = detectedFace;

      let maxConfidence = 0;
      let matchedStudentId: number | undefined = undefined;

      // Compare with all registered faces
      for (const registeredFace of registeredFaces) {
        const registeredDescriptor = JSON.parse(registeredFace.face_descriptor);
        const similarity = cosineSimilarity(descriptor, registeredDescriptor);

        if (similarity > maxConfidence && similarity >= FACE_MATCH_THRESHOLD) {
          maxConfidence = similarity;
          matchedStudentId = registeredFace.student_id;
        }
      }

      // Save detected face record
      const detectedFaceRecord = await DetectedClassFace.create({
        capture_id: capture.capture_id,
        face_descriptor: JSON.stringify(descriptor),
        face_bbox: bbox as any,
        matched_student_id: matchedStudentId,
        confidence: maxConfidence,
      });

      detectedFaceRecords.push(detectedFaceRecord);

      if (matchedStudentId) {
        matchedStudentIds.add(matchedStudentId);
      }
    }

    // Update capture as processed
    await capture.update({ processed: true });

    return res.status(201).json({
      message: "Class photo processed successfully",
      capture: {
        captureId: capture.capture_id,
        detectedFacesCount: detectedFaces.length,
        matchedStudentsCount: matchedStudentIds.size,
      },
      matchedStudentIds: Array.from(matchedStudentIds),
    });
  } catch (error: any) {
    console.error("Error processing class photo:", error);
    return res.status(500).json({ error: "Failed to process class photo" });
  }
};

/**
 * Finalize attendance - cross-verify scans and class photo, mark attendance
 * POST /api/smart-attendance/finalize
 * Body: { sessionId: string, manualAdjustments?: Array<{ studentId: number, status: 'present' | 'absent' }> }
 */
export const finalizeAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId, studentStatuses } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    console.log("\n🎯 ========== FINALIZE ATTENDANCE ===========");
    console.log("📨 Received student statuses:", studentStatuses?.length || 0);
    if (studentStatuses && studentStatuses.length > 0) {
      console.log("📊 Status breakdown:");
      console.log(
        "  Present:",
        studentStatuses.filter((s: any) => s.status === "present").length
      );
      console.log(
        "  Absent:",
        studentStatuses.filter((s: any) => s.status === "absent").length
      );
    }
    console.log("==========================================\n");

    // Find session
    const session = await AttendanceSession.findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Fetch the schedule separately (no association defined)
    const schedule = await Timetable.findOne({
      where: { schedule_id: session.schedule_id },
    });

    // Check if already completed
    if (session.status === "completed") {
      return res
        .status(409)
        .json({ error: "Attendance already finalized for this session" });
    }

    // Get all verified scans for this session
    const verifiedScans = await StudentScanRecord.findAll({
      where: {
        session_id: sessionId,
        status: "verified",
      },
    });

    const scannedStudentIds = new Set(
      verifiedScans.map((scan) => scan.student_id)
    );

    // Get all students detected in class photo
    const classCaptures = await TeacherClassCapture.findAll({
      where: { session_id: sessionId, processed: true },
    });

    const detectedInPhotoStudentIds = new Set<number>();

    for (const capture of classCaptures) {
      const detectedFaces = await DetectedClassFace.findAll({
        where: {
          capture_id: capture.capture_id,
          matched_student_id: { [Op.ne]: undefined },
        },
      });

      detectedFaces.forEach((face) => {
        if (face.matched_student_id) {
          detectedInPhotoStudentIds.add(face.matched_student_id);
        }
      });
    }

    // Cross-verify: Students must be in BOTH scan records AND class photo
    const verifiedPresentStudentIds = new Set<number>();

    console.log("\n🔍 ========== CROSS-VERIFICATION ===========");
    console.log("📱 Scanned Students:", Array.from(scannedStudentIds));
    console.log("📸 Detected in Photo:", Array.from(detectedInPhotoStudentIds));

    for (const studentId of scannedStudentIds) {
      if (detectedInPhotoStudentIds.has(studentId)) {
        verifiedPresentStudentIds.add(studentId);
        console.log(`✅ Student ${studentId} verified in BOTH scan & photo`);
      } else {
        console.log(`❌ Student ${studentId} only scanned (not in photo)`);
      }
    }

    // Check for students only in photo (not scanned)
    for (const studentId of detectedInPhotoStudentIds) {
      if (!scannedStudentIds.has(studentId)) {
        console.log(`❌ Student ${studentId} only in photo (didn't scan)`);
      }
    }

    console.log(
      "✅ Verified Present Students:",
      Array.from(verifiedPresentStudentIds)
    );
    console.log("==========================================\n");

    // Get all eligible students for this timetable slot (same logic as getSessionStatus)
    let allEnrolledStudentIds: number[] = [];

    console.log("\n📚 ========== ENROLLED STUDENTS ===========");

    // Fetch timetable slot details with course and section info
    const timetableSlot = (await Timetable.findByPk(session.schedule_id, {
      include: [
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["department_id", "name"],
            },
          ],
        },
        {
          model: Section,
          as: "section",
          attributes: [
            "section_id",
            "section_name",
            "semester",
            "department_id",
          ],
        },
      ],
    })) as any;

    if (timetableSlot) {
      const studentWhere: any = {};

      console.log("🔍 Timetable Slot Details:");
      console.log("  Schedule ID:", session.schedule_id);
      console.log("  Section ID:", timetableSlot.section_id);
      console.log("  Course ID:", timetableSlot.course_id);
      console.log("  Course Department:", timetableSlot.course?.department_id);
      console.log("  Course Semester:", timetableSlot.course?.semester);

      // Match by department from course
      if (timetableSlot.course?.department_id) {
        studentWhere.department_id = timetableSlot.course.department_id;
      }

      // Match by semester from course
      if (timetableSlot.course?.semester) {
        studentWhere.semester = timetableSlot.course.semester;
      }

      // Match by section from timetable (most specific filter)
      if (timetableSlot.section_id) {
        studentWhere.section_id = timetableSlot.section_id;
      }

      console.log("🔎 Student Query Where Clause:", studentWhere);

      // Fetch all eligible students
      const allEligibleStudents = (await Student.findAll({
        where: studentWhere,
        attributes: ["student_id"],
        order: [["roll_number", "ASC"]],
      })) as any[];

      allEnrolledStudentIds = allEligibleStudents.map((s) => s.student_id);

      console.log(
        `✅ Found ${allEnrolledStudentIds.length} eligible students for this class`
      );
      console.log(
        `📋 Enrolled Student IDs:`,
        allEnrolledStudentIds.slice(0, 10),
        allEnrolledStudentIds.length > 10 ? "..." : ""
      );
    } else {
      console.log("⚠️ No timetable slot found!");
    }
    console.log("==========================================\n");

    // If no enrolled students found, fall back to students who participated
    const allStudentIds =
      allEnrolledStudentIds.length > 0
        ? new Set(allEnrolledStudentIds)
        : new Set([...scannedStudentIds, ...detectedInPhotoStudentIds]);

    // Use studentStatuses from frontend if provided, otherwise use automatic logic
    const finalStudentStatuses = new Map<number, "present" | "absent">();

    if (
      studentStatuses &&
      Array.isArray(studentStatuses) &&
      studentStatuses.length > 0
    ) {
      console.log("✅ Using student statuses from frontend");
      studentStatuses.forEach((item: any) => {
        finalStudentStatuses.set(item.studentId, item.status);
      });
    } else {
      console.log(
        "⚠️ No student statuses from frontend, using automatic cross-verification"
      );
      // Fall back to automatic cross-verification
      for (const studentId of allStudentIds) {
        const isPresent = verifiedPresentStudentIds.has(studentId);
        finalStudentStatuses.set(studentId, isPresent ? "present" : "absent");
      }
    }

    // Create attendance records
    const attendanceRecords: SmartAttendanceRecord[] = [];
    const date = new Date(); // Today's date
    let presentCountFinal = 0;
    let absentCountFinal = 0;

    for (const studentId of allStudentIds) {
      const status = finalStudentStatuses.get(studentId) || "absent";
      const verifiedByScan = scannedStudentIds.has(studentId);
      const verifiedByPhoto = detectedInPhotoStudentIds.has(studentId);

      // Check if this differs from automatic cross-verification (indicates manual adjustment)
      const automaticStatus = verifiedPresentStudentIds.has(studentId)
        ? "present"
        : "absent";
      const manuallyMarked = status !== automaticStatus;

      if (status === "present") {
        presentCountFinal++;
      } else {
        absentCountFinal++;
      }

      const record = await SmartAttendanceRecord.create({
        session_id: sessionId,
        student_id: studentId,
        schedule_id: session.schedule_id,
        date,
        status,
        verified_by_scan: verifiedByScan,
        verified_by_class_photo: verifiedByPhoto,
        manually_marked: manuallyMarked,
        notification_sent: false,
      });

      // Send notification for absent students
      if (status === "absent" && timetableSlot?.course) {
        try {
          await NotificationService.notifyAttendanceAbsent({
            studentId,
            courseName: timetableSlot.course.course_name || "Unknown Course",
            courseCode: timetableSlot.course.course_code || "N/A",
            date: date.toISOString().split("T")[0],
            timeSlot: timetableSlot.time_slot,
            attendanceId: record.record_id,
          });
          
          // Update notification_sent flag
          await record.update({ notification_sent: true });
          
          console.log(`📧 Notification sent to student ${studentId} for absence`);
        } catch (notificationError) {
          console.error(
            `❌ Failed to send notification to student ${studentId}:`,
            notificationError
          );
          // Don't throw error - notification failure shouldn't break attendance
        }
      }

      attendanceRecords.push(record);
    }

    // Update session status to completed
    await session.update({ status: "completed" });

    // Fetch student details for the response
    const studentDetails = await Student.findAll({
      where: {
        student_id: Array.from(allStudentIds),
      },
      attributes: ["student_id", "name", "roll_number"],
    });

    const studentMap = new Map(studentDetails.map((s) => [s.student_id, s]));

    console.log("\n📊 ========== FINAL SUMMARY ===========");
    console.log(`Total Students: ${allStudentIds.size}`);
    console.log(`Present (Final): ${presentCountFinal}`);
    console.log(`Absent (Final): ${absentCountFinal}`);
    console.log(`Scanned: ${scannedStudentIds.size}`);
    console.log(`Detected in Photo: ${detectedInPhotoStudentIds.size}`);
    console.log(
      `Cross-verified (automatic): ${verifiedPresentStudentIds.size}`
    );
    console.log(`Enrolled: ${allEnrolledStudentIds.length}`);
    console.log("==========================================\n");

    return res.status(200).json({
      message: "Attendance finalized successfully",
      summary: {
        totalStudents: allStudentIds.size,
        present: presentCountFinal, // Use actual final count
        absent: absentCountFinal, // Use actual final count
        scannedCount: scannedStudentIds.size,
        detectedInPhotoCount: detectedInPhotoStudentIds.size,
        crossVerifiedCount: verifiedPresentStudentIds.size,
        enrolledCount: allEnrolledStudentIds.length,
      },
      attendanceRecords: attendanceRecords.map((record) => {
        const student = studentMap.get(record.student_id);
        return {
          studentId: record.student_id,
          name: student?.name || "Unknown",
          rollNumber: student?.roll_number || "N/A",
          status: record.status,
          verifiedByScan: record.verified_by_scan,
          verifiedByPhoto: record.verified_by_class_photo,
          manuallyMarked: record.manually_marked,
          verificationStatus:
            record.verified_by_scan && record.verified_by_class_photo
              ? "both"
              : record.verified_by_scan
              ? "scan-only"
              : record.verified_by_class_photo
              ? "photo-only"
              : "none",
        };
      }),
    });
  } catch (error: any) {
    console.error("Error finalizing attendance:", error);
    return res.status(500).json({ error: "Failed to finalize attendance" });
  }
};

/**
 * Get session status and scanned students
 * GET /api/smart-attendance/session/:sessionId/status
 */
export const getSessionStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    console.log("\n🔍 ========== GET SESSION STATUS ===========");
    console.log("📊 Request for session ID:", sessionId);

    // Find session (don't include Timetable - association not defined)
    const session = await AttendanceSession.findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get all scans for this session
    const scans = await StudentScanRecord.findAll({
      where: { session_id: sessionId },
      // Removed include - association not defined, fetch student details separately if needed
      order: [["scan_timestamp", "DESC"]],
    });

    // Get class photo captures
    const captures = await TeacherClassCapture.findAll({
      where: { session_id: sessionId },
      order: [["capture_timestamp", "DESC"]],
    });

    // Count verified scans
    const verifiedScans = scans.filter((scan) => scan.status === "verified");

    // Check if expired based on session status (set during QR validation)
    const isExpired = session.status === "expired";

    // Fetch all eligible students for this timetable slot
    const timetableSlot = (await Timetable.findByPk(session.schedule_id, {
      include: [
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["department_id", "name"],
            },
          ],
        },
        {
          model: Section,
          as: "section",
          attributes: [
            "section_id",
            "section_name",
            "semester",
            "department_id",
          ],
        },
      ],
    })) as any;

    let allEligibleStudents: any[] = [];
    if (timetableSlot) {
      const studentWhere: any = {};

      console.log("🔍 Timetable Slot Details for Eligible Students:");
      console.log("  Schedule ID:", session.schedule_id);
      console.log("  Section ID:", timetableSlot.section_id);
      console.log("  Course ID:", timetableSlot.course_id);
      console.log("  Course Department:", timetableSlot.course?.department_id);
      console.log("  Course Semester:", timetableSlot.course?.semester);

      // Match by department from course
      if (timetableSlot.course?.department_id) {
        studentWhere.department_id = timetableSlot.course.department_id;
      }

      // Match by semester from course
      if (timetableSlot.course?.semester) {
        studentWhere.semester = timetableSlot.course.semester;
      }

      // Match by section from timetable (most specific filter)
      if (timetableSlot.section_id) {
        studentWhere.section_id = timetableSlot.section_id;
      }

      console.log("🔎 Student Query Where Clause:", studentWhere);

      allEligibleStudents = (await Student.findAll({
        where: studentWhere,
        order: [
          ["roll_number", "ASC"],
          ["name", "ASC"],
        ],
      })) as any[];

      console.log("✅ Found Eligible Students:", allEligibleStudents.length);
      if (allEligibleStudents.length > 0) {
        console.log(
          "📋 First few students:",
          allEligibleStudents.slice(0, 3).map((s) => ({
            id: s.student_id,
            name: s.name,
            roll: s.roll_number,
          }))
        );
      } else {
        console.log("⚠️ No eligible students found! Check database records.");
      }
    }

    console.log("⏰ Session Status Check:");
    console.log("  Session Status:", session.status);
    console.log("  Is Expired:", isExpired);
    console.log("  Total Scans:", scans.length);
    console.log("  Verified Scans:", verifiedScans.length);
    console.log("  Eligible Students:", allEligibleStudents.length);
    console.log(
      "  Rejected Scans:",
      scans.filter((scan) => scan.status === "rejected").length
    );
    console.log(
      "  Pending Scans:",
      scans.filter((scan) => scan.status === "pending").length
    );
    console.log("\n📤 Returning response with scans.total:", scans.length);
    console.log(
      "📤 Returning response with scans.verified:",
      verifiedScans.length
    );

    // Fetch student details for scan records
    const studentIds = scans.map((scan) => scan.student_id);
    const students = await Student.findAll({
      where: {
        student_id: studentIds,
      },
      attributes: ["student_id", "name", "roll_number"],
    });

    // Create a map for quick lookup
    const studentMap = new Map(students.map((s: any) => [s.student_id, s]));

    console.log("👥 Fetched student details for scans:", students.length);

    return res.status(200).json({
      session: {
        sessionId: session.session_id,
        scheduleId: session.schedule_id,
        status: session.status,
        expiresAt: session.expires_at,
        isExpired,
        locationLat: session.location_lat,
        locationLng: session.location_lng,
      },
      scans: {
        total: scans.length,
        verified: verifiedScans.length,
        rejected: scans.filter((scan) => scan.status === "rejected").length,
        pending: scans.filter((scan) => scan.status === "pending").length,
        records: scans.map((scan) => {
          const student = studentMap.get(scan.student_id);
          return {
            scanId: scan.scan_id,
            studentId: scan.student_id,
            studentName: student?.name || null,
            rollNumber: student?.roll_number || null,
            status: scan.status,
            confidence: scan.face_match_confidence,
            distance: Math.round(scan.distance_from_class || 0),
          };
        }),
      },
      eligibleStudents: allEligibleStudents.map((student) => ({
        studentId: student.student_id,
        studentName: student.name,
        rollNumber: student.roll_number,
      })),
      classPhotos: {
        total: captures.length,
        processed: captures.filter((c) => c.processed).length,
        records: captures.map((capture) => ({
          captureId: capture.capture_id,
          detectedFacesCount: capture.detected_faces_count,
          processed: capture.processed,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error getting session status:", error);
    return res.status(500).json({ error: "Failed to get session status" });
  }
};

/**
 * Register student's face
 * POST /api/smart-attendance/register-face
 * Body: { studentId: number, faceDescriptor: number[], imageBase64: string }
 */
export const registerStudentFace = async (req: Request, res: Response) => {
  try {
    const { studentId, faceDescriptor, imageBase64 } = req.body;

    if (!studentId || !faceDescriptor || !imageBase64) {
      return res.status(400).json({
        error: "studentId, faceDescriptor, and imageBase64 are required",
      });
    }

    // Verify student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Save image (TODO: Upload to Supabase Storage in production)
    const imageUrl = `storage/student-faces/${studentId}_${Date.now()}.jpg`;

    // Check if student already has 5 or more registered faces
    const existingFaces = await StudentFace.findAll({
      where: { student_id: studentId, is_active: true },
    });

    if (existingFaces.length >= 5) {
      return res.status(400).json({
        error:
          "Maximum 5 faces can be registered. Please delete old faces first.",
      });
    }

    // Create face record
    const faceRecord = await StudentFace.create({
      student_id: studentId,
      face_descriptor: JSON.stringify(faceDescriptor),
      image_url: imageUrl,
      is_active: true,
    });

    return res.status(201).json({
      message: "Face registered successfully",
      face: {
        faceId: faceRecord.face_id,
        studentId: faceRecord.student_id,
        registeredAt: faceRecord.registered_at,
      },
      totalRegisteredFaces: existingFaces.length + 1,
    });
  } catch (error: any) {
    console.error("Error registering face:", error);
    return res.status(500).json({ error: "Failed to register face" });
  }
};

/**
 * Get student's registered faces
 * GET /api/smart-attendance/student/:studentId/faces
 */
export const getStudentFaces = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const faces = await StudentFace.findAll({
      where: { student_id: parseInt(studentId), is_active: true },
      order: [["registered_at", "DESC"]],
    });

    return res.status(200).json({
      studentId: parseInt(studentId),
      totalFaces: faces.length,
      faces: faces.map((face) => ({
        faceId: face.face_id,
        imageUrl: face.image_url,
        registeredAt: face.registered_at,
      })),
    });
  } catch (error: any) {
    console.error("Error getting student faces:", error);
    return res.status(500).json({ error: "Failed to get student faces" });
  }
};

/**
 * Delete a registered face
 * DELETE /api/smart-attendance/face/:faceId
 */
export const deleteStudentFace = async (req: Request, res: Response) => {
  try {
    const { faceId } = req.params;

    const face = await StudentFace.findOne({ where: { face_id: faceId } });

    if (!face) {
      return res.status(404).json({ error: "Face not found" });
    }

    // Soft delete (deactivate)
    await face.update({ is_active: false });

    return res.status(200).json({
      message: "Face deleted successfully",
      faceId: face.face_id,
    });
  } catch (error: any) {
    console.error("Error deleting face:", error);
    return res.status(500).json({ error: "Failed to delete face" });
  }
};
