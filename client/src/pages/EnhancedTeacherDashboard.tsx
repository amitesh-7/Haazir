import React, { useState, useEffect } from "react";
import { getTeacherCourses } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useHistory } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
  Award,
  Target,
  ArrowUp,
  ArrowDown,
  Play,
  BookMarked,
  GraduationCap,
  ClipboardCheck,
  TrendingDown,
  Star,
  Zap,
  Smartphone,
  History,
  Sparkles,
} from "lucide-react";

interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_name?: string;
  section?: string;
}

// Analytics Colors
const COLORS = {
  primary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
};

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

const EnhancedTeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock Analytics Data (Replace with real API calls)
  const attendanceData = [
    { month: "Jan", present: 92, absent: 8 },
    { month: "Feb", present: 88, absent: 12 },
    { month: "Mar", present: 95, absent: 5 },
    { month: "Apr", present: 90, absent: 10 },
    { month: "May", present: 93, absent: 7 },
    { month: "Jun", present: 96, absent: 4 },
  ];

  const performanceData = [
    { subject: "Math", avgScore: 85, target: 80 },
    { subject: "Physics", avgScore: 78, target: 75 },
    { subject: "Chemistry", avgScore: 82, target: 80 },
    { subject: "Biology", avgScore: 88, target: 85 },
    { subject: "English", avgScore: 90, target: 85 },
  ];

  const weeklyTrend = [
    { day: "Mon", attendance: 95, performance: 82 },
    { day: "Tue", attendance: 92, performance: 85 },
    { day: "Wed", attendance: 88, performance: 80 },
    { day: "Thu", attendance: 94, performance: 88 },
    { day: "Fri", attendance: 96, performance: 90 },
    { day: "Sat", attendance: 90, performance: 86 },
  ];

  const courseDistribution = [
    { name: "CSE101", value: 45 },
    { name: "CSE102", value: 38 },
    { name: "CSE103", value: 52 },
    { name: "CSE104", value: 41 },
  ];

  const studentEngagement = [
    { category: "Participation", score: 85 },
    { category: "Assignment", score: 90 },
    { category: "Attendance", score: 95 },
    { category: "Performance", score: 82 },
    { category: "Improvement", score: 88 },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const teacherId = user?.user_id || user?.id;
        if (teacherId) {
          const data = await getTeacherCourses(teacherId);
          setCourses(data);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user]);

  const statsCards = [
    {
      title: "Total Students",
      value: "248",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Avg Attendance",
      value: "94.2%",
      change: "+2.3%",
      trend: "up",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Active Courses",
      value: courses.length.toString(),
      change: "0%",
      trend: "neutral",
      icon: BookOpen,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Avg Performance",
      value: "84.6%",
      change: "+5.1%",
      trend: "up",
      icon: Award,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const todayClasses = [
    {
      time: "09:00 AM",
      course: "CSE101 - Data Structures",
      room: "Room 301",
      students: 45,
      status: "completed",
    },
    {
      time: "11:00 AM",
      course: "CSE102 - Algorithms",
      room: "Room 205",
      students: 38,
      status: "ongoing",
    },
    {
      time: "02:00 PM",
      course: "CSE103 - Database Systems",
      room: "Room 401",
      students: 52,
      status: "upcoming",
    },
  ];

  const quickActions = [
    {
      icon: Smartphone,
      label: "Smart Attendance",
      description: "QR + Face Recognition",
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
      action: () => history.push("/teacher/smart-attendance"),
      badge: "AI",
    },
    {
      icon: ClipboardCheck,
      label: "Manual Attendance",
      description: "Traditional Roll Call",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      action: () => history.push("/attendance/take"),
    },
    {
      icon: Calendar,
      label: "View Schedule",
      description: "My Timetable",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      action: () => history.push("/my-timetable"),
    },
    {
      icon: History,
      label: "Attendance History",
      description: "Past Records",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      action: () => history.push("/teacher/attendance/history"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, {user?.name || "Teacher"}! 👋
              </h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{currentTime.toLocaleDateString("en-US", { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </p>
            </div>

            {/* Right Section - Clock */}
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-2xl border border-blue-200">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="text-gray-700">
                <div className="text-2xl font-bold">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Feature Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  🚀 New: Smart Attendance with AI Face Recognition
                </h3>
                <p className="text-purple-100">
                  Take attendance 10x faster with QR scanning & automatic face verification
                </p>
              </div>
            </div>
            <button
              onClick={() => history.push('/teacher/smart-attendance')}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 whitespace-nowrap"
            >
              Try Now →
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      stat.trend === "up"
                        ? "bg-green-100 text-green-700"
                        : stat.trend === "down"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : stat.trend === "down" ? (
                      <ArrowDown className="w-3 h-3" />
                    ) : null}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative`}
              >
                {action.badge && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {action.badge}
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-10 h-10 opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold mb-1">{action.label}</p>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Attendance Methods Comparison */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border border-purple-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Zap className="w-6 h-6 text-purple-600" />
            <span>Choose Your Attendance Method</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Smart Attendance Card */}
            <div className="bg-white rounded-xl p-5 border-2 border-purple-300 relative">
              <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                RECOMMENDED
              </div>
              <div className="flex items-start space-x-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Smart Attendance</h4>
                  <p className="text-sm text-gray-600">AI-Powered QR + Face Recognition</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Automated QR scanning</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Face verification (anti-proxy)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Real-time monitoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Best for: Large classes (50+)</span>
                </li>
              </ul>
              <button
                onClick={() => history.push('/teacher/smart-attendance')}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Start Smart Attendance
              </button>
            </div>

            {/* Manual Attendance Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-300">
              <div className="flex items-start space-x-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ClipboardCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Manual Attendance</h4>
                  <p className="text-sm text-gray-600">Traditional Roll Call</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Simple point-and-click</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No setup required</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Works offline</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Best for: Small classes (&lt;30)</span>
                </li>
              </ul>
              <button
                onClick={() => history.push('/attendance/take')}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Take Manual Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Today's Classes</span>
            </h2>
          </div>
          <div className="space-y-4">
            {todayClasses.map((cls, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cls.course}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{cls.time}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{cls.room}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{cls.students} students</span>
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    cls.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : cls.status === "ongoing"
                      ? "bg-blue-100 text-blue-700 animate-pulse"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {cls.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Attendance Trend</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                  name="Present %"
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                  name="Absent %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Performance Overview</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="subject" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#8b5cf6" name="Average Score" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#ec4899" name="Target" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* More Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span>Weekly Trend</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Attendance %"
                  dot={{ fill: "#3b82f6", r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Performance %"
                  dot={{ fill: "#f59e0b", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Course Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <BookMarked className="w-5 h-5 text-orange-600" />
              <span>Student Distribution</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Engagement Radar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Student Engagement Analysis</span>
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={studentEngagement}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" stroke="#6b7280" />
              <PolarRadiusAxis stroke="#6b7280" />
              <Radar
                name="Engagement Score"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Your Courses */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Your Courses</span>
          </h2>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {course.course_code}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {course.course_name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {course.department_name && (
                      <p className="flex items-center space-x-2">
                        <BookMarked className="w-4 h-4" />
                        <span>{course.department_name}</span>
                      </p>
                    )}
                    {course.section && (
                      <p className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Section {course.section}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No courses assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedTeacherDashboard;
