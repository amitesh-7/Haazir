import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { api } from "../../services/api";

interface Warning {
  type: "critical" | "warning" | "info";
  message: string;
}

interface AttendanceAnalytics {
  overall: {
    total_classes: number;
    present_count: number;
    absent_count: number;
    attendance_percentage: number;
  };
  courseWise: Array<{
    course_name: string;
    course_code: string;
    total_classes: number;
    present_count: number;
    attendance_percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    total_classes: number;
    present_count: number;
    attendance_percentage: number;
  }>;
  warnings: Warning[];
}

const EnhancedStudentDashboard: React.FC = () => {
  const history = useHistory();
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get("/analytics/student");
        setAnalytics(response.data);
      } catch (err: any) {
        console.error("Error loading analytics:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const downloadReport = async () => {
    try {
      const response = await api.get("/analytics/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your attendance analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-gray-800">No attendance data available</div>
      </div>
    );
  }

  const overallPercentage = analytics.overall.attendance_percentage || 0;
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 85) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 85) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          My Attendance Dashboard
        </h1>
        <button
          onClick={downloadReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Download Report
        </button>
      </div>

      {/* Warnings Section */}
      {analytics.warnings.length > 0 && (
        <div className="space-y-2">
          {analytics.warnings.map((warning, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                warning.type === "critical"
                  ? "bg-red-50 border-red-200"
                  : warning.type === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center">
                <span
                  className={`text-lg mr-2 ${
                    warning.type === "critical"
                      ? "text-red-600"
                      : warning.type === "warning"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}
                >
                  {warning.type === "critical"
                    ? "⚠️"
                    : warning.type === "warning"
                    ? "⚠️"
                    : "ℹ️"}
                </span>
                <span
                  className={`font-medium ${
                    warning.type === "critical"
                      ? "text-red-800"
                      : warning.type === "warning"
                      ? "text-yellow-800"
                      : "text-blue-800"
                  }`}
                >
                  {warning.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Attendance Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Overall Attendance</h2>
        <div className="flex items-center space-x-6">
          <div className="relative w-32 h-32">
            <svg
              className="w-32 h-32 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${overallPercentage * 2.51} 251`}
                className={getPercentageColor(overallPercentage)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-2xl font-bold ${getPercentageColor(
                  overallPercentage
                )}`}
              >
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">
              {analytics.overall.present_count} /{" "}
              {analytics.overall.total_classes}
            </div>
            <div className="text-gray-600">Classes Attended</div>
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600">
                Present: {analytics.overall.present_count}
              </span>
              <span className="text-red-600">
                Absent: {analytics.overall.absent_count}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course-wise Attendance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Course-wise Attendance</h2>
        <div className="space-y-4">
          {analytics.courseWise.map((course, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {course.course_name}
                  </h3>
                  <p className="text-sm text-gray-600">{course.course_code}</p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-semibold ${getPercentageColor(
                      course.attendance_percentage
                    )}`}
                  >
                    {course.attendance_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.present_count} / {course.total_classes}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getPercentageBg(
                    course.attendance_percentage
                  )}`}
                  style={{
                    width: `${Math.min(course.attendance_percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      {analytics.monthlyTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Monthly Attendance Trend
          </h2>
          <div className="space-y-3">
            {analytics.monthlyTrend.map((month, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <div className="font-medium text-gray-900">
                  {new Date(month.month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {month.present_count} / {month.total_classes}
                  </span>
                  <span
                    className={`font-semibold ${getPercentageColor(
                      month.attendance_percentage
                    )}`}
                  >
                    {month.attendance_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => history.push("/student/smart-attendance")}
            className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors bg-gradient-to-r from-green-50 to-blue-50"
          >
            <div className="text-2xl mb-2">📱</div>
            <div className="font-medium text-green-700">Scan QR Code</div>
            <div className="text-xs text-gray-600 mt-1">Mark Attendance</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium">View Timetable</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Detailed Analytics</div>
          </button>
          <button
            onClick={downloadReport}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📥</div>
            <div className="font-medium">Download Report</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;
