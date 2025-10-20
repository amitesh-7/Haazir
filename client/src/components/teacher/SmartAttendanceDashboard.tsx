import React, { useState, useEffect } from "react";
import {
  Camera,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";
import QRDisplay from "./QRDisplay";
import ClassPhotoCapture from "./ClassPhotoCapture";
import { useAuth } from "../../hooks/useAuth";

interface TimetableSlot {
  schedule_id: number;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom?: string;
}

interface ScannedStudent {
  scanId: string;
  studentId: number;
  studentName: string;
  rollNumber: string;
  status: "verified" | "rejected" | "pending";
  confidence: number;
  distance: number;
}

interface EligibleStudent {
  studentId: number;
  studentName: string;
  rollNumber: string;
}

interface SessionData {
  sessionId: string;
  scheduleId: number;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  qrCodeUrl?: string;
  scans: {
    total: number;
    verified: number;
    rejected: number;
    pending: number;
    records: ScannedStudent[];
  };
  eligibleStudents?: EligibleStudent[];
  classPhotos: {
    total: number;
    processed: number;
    records: any[];
  };
}

const SmartAttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const teacherId =
    user?.teacherId ||
    (user as any)?.teacher_id ||
    (user as any)?.profile?.teacher_id;

  // Debug logging
  useEffect(() => {
    console.log("🔍 Smart Attendance - User object:", user);
    console.log("🔍 Smart Attendance - Teacher ID:", teacherId);
  }, [user, teacherId]);

  const [currentStep, setCurrentStep] = useState<
    "select" | "qr" | "monitor" | "photo" | "finalize"
  >("select");
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingScheduleId, setLoadingScheduleId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [manualAdjustments, setManualAdjustments] = useState<
    Map<number, "present" | "absent">
  >(new Map());
  const [matchedStudentIds, setMatchedStudentIds] = useState<number[]>([]);
  const [finalizing, setFinalizing] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update current date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's timetable slots
  useEffect(() => {
    const fetchTimetable = async () => {
      if (!teacherId) {
        // Don't set error immediately - wait for auth to load
        if (user !== undefined && user !== null) {
          setError("Teacher ID not found. Please login again.");
        }
        return;
      }

      // Clear any previous errors
      setError("");

      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(
          `${API_URL}/timetable/teacher/${teacherId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        const rawSlots = Array.isArray(data) ? data : data.timetable || [];

        console.log("📅 Raw API response:", rawSlots);

        // Transform the API response to match the expected format
        const slots: TimetableSlot[] = rawSlots.map((slot: any) => ({
          schedule_id: slot.schedule_id,
          course_name:
            slot.course?.course_name || slot.course_name || "Unknown Course",
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          classroom: slot.classroom,
        }));

        console.log("📅 Transformed timetable slots:", slots);

        // Filter today's slots
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        console.log("📅 Today is:", today);
        console.log(
          "📅 Available days in timetable:",
          slots.map((s: any) => s.day_of_week)
        );

        // Case-insensitive comparison to handle any format differences
        const todaySlots = slots.filter(
          (slot: TimetableSlot) =>
            slot.day_of_week?.toLowerCase() === today.toLowerCase()
        );
        console.log("📅 Today's slots (filtered):", todaySlots);
        console.log(`📅 Found ${todaySlots.length} classes for ${today}`);

        setTimetableSlots(todaySlots);
      } catch (err) {
        console.error("Error fetching timetable:", err);
        setError("Failed to load timetable");
      }
    };
    fetchTimetable();
  }, [teacherId, user]);

  // Poll session status every 5 seconds when monitoring
  useEffect(() => {
    if (currentStep === "monitor" && sessionData?.sessionId) {
      const interval = setInterval(() => {
        fetchSessionStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentStep, sessionData?.sessionId]);

  const fetchSessionStatus = async () => {
    if (!sessionData?.sessionId) {
      console.log("⚠️ fetchSessionStatus: No sessionId, skipping...");
      return;
    }

    console.log(
      "🔄 fetchSessionStatus called for sessionId:",
      sessionData.sessionId
    );

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/smart-attendance/session/${sessionData.sessionId}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      console.log("📥 API Response received:", {
        sessionId: data.session?.sessionId,
        status: data.session?.status,
        scans: data.scans,
        totalScans: data.scans?.total,
        verified: data.scans?.verified,
        eligibleStudents: data.eligibleStudents,
        eligibleStudentsCount: data.eligibleStudents?.length || 0,
      });

      // Merge the response data with existing sessionData
      // API returns: { session: {...}, scans: {...}, eligibleStudents: [...], classPhotos: {...} }
      // We need to flatten it to match component's structure
      setSessionData((prev) => {
        if (!prev) return null; // Safety check

        return {
          ...prev, // Preserve existing fields like qrCodeUrl
          sessionId: data.session.sessionId || prev.sessionId,
          scheduleId: data.session.scheduleId || prev.scheduleId,
          status: data.session.status,
          expiresAt: data.session.expiresAt || prev.expiresAt,
          isExpired: data.session.isExpired,
          scans: data.scans,
          eligibleStudents:
            data.eligibleStudents || prev.eligibleStudents || [],
          classPhotos: data.classPhotos,
        };
      });

      console.log("📊 Session status updated:", {
        total: data.scans.total,
        verified: data.scans.verified,
        records: data.scans.records.length,
      });
    } catch (err) {
      console.error("Error fetching session status:", err);
    }
  };

  const handleGenerateQR = async (slot: TimetableSlot) => {
    setLoading(true);
    setLoadingScheduleId(slot.schedule_id);
    setError("");
    setSessionData(null); // Clear old session data

    console.log("🔄 Generating NEW QR code for slot:", slot);

    // Get current location
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = localStorage.getItem("token");
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const response = await fetch(
            `${API_URL}/smart-attendance/generate-qr`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                scheduleId: slot.schedule_id,
                teacherId: teacherId,
                locationLat: position.coords.latitude,
                locationLng: position.coords.longitude,
                forceNew: true, // Always create a new session
              }),
            }
          );

          const data = await response.json();

          console.log("📱 QR Generation Response:", data);
          console.log(
            "📱 Expires At (raw):",
            data.session.expiresAt || data.session.expires_at
          );
          console.log("📱 Current Time:", new Date().toISOString());

          if (!response.ok) {
            throw new Error(data.error || "Failed to generate QR code");
          }

          const expiresAt = data.session.expiresAt || data.session.expires_at;
          console.log("📱 Expires At (final):", expiresAt);
          console.log(
            "📱 Time difference (ms):",
            new Date(expiresAt).getTime() - new Date().getTime()
          );

          setSessionData({
            sessionId: data.session.sessionId || data.session.session_id,
            scheduleId: data.session.scheduleId || data.session.schedule_id,
            status: data.session.status,
            expiresAt: expiresAt,
            isExpired: false,
            qrCodeUrl: data.qrCode,
            scans: {
              total: 0,
              verified: 0,
              rejected: 0,
              pending: 0,
              records: [],
            },
            classPhotos: { total: 0, processed: 0, records: [] },
          });
          setSelectedSlot(slot);
          setCurrentStep("qr");
        } catch (err: any) {
          console.error("Error generating QR:", err);
          setError(err.message || "Failed to generate QR code");
        } finally {
          setLoading(false);
          setLoadingScheduleId(null);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Failed to get your location. Please enable location access.");
        setLoading(false);
        setLoadingScheduleId(null);
      }
    );
  };

  const handleStartMonitoring = () => {
    setCurrentStep("monitor");
    fetchSessionStatus();
  };

  const handleCapturePhoto = () => {
    setCurrentStep("photo");
  };

  const handlePhotoProcessed = (matchedIds: number[]) => {
    setMatchedStudentIds(matchedIds);
    setCurrentStep("finalize");
    fetchSessionStatus();
  };

  const handleToggleManualAttendance = (
    studentId: number,
    currentStatus: "present" | "absent"
  ) => {
    const newAdjustments = new Map(manualAdjustments);
    if (currentStatus === "present") {
      newAdjustments.set(studentId, "absent");
    } else {
      newAdjustments.set(studentId, "present");
    }
    setManualAdjustments(newAdjustments);
  };

  const handleFinalizeAttendance = async () => {
    if (!sessionData?.sessionId) return;

    setFinalizing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Calculate ALL student statuses (same logic as renderFinalizeStep)
      const scannedIds = new Set(
        sessionData?.scans.records
          .filter((s) => s.status === "verified")
          .map((s) => s.studentId) || []
      );
      const photoIds = new Set(matchedStudentIds);
      const eligibleStudents = sessionData?.eligibleStudents || [];

      // Build complete status map for ALL students
      const allStudentStatuses: Array<{
        studentId: number;
        status: "present" | "absent";
      }> = [];

      eligibleStudents.forEach((student) => {
        const scanned = scannedIds.has(student.studentId);
        const inPhoto = photoIds.has(student.studentId);
        const manualStatus = manualAdjustments.get(student.studentId);

        let status: "present" | "absent" = "absent";

        // Automatic status: present if scanned AND in photo
        if (scanned && inPhoto) {
          status = "present";
        }

        // Override with manual adjustment if exists
        if (manualStatus) {
          status = manualStatus;
        }

        allStudentStatuses.push({
          studentId: student.studentId,
          status,
        });
      });

      // Also include edge case: students who scanned but aren't in eligible list
      sessionData?.scans.records.forEach((scan) => {
        if (
          scan.status === "verified" &&
          !eligibleStudents.some((s) => s.studentId === scan.studentId)
        ) {
          const isInPhoto = photoIds.has(scan.studentId);
          const manualStatus = manualAdjustments.get(scan.studentId);

          allStudentStatuses.push({
            studentId: scan.studentId,
            status: manualStatus || (isInPhoto ? "present" : "absent"),
          });
        }
      });

      console.log("📤 Sending to finalize API:", {
        sessionId: sessionData.sessionId,
        totalStudents: allStudentStatuses.length,
        presentCount: allStudentStatuses.filter((s) => s.status === "present")
          .length,
        statuses: allStudentStatuses,
      });

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/smart-attendance/finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            studentStatuses: allStudentStatuses, // Send ALL statuses
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to finalize attendance");
      }

      setAttendanceSummary(data);
      alert(
        `Attendance finalized successfully!\n\nPresent: ${data.summary.present}/${data.summary.totalStudents}\nAbsent: ${data.summary.absent}`
      );

      // Reset to select new class
      setCurrentStep("select");
      setSessionData(null);
      setSelectedSlot(null);
      setManualAdjustments(new Map());
      setMatchedStudentIds([]);
    } catch (err: any) {
      console.error("Error finalizing attendance:", err);
      setError(err.message || "Failed to finalize attendance");
    } finally {
      setFinalizing(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "select", label: "Select Class", icon: Users },
      { key: "qr", label: "QR Code", icon: QrCode },
      { key: "monitor", label: "Monitor Scans", icon: Clock },
      { key: "photo", label: "Class Photo", icon: Camera },
      { key: "finalize", label: "Finalize", icon: CheckCircle },
    ];

    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      isActive ? "font-bold text-blue-600" : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderClassSelection = () => {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            Select Class for Smart Attendance
          </h2>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
            📅 Today: {today}
          </div>
        </div>
        {timetableSlots.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              No classes scheduled for {today}
            </p>
            <p className="text-gray-500 text-sm">
              Please check back on a day when you have classes scheduled
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timetableSlots.map((slot) => {
              const isThisSlotLoading = loadingScheduleId === slot.schedule_id;

              return (
                <div
                  key={slot.schedule_id}
                  className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg mb-2">{slot.course_name}</h3>
                  <p className="text-sm text-gray-600">
                    ⏰ {slot.start_time} - {slot.end_time}
                  </p>
                  {slot.classroom && (
                    <p className="text-sm text-gray-600">
                      📍 Room: {slot.classroom}
                    </p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateQR(slot);
                    }}
                    className={`mt-4 w-full py-2 rounded font-semibold transition-colors ${
                      isThisSlotLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                    disabled={loading}
                  >
                    {isThisSlotLoading ? "Generating..." : "Generate QR Code"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderQRStep = () => (
    <div>
      {selectedSlot && sessionData && (
        <QRDisplay
          sessionData={sessionData}
          selectedSlot={selectedSlot}
          onStartMonitoring={handleStartMonitoring}
        />
      )}
    </div>
  );

  const renderMonitorStep = () => (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Scan Monitoring</h2>
          <button
            onClick={fetchSessionStatus}
            className="text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-600">
              {sessionData?.scans?.total || 0}
            </p>
            <p className="text-sm text-gray-600">Total Scans</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-600">
              {sessionData?.scans?.verified || 0}
            </p>
            <p className="text-sm text-gray-600">Verified</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-red-600">
              {sessionData?.scans?.rejected || 0}
            </p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {sessionData?.scans?.pending || 0}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessionData?.scans?.records &&
          sessionData.scans.records.length > 0 ? (
            sessionData.scans.records.map((scan) => (
              <div
                key={scan.scanId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  scan.status === "verified"
                    ? "bg-green-50 border-l-4 border-green-500"
                    : scan.status === "rejected"
                    ? "bg-red-50 border-l-4 border-red-500"
                    : "bg-yellow-50 border-l-4 border-yellow-500"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {scan.status === "verified" ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <XCircle className="text-red-600" size={24} />
                  )}
                  <div>
                    <p className="font-semibold">{scan.studentName}</p>
                    <p className="text-sm text-gray-600">
                      Roll: {scan.rollNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    Confidence: {(scan.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    Distance: {scan.distance}m
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-semibold mb-2">No scans yet</p>
              <p className="text-sm">
                Students will appear here after they scan the QR code
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleCapturePhoto}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
        >
          <Camera size={20} />
          <span>Capture Class Photo</span>
        </button>
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div>
      {sessionData && (
        <ClassPhotoCapture
          sessionId={sessionData.sessionId}
          onPhotoProcessed={handlePhotoProcessed}
          onBack={() => setCurrentStep("monitor")}
        />
      )}
    </div>
  );

  const renderFinalizeStep = () => {
    const scannedIds = new Set(
      sessionData?.scans.records
        .filter((s) => s.status === "verified")
        .map((s) => s.studentId) || []
    );
    const photoIds = new Set(matchedStudentIds);
    const crossVerifiedIds = new Set(
      Array.from(scannedIds).filter((id) => photoIds.has(id))
    );

    // Determine final status for each student
    const studentStatuses = new Map<
      number,
      {
        name: string;
        roll: string;
        status: "present" | "absent";
        reason: string;
      }
    >();

    // First, process all eligible students from the class roster
    const eligibleStudents = sessionData?.eligibleStudents || [];

    console.log("🎓 Finalize Step - Eligible Students:", eligibleStudents);
    console.log("📊 Scanned IDs:", Array.from(scannedIds));
    console.log("📷 Photo IDs:", Array.from(photoIds));
    console.log("✅ Cross-Verified IDs:", Array.from(crossVerifiedIds));

    eligibleStudents.forEach((student) => {
      const scanned = scannedIds.has(student.studentId);
      const inPhoto = photoIds.has(student.studentId);
      const manualStatus = manualAdjustments.get(student.studentId);

      let status: "present" | "absent" = "absent";
      let reason = "Did not scan QR code";

      if (scanned && inPhoto) {
        status = "present";
        reason = "Verified in both scan & photo";
      } else if (scanned && !inPhoto) {
        status = "absent";
        reason = "Not detected in class photo";
      } else if (!scanned && inPhoto) {
        status = "absent";
        reason = "Did not scan QR code";
      }

      if (manualStatus) {
        status = manualStatus;
        reason = "Manually adjusted by teacher";
      }

      studentStatuses.set(student.studentId, {
        name: student.studentName,
        roll: student.rollNumber,
        status,
        reason,
      });
    });

    // Also include any students who scanned but aren't in the eligible list (edge case)
    sessionData?.scans.records.forEach((scan) => {
      if (scan.status === "verified" && !studentStatuses.has(scan.studentId)) {
        const isInPhoto = photoIds.has(scan.studentId);
        const manualStatus = manualAdjustments.get(scan.studentId);

        let status: "present" | "absent" = isInPhoto ? "present" : "absent";
        let reason = isInPhoto
          ? "Verified in both scan & photo"
          : "Not detected in class photo";

        if (manualStatus) {
          status = manualStatus;
          reason = "Manually adjusted by teacher";
        }

        studentStatuses.set(scan.studentId, {
          name: scan.studentName,
          roll: scan.rollNumber,
          status,
          reason,
        });
      }
    });

    const presentCount = Array.from(studentStatuses.values()).filter(
      (s) => s.status === "present"
    ).length;
    const absentCount = Array.from(studentStatuses.values()).filter(
      (s) => s.status === "absent"
    ).length;

    return (
      <div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Final Attendance Review</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">
                {scannedIds.size}
              </p>
              <p className="text-sm text-gray-600">Scanned QR</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-600">
                {photoIds.size}
              </p>
              <p className="text-sm text-gray-600">In Class Photo</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">
                {crossVerifiedIds.size}
              </p>
              <p className="text-sm text-gray-600">Cross-Verified</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="font-semibold text-yellow-800">
              Anti-Proxy Protection Active
            </p>
            <p className="text-sm text-yellow-700">
              Only students present in BOTH QR scan AND class photo will be
              marked present.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
            {Array.from(studentStatuses.entries()).map(([studentId, data]) => (
              <div
                key={studentId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  data.status === "present"
                    ? "bg-green-50 border-l-4 border-green-500"
                    : "bg-red-50 border-l-4 border-red-500"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {data.status === "present" ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <XCircle className="text-red-600" size={24} />
                  )}
                  <div>
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-gray-600">Roll: {data.roll}</p>
                    <p className="text-xs text-gray-500">{data.reason}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleToggleManualAttendance(studentId, data.status)
                  }
                  className={`px-4 py-2 rounded ${
                    data.status === "present"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  Mark {data.status === "present" ? "Absent" : "Present"}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-2">Summary</h3>
            <div className="flex justify-around">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {presentCount}
                </p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setCurrentStep("monitor")}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500"
          >
            Back to Monitoring
          </button>
          <button
            onClick={handleFinalizeAttendance}
            disabled={finalizing}
            className={`px-8 py-3 rounded-lg font-semibold text-white ${
              finalizing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {finalizing ? "Finalizing..." : "Finalize Attendance"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Smart Attendance System
              </h1>
              <p className="text-gray-600">
                QR-based attendance with face verification and anti-proxy
                protection
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-700 mb-1">
                📅{" "}
                {currentDateTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                🕐{" "}
                {currentDateTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {currentStep === "select" && renderClassSelection()}
        {currentStep === "qr" && renderQRStep()}
        {currentStep === "monitor" && renderMonitorStep()}
        {currentStep === "photo" && renderPhotoStep()}
        {currentStep === "finalize" && renderFinalizeStep()}
      </div>
    </div>
  );
};

export default SmartAttendanceDashboard;
