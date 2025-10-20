import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

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
import AttendanceIcon from '../../assets/lottie/Attendance-icon.json';
import CheckmarkIcon from '../../assets/lottie/checkmark-circle.json';
import StudentIcon from '../../assets/lottie/STUDENT.json';
import AnalyticsIcon from '../../assets/lottie/analytics-icon.json';

interface AttendanceStats {
  todayPresent: number;
  todayAbsent: number;
  todayPercentage: number;
  weeklyAverage: number;
  totalStudents: number;
  lowAttendanceAlerts: number;
}

interface RecentAttendance {
  id: number;
  courseName: string;
  section: string;
  date: string;
  present: number;
  total: number;
  percentage: number;
  teacher: string;
}

const AttendancePage: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({
    todayPresent: 0,
    todayAbsent: 0,
    todayPercentage: 0,
    weeklyAverage: 0,
    totalStudents: 0,
    lowAttendanceAlerts: 0
  });
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      setTimeout(() => {
        setStats({
          todayPresent: 847,
          todayAbsent: 153,
          todayPercentage: 84.7,
          weeklyAverage: 86.2,
          totalStudents: 1000,
          lowAttendanceAlerts: 23
        });

        setRecentAttendance([
          {
            id: 1,
            courseName: 'Data Structures',
            section: 'CS-A',
            date: new Date().toISOString(),
            present: 45,
            total: 50,
            percentage: 90,
            teacher: 'Dr. Smith'
          },
          {
            id: 2,
            courseName: 'Operating Systems',
            section: 'CS-B',
            date: new Date().toISOString(),
            present: 38,
            total: 48,
            percentage: 79.2,
            teacher: 'Dr. Johnson'
          },
          {
            id: 3,
            courseName: 'Database Management',
            section: 'IT-A',
            date: new Date().toISOString(),
            present: 42,
            total: 45,
            percentage: 93.3,
            teacher: 'Prof. Williams'
          },
          {
            id: 4,
            courseName: 'Computer Networks',
            section: 'CS-C',
            date: new Date().toISOString(),
            present: 35,
            total: 52,
            percentage: 67.3,
            teacher: 'Dr. Brown'
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setLoading(false);
    }
  };

  // Chart Data - Weekly Attendance Trend
  const weeklyTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Attendance %',
        data: [88, 85, 87, 84, 86, 89],
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const weeklyTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(16, 185, 129)',
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
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: {
          callback: (value: any) => value + '%',
          font: { size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
  };

  // Department-wise Attendance Doughnut
  const departmentData = {
    labels: ['Computer Science', 'Information Tech', 'Electronics', 'Mechanical', 'Civil'],
    datasets: [
      {
        data: [88, 85, 82, 86, 84],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(168, 85, 247)',
          'rgb(251, 146, 60)',
          'rgb(236, 72, 153)',
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
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed}%`,
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
          <div className="w-24 h-24">
            <Lottie animationData={AttendanceIcon} loop={true} />
          </div>
          <div className="text-xl font-semibold text-gray-700">Loading Attendance Data...</div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      {/* Import CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out 0.5s forwards;
          opacity: 0;
        }
        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out 0.5s forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              📊 Attendance Management
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">
              Monitor and manage student attendance across all departments
            </p>
          </div>
          <button
            onClick={() => history.push('/attendance/reports')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center"
          >
            <span className="text-lg sm:text-xl">📈</span>
            <span className="text-sm sm:text-base">View Detailed Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
        {/* Today's Attendance Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Today's Attendance</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{stats.todayPercentage}%</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                  ✓ {stats.todayPresent} Present
                </span>
              </div>
              <p className="text-green-100 text-[10px] sm:text-xs mt-2">Out of {stats.totalStudents} students</p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={CheckmarkIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Weekly Average Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Weekly Average</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{stats.weeklyAverage}%</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                  <span className="mr-1">↗️</span> +1.5% from last week
                </span>
              </div>
              <p className="text-blue-100 text-[10px] sm:text-xs mt-2">Consistent performance</p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={AnalyticsIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Total Students Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Total Students</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{stats.totalStudents}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                  👥 All departments
                </span>
              </div>
              <p className="text-purple-100 text-[10px] sm:text-xs mt-2">Active enrollments</p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={StudentIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Low Attendance Alerts Card */}
        <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.4s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-red-100 text-xs sm:text-sm font-medium mb-1">Low Attendance Alerts</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{stats.lowAttendanceAlerts}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                  <span className="animate-pulse-slow mr-1">⚠️</span> Needs attention
                </span>
              </div>
              <p className="text-red-100 text-[10px] sm:text-xs mt-2">Below 75% threshold</p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={AttendanceIcon} loop={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
        {/* Weekly Trend Line Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-green-500 animate-slideInLeft">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">📈</span>
            <span className="text-sm sm:text-base">Weekly Attendance Trend</span>
          </h3>
          <div className="h-[250px] sm:h-[280px] md:h-[300px]">
            <Line data={weeklyTrendData} options={weeklyTrendOptions} />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">
            Institution-wide attendance for the current week
          </p>
        </div>

        {/* Department-wise Doughnut Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-500 animate-slideInRight">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">🎯</span>
            <span className="text-sm sm:text-base">Department-wise Attendance</span>
          </h3>
          <div className="h-[250px] sm:h-[280px] md:h-[300px]">
            <Doughnut data={departmentData} options={departmentOptions} />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">
            Average attendance percentage by department
          </p>
        </div>
      </div>

      {/* Recent Attendance & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Recent Attendance Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-5 md:p-6 animate-slideInUp" style={{animationDelay: '0.5s'}}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">📋</span>
            <span>Recent Attendance Records</span>
            <span className="ml-auto text-xs text-gray-500 font-normal hidden sm:inline">{recentAttendance.length} recent</span>
          </h3>
          <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
            {recentAttendance.map((record, index) => (
              <div
                key={record.id}
                className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md transform hover:-translate-y-1 animate-fadeIn"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md">
                  {record.percentage.toFixed(0)}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{record.courseName}</p>
                      <p className="text-xs text-gray-600">Section: {record.section} • Teacher: {record.teacher}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      record.percentage >= 85 ? 'bg-green-100 text-green-700' :
                      record.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {record.present}/{record.total}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                    {new Date(record.date).toLocaleDateString()} • {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-5 md:p-6 animate-slideInUp" style={{animationDelay: '0.6s'}}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">⚡</span>
            <span>Quick Actions</span>
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => history.push('/attendance/reports')}
              className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-xl border border-blue-200 transition-all duration-200 hover:translate-x-1 font-medium shadow-sm hover:shadow-md flex items-center gap-3"
            >
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-semibold">View Detailed Reports</div>
                <div className="text-xs text-blue-600">Course-wise analytics</div>
              </div>
            </button>

            <button
              onClick={() => alert('Export functionality coming soon!')}
              className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 rounded-xl border border-green-200 transition-all duration-200 hover:translate-x-1 font-medium shadow-sm hover:shadow-md flex items-center gap-3"
            >
              <span className="text-2xl">📥</span>
              <div>
                <div className="font-semibold">Export Attendance</div>
                <div className="text-xs text-green-600">Download CSV/Excel</div>
              </div>
            </button>

            <button
              onClick={() => alert('Low attendance alerts feature coming soon!')}
              className="w-full text-left px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-xl border border-red-200 transition-all duration-200 hover:translate-x-1 font-medium shadow-sm hover:shadow-md flex items-center gap-3"
            >
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold">Low Attendance Alerts</div>
                <div className="text-xs text-red-600">{stats.lowAttendanceAlerts} students below 75%</div>
              </div>
            </button>

            <button
              onClick={() => alert('Send notifications feature coming soon!')}
              className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 rounded-xl border border-purple-200 transition-all duration-200 hover:translate-x-1 font-medium shadow-sm hover:shadow-md flex items-center gap-3"
            >
              <span className="text-2xl">🔔</span>
              <div>
                <div className="font-semibold">Send Notifications</div>
                <div className="text-xs text-purple-600">Alert students & parents</div>
              </div>
            </button>
          </div>

          {/* System Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">System Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-600 font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;