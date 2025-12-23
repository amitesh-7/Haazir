import React, { useEffect, useState, useRef } from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  loading?: boolean;
  onClick?: () => void;
  animateValue?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'blue',
  loading = false,
  onClick,
  animateValue = true,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const colorStyles = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-500/20',
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      ring: 'ring-green-500/20',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-500/20',
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      ring: 'ring-orange-500/20',
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      ring: 'ring-red-500/20',
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      ring: 'ring-indigo-500/20',
    },
  };

  const styles = colorStyles[color];

  // Intersection observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate number counting
  useEffect(() => {
    if (!isVisible || !animateValue || typeof value !== 'number') {
      setDisplayValue(typeof value === 'number' ? value : 0);
      return;
    }

    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible, animateValue]);

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
          </div>
          <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-32 h-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-lg border border-gray-100 p-6
        transition-all duration-300 hover:shadow-xl
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${styles.light} p-3 rounded-xl`}>
          {icon || (
            <svg className={`w-6 h-6 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
        </div>
        
        {trend && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              trend.isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.isPositive ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">
        {prefix}
        {typeof value === 'number' ? displayValue.toLocaleString() : value}
        {suffix}
      </p>
      
      {subtitle && (
        <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
      )}
    </div>
  );
};

// Gradient variant
export const GradientStatsCard: React.FC<StatsCardProps> = (props) => {
  const { color = 'blue', ...rest } = props;
  
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div
      className={`bg-gradient-to-br ${gradients[color]} rounded-2xl shadow-lg p-6 text-white ${props.className || ''}`}
      onClick={props.onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          {props.icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
        </div>
        
        {props.trend && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
            {props.trend.isPositive ? '↑' : '↓'} {props.trend.value}%
          </div>
        )}
      </div>

      <p className="text-white/80 text-sm mb-1">{props.title}</p>
      <p className="text-3xl font-bold">
        {props.prefix}
        {props.value}
        {props.suffix}
      </p>
      
      {props.subtitle && (
        <p className="text-white/70 text-sm mt-2">{props.subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;
