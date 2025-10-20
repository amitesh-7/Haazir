import React, { useEffect, useState } from "react";
import { fetchAttendanceHistory } from "../services/api";
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
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface HistoryItem {
  date: string;
  course_code?: string;
  course_name?: string;
  status: "present" | "absent" | "late";
  start_time?: string;
  end_time?: string;
}

interface AttendanceStats {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

const EnhancedStudentAttendance: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
  });

  // Filter states
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "analytics">(
    "list"
  );
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    loadAttendanceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, selectedCourse, selectedMonth, selectedStatus]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      const id = user?.profile?.student_id || user?.user_id || user?.id;
      const data = await fetchAttendanceHistory(String(id));

      console.log("🔍 Raw attendance data from API:", data);
      if (data && data.length > 0) {
        console.log(
          "🔍 First record structure:",
          JSON.stringify(data[0], null, 2)
        );
        console.log("🔍 Timetable:", data[0].timetable);
        console.log("🔍 Course:", data[0].timetable?.course);
      }

      // Normalize data - FIX: Access course through timetable
      const mapped: HistoryItem[] = Array.isArray(data)
        ? data.map((d: any) => {
            // Normalize date to YYYY-MM-DD format (remove time component)
            const rawDate = d.date || d.attendance_date || d.created_at;
            const normalizedDate = rawDate ? rawDate.split("T")[0] : rawDate;

            return {
              date: normalizedDate,
              status: d.status as "present" | "absent" | "late",
              course_code:
                d.timetable?.course?.course_code ||
                d.course?.course_code ||
                d.course_code,
              course_name:
                d.timetable?.course?.course_name ||
                d.course?.course_name ||
                d.course_name,
              start_time: d.timetable?.start_time || d.start_time,
              end_time: d.timetable?.end_time || d.end_time,
            };
          })
        : [];

      console.log("✅ Mapped attendance data:", mapped.length, "records");

      // DEDUPLICATION: Remove duplicates (same date + same course)
      const uniqueRecords = new Map<string, HistoryItem>();

      mapped.forEach((record) => {
        const key = `${record.date}-${record.course_code}`;
        const existing = uniqueRecords.get(key);

        // If no existing record, add it
        if (!existing) {
          uniqueRecords.set(key, record);
        } else {
          // If duplicate exists, prefer 'present' over 'absent'
          if (record.status === "present" && existing.status !== "present") {
            uniqueRecords.set(key, record);
            console.log(
              `🔄 Replaced ${existing.status} with present for ${key}`
            );
          }
        }
      });

      const deduplicated = Array.from(uniqueRecords.values());

      console.log(
        `🎯 Deduplicated: ${mapped.length} → ${deduplicated.length} unique records`
      );

      // Sort by date (newest first)
      deduplicated.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setItems(deduplicated);
      calculateStats(deduplicated);
    } catch (e: any) {
      setError(e?.message || "Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: HistoryItem[]) => {
    const totalClasses = data.length;
    const presentCount = data.filter(
      (item) => item.status === "present"
    ).length;
    const absentCount = data.filter((item) => item.status === "absent").length;
    const lateCount = data.filter((item) => item.status === "late").length;
    const attendanceRate =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    setStats({
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    });
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Filter by course
    if (selectedCourse !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.course_code === selectedCourse ||
          item.course_name === selectedCourse
      );
    }

    // Filter by month
    if (selectedMonth !== "all") {
      filtered = filtered.filter((item) => {
        const itemMonth = new Date(item.date).getMonth().toString();
        return itemMonth === selectedMonth;
      });
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    setFilteredItems(filtered);
  };

  const getUniqueValues = (key: keyof HistoryItem) => {
    const uniqueSet = new Set(items.map((item) => item[key]).filter(Boolean));
    return Array.from(uniqueSet);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return (
          <svg
            className="w-5 h-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "absent":
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414 1.414L11.414 12l1.293 1.293a1 1 0 01-1.414 1.414L10 13.414l-1.293 1.293a1 1 0 01-1.414-1.414L8.586 12 7.293 10.707a1 1 0 011.414-1.414L10 10.586l1.293-1.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "late":
        return (
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
    switch (status) {
      case "present":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "absent":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "late":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Chart data
  const monthlyAttendanceData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Present",
        data: Array.from(
          { length: 12 },
          (_, i) =>
            items.filter((item) => {
              const month = new Date(item.date).getMonth();
              return month === i && item.status === "present";
            }).length
        ),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
      {
        label: "Absent",
        data: Array.from(
          { length: 12 },
          (_, i) =>
            items.filter((item) => {
              const month = new Date(item.date).getMonth();
              return month === i && item.status === "absent";
            }).length
        ),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
      {
        label: "Late",
        data: Array.from(
          { length: 12 },
          (_, i) =>
            items.filter((item) => {
              const month = new Date(item.date).getMonth();
              return month === i && item.status === "late";
            }).length
        ),
        backgroundColor: "rgba(251, 191, 36, 0.8)",
        borderColor: "rgba(251, 191, 36, 1)",
        borderWidth: 1,
      },
    ],
  };

  const overallStatsData = {
    labels: ["Present", "Absent", "Late"],
    datasets: [
      {
        data: [stats.presentCount, stats.absentCount, stats.lateCount],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(251, 191, 36, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(251, 191, 36, 1)",
        ],
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
            Loading attendance data...
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
                  Error loading attendance data
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  onClick={loadAttendanceData}
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            My Attendance 📊
          </h1>
          <p className="text-gray-600 text-lg">
            Track your class attendance and analyze patterns
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalClasses}
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Present</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.presentCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Absent</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.absentCount}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414 1.414L11.414 12l1.293 1.293a1 1 0 01-1.414 1.414L10 13.414l-1.293 1.293a1 1 0 01-1.414-1.414L8.586 12 7.293 10.707a1 1 0 011.414-1.414L10 10.586l1.293-1.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats.attendanceRate}%
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg
                  className="w-8 h-8 text-indigo-600"
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
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-xl p-1">
                <div className="flex space-x-1">
                  {["list", "calendar", "analytics"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${
                        viewMode === mode
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {getUniqueValues("course_name").map((course) => (
                  <option key={course} value={course as string}>
                    {course}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Months</option>
                {[
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ].map((month, index) => (
                  <option key={month} value={index.toString()}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>

              <button
                onClick={() => {
                  setSelectedCourse("all");
                  setSelectedMonth("all");
                  setSelectedStatus("all");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === "analytics" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Monthly Attendance Trend
              </h3>
              <div className="h-80">
                <Bar
                  data={monthlyAttendanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Overall Stats Pie Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Overall Distribution
              </h3>
              <div className="h-80">
                <Doughnut
                  data={overallStatsData}
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
          </div>
        ) : (
          /* List/Calendar View */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Records ({filteredItems.length} records)
              </h3>
            </div>

            {filteredItems.length === 0 ? (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">
                  No attendance records found
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your filters or contact your instructor
                </p>
              </div>
            ) : (
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
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item, idx) => {
                      const date = new Date(item.date);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {date.toLocaleDateString("en-US", {
                                weekday: "long",
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.course_name || "Unknown Course"}
                            </div>
                            {item.course_code && (
                              <div className="text-sm text-gray-500">
                                {item.course_code}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.start_time && item.end_time ? (
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">
                                  {new Date(
                                    `2000-01-01T${item.start_time}`
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">to</div>
                                <div className="font-medium">
                                  {new Date(
                                    `2000-01-01T${item.end_time}`
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Not available
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(item.status)}
                              <span
                                className={`ml-2 ${getStatusBadge(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {date.toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedStudentAttendance;
