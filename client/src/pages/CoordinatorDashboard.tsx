import React, { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { getDashboardStats } from "../services/api";
import Lottie from "lottie-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import "../styles/coordinatorDashboard.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Import Lottie animations
import StudentAnimation from "../assets/lottie/STUDENT.json";
import TeacherAnimation from "../assets/lottie/Teaching.json";
import CourseAnimation from "../assets/lottie/Courses.json";
import AttendanceAnimation from "../assets/lottie/Attendance-icon.json";
// Import Activity Feed Lottie animations
import MultiUserIcon from "../assets/lottie/multi-user-icon.json";
import CheckmarkIcon from "../assets/lottie/checkmark-circle.json";
import BuildingIcon from "../assets/lottie/building-icon.json";

interface User {
  user_id: number;
  email: string;
  role: string;
}

interface DashboardStats {
  students: number;
  teachers: number;
  courses: number;
  departments: number;
  activeUsers?: number;
  todayAttendance?: number;
  recentStudents?: number;
  recentTeachers?: number;
}

interface Activity {
  id: number;
  type: "student" | "teacher" | "course" | "attendance";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  lottieAnimation?: any; // Lottie animation data
}

const CoordinatorDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    teachers: 0,
    courses: 0,
    departments: 0,
    activeUsers: 0,
    todayAttendance: 0,
    recentStudents: 0,
    recentTeachers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const history = useHistory();

  // Debug: Log every render
  console.log(
    "🎨 CoordinatorDashboard rendering. User:",
    user,
    "Stats:",
    stats
  );

  // Define fetchDashboardData with useCallback to prevent re-creation
  const fetchDashboardData = useCallback(async () => {
    console.log("📡 Fetching dashboard data...");
    try {
      setLoading(true);
      const data = await getDashboardStats();

      console.log("📊 Dashboard data received:", data);

      const newStats = {
        students: data.overview?.totalStudents || 0,
        teachers: data.overview?.totalTeachers || 0,
        courses: data.overview?.totalCourses || 0,
        departments: data.overview?.totalDepartments || 0,
        activeUsers: data.overview?.activeUsers || 0,
        todayAttendance: 87, // Mock data for now
        recentStudents: data.recentActivity?.recentStudents?.length || 0,
        recentTeachers: data.recentActivity?.recentTeachers?.length || 0,
      };

      setStats(newStats);

      console.log("✅ Stats updated:", newStats);

      // Generate recent activities
      const activities: Activity[] = [];

      if (data.recentActivity?.recentStudents) {
        data.recentActivity.recentStudents
          .slice(0, 3)
          .forEach((student: any) => {
            activities.push({
              id: student.id,
              type: "student",
              title: "New Student Registered",
              description: `${student.name} (${
                student.rollNumber || "N/A"
              }) - ${student.department || "N/A"}`,
              timestamp: new Date(student.createdAt).toLocaleString(),
              icon: "👤",
              lottieAnimation: MultiUserIcon,
            });
          });
      }

      if (data.recentActivity?.recentTeachers) {
        data.recentActivity.recentTeachers
          .slice(0, 2)
          .forEach((teacher: any) => {
            activities.push({
              id: teacher.id,
              type: "teacher",
              title: "New Teacher Added",
              description: `${teacher.name} - ${teacher.department || "N/A"}`,
              timestamp: new Date(teacher.createdAt).toLocaleString(),
              icon: "👨‍🏫",
              lottieAnimation: TeacherAnimation,
            });
          });
      }

      setRecentActivities(activities.slice(0, 5));
      setLoading(false);
      console.log("✅ Dashboard data fetch complete. Loading set to false.");
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setLoading(false);
    }
  }, []); // useCallback with empty deps - function never changes

  useEffect(() => {
    console.log("🔄 CoordinatorDashboard useEffect triggered");

    // Get user info from token
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ No token found, redirecting to login");
      history.push("/");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userData = {
        user_id: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      console.log("👤 Setting user:", userData);
      setUser(userData);

      // Fetch dashboard stats
      fetchDashboardData();
    } catch (error) {
      console.error("❌ Invalid token:", error);
      localStorage.removeItem("token");
      history.push("/");
    }
  }, [fetchDashboardData, history]); // Add dependencies

  const handleLogout = () => {
    localStorage.removeItem("token");
    history.push("/");
  };

  // Chart Data Configurations
  // 1. Attendance Trend Line Chart (Last 7 Days)
  const attendanceTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Attendance %",
        data: [85, 88, 82, 90, 87, 84, 89],
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
          return gradient;
        },
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const attendanceTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Attendance: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          callback: (value: any) => value + "%",
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeInOutQuart" as const,
    },
  };

  // 2. Department Distribution Doughnut Chart
  const departmentData = {
    labels: [
      "Computer Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
    ],
    datasets: [
      {
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(168, 85, 247)",
          "rgb(251, 146, 60)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 2,
        hoverOffset: 15,
      },
    ],
  };

  const departmentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: "easeInOutQuart" as const,
    },
  };

  // 3. Monthly Enrollment Bar Chart
  const enrollmentData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Students",
        data: [45, 52, 48, 61, 58, 67],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.2)");
          return gradient;
        },
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Teachers",
        data: [8, 10, 9, 12, 11, 13],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.8)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 0.2)");
          return gradient;
        },
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const enrollmentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeInOutQuart" as const,
    },
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-semibold text-gray-800">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ">
      {/* Header - Enhanced Responsive */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            {/* Title Section - Mobile Optimized */}
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Coordinator Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1 truncate">
                <span className="mr-1 sm:mr-2">👋</span>
                Welcome back,{" "}
                <span className="font-medium ml-1 truncate max-w-[150px] sm:max-w-none">
                  {user.email}
                </span>
              </p>
            </div>

            {/* Action Buttons - Mobile Responsive */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                aria-label="Refresh dashboard data"
              >
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${
                    loading ? "animate-spin" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {loading ? "Refreshing..." : "Refresh"}
                </span>
                <span className="sm:hidden">🔄</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                aria-label="Logout from dashboard"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Stats Cards - Enhanced with Gradients and Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          {/* Students Card - Animation Delay 1 */}
          <div
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden "
            style={{ animationDelay: "0.1s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">
                  Total Students
                </p>
                <p className="text-3xl sm:text-4xl font-bold mb-2">
                  {stats.students}
                </p>
                {(stats.recentStudents || 0) > 0 && (
                  <div className="flex items-center mt-2">
                    <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                      <span className="mr-1">↗️</span> +{stats.recentStudents}{" "}
                      new this week
                    </span>
                  </div>
                )}
                <p className="text-blue-100 text-[10px] sm:text-xs mt-2">
                  Active enrollments
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
                <Lottie animationData={StudentAnimation} loop={true} />
              </div>
            </div>
          </div>

          {/* Teachers Card - Animation Delay 2 */}
          <div
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden "
            style={{ animationDelay: "0.2s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">
                  Total Teachers
                </p>
                <p className="text-3xl sm:text-4xl font-bold mb-2">
                  {stats.teachers}
                </p>
                {(stats.recentTeachers || 0) > 0 && (
                  <div className="flex items-center mt-2">
                    <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                      <span className="mr-1">↗️</span> +{stats.recentTeachers}{" "}
                      new
                    </span>
                  </div>
                )}
                <p className="text-green-100 text-[10px] sm:text-xs mt-2">
                  {stats.activeUsers || 0} active today
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
                <Lottie animationData={TeacherAnimation} loop={true} />
              </div>
            </div>
          </div>

          {/* Courses Card - Animation Delay 3 */}
          <div
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden "
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">
                  Active Courses
                </p>
                <p className="text-3xl sm:text-4xl font-bold mb-2">
                  {stats.courses}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                    📚 This semester
                  </span>
                </div>
                <p className="text-purple-100 text-[10px] sm:text-xs mt-2">
                  Across {stats.departments} departments
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
                <Lottie animationData={CourseAnimation} loop={true} />
              </div>
            </div>
          </div>

          {/* Attendance Card - Animation Delay 4 */}
          <div
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden "
            style={{ animationDelay: "0.4s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">
                  Avg Attendance
                </p>
                <p className="text-3xl sm:text-4xl font-bold mb-2">
                  {stats.todayAttendance}%
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                    <span className="mr-1">↗️</span> +2.3% this week
                  </span>
                </div>
                <p className="text-orange-100 text-[10px] sm:text-xs mt-2">
                  Institution-wide
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
                <Lottie animationData={AttendanceAnimation} loop={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Alerts Section - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          {/* Recent Activity Feed - Mobile Optimized */}
          <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-5 md:p-6 a">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">📋</span>
              <span>Recent Activity</span>
              <span className="ml-auto text-xs text-gray-500 font-normal hidden sm:inline">
                {recentActivities.length} items
              </span>
            </h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md transform hover:-translate-y-1 "
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {activity.lottieAnimation ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <Lottie
                          animationData={activity.lottieAnimation}
                          loop={true}
                        />
                      </div>
                    ) : (
                      <div className="text-2xl sm:text-3xl flex-shrink-0">
                        {activity.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-400 ">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
                  <Lottie animationData={CheckmarkIcon} loop={true} />
                </div>
                <p className="text-xs sm:text-sm font-medium">
                  No recent activity
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Activities will appear here
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats - Mobile Optimized */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-5 md:p-6 ">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">⚡</span>
              Quick Stats
            </h3>
            <div className="space-y-4">
              {/* System Health */}
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h4 className="font-semibold text-green-800 text-sm">
                      System Healthy
                    </h4>
                    <p className="text-xs text-green-700 mt-1">
                      All services operational
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Classes */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📅</span>
                  <div>
                    <h4 className="font-semibold text-blue-800 text-sm">
                      Classes Today
                    </h4>
                    <p className="text-xs text-blue-700 mt-1">
                      28 classes scheduled
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👤</span>
                  <div>
                    <h4 className="font-semibold text-purple-800 text-sm">
                      Active Now
                    </h4>
                    <p className="text-xs text-purple-700 mt-1">
                      {stats.activeUsers} users online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics & Charts Section - Modern Animated Graphs */}
        <h2
          className="text-2xl font-bold text-gray-800 mb-6 flex items-center "
          style={{ animationDelay: "0.6s" }}
        >
          <span className="text-3xl mr-3">📊</span>
          Analytics Dashboard
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          {/* Attendance Trend Line Chart */}
          <div
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-500 "
            style={{ animationDelay: "0.7s" }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">📈</span>
              <span className="text-sm sm:text-base">Attendance Trends</span>
            </h3>
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <Line
                data={attendanceTrendData}
                options={attendanceTrendOptions}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">
              Weekly attendance performance overview
            </p>
          </div>

          {/* Department Distribution Doughnut Chart */}
          <div
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-green-500 "
            style={{ animationDelay: "0.8s" }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">🎯</span>
              <span className="text-sm sm:text-base">
                Department Distribution
              </span>
            </h3>
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <Doughnut data={departmentData} options={departmentOptions} />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">
              Student distribution across departments
            </p>
          </div>

          {/* Monthly Enrollment Bar Chart */}
          <div
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-purple-500 p lg:col-span-2 xl:col-span-1"
            style={{ animationDelay: "0.9s" }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">📊</span>
              <span className="text-sm sm:text-base">Monthly Enrollment</span>
            </h3>
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <Bar data={enrollmentData} options={enrollmentOptions} />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">
              Student and teacher enrollment trends
            </p>
          </div>
        </div>

        {/* Management Sections */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="text-3xl mr-3">🎛️</span>
          Management Portal
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Student Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">👥</span>
              Student Management
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl border border-blue-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">➕</span> Add New Student
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl border border-blue-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">�</span> View All Students
              </button>
              <button
                onClick={() => history.push("/coordinator/student-enrollment")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl border border-blue-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="text-lg mr-2">🎓</span> Student Enrollment
              </button>
              <button
                onClick={() => history.push("/coordinator/smart-data-entry")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl border border-transparent shadow-md transition-all duration-200 hover:translate-x-1 font-semibold"
              >
                <span className="text-lg mr-2">✨</span> Smart Data Entry
              </button>
            </div>
          </div>

          {/* Teacher Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">👨‍🏫</span>
              Teacher Management
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-xl border border-green-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">➕</span> Add New Teacher
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-xl border border-green-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📋</span> View All Teachers
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-xl border border-green-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📚</span> Assign Courses
              </button>
            </div>
          </div>

          {/* Course Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📚</span>
              Course Management
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-xl border border-purple-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">➕</span> Add New Course
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-xl border border-purple-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📋</span> View All Courses
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-xl border border-purple-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">🎓</span> Course Enrollment
              </button>
            </div>
          </div>

          {/* Department Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🏢</span>
              Department Management
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => history.push("/departments")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-xl border border-orange-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="text-lg mr-2">➕</span> Add Department
              </button>
              <button
                onClick={() => history.push("/departments")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-xl border border-orange-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="text-lg mr-2">📋</span> View Departments
              </button>
              <button
                onClick={() => history.push("/departments")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-xl border border-orange-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="text-lg mr-2">📚</span> Manage Semesters
              </button>
              <button
                onClick={() => history.push("/departments")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-xl border border-orange-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="text-lg mr-2">👥</span> Manage Sections
              </button>
              <button
                onClick={() => history.push("/coordinator/student-enrollment")}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-xl border border-orange-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="text-lg mr-2">🎯</span> Enroll to Sections
              </button>
            </div>
          </div>

          {/* Timetable Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-indigo-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📅</span>
              Timetable Management
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 rounded-xl border border-indigo-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">➕</span> Create Timetable
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 rounded-xl border border-indigo-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📋</span> View Schedules
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 rounded-xl border border-indigo-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📊</span> Attendance Reports
              </button>
            </div>
          </div>

          {/* Attendance Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-pink-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">✅</span>
              Attendance Management
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 text-pink-700 rounded-xl border border-pink-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📸</span> Mark Attendance
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 text-pink-700 rounded-xl border border-pink-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📊</span> View Reports
              </button>
              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 text-pink-700 rounded-xl border border-pink-200 transition-all duration-200 hover:translate-x-1">
                <span className="text-lg mr-2">📈</span> Analytics
              </button>
            </div>
          </div>
        </div>

        {/* System Status & Footer */}
        <div className="mt-8 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl shadow-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
            <span className="text-2xl mr-2">🖥️</span>
            System Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Backend API
                </p>
                <p className="text-xs text-green-600">Online • 99.9% uptime</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Database</p>
                <p className="text-xs text-green-600">Connected • Supabase</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Authentication
                </p>
                <p className="text-xs text-green-600">Active • JWT Secured</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-gray-500 text-center">
              Last updated: {new Date().toLocaleString()} • Dashboard v2.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
