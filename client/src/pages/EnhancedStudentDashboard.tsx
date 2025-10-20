import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  fetchStudentAttendance,
  fetchStudentTimetable,
  getStudentCourses,
} from "../services/api";
import NotificationBell from "../components/student/NotificationBell";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DashboardStats {
  totalCourses: number;
  attendanceRate: number;
  todayClasses: number;
  upcomingAssignments: number;
  overallGrade: string;
}

interface RecentActivity {
  id: string;
  type: "attendance" | "assignment" | "grade" | "announcement";
  title: string;
  description: string;
  timestamp: Date;
  status?: "present" | "absent" | "completed" | "pending" | "new";
}

interface UpcomingClass {
  id: string;
  courseName: string;
  courseCode: string;
  time: string;
  room: string;
  teacher: string;
  type: "lecture" | "lab" | "tutorial";
}

const EnhancedStudentDashboard: React.FC = () => {
  const history = useHistory();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalCourses: 0,
    attendanceRate: 0,
    todayClasses: 0,
    upcomingAssignments: 0,
    overallGrade: "A",
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faceEnrollmentStatus, setFaceEnrollmentStatus] = useState<{
    isEnrolled: boolean;
    totalFaces: number;
  }>({ isEnrolled: false, totalFaces: 0 });

  useEffect(() => {
    loadDashboardData();
    checkFaceEnrollmentStatus();
  }, []);

  const checkFaceEnrollmentStatus = async () => {
    try {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;

      if (!user) return;

      const studentId =
        user?.profile?.student_id ||
        user?.student?.student_id ||
        user?.user_id ||
        user?.id;

      if (!studentId) return;

      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/smart-attendance/student/${studentId}/faces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFaceEnrollmentStatus({
          isEnrolled: data.totalFaces >= 5,
          totalFaces: data.totalFaces || 0,
        });
      }
    } catch (error) {
      console.error("Error checking face enrollment status:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;

      if (!user) {
        throw new Error("No user found in localStorage");
      }

      const studentId =
        user?.profile?.student_id ||
        user?.student?.student_id ||
        user?.user_id ||
        user?.id ||
        "1";

      // Load data in parallel
      const [courses, attendance, timetable] = await Promise.allSettled([
        getStudentCourses(String(studentId)),
        fetchStudentAttendance(String(studentId)),
        fetchStudentTimetable(String(studentId)),
      ]);

      // Process courses
      const coursesResult = courses.status === "fulfilled" ? courses.value : [];
      const attendanceResult =
        attendance.status === "fulfilled" ? attendance.value : [];
      const timetableResult =
        timetable.status === "fulfilled" ? timetable.value : [];

      setCoursesData(Array.isArray(coursesResult) ? coursesResult : []);
      setAttendanceData(
        Array.isArray(attendanceResult) ? attendanceResult : []
      );
      setTimetableData(Array.isArray(timetableResult) ? timetableResult : []);

      // Calculate dashboard stats
      calculateDashboardStats(coursesResult, attendanceResult, timetableResult);
      generateRecentActivities(attendanceResult, coursesResult);
      generateUpcomingClasses(timetableResult);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (
    courses: any[],
    attendance: any[],
    timetable: any[]
  ) => {
    const totalCourses = courses.length;

    // Calculate attendance rate
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(
      (record) => record.status === "present"
    ).length;
    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

    // Calculate today's classes
    const today = new Date().toISOString().split("T")[0];
    const todayClasses = timetable.filter((entry) => {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const todayName = dayNames[new Date().getDay()];
      return entry.day_of_week === todayName;
    }).length;

    setDashboardStats({
      totalCourses,
      attendanceRate,
      todayClasses,
      upcomingAssignments: 5, // Mock data
      overallGrade:
        attendanceRate >= 90
          ? "A"
          : attendanceRate >= 80
          ? "B"
          : attendanceRate >= 70
          ? "C"
          : "D",
    });
  };

  const generateRecentActivities = (attendance: any[], courses: any[]) => {
    const activities: RecentActivity[] = [];

    // Add recent attendance records
    attendance.slice(0, 3).forEach((record, index) => {
      activities.push({
        id: `attendance-${index}`,
        type: "attendance",
        title: `Attendance Recorded`,
        description: `${
          record.status === "present" ? "Present" : "Absent"
        } for ${record.course_name || "Class"}`,
        timestamp: new Date(record.date || Date.now()),
        status: record.status === "present" ? "present" : "absent",
      });
    });

    // Add mock activities for better UX
    activities.push(
      {
        id: "assignment-1",
        type: "assignment",
        title: "Assignment Due Soon",
        description: "Data Structures Assignment due in 2 days",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "pending",
      },
      {
        id: "grade-1",
        type: "grade",
        title: "New Grade Posted",
        description: "Database Systems - Quiz 2: 85/100",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: "new",
      }
    );

    setRecentActivities(
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );
  };

  const generateUpcomingClasses = (timetable: any[]) => {
    const today = new Date();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = dayNames[today.getDay()];

    const todayClasses = timetable
      .filter((entry) => entry.day_of_week === todayName)
      .map((entry, index) => {
        const randomType = Math.random();
        const type: "lecture" | "lab" | "tutorial" =
          randomType > 0.7 ? "lab" : randomType > 0.5 ? "tutorial" : "lecture";

        return {
          id: `class-${index}`,
          courseName:
            entry.course?.course_name || entry.course_name || "Unknown Course",
          courseCode: entry.course?.course_code || entry.course_code || "N/A",
          time: `${entry.start_time} - ${entry.end_time}`,
          room: `Room ${Math.floor(Math.random() * 300) + 100}`, // Mock room data
          teacher: entry.teacher?.name || entry.teacher_name || "TBA",
          type,
        };
      })
      .slice(0, 4); // Show max 4 upcoming classes

    setUpcomingClasses(todayClasses);
  };

  // Chart data for attendance trends
  const attendanceChartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Attendance Rate (%)",
        data: [95, 88, 92, 85, 90, dashboardStats.attendanceRate],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart data for course distribution
  const courseChartData = {
    labels: ["Attended", "Missed"],
    datasets: [
      {
        data: [
          dashboardStats.attendanceRate,
          100 - dashboardStats.attendanceRate,
        ],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  onClick={loadDashboardData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back! 👋
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Here's what's happening with your academics today
              </p>
            </div>
            <div className="flex items-center gap-6">
              {/* Notification Bell */}
              <NotificationBell />
              
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Courses
                </p>
                <p className="text-3xl font-bold">
                  {dashboardStats.totalCourses}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold">
                  {dashboardStats.attendanceRate}%
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  width="32"
                  height="32"
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
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Today's Classes
                </p>
                <p className="text-3xl font-bold">
                  {dashboardStats.todayClasses}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Assignments
                </p>
                <p className="text-3xl font-bold">
                  {dashboardStats.upcomingAssignments}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Overall Grade
                </p>
                <p className="text-3xl font-bold">
                  {dashboardStats.overallGrade}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Course Overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Attendance Trend Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Attendance Trends
                </h2>
                <div className="flex gap-3">
                  <Link
                    to="/student/attendance/stats"
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    📊 View Analytics
                  </Link>
                  <Link
                    to="/student/attendance"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center"
                  >
                    View History →
                  </Link>
                </div>
              </div>
              <div className="h-80">
                <Line
                  data={attendanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function (value) {
                            return value + "%";
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* My Courses */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  My Courses
                </h2>
                <span className="text-sm text-gray-500">
                  {coursesData.length} courses enrolled
                </span>
              </div>
              {coursesData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coursesData.map((course: any) => (
                    <div
                      key={course.course_id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                          {course.course_name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {course.credits} Credits
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium w-16">Code:</span>
                          <span className="text-gray-800">
                            {course.course_code}
                          </span>
                        </div>
                        {course.description && (
                          <p className="text-gray-500 text-sm line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Active</span>
                        <Link
                          to={`/student/course/${course.course_id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-16 w-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">
                    No courses enrolled yet
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Contact your coordinator to get enrolled in courses
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Activities and Quick Info */}
          <div className="space-y-8">
            {/* Attendance Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Attendance Overview
              </h2>
              <div className="h-48">
                <Doughnut
                  data={courseChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Today's Classes
                </h2>
                <Link
                  to="/student/timetable"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  Full Schedule →
                </Link>
              </div>
              {upcomingClasses.length > 0 ? (
                <div className="space-y-3">
                  {upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          classItem.type === "lecture"
                            ? "bg-blue-500"
                            : classItem.type === "lab"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {classItem.courseName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {classItem.time} • {classItem.room}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                          classItem.type === "lecture"
                            ? "bg-blue-100 text-blue-800"
                            : classItem.type === "lab"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {classItem.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No classes today</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Enjoy your free day!
                  </p>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Recent Activities
              </h2>
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "attendance"
                          ? "bg-blue-100"
                          : activity.type === "assignment"
                          ? "bg-orange-100"
                          : activity.type === "grade"
                          ? "bg-green-100"
                          : "bg-purple-100"
                      }`}
                    >
                      {activity.type === "attendance" && (
                        <svg
                          className={`w-4 h-4 ${
                            activity.status === "present"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {activity.type === "assignment" && (
                        <svg
                          className="w-4 h-4 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                      {activity.type === "grade" && (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timestamp.toLocaleString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => history.push("/student/smart-attendance")}
                  className="flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-xl transition-all group border-2 border-green-400 col-span-2"
                >
                  <div className="text-center">
                    <svg
                      className="w-10 h-10 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <p className="text-base font-bold text-green-700">
                      📱 Scan QR Code
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Mark Attendance with Face Recognition
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (!faceEnrollmentStatus.isEnrolled) {
                      history.push("/student/face-enrollment");
                    }
                  }}
                  disabled={faceEnrollmentStatus.isEnrolled}
                  className={`flex items-center justify-center p-4 rounded-xl transition-colors group border ${
                    faceEnrollmentStatus.isEnrolled
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                      : "bg-purple-50 hover:bg-purple-100 border-purple-200 cursor-pointer"
                  }`}
                  title={
                    faceEnrollmentStatus.isEnrolled
                      ? `Face Enrolled (${faceEnrollmentStatus.totalFaces}/5 faces registered)`
                      : "Enroll your face for attendance"
                  }
                >
                  <div className="text-center">
                    {faceEnrollmentStatus.isEnrolled ? (
                      <svg
                        className="w-8 h-8 text-green-600 mx-auto mb-2"
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
                    ) : (
                      <svg
                        className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <p
                      className={`text-sm font-medium ${
                        faceEnrollmentStatus.isEnrolled
                          ? "text-green-800"
                          : "text-purple-800"
                      }`}
                    >
                      {faceEnrollmentStatus.isEnrolled
                        ? "✓ Face Enrolled"
                        : "Face Enrollment"}
                    </p>
                    {faceEnrollmentStatus.isEnrolled && (
                      <p className="text-xs text-gray-600 mt-1">
                        {faceEnrollmentStatus.totalFaces}/5 faces
                      </p>
                    )}
                  </div>
                </button>
                <Link
                  to="/student/attendance"
                  className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform"
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
                    <p className="text-sm font-medium text-blue-800">
                      Attendance
                    </p>
                  </div>
                </Link>
                <Link
                  to="/my-timetable"
                  className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform"
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
                    <p className="text-sm font-medium text-green-800">
                      Timetable
                    </p>
                  </div>
                </Link>
                <Link
                  to="/student/profile"
                  className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-purple-800">
                      Profile
                    </p>
                  </div>
                </Link>
                <Link
                  to="/student/grades"
                  className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group"
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-orange-800">
                      Grades
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;
