import React from 'react';

interface EmptyStateProps {
  icon?: 'search' | 'data' | 'error' | 'success' | 'calendar' | 'users' | 'courses' | 'attendance' | 'custom';
  customIcon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'data',
  customIcon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: { container: 'py-8', icon: 'w-12 h-12', title: 'text-lg', desc: 'text-sm' },
    md: { container: 'py-12', icon: 'w-16 h-16', title: 'text-xl', desc: 'text-base' },
    lg: { container: 'py-16', icon: 'w-24 h-24', title: 'text-2xl', desc: 'text-lg' },
  };

  const icons = {
    search: (
      <svg className={`${sizeClasses[size].icon} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    data: (
      <svg className={`${sizeClasses[size].icon} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    error: (
      <svg className={`${sizeClasses[size].icon} text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    success: (
      <svg className={`${sizeClasses[size].icon} text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    calendar: (
      <svg className={`${sizeClasses[size].icon} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className={`${sizeClasses[size].icon} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    courses: (
      <svg className={`${sizeClasses[size].icon} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    attendance: (
      <svg className={`${sizeClasses[size].icon} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    custom: customIcon || null,
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size].container} ${className}`}>
      {/* Animated background circles */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gray-100 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }} />
        <div className="relative bg-gray-50 rounded-full p-6">
          {icons[icon]}
        </div>
      </div>

      <h3 className={`font-semibold text-gray-900 mb-2 ${sizeClasses[size].title}`}>
        {title}
      </h3>

      {description && (
        <p className={`text-gray-500 max-w-md mb-6 ${sizeClasses[size].desc}`}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                action.variant === 'secondary'
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
              }`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Preset empty states for common scenarios
export const NoSearchResults: React.FC<{ query?: string; onClear?: () => void }> = ({ query, onClear }) => (
  <EmptyState
    icon="search"
    title="No results found"
    description={query ? `We couldn't find anything matching "${query}". Try different keywords.` : 'Try adjusting your search or filters.'}
    action={onClear ? { label: 'Clear Search', onClick: onClear, variant: 'secondary' } : undefined}
  />
);

export const NoDataYet: React.FC<{ type?: string; onAdd?: () => void }> = ({ type = 'data', onAdd }) => (
  <EmptyState
    icon="data"
    title={`No ${type} yet`}
    description={`Get started by adding your first ${type}.`}
    action={onAdd ? { label: `Add ${type}`, onClick: onAdd } : undefined}
  />
);

export const NoStudents: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="users"
    title="No students found"
    description="There are no students enrolled yet. Add students to get started."
    action={onAdd ? { label: 'Add Student', onClick: onAdd } : undefined}
  />
);

export const NoCourses: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
  <EmptyState
    icon="courses"
    title="No courses available"
    description="No courses have been created yet. Create a course to begin."
    action={onAdd ? { label: 'Create Course', onClick: onAdd } : undefined}
  />
);

export const NoAttendance: React.FC<{ onTake?: () => void }> = ({ onTake }) => (
  <EmptyState
    icon="attendance"
    title="No attendance records"
    description="Attendance hasn't been taken yet for this class."
    action={onTake ? { label: 'Take Attendance', onClick: onTake } : undefined}
  />
);

export const NoSchedule: React.FC = () => (
  <EmptyState
    icon="calendar"
    title="No classes scheduled"
    description="There are no classes scheduled for today. Enjoy your free time!"
  />
);

export default EmptyState;
