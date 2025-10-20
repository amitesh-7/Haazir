import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Download, 
  Filter, 
  Users, 
  CheckCircle, 
  XCircle,
  Smartphone,
  ClipboardCheck,
  TrendingUp,
  Clock,
  Search,
  RefreshCw,
  BarChart2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getTeacherUnifiedAttendanceHistory } from '../../services/api';
import AttendanceCharts from './AttendanceCharts';

interface UnifiedAttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  course_name: string;
  course_code: string;
  date: string;
  status: 'present' | 'absent';
  method: 'manual' | 'smart';
  time_slot?: string;
  verified_by_face?: boolean;
  confidence_score?: number;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  manual: number;
  smart: number;
  attendance_rate: number;
}

const UnifiedAttendanceHistory: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const teacherId = user?.teacherId || user?.teacher_id || user?.profile?.teacher_id;

  const [records, setRecords] = useState<UnifiedAttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<UnifiedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(true); // Toggle for charts visibility
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    manual: 0,
    smart: 0,
    attendance_rate: 0,
  });

  // Filters
  const [methodFilter, setMethodFilter] = useState<'all' | 'manual' | 'smart'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch data
  useEffect(() => {
    if (teacherId) {
      loadAttendanceHistory();
    }
  }, [teacherId, dateRange]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [records, methodFilter, statusFilter, searchQuery]);

  const loadAttendanceHistory = async () => {
    setLoading(true);
    try {
      const data = await getTeacherUnifiedAttendanceHistory(teacherId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      setRecords(data.records || []);
      calculateStats(data.records || []);
    } catch (error) {
      console.error('Error loading unified attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UnifiedAttendanceRecord[]) => {
    const total = data.length;
    const present = data.filter(r => r.status === 'present').length;
    const absent = data.filter(r => r.status === 'absent').length;
    const manual = data.filter(r => r.method === 'manual').length;
    const smart = data.filter(r => r.method === 'smart').length;
    const attendance_rate = total > 0 ? (present / total) * 100 : 0;

    setStats({ total, present, absent, manual, smart, attendance_rate });
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(r => r.method === methodFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.student_name.toLowerCase().includes(query) ||
        r.roll_number.toLowerCase().includes(query) ||
        r.course_name.toLowerCase().includes(query) ||
        r.course_code.toLowerCase().includes(query)
      );
    }

    setFilteredRecords(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Student Name', 'Roll Number', 'Course', 'Status', 'Method', 'Face Verified'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.student_name,
      r.roll_number,
      `${r.course_code} - ${r.course_name}`,
      r.status.toUpperCase(),
      r.method.toUpperCase(),
      r.verified_by_face ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unified_attendance_${dateRange.startDate}_${dateRange.endDate}.csv`;
    a.click();
  };

  const getMethodBadge = (method: 'manual' | 'smart') => {
    if (method === 'smart') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          <Smartphone className="w-3 h-3 mr-1" />
          Smart
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <ClipboardCheck className="w-3 h-3 mr-1" />
        Manual
      </span>
    );
  };

  const getStatusBadge = (status: 'present' | 'absent') => {
    if (status === 'present') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Present
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3 h-3 mr-1" />
        Absent
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="inline-block w-8 h-8 mr-3" />
            Unified Attendance History
          </h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            View and manage both Manual and Smart attendance records
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Records */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </motion.div>

          {/* Present */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </motion.div>

          {/* Absent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </motion.div>

          {/* Smart Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Smart</p>
                <p className="text-2xl font-bold text-gray-900">{stats.smart}</p>
              </div>
              <Smartphone className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </motion.div>

          {/* Manual Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Manual</p>
                <p className="text-2xl font-bold text-gray-900">{stats.manual}</p>
              </div>
              <ClipboardCheck className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Charts Toggle Button */}
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCharts(!showCharts)}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              showCharts
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500'
            }`}
          >
            {showCharts ? (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Hide Charts
              </>
            ) : (
              <>
                <BarChart2 className="w-5 h-5 mr-2" />
                Show Charts
              </>
            )}
          </motion.button>
        </div>

        {/* Charts Section */}
        <AnimatePresence>
          {showCharts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <AttendanceCharts records={filteredRecords} theme={theme} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Student name, roll number, course..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Method
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="smart">Smart Only</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={loadAttendanceHistory}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>

            <div className="ml-auto text-sm text-gray-600 self-center">
              Showing {filteredRecords.length} of {records.length} records
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading attendance records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No attendance records found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or date range</p>
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
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredRecords.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                          <div className="text-sm text-gray-500">{record.roll_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.course_code}</div>
                          <div className="text-sm text-gray-500">{record.course_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getMethodBadge(record.method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.method === 'smart' && record.verified_by_face && (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Face Verified
                            </span>
                          )}
                          {record.time_slot && (
                            <span className="flex items-center text-gray-500 mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {record.time_slot}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance Rate Card */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Overall Attendance Rate</h3>
                <p className="text-blue-100">
                  Based on {stats.total} records ({stats.manual} manual, {stats.smart} smart)
                </p>
              </div>
              <div className="text-5xl font-bold">
                {stats.attendance_rate.toFixed(1)}%
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UnifiedAttendanceHistory;
