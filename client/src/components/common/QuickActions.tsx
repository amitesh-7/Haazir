import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

const quickActionsConfig = {
  coordinator: [
    {
      title: 'Add Student',
      description: 'Register a new student',
      icon: '👥',
      href: '/students',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Reports',
      description: 'Check attendance reports',
      icon: '📊',
      href: '/attendance',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Manage Courses',
      description: 'Create and edit courses',
      icon: '📚',
      href: '/courses',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Setup Timetable',
      description: 'Configure class schedules',
      icon: '🗓️',
      href: '/timetable',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ],
  teacher: [
    {
      title: 'Take Attendance',
      description: 'Mark student attendance',
      icon: '✅',
      href: '/attendance/take',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Schedule',
      description: 'Check your timetable',
      icon: '🗓️',
      href: '/my-timetable',
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ],
  student: [
    {
      title: 'Check Attendance',
      description: 'View your attendance record',
      icon: '📈',
      href: '/attendance/me',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Schedule',
      description: 'Check your class timetable',
      icon: '🗓️',
      href: '/my-timetable',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Update Profile',
      description: 'Edit your information',
      icon: '👤',
      href: '/student/profile',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]
};

const QuickActions: React.FC = () => {
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const quickActions = useMemo(() => {
    if (!user?.role) return [];
    return quickActionsConfig[user.role as keyof typeof quickActionsConfig] || [];
  }, [user?.role]);

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className={`${action.color} text-white rounded-lg p-4 block transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </span>
              <div>
                <h3 className="font-semibold text-sm">{action.title}</h3>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;