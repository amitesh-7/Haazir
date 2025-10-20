import React, { useEffect, useState } from "react";
import { useParams, useHistory, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Line, Doughnut, Bar } from "react-chartjs-2";

interface CourseDetailParams {
  courseId: string;
}

interface CourseAttendanceDetail {
  course_id: number;
  course_name: string;
  course_code: string;
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  attendance_percentage: number;
  classes_needed_for_75: number;
  classes_can_skip: number;
  recent_attendance: Array<{
    date: string;
    status: "present" | "absent";
    marked_at: string;
  }>;
  monthly_breakdown: Array<{
    month: string;
    present: number;
    absent: number;
    percentage: number;
  }>;
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<CourseDetailParams>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseAttendanceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      const studentId =
        user?.profile?.student_id ||
        user?.student?.student_id ||
        user?.user_id ||
        user?.id;

      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      
      const response = await fetch(
        `${API_URL}/attendance/student/${studentId}/course/${courseId}/detailed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load course data");

      const data = await response.json();
      setCourseData(data);
    } catch (error: any) {
      console.error("Error loading course data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-xl text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => history.goBack()}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <h3 className="text-red-800 font-semibold">Error loading course data</h3>
            <p className="text-red-700 mt-2">{error || "Course not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const attendancePercentage = courseData.attendance_percentage;
  const needsMoreClasses = attendancePercentage < 75;

  // Chart data for monthly breakdown
  const monthlyChartData = {
    labels: courseData.monthly_breakdown.map((m) => m.month),
    datasets: [
      {
        label: "Present",
        data: courseData.monthly_breakdown.map((m) => m.present),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
      },
      {
        label: "Absent",
        data: courseData.monthly_breakdown.map((m) => m.absent),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Attendance distribution
  const distributionData = {
    labels: ["Attended", "Missed"],
    datasets: [
      {
        data: [courseData.attended_classes, courseData.absent_classes],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => history.goBack()}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {courseData.course_name}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Course Code: {courseData.course_code}
              </p>
            </div>
            <div
              className={`px-6 py-3 rounded-2xl ${
                attendancePercentage >= 75
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <p className="text-sm font-medium">Overall Attendance</p>
              <p className="text-3xl font-bold">{attendancePercentage}%</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Classes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {courseData.total_classes}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Classes Attended</p>
                <p className="text-3xl font-bold text-green-600">
                  {courseData.attended_classes}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Classes Missed</p>
                <p className="text-3xl font-bold text-red-600">
                  {courseData.absent_classes}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">
                  {needsMoreClasses ? "Classes Needed" : "Can Skip"}
                </p>
                <p className="text-4xl font-black">
                  {needsMoreClasses
                    ? courseData.classes_needed_for_75
                    : courseData.classes_can_skip}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                {needsMoreClasses ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Smart 75% Attendance Calculator - Highlighted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className={`relative rounded-3xl shadow-2xl overflow-hidden ${
            needsMoreClasses 
              ? "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600" 
              : "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600"
          }`}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}></div>
            </div>

            <div className="relative p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                    🎯 75% Attendance Calculator
                  </h3>
                  <p className="text-white/90 text-lg">Smart insights for your attendance goals</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 border-2 border-white/30">
                  <p className="text-white/80 text-sm font-medium">Current Status</p>
                  <p className="text-4xl font-black text-white">{attendancePercentage}%</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {needsMoreClasses ? (
                    <>
                      <div className="p-4 bg-white/20 rounded-full">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white mb-1">⚠️ Action Required!</p>
                        <p className="text-white/90 text-lg">
                          Attend the next <span className="text-4xl font-black text-yellow-300 mx-2">{courseData.classes_needed_for_75}</span> classes consecutively
                        </p>
                        <p className="text-white/80 text-sm mt-2">to reach the 75% attendance threshold</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white/20 rounded-full">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white mb-1">✓ Great Performance!</p>
                        <p className="text-white/90 text-lg">
                          You can skip <span className="text-4xl font-black text-green-300 mx-2">{courseData.classes_can_skip}</span> more classes
                        </p>
                        <p className="text-white/80 text-sm mt-2">while still maintaining 75% attendance</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-white/90 text-sm font-medium mb-2">
                    <span>Progress to 75%</span>
                    <span>{attendancePercentage}%</span>
                  </div>
                  <div className="relative h-6 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                      className={`h-full rounded-full ${
                        attendancePercentage >= 75
                          ? "bg-gradient-to-r from-green-300 to-green-500"
                          : "bg-gradient-to-r from-yellow-300 to-orange-500"
                      } shadow-lg`}
                    />
                    {/* 75% Marker */}
                    <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-white/60">
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold whitespace-nowrap">
                        ▼ 75%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
                  <p className="text-white/80 text-sm font-medium mb-1">Total</p>
                  <p className="text-3xl font-bold text-white">{courseData.total_classes}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
                  <p className="text-white/80 text-sm font-medium mb-1">Present</p>
                  <p className="text-3xl font-bold text-green-300">{courseData.attended_classes}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
                  <p className="text-white/80 text-sm font-medium mb-1">Absent</p>
                  <p className="text-3xl font-bold text-red-300">{courseData.absent_classes}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📊 Monthly Breakdown
            </h3>
            <div className="h-80">
              <Bar
                data={monthlyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" },
                    title: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              🥧 Attendance Distribution
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={distributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Recent Attendance History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Recent Attendance History
          </h2>
          {courseData.recent_attendance.length > 0 ? (
            <div className="space-y-3">
              {courseData.recent_attendance.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    record.status === "present"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        record.status === "present"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {record.status === "present" ? (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-lg text-gray-900">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Marked at:{" "}
                        {new Date(record.marked_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full font-semibold text-sm ${
                      record.status === "present"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {record.status === "present" ? "Present ✓" : "Absent ✗"}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No attendance records yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
