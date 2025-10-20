import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = true, 
  circle = false 
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-200 animate-shimmer';
  const shapeClasses = circle ? 'rounded-full' : rounded ? 'rounded' : '';
  
  return (
    <div 
      className={`${baseClasses} ${shapeClasses} ${width} ${height} ${className}`}
      role="status"
      aria-label="Loading content"
    />
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'gray';
  text?: string;
  centered?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = 'blue',
  text,
  centered = true
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    purple: 'border-purple-600',
    green: 'border-green-600',
    red: 'border-red-600',
    gray: 'border-gray-600'
  };

  const containerClasses = centered 
    ? 'flex flex-col items-center justify-center p-8' 
    : 'flex items-center space-x-3';

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div 
        className={`animate-spin rounded-full border-4 border-gray-200 ${colorClasses[color]} border-t-transparent ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {text && (
        <span className="text-gray-600 font-medium" aria-live="polite">
          {text}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface CardSkeletonProps {
  rows?: number;
  showAvatar?: boolean;
  showButton?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  rows = 3, 
  showAvatar = false, 
  showButton = false 
}) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4" role="status" aria-label="Loading card">
    {showAvatar && (
      <div className="flex items-center space-x-4">
        <Skeleton circle width="w-12" height="h-12" />
        <div className="space-y-2 flex-1">
          <Skeleton width="w-1/2" height="h-4" />
          <Skeleton width="w-1/3" height="h-3" />
        </div>
      </div>
    )}
    
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton 
          key={index} 
          width={index === rows - 1 ? 'w-3/4' : 'w-full'} 
          height="h-4" 
        />
      ))}
    </div>
    
    {showButton && (
      <Skeleton width="w-32" height="h-10" />
    )}
  </div>
);

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden" role="status" aria-label="Loading table">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="w-3/4" height="h-4" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                width={colIndex === 0 ? 'w-full' : 'w-2/3'} 
                height="h-4" 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface ChartSkeletonProps {
  type?: 'line' | 'bar' | 'doughnut';
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ type = 'line' }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6" role="status" aria-label="Loading chart">
    <div className="space-y-4">
      <Skeleton width="w-1/3" height="h-6" />
      
      {type === 'doughnut' ? (
        <div className="flex justify-center">
          <Skeleton circle width="w-48" height="h-48" />
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-end space-x-2 h-8">
              {Array.from({ length: 12 }).map((_, barIndex) => (
                <Skeleton 
                  key={barIndex} 
                  width="w-4" 
                  height={`h-${Math.floor(Math.random() * 6) + 2}`} 
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

interface PageSkeletonProps {
  type?: 'dashboard' | 'table' | 'profile' | 'form';
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ type = 'dashboard' }) => {
  const renderDashboardSkeleton = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="w-1/4" height="h-8" />
        <Skeleton width="w-1/2" height="h-4" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} rows={2} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="line" />
        <ChartSkeleton type="doughnut" />
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex justify-between items-center">
        <Skeleton width="w-1/4" height="h-8" />
        <Skeleton width="w-48" height="h-10" />
      </div>
      
      {/* Table */}
      <TableSkeleton rows={8} columns={5} />
    </div>
  );

  const renderProfileSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 text-center space-y-4">
        <Skeleton circle width="w-24" height="h-24" className="mx-auto" />
        <Skeleton width="w-2/3" height="h-6" className="mx-auto" />
        <Skeleton width="w-1/2" height="h-4" className="mx-auto" />
        <Skeleton width="w-3/4" height="h-8" className="mx-auto" />
      </div>
      
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={6} />
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton width="w-1/3" height="h-8" />
        <Skeleton width="w-2/3" height="h-4" />
      </div>
      
      <div className="bg-white rounded-2xl p-6 space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton width="w-1/4" height="h-4" />
            <Skeleton width="w-full" height="h-12" />
          </div>
        ))}
        
        <div className="flex justify-end space-x-4">
          <Skeleton width="w-24" height="h-10" />
          <Skeleton width="w-32" height="h-10" />
        </div>
      </div>
    </div>
  );

  const skeletonTypes = {
    dashboard: renderDashboardSkeleton,
    table: renderTableSkeleton,
    profile: renderProfileSkeleton,
    form: renderFormSkeleton
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {skeletonTypes[type]()}
      </div>
    </div>
  );
};

// Pulse Loading Animation Component
export const PulseLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex space-x-2" role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  color?: 'blue' | 'green' | 'purple' | 'red';
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  showPercentage = true,
  animated = true
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600'
  };

  return (
    <div className="w-full" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-600">{progress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 ${colorClasses[color]} rounded-full transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default {
  Skeleton,
  LoadingSpinner,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PageSkeleton,
  PulseLoader,
  ProgressBar
};