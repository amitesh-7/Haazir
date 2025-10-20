import React, { useEffect, useState } from 'react';
import { getDashboardStats, getSystemHealth } from '../../services/api';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';
import QuickActions from '../common/QuickActions';
import type { DashboardStats, SystemHealth } from '../../services/api';

// Enhanced KPI Card Component
interface KPICardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend, 
  description 
}) => (
  <div className={`${color} rounded-xl p-6 text-white relative overflow-hidden`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold mb-2">{value}</p>
        {description && (
          <p className="text-white/70 text-xs">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs flex items-center ${
              trend.isPositive ? 'text-white/90' : 'text-white/70'
            }`}>
              {trend.isPositive ? '↗️' : '↘️'} {Math.abs(trend.value)}%
            </span>
            <span className="text-white/60 text-xs ml-2">vs last month</span>
          </div>
        )}
      </div>
      <div className="text-4xl opacity-80">
        {icon}
      </div>
    </div>
    
    {/* Decorative background pattern */}
    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10"></div>
  </div>
);

// Alert Component
interface AlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, title, message, onDismiss }) => {
  const alertStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
  };

  return (
    <div className={`border rounded-lg p-4 ${alertStyles[type]} flex items-start space-x-3`}>
      <span className="text-lg flex-shrink-0">{icons[type]}</span>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Recent Activity Card Component
interface RecentActivityProps {
  title: string;
  items: Array<{
    id: number;
    name: string;
    subtitle: string;
    timestamp: string;
    avatar?: string;
  }>;
  emptyMessage: string;
  onViewAll?: () => void;
}

const RecentActivityCard: React.FC<RecentActivityProps> = ({ 
  title, 
  items, 
  emptyMessage, 
  onViewAll 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </button>
      )}
    </div>
    
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {item.avatar || item.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
              <p className="text-gray-500 text-xs truncate">{item.subtitle}</p>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(item.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      )}
    </div>
  </div>
);

// Department Stats Component
interface DepartmentStatsProps {
  departments: Array<{
    department_name: string;
    student_count: number;
  }>;
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ departments }) => {
  const total = departments.reduce((sum, dept) => sum + parseInt(dept.student_count.toString()), 0);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Students by Department</h3>
      
      <div className="space-y-3">
        {departments.map((dept) => {
          const percentage = total > 0 ? (parseInt(dept.student_count.toString()) / total) * 100 : 0;
          
          return (
            <div key={dept.department_name} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{dept.department_name}</span>
                  <span className="text-gray-600">{dept.student_count} students</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// System Health Status Component
const SystemHealthBadge: React.FC<{ health: SystemHealth | null }> = ({ health }) => {
  if (!health) return null;

  const isHealthy = health.status === 'healthy';
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isHealthy 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        isHealthy ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      System {isHealthy ? 'Healthy' : 'Issues'}
    </div>
  );
};

// Utility function to format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

// Main Dashboard Component
const EnhancedDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'info' | 'warning' | 'error' | 'success'; title: string; message: string; }>>([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResp, healthResp] = await Promise.all([
        getDashboardStats(),
        getSystemHealth(),
      ]);
      
      setStats(statsResp);
      setHealth(healthResp);
      
      // Generate alerts based on data
      generateAlerts(statsResp, healthResp);
      
      showToast('success', 'Dashboard data loaded successfully!', 3000);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (dashboardStats: DashboardStats, systemHealth: SystemHealth) => {
    const newAlerts: typeof alerts = [];

    // System health alert
    if (systemHealth.status !== 'healthy') {
      newAlerts.push({
        id: 'system-health',
        type: 'error',
        title: 'System Health Warning',
        message: 'System is experiencing issues. Please check logs.',
      });
    }

    // Low department enrollment alert
    const lowEnrollmentDepts = dashboardStats.statistics.departmentBreakdown?.filter(
      dept => parseInt(dept.student_count.toString()) < 5
    );
    
    if (lowEnrollmentDepts && lowEnrollmentDepts.length > 0) {
      newAlerts.push({
        id: 'low-enrollment',
        type: 'warning',
        title: 'Low Department Enrollment',
        message: `${lowEnrollmentDepts.length} department(s) have fewer than 5 students enrolled.`,
      });
    }

    // New users welcome alert
    if (dashboardStats.overview.activeUsers > 10) {
      newAlerts.push({
        id: 'active-users',
        type: 'success',
        title: 'High User Activity',
        message: `${dashboardStats.overview.activeUsers} users have been active in the last 30 days.`,
      });
    }

    setAlerts(newAlerts);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, Administrator! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with Haazir today.
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <SystemHealthBadge health={health} />
            <button 
              onClick={loadDashboardData}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Students"
            value={stats?.overview.totalStudents ?? 0}
            icon="👥"
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            trend={{ value: 12, isPositive: true }}
            description="Enrolled across all departments"
          />
          <KPICard
            title="Active Teachers"
            value={stats?.overview.totalTeachers ?? 0}
            icon="👨‍🏫"
            color="bg-gradient-to-r from-green-500 to-green-600"
            trend={{ value: 3, isPositive: true }}
            description="Currently teaching"
          />
          <KPICard
            title="Courses"
            value={stats?.overview.totalCourses ?? 0}
            icon="📚"
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            trend={{ value: 8, isPositive: true }}
            description="Active this semester"
          />
          <KPICard
            title="Departments"
            value={stats?.overview.totalDepartments ?? 0}
            icon="🏢"
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            description="Academic divisions"
          />
        </div>

        {/* Recent Activity and Department Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RecentActivityCard
              title="Recent Students"
              items={stats?.recentActivity.recentStudents?.map(student => ({
                id: student.id,
                name: student.name,
                subtitle: `${student.rollNumber} • ${student.department}`,
                timestamp: student.createdAt
              })) || []}
              emptyMessage="No recent student registrations"
              onViewAll={() => window.location.href = '/students'}
            />
          </div>
          
          <div className="lg:col-span-1">
            <RecentActivityCard
              title="Recent Teachers"
              items={stats?.recentActivity.recentTeachers?.map(teacher => ({
                id: teacher.id,
                name: teacher.name,
                subtitle: `${teacher.email} • ${teacher.department}`,
                timestamp: teacher.createdAt
              })) || []}
              emptyMessage="No recent teacher registrations"
              onViewAll={() => window.location.href = '/teachers'}
            />
          </div>
          
          <div className="lg:col-span-1">
            <DepartmentStats 
              departments={stats?.statistics.departmentBreakdown || []}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">Haazir Dashboard v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;