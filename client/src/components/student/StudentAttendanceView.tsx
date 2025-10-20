import React, { useState, useEffect } from "react";
import { getStudentAttendanceSummary } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface AttendanceSummary {
  total_classes: number;
  present: number;
  absent: number;
  attendance_percentage: number;
}

interface CourseWiseAttendance {
  [courseId: string]: {
    course_name: string;
    total_classes: number;
    present: number;
    absent: number;
    percentage: number;
  };
}

interface AttendanceRecord {
  attendance_id: number;
  date: string;
  status: "present" | "absent";
  timetable?: {
    course: {
      course_name: string;
      course_code: string;
    };
    teacher: {
      name: string;
    };
    start_time: string;
    end_time: string;
  };
}

interface AttendanceData {
  student_id: number;
  date_range: { start_date?: string; end_date?: string };
  summary: AttendanceSummary;
  course_wise_attendance: CourseWiseAttendance;
  recent_attendance: AttendanceRecord[];
}

const StudentAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    console.log("🔍 StudentAttendanceView - Checking user data:", user);
    console.log(
      "🔍 StudentAttendanceView - User object:",
      JSON.stringify(user, null, 2)
    );

    // Try multiple ways to get student ID
    const studentId =
      user?.studentId ||
      user?.profile?.student_id ||
      user?.student?.student_id ||
      user?.student_id ||
      user?.id;

    console.log("🆔 StudentAttendanceView - Resolved student ID:", studentId);

    if (studentId) {
      // Set default date range to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);

      loadAttendanceData(
        firstDay.toISOString().split("T")[0],
        lastDay.toISOString().split("T")[0]
      );
    } else {
      console.error(
        "❌ StudentAttendanceView - No student ID found in user object"
      );
      console.error("📋 Available user properties:", Object.keys(user || {}));
    }
  }, [user]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || !startDate || !endDate) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing attendance data...");
      loadAttendanceData(startDate, endDate, true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, startDate, endDate]);

  const loadAttendanceData = async (
    start?: string,
    end?: string,
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Try multiple ways to get student ID
      const studentId =
        user?.studentId ||
        user?.profile?.student_id ||
        user?.student?.student_id ||
        user?.student_id ||
        user?.id;

      if (!studentId) {
        console.error("❌ loadAttendanceData - No student ID found");
        console.error("📋 User object:", user);
        setMessage({
          type: "error",
          text: "Unable to load attendance: Student ID not found. Please try logging in again.",
        });
        return;
      }

      console.log("📊 Loading attendance data for student:", studentId);
      console.log("📅 Date range:", { start, end });

      const data = await getStudentAttendanceSummary(studentId, start, end);
      console.log("✅ Attendance data loaded:", data);
      console.log("📈 Summary:", data.summary);
      console.log(
        "📚 Course-wise:",
        Object.keys(data.course_wise_attendance || {}).length,
        "courses"
      );
      console.log(
        "📋 Recent records:",
        data.recent_attendance?.length || 0,
        "records"
      );

      // Debug: Check what's in the attendance records
      if (data.recent_attendance && data.recent_attendance.length > 0) {
        console.log(
          "🔍 First attendance record structure:",
          JSON.stringify(data.recent_attendance[0], null, 2)
        );
        console.log("🔍 Timetable data:", data.recent_attendance[0].timetable);
        console.log(
          "🔍 Course data:",
          data.recent_attendance[0].timetable?.course
        );
      }

      setAttendanceData(data);
      setLastUpdated(new Date());

      if (data.recent_attendance && data.recent_attendance.length > 0) {
        setMessage({
          type: "success",
          text: `Loaded ${data.recent_attendance.length} attendance records`,
        });
      }
    } catch (error: any) {
      console.error("❌ Error loading attendance data:", error);
      console.error("Error response:", error.response?.data);
      setMessage({
        type: "error",
        text: `Failed to load attendance: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    loadAttendanceData(startDate, endDate, true);
  };

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      loadAttendanceData(startDate, endDate);
    }
  };

  const getAttendanceStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getAttendanceStatusText = (percentage: number) => {
    if (percentage >= 80) return "Good";
    if (percentage >= 60) return "Average";
    return "Poor";
  };

  if (loading && !attendanceData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Real-Time Attendance Updates
            </h3>
            <p className="text-sm text-blue-800">
              Your attendance is automatically updated when your teachers mark
              it in their dashboard.
              {autoRefresh
                ? " Auto-refresh is enabled - new attendance will appear within 30 seconds."
                : " Enable auto-refresh to see updates in real-time."}
            </p>
          </div>
        </div>
      </div>

      {/* Header and Date Range */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>

          {/* Last Updated and Auto-refresh */}
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Last updated:</span>{" "}
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}

            {/* Auto-refresh Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>

            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-2 rounded-md text-white font-medium transition-all ${
                refreshing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {refreshing ? "Refreshing..." : "Refresh"}
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleDateRangeChange}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Loading..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {attendanceData && (
        <>
          {/* Overall Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Overall Attendance Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceData.summary.total_classes}
                </div>
                <div className="text-sm text-gray-600">Total Classes</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceData.summary.present}
                </div>
                <div className="text-sm text-gray-600">Present</div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceData.summary.absent}
                </div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>

              <div
                className={`rounded-lg p-4 ${getAttendanceStatusColor(
                  attendanceData.summary.attendance_percentage
                )}`}
              >
                <div className="text-2xl font-bold">
                  {attendanceData.summary.attendance_percentage.toFixed(1)}%
                </div>
                <div className="text-sm">
                  {getAttendanceStatusText(
                    attendanceData.summary.attendance_percentage
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Course-wise Attendance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Course-wise Attendance
            </h2>

            <div className="space-y-4">
              {Object.entries(attendanceData.course_wise_attendance).map(
                ([courseId, course]) => (
                  <div
                    key={courseId}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-800">
                        {course.course_name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceStatusColor(
                          course.percentage
                        )}`}
                      >
                        {course.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total: </span>
                        <span className="font-medium">
                          {course.total_classes}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Present: </span>
                        <span className="font-medium text-green-600">
                          {course.present}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Absent: </span>
                        <span className="font-medium text-red-600">
                          {course.absent}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {Object.keys(attendanceData.course_wise_attendance).length ===
                0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No attendance records found for the selected date range
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Attendance
            </h2>

            {attendanceData.recent_attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.recent_attendance.map((record, index) => {
                      const recordDate = new Date(record.date);
                      const today = new Date();
                      const isToday =
                        recordDate.toDateString() === today.toDateString();

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 ${
                            isToday ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">
                                {recordDate.toLocaleDateString()}
                              </span>
                              {isToday && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.timetable?.course?.course_name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.timetable?.course?.course_code || ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.timetable?.teacher?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.timetable
                              ? `${record.timetable.start_time} - ${record.timetable.end_time}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {record.status.charAt(0).toUpperCase() +
                                record.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No recent attendance records found
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Attendance Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Attendance Guidelines
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • Minimum 80% attendance is required to be eligible for examinations
          </li>
          <li>
            • 60-79% attendance is considered average and may require
            improvement
          </li>
          <li>
            • Below 60% attendance is poor and may result in academic
            consequences
          </li>
          <li>
            • Contact your coordinator if you have concerns about your
            attendance
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentAttendanceView;
