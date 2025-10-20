import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/api';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { DonutChart, BarChart, LineChart, StatsCard, ProgressRing } from '../common/Charts';
import type { DashboardStats } from '../../services/api';

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      showToast('error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Analytics data could not be loaded.</p>
          <button 
            onClick={loadAnalytics}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const departmentData = stats.statistics.departmentBreakdown?.map((dept, index) => ({
    label: dept.department_name,
    value: parseInt(dept.student_count.toString()),
    color: `hsl(${(index * 137.508) % 360}, 70%, 60%)`
  })) || [];

  const enrollmentData = [
    { label: 'Students', value: stats.overview.totalStudents },
    { label: 'Teachers', value: stats.overview.totalTeachers },
    { label: 'Courses', value: stats.overview.totalCourses },
    { label: 'Departments', value: stats.overview.totalDepartments }
  ];

  // Mock data for time-based analytics (in a real app, this would come from API)
  const monthlyTrend = [
    { label: 'Jan', value: Math.max(0, stats.overview.totalStudents - 50) },
    { label: 'Feb', value: Math.max(0, stats.overview.totalStudents - 35) },
    { label: 'Mar', value: Math.max(0, stats.overview.totalStudents - 20) },
    { label: 'Apr', value: Math.max(0, stats.overview.totalStudents - 10) },
    { label: 'May', value: stats.overview.totalStudents },
    { label: 'Jun', value: stats.overview.totalStudents + 5 }
  ];

  const attendanceRate = 87; // Mock data
  const systemHealth = 95; // Mock data
  const userSatisfaction = 92; // Mock data

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive insights into your institution's performance
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex bg-white rounded-lg p-1 border">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
            
            <button 
              onClick={loadAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Enrollment"
            value={stats.overview.totalStudents}
            change={{ value: 12, type: 'increase' }}
            icon="👥"
            color="bg-blue-100"
          />
          
          <StatsCard
            title="Active Teachers"
            value={stats.overview.totalTeachers}
            change={{ value: 3, type: 'increase' }}
            icon="👨‍🏫"
            color="bg-green-100"
          />
          
          <StatsCard
            title="Course Offerings"
            value={stats.overview.totalCourses}
            change={{ value: 8, type: 'increase' }}
            icon="📚"
            color="bg-purple-100"
          />
          
          <StatsCard
            title="Departments"
            value={stats.overview.totalDepartments}
            icon="🏢"
            color="bg-orange-100"
          />
        </div>

        {/* Progress Rings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <ProgressRing
                percentage={attendanceRate}
                size={120}
                strokeWidth={8}
                color="#059669"
                label="Attendance"
              />
              <p className="mt-2 text-sm text-gray-600">Average attendance rate</p>
            </div>
            
            <div className="text-center">
              <ProgressRing
                percentage={systemHealth}
                size={120}
                strokeWidth={8}
                color="#2563eb"
                label="System Health"
              />
              <p className="mt-2 text-sm text-gray-600">Overall system performance</p>
            </div>
            
            <div className="text-center">
              <ProgressRing
                percentage={userSatisfaction}
                size={120}
                strokeWidth={8}
                color="#7c3aed"
                label="Satisfaction"
              />
              <p className="mt-2 text-sm text-gray-600">User satisfaction score</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart
            data={departmentData}
            title="Students by Department"
          />
          
          <BarChart
            data={enrollmentData}
            title="Enrollment Overview"
            color="bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <LineChart
            data={monthlyTrend}
            title="Student Enrollment Trend"
          />
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Departments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Departments</h3>
            <div className="space-y-3">
              {departmentData
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((dept, index) => (
                  <div key={dept.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                      <span className="font-medium text-gray-900">{dept.label}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                      {dept.value} students
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New student registered</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Attendance recorded</p>
                  <p className="text-xs text-gray-500">12 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New course created</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Report generated</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Users (30d)</span>
                <span className="font-semibold text-gray-900">{stats.overview.activeUsers}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Class Size</span>
                <span className="font-semibold text-gray-900">
                  {stats.overview.totalCourses > 0 ? Math.round(stats.overview.totalStudents / stats.overview.totalCourses) : 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Student-Teacher Ratio</span>
                <span className="font-semibold text-gray-900">
                  {stats.overview.totalTeachers > 0 ? Math.round(stats.overview.totalStudents / stats.overview.totalTeachers) : 0}:1
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Departments Active</span>
                <span className="font-semibold text-gray-900">{stats.overview.totalDepartments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
          
          <div className="flex flex-wrap gap-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              📊 Export Analytics Report
            </button>
            
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              📈 Generate Trend Report
            </button>
            
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              📋 Department Summary
            </button>
            
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              📧 Email Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;