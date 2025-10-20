import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Line, Doughnut, Bar, Radar } from "react-chartjs-2";

interface CourseAttendance {
  course_id: number;
  course_name: string;
  course_code: string;
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  attendance_percentage: number;
  classes_needed_for_75: number;
  classes_can_skip: number;
}

interface AttendanceStatsData {
  overall_attendance: number;
  total_classes: number;
  total_present: number;
  total_absent: number;
  courses: CourseAttendance[];
  weekly_trend: Array<{
    week: string;
    percentage: number;
  }>;
}

const EnhancedAttendanceStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<AttendanceStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendanceStats();
  }, []);

  const loadAttendanceStats = async () => {
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
        `${API_URL}/attendance/student/${studentId}/detailed-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load attendance stats");

      const data = await response.json();
      setStatsData(data);
    } catch (error: any) {
      console.error("Error loading attendance stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-2xl font-bold text-gray-700">Loading your attendance analytics...</p>
          <p className="text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-bold text-red-800">Error loading stats</h3>
            </div>
            <p className="text-red-700 text-lg">{error || "Failed to load data"}</p>
            <button
              onClick={loadAttendanceStats}
              className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-colors"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallPercentage = statsData.overall_attendance;
  const isAbove75 = overallPercentage >= 75;

  // Weekly trend chart
  const weeklyTrendData = {
    labels: statsData.weekly_trend.map((w) => w.week),
    datasets: [
      {
        label: "Weekly Attendance %",
        data: statsData.weekly_trend.map((w) => w.percentage),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  // Overall distribution
  const overallDistribution = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [statsData.total_present, statsData.total_absent],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
      },
    ],
  };

  // Course-wise comparison (Radar Chart)
  const courseRadarData = {
    labels: statsData.courses.map((c) => c.course_code),
    datasets: [
      {
        label: "Attendance %",
        data: statsData.courses.map((c) => c.attendance_percentage),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(59, 130, 246)",
      },
    ],
  };

  // Course-wise bar chart
  const courseBarData = {
    labels: statsData.courses.map((c) => c.course_code),
    datasets: [
      {
        label: "Attendance %",
        data: statsData.courses.map((c) => c.attendance_percentage),
        backgroundColor: statsData.courses.map((c) =>
          c.attendance_percentage >= 75
            ? "rgba(34, 197, 94, 0.8)"
            : "rgba(239, 68, 68, 0.8)"
        ),
        borderColor: statsData.courses.map((c) =>
          c.attendance_percentage >= 75
            ? "rgba(34, 197, 94, 1)"
            : "rgba(239, 68, 68, 1)"
        ),
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            📊 Attendance Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-xl">
            Comprehensive insights into your academic attendance
          </p>
        </motion.div>

        {/* Overall Stats Hero Section - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl shadow-2xl mb-10"
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 ${
            isAbove75
              ? "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600"
              : "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600"
          }`}>
            {/* Animated Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)',
                backgroundSize: '60px 60px'
              }}></div>
            </div>
          </div>

          <div className="relative p-8 md:p-12">
            {/* Main Stats Row */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
              {/* Left: Title */}
              <div className="text-center lg:text-left">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-black text-white mb-3"
                >
                  🎯 Overall Attendance
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/90 text-xl"
                >
                  Tracking {statsData.courses.length} courses • {statsData.total_classes} total classes
                </motion.p>
              </div>

              {/* Center: Big Percentage */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="text-center"
              >
                <div className="bg-white/10 backdrop-blur-xl border-4 border-white/30 rounded-3xl p-8 shadow-2xl">
                  <p className="text-white/80 text-lg font-medium mb-2">Your Score</p>
                  <p className="text-9xl font-black text-white leading-none mb-4">
                    {overallPercentage}
                    <span className="text-6xl">%</span>
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {isAbove75 ? (
                      <>
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-2xl font-bold">Excellent!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-2xl font-bold">Action Needed</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Right: Link to Dashboard */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <Link
                  to="/student/dashboard"
                  className="inline-block bg-white/20 backdrop-blur-md hover:bg-white/30 border-2 border-white/30 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105"
                >
                  ← Back to Dashboard
                </Link>
              </motion.div>
            </div>

            {/* Stats Cards Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-6 text-center hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-4xl font-black text-white">{statsData.total_classes}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-6 text-center hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-400/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">Present</p>
                <p className="text-4xl font-black text-green-200">{statsData.total_present}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-6 text-center hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-400/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">❌</span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">Absent</p>
                <p className="text-4xl font-black text-red-200">{statsData.total_absent}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-6 text-center hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-400/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎓</span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">Courses</p>
                <p className="text-4xl font-black text-white">{statsData.courses.length}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-black text-gray-900 mb-2">📈 Performance Analytics</h2>
          <p className="text-gray-600 text-lg">Visual insights into your attendance patterns</p>
        </motion.div>

        {/* Charts Grid - ENHANCED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Weekly Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Weekly Trend</h3>
            </div>
            <div className="h-80">
              <Line
                data={weeklyTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Overall Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Distribution</h3>
            </div>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={overallDistribution}
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

          {/* Course-wise comparison */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Course Comparison</h3>
            </div>
            <div className="h-80">
              <Bar
                data={courseBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Performance Radar</h3>
            </div>
            <div className="h-80 flex items-center justify-center">
              <Radar
                data={courseRadarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (value) => value + "%",
                      },
                    },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Section Title for Course Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-black text-gray-900 mb-2">🎓 Course-wise Breakdown</h2>
          <p className="text-gray-600 text-lg">Detailed attendance analysis for each course</p>
        </motion.div>

        {/* Course-wise Detailed Cards - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsData.courses.map((course, index) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-blue-400"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-xl text-gray-900 line-clamp-2 mb-1">
                      {course.course_name}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      {course.course_code}
                    </p>
                  </div>
                  <div
                    className={`ml-2 px-4 py-2 rounded-full text-lg font-black ${
                      course.attendance_percentage >= 75
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {course.attendance_percentage}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(course.attendance_percentage, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: 1.5 + index * 0.1 }}
                      className={`h-full rounded-full ${
                        course.attendance_percentage >= 75
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : "bg-gradient-to-r from-red-400 to-red-600"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-500 font-medium">
                    <span>0%</span>
                    <span className="font-bold text-gray-700">75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium">Total</p>
                    <p className="text-2xl font-black text-blue-900">
                      {course.total_classes}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600 font-medium">Present</p>
                    <p className="text-2xl font-black text-green-900">
                      {course.attended_classes}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-red-600 font-medium">Absent</p>
                    <p className="text-2xl font-black text-red-900">
                      {course.absent_classes}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-3 text-center ${
                      course.attendance_percentage >= 75
                        ? "bg-purple-50"
                        : "bg-orange-50"
                    }`}
                  >
                    <p
                      className={`text-xs font-medium ${
                        course.attendance_percentage >= 75
                          ? "text-purple-600"
                          : "text-orange-600"
                      }`}
                    >
                      {course.attendance_percentage >= 75
                        ? "Can Skip"
                        : "Need"}
                    </p>
                    <p
                      className={`text-2xl font-black ${
                        course.attendance_percentage >= 75
                          ? "text-purple-900"
                          : "text-orange-900"
                      }`}
                    >
                      {course.attendance_percentage >= 75
                        ? course.classes_can_skip
                        : course.classes_needed_for_75}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {course.attendance_percentage < 75 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-center">
                      <p className="text-sm text-orange-700 font-bold">
                        ⚠️ Attend next <span className="text-xl">{course.classes_needed_for_75}</span> classes
                      </p>
                    </div>
                  )}
                  {course.attendance_percentage >= 75 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                      <p className="text-sm text-green-700 font-bold">
                        ✅ Can skip <span className="text-xl">{course.classes_can_skip}</span> more classes
                      </p>
                    </div>
                  )}
                  <Link
                    to={`/student/course/${course.course_id}`}
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:shadow-xl"
                  >
                    View Details →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedAttendanceStats;
