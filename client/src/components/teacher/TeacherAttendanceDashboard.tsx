import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getTeacherTimetableForAttendance,
  getStudentsForTimetableSlot,
  markTimetableAttendance,
  getAttendanceStatus,
} from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface TimetableSlot {
  schedule_id: number;
  course: {
    course_id: number;
    course_name: string;
    course_code: string;
  };
  teacher: {
    teacher_id: number;
    name: string;
  };
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom?: string;
}

interface EligibleStudent {
  student_id: number;
  name: string;
  roll_number: string;
  department: {
    department_id: number;
    name: string;
  };
  section_id?: number;
}

interface AttendanceRecord {
  student_id: number;
  status: "present" | "absent";
}

const TeacherAttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation<any>();
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>(
    []
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check if we came from dashboard with schedule data
  useEffect(() => {
    if (location.state?.scheduleId && location.state?.dayOfWeek) {
      console.log("📋 Received schedule from dashboard:", location.state);

      // Auto-adjust date to match the class schedule
      const today = new Date();
      const todayDayOfWeek = today.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const scheduledDayOfWeek = location.state.dayOfWeek;

      if (todayDayOfWeek.toLowerCase() !== scheduledDayOfWeek.toLowerCase()) {
        // Calculate the closest date matching the scheduled day
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const todayIndex = today.getDay();
        const scheduledIndex = daysOfWeek.findIndex(
          (d) => d.toLowerCase() === scheduledDayOfWeek.toLowerCase()
        );

        // Try to find the closest occurrence (prefer past week if within 3 days)
        let daysOffset = scheduledIndex - todayIndex;
        if (daysOffset > 3) daysOffset -= 7; // Use last week
        if (daysOffset < -3) daysOffset += 7; // Use next week

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysOffset);
        const targetDateString = targetDate.toISOString().split("T")[0];

        setSelectedDate(targetDateString);
        console.log(
          `📅 Auto-adjusted date from ${
            new Date().toISOString().split("T")[0]
          } to ${targetDateString} (${scheduledDayOfWeek})`
        );

        // Pass the adjusted date to the load function
        loadStudentsFromRouteState(location.state, targetDateString);
      } else {
        // Today matches, use current selected date
        loadStudentsFromRouteState(location.state);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.teacherId) {
      loadTimetable();
    }
  }, [user]);

  // Validate selected slot when date changes
  useEffect(() => {
    if (selectedSlot) {
      const selectedDateObj = new Date(selectedDate + "T00:00:00");
      const dayOfWeek = selectedDateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });

      // If selected slot doesn't match the new date's day of week, clear it
      if (selectedSlot.day_of_week.toLowerCase() !== dayOfWeek.toLowerCase()) {
        setSelectedSlot(null);
        setEligibleStudents([]);
        setAttendanceRecords([]);
        setMessage({
          type: "error",
          text: `The selected class (${selectedSlot.course.course_name}) is scheduled for ${selectedSlot.day_of_week}, not ${dayOfWeek}. Please select a class from the list below.`,
        });
      }
    }
  }, [selectedDate]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const teacherId = user?.teacherId || user?.profile?.teacher_id;
      console.log("🔍 Loading timetable for teacher ID:", teacherId);

      const data = await getTeacherTimetableForAttendance(teacherId);

      console.log("📊 API Response:", data);

      // Handle both response formats: array directly or { timetable: array }
      const slots = Array.isArray(data) ? data : data.timetable || [];

      console.log("📚 Timetable slots received:", slots.length);

      if (slots.length > 0) {
        const slotsByDay = slots.reduce((acc: any, slot: any) => {
          const day = slot.day_of_week;
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});

        console.log("📋 Slots by day:", slotsByDay);
        console.log(
          "📝 Sample Saturday slots:",
          slots
            .filter((s: any) => s.day_of_week?.toLowerCase() === "saturday")
            .map((s: any) => ({
              id: s.schedule_id,
              course: s.course?.course_name,
              time: `${s.start_time} - ${s.end_time}`,
            }))
        );
      } else {
        console.warn("⚠️ No timetable slots returned from API!");
      }

      setTimetableSlots(slots);
    } catch (error) {
      console.error("❌ Error loading timetable:", error);
      setMessage({ type: "error", text: "Failed to load timetable" });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsFromRouteState = async (state: any, dateToUse?: string) => {
    try {
      setLoading(true);

      // VALIDATION: Check if selected date matches the class day of week
      const dateStr = dateToUse || selectedDate;
      const selectedDateObj = new Date(dateStr + "T00:00:00");
      const selectedDayOfWeek = selectedDateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const scheduledDayOfWeek = state.dayOfWeek;

      console.log("🔍 Date validation:", {
        dateStr,
        selectedDayOfWeek,
        scheduledDayOfWeek,
        matches:
          selectedDayOfWeek.toLowerCase() === scheduledDayOfWeek.toLowerCase(),
      });

      if (
        selectedDayOfWeek.toLowerCase() !== scheduledDayOfWeek.toLowerCase()
      ) {
        setMessage({
          type: "error",
          text: `Date mismatch: This class (${state.courseName}) is scheduled for ${scheduledDayOfWeek}, but ${dateStr} is ${selectedDayOfWeek}. Please select a ${scheduledDayOfWeek} date.`,
        });
        setLoading(false);
        return;
      }

      // Create a slot object from route state
      const slot: TimetableSlot = {
        schedule_id: state.scheduleId,
        course: {
          course_id: state.courseId,
          course_name: state.courseName,
          course_code: state.courseCode,
        },
        teacher: {
          teacher_id: user?.teacherId || user?.profile?.teacher_id,
          name: user?.name || "",
        },
        day_of_week: state.dayOfWeek,
        start_time: state.startTime,
        end_time: state.endTime,
        classroom: state.classroom,
      };

      setSelectedSlot(slot);

      console.log("🔍 Loading students for schedule:", state.scheduleId);
      console.log("📊 Filter criteria:", {
        department: state.departmentName,
        section: state.sectionName,
        semester: state.semester || "from course",
      });

      // Get eligible students for this slot (filtered by dept, semester, section)
      const studentsData = await getStudentsForTimetableSlot(state.scheduleId);

      console.log(
        `✅ Loaded ${studentsData.eligibleStudents?.length || 0} students`
      );
      if ((studentsData as any).filterCriteria) {
        console.log("📋 Filter applied:", (studentsData as any).filterCriteria);
      }

      setEligibleStudents(studentsData.eligibleStudents || []);

      // Initialize attendance records
      const initialRecords = (studentsData.eligibleStudents || []).map(
        (student: EligibleStudent) => ({
          student_id: student.student_id,
          status: "present" as const,
        })
      );
      setAttendanceRecords(initialRecords);

      // Check if attendance already exists for this date
      try {
        const existingAttendance = await getAttendanceStatus(
          state.scheduleId,
          selectedDate
        );
        if (existingAttendance && existingAttendance.length > 0) {
          // Update records with existing attendance
          const updatedRecords = initialRecords.map((record) => {
            const existing = existingAttendance.find(
              (att: any) => att.student_id === record.student_id
            );
            return existing ? { ...record, status: existing.status } : record;
          });
          setAttendanceRecords(updatedRecords);
          setMessage({
            type: "success",
            text: `Loaded existing attendance for ${state.courseName} - ${state.sectionName}`,
          });
        } else {
          setMessage({
            type: "success",
            text: `Ready to mark attendance for ${state.courseName} - ${
              state.sectionName
            } (${studentsData.eligibleStudents?.length || 0} students)`,
          });
        }
      } catch (error) {
        // No existing attendance found, use default
        console.log("No existing attendance found for this date");
        setMessage({
          type: "success",
          text: `Ready to mark attendance for ${state.courseName} - ${
            state.sectionName
          } (${studentsData.eligibleStudents?.length || 0} students)`,
        });
      }
    } catch (error: any) {
      console.error("❌ Error loading students from route state:", error);
      console.error("Error details:", error.response?.data);
      setMessage({
        type: "error",
        text: `Failed to load students: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = async (slot: TimetableSlot) => {
    try {
      setLoading(true);

      // VALIDATION: Double-check date matches day of week
      const selectedDateObj = new Date(selectedDate + "T00:00:00");
      const selectedDayOfWeek = selectedDateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (slot.day_of_week.toLowerCase() !== selectedDayOfWeek.toLowerCase()) {
        setMessage({
          type: "error",
          text: `Cannot select this class: ${slot.course.course_name} is scheduled for ${slot.day_of_week}, but selected date is ${selectedDayOfWeek}.`,
        });
        setLoading(false);
        return;
      }

      setSelectedSlot(slot);

      // Get eligible students for this slot
      const studentsData = await getStudentsForTimetableSlot(slot.schedule_id);
      setEligibleStudents(studentsData.eligibleStudents);

      // Initialize attendance records
      const initialRecords = studentsData.eligibleStudents.map((student) => ({
        student_id: student.student_id,
        status: "present" as const,
      }));
      setAttendanceRecords(initialRecords);

      // Check if attendance already exists for this date
      try {
        const existingAttendance = await getAttendanceStatus(
          slot.schedule_id,
          selectedDate
        );
        if (existingAttendance && existingAttendance.length > 0) {
          // Update records with existing attendance
          const updatedRecords = initialRecords.map((record) => {
            const existing = existingAttendance.find(
              (att: any) => att.student_id === record.student_id
            );
            return existing ? { ...record, status: existing.status } : record;
          });
          setAttendanceRecords(updatedRecords);
        }
      } catch (error) {
        // No existing attendance found, use default
        console.log("No existing attendance found for this date");
      }
    } catch (error) {
      console.error("Error loading students for slot:", error);
      setMessage({
        type: "error",
        text: "Failed to load students for this class",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceStatus = (
    studentId: number,
    status: "present" | "absent"
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId ? { ...record, status } : record
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedSlot) return;

    try {
      setSaving(true);
      await markTimetableAttendance(
        selectedSlot.schedule_id,
        selectedDate,
        attendanceRecords
      );
      setMessage({
        type: "success",
        text: `Attendance saved successfully for ${selectedSlot.course.course_name}`,
      });
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to save attendance";
      const errorDetails = error?.response?.data?.details;
      console.log("Error details:", errorDetails);
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const getTodaySlots = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return timetableSlots.filter(
      (slot) => slot.day_of_week.toLowerCase() === today.toLowerCase()
    );
  };

  const getSlotsForSelectedDate = () => {
    const selectedDateObj = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = selectedDateObj.toLocaleDateString("en-US", {
      weekday: "long",
    });

    console.log("🔍 Filtering slots for date:", selectedDate);
    console.log("📅 Day of week:", dayOfWeek);
    console.log(
      "📚 All timetable slots:",
      timetableSlots.map((s) => ({
        id: s.schedule_id,
        course: s.course?.course_name,
        day: s.day_of_week,
      }))
    );

    const filtered = timetableSlots.filter((slot) => {
      const matches =
        slot.day_of_week.toLowerCase() === dayOfWeek.toLowerCase();
      console.log(
        `  Slot ${slot.schedule_id} (${slot.course?.course_name}) - ${
          slot.day_of_week
        }: ${matches ? "✅" : "❌"}`
      );
      return matches;
    });

    console.log("✅ Filtered slots:", filtered.length);
    return filtered;
  };

  const getUpcomingSlots = () => {
    const today = new Date().getDay();
    const daysOrder = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    return timetableSlots
      .filter((slot) => {
        const slotDay = daysOrder.indexOf(slot.day_of_week.toLowerCase());
        return slotDay >= today;
      })
      .sort((a, b) => {
        const dayA = daysOrder.indexOf(a.day_of_week.toLowerCase());
        const dayB = daysOrder.indexOf(b.day_of_week.toLowerCase());
        if (dayA !== dayB) return dayA - dayB;
        return a.start_time.localeCompare(b.start_time);
      });
  };

  if (loading && !selectedSlot) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Management
          </h1>
          <button
            onClick={() => (window.location.href = "/teacher/smart-attendance")}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            <span className="font-semibold">
              🤖 Smart Attendance (QR + Face)
            </span>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-600">
            💡 Only classes scheduled for{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
            })}{" "}
            will be shown below
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes for Selected Date */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              Classes for{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "short", day: "numeric" }
              )}
            </h2>
            <div className="space-y-2">
              {getSlotsForSelectedDate().length > 0 ? (
                getSlotsForSelectedDate().map((slot) => (
                  <div
                    key={slot.schedule_id}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedSlot?.schedule_id === slot.schedule_id
                        ? "bg-blue-200 border-2 border-blue-500"
                        : "bg-white hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    <div className="font-medium text-gray-800">
                      {slot.course.course_name} ({slot.course.course_code})
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.start_time} - {slot.end_time}
                      {slot.classroom && ` • ${slot.classroom}`}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No classes scheduled for{" "}
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { weekday: "long" }
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Upcoming Classes
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getUpcomingSlots().map((slot) => (
                <div
                  key={slot.schedule_id}
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedSlot?.schedule_id === slot.schedule_id
                      ? "bg-gray-200 border-2 border-gray-500"
                      : "bg-white hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div className="font-medium text-gray-800">
                    {slot.course.course_name} ({slot.course.course_code})
                  </div>
                  <div className="text-sm text-gray-600">
                    {slot.day_of_week} • {slot.start_time} - {slot.end_time}
                    {slot.classroom && ` • ${slot.classroom}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Marking Section */}
      {selectedSlot && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Mark Attendance: {selectedSlot.course.course_name}
              </h2>
              <p className="text-gray-600">
                {selectedSlot.day_of_week} • {selectedSlot.start_time} -{" "}
                {selectedSlot.end_time}
                {selectedSlot.classroom && ` • ${selectedSlot.classroom}`}
              </p>
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || eligibleStudents.length === 0}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                saving || eligibleStudents.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>

          {eligibleStudents.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">
                    Total Students
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {eligibleStudents.length}
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">
                    Present
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {
                      attendanceRecords.filter((r) => r.status === "present")
                        .length
                    }
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-600 font-medium">Absent</div>
                  <div className="text-2xl font-bold text-red-700">
                    {
                      attendanceRecords.filter((r) => r.status === "absent")
                        .length
                    }
                  </div>
                </div>
              </div>

              {/* Present Section */}
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Present (
                  {
                    attendanceRecords.filter((r) => r.status === "present")
                      .length
                  }
                  )
                </h3>
                <div className="space-y-2">
                  {eligibleStudents
                    .filter(
                      (student) =>
                        attendanceRecords.find(
                          (r) => r.student_id === student.student_id
                        )?.status === "present"
                    )
                    .map((student, index) => (
                      <div
                        key={student.student_id}
                        className="bg-white border border-green-300 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.roll_number}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 hidden md:block">
                            {student.department.name}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            updateAttendanceStatus(student.student_id, "absent")
                          }
                          className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
                        >
                          Mark Absent
                        </button>
                      </div>
                    ))}
                  {attendanceRecords.filter((r) => r.status === "present")
                    .length === 0 && (
                    <div className="text-center py-4 text-green-600">
                      No students marked present yet
                    </div>
                  )}
                </div>
              </div>

              {/* Absent Section */}
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Absent (
                  {
                    attendanceRecords.filter((r) => r.status === "absent")
                      .length
                  }
                  )
                </h3>
                <div className="space-y-2">
                  {eligibleStudents
                    .filter(
                      (student) =>
                        attendanceRecords.find(
                          (r) => r.student_id === student.student_id
                        )?.status === "absent"
                    )
                    .map((student, index) => (
                      <div
                        key={student.student_id}
                        className="bg-white border border-red-300 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.roll_number}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 hidden md:block">
                            {student.department.name}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            updateAttendanceStatus(
                              student.student_id,
                              "present"
                            )
                          }
                          className="ml-4 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm font-medium transition-colors"
                        >
                          Mark Present
                        </button>
                      </div>
                    ))}
                  {attendanceRecords.filter((r) => r.status === "absent")
                    .length === 0 && (
                    <div className="text-center py-4 text-red-600">
                      No students marked absent yet
                    </div>
                  )}
                </div>
              </div>

              {/* Unmarked Students Section */}
              {eligibleStudents.filter(
                (student) =>
                  !attendanceRecords.find(
                    (r) => r.student_id === student.student_id
                  )
              ).length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pending (
                    {
                      eligibleStudents.filter(
                        (student) =>
                          !attendanceRecords.find(
                            (r) => r.student_id === student.student_id
                          )
                      ).length
                    }
                    )
                  </h3>
                  <div className="space-y-2">
                    {eligibleStudents
                      .filter(
                        (student) =>
                          !attendanceRecords.find(
                            (r) => r.student_id === student.student_id
                          )
                      )
                      .map((student, index) => (
                        <div
                          key={student.student_id}
                          className="bg-white border border-gray-300 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {student.roll_number}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 hidden md:block">
                              {student.department.name}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() =>
                                updateAttendanceStatus(
                                  student.student_id,
                                  "present"
                                )
                              }
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                              Present
                            </button>
                            <button
                              onClick={() =>
                                updateAttendanceStatus(
                                  student.student_id,
                                  "absent"
                                )
                              }
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              ) : (
                <p className="text-gray-500">
                  No students enrolled in this course
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceDashboard;
