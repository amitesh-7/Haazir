import React, { useState } from 'react';

interface ResponsiveTableProps {
  headers: string[];
  data: Array<Record<string, any>>;
  actions?: (row: any, index: number) => React.ReactNode;
  mobileCardRenderer?: (row: any, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  data,
  actions,
  mobileCardRenderer,
  loading = false,
  emptyMessage = "No data available"
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Desktop Loading */}
        <div className="hidden md:block">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="grid grid-cols-4 gap-4">
              {headers.map((_, index) => (
                <div key={index} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4 border-b border-gray-100">
              <div className="grid grid-cols-4 gap-4">
                {headers.map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Loading */}
        <div className="md:hidden space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort(header.toLowerCase().replace(/\s+/g, '_'))}
                >
                  <div className="flex items-center space-x-2">
                    <span>{header}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                    {row[header.toLowerCase().replace(/\s+/g, '_')] || '-'}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-right">
                    {actions(row, index)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="space-y-4 p-4">
          {sortedData.map((row, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
              {mobileCardRenderer ? (
                mobileCardRenderer(row, index)
              ) : (
                <>
                  {headers.map((header, colIndex) => (
                    <div key={colIndex} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">{header}:</span>
                      <span className="text-sm text-gray-900">
                        {row[header.toLowerCase().replace(/\s+/g, '_')] || '-'}
                      </span>
                    </div>
                  ))}
                  {actions && (
                    <div className="pt-3 border-t border-gray-200">
                      {actions(row, index)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  className = ''
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  };

  const sizeClasses = {
    sm: 'px-4 py-3 min-h-[44px] text-sm', // 44px minimum touch target
    md: 'px-6 py-4 min-h-[48px] text-base',
    lg: 'px-8 py-5 min-h-[52px] text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-xl font-semibold transition-all duration-200
        flex items-center justify-center space-x-2
        focus:outline-none focus:ring-4 focus:ring-blue-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95 transform
        ${className}
      `}
      style={{ minHeight: '44px' }} // Ensure minimum touch target size
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-2 overflow-y-auto max-h-full">
          {children}
        </div>
      </div>
    </>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 100; // Minimum swipe distance
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    setIsDragging(false);
    setCurrentX(0);
    setStartX(0);
  };

  const translateX = isDragging ? currentX - startX : 0;

  return (
    <div
      className={`touch-pan-x select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${Math.max(-50, Math.min(50, translateX))}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease'
      }}
    >
      {children}
      
      {/* Swipe Indicators */}
      {isDragging && (
        <>
          {translateX > 50 && onSwipeRight && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
              ➡️
            </div>
          )}
          {translateX < -50 && onSwipeLeft && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
              ⬅️
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
  size?: 'md' | 'lg';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  color = 'blue',
  size = 'md'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  const sizeClasses = {
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50
        ${colorClasses[color]} ${sizeClasses[size]}
        text-white rounded-full shadow-lg
        flex items-center justify-center
        transform transition-all duration-300
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-4 focus:ring-blue-500/20
      `}
      style={{ minHeight: '56px', minWidth: '56px' }} // Ensure touch target
      aria-label={label}
    >
      {icon}
    </button>
  );
};

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80
}) => {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  const refreshProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div 
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 z-10 transition-all duration-300"
          style={{ 
            height: `${Math.max(60, pullDistance)}px`,
            transform: `translateY(-60px)`
          }}
        >
          <div className="flex items-center space-x-2 text-blue-600">
            {isRefreshing ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : (
              <>
                <div 
                  className="w-5 h-5 border-2 border-blue-600 rounded-full transition-transform"
                  style={{ 
                    transform: `rotate(${refreshProgress * 360}deg)`,
                    borderTopColor: refreshProgress >= 1 ? 'transparent' : 'currentColor'
                  }}
                />
                <span className="text-sm font-medium">
                  {refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      <div 
        style={{ 
          transform: `translateY(${isPulling || isRefreshing ? pullDistance : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default {
  ResponsiveTable,
  TouchFriendlyButton,
  MobileMenu,
  SwipeableCard,
  FloatingActionButton,
  PullToRefresh
};