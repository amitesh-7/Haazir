import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, isVisible]);

  return (
    <div ref={ref} className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </div>
  );
};

interface ProgressIndicatorProps {
  progress: number;
  color?: 'blue' | 'green' | 'purple' | 'red';
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  color = 'blue',
  showPercentage = true,
  animated = true,
  size = 'md'
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

interface HoverCardProps {
  children: React.ReactNode;
  hoverContent: React.ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  hoverContent,
  delay = 300,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}>
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
            {hoverContent}
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1' :
              'right-full top-1/2 -translate-y-1/2 translate-x-1'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
};

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = 'fade',
  duration = 600,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(30px)';
        case 'down': return 'translateY(-30px)';
        case 'left': return 'translateX(30px)';
        case 'right': return 'translateX(-30px)';
        default: return 'translateY(0)';
      }
    }
    return 'translateY(0)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `all ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
};

interface PulseAnimationProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
  intensity?: 'low' | 'medium' | 'high';
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  color = 'blue',
  size = 'md',
  intensity = 'medium'
}) => {
  const colorClasses = {
    blue: 'ring-blue-400',
    green: 'ring-green-400',
    purple: 'ring-purple-400',
    red: 'ring-red-400'
  };

  const sizeClasses = {
    sm: 'ring-2',
    md: 'ring-4',
    lg: 'ring-8'
  };

  const intensityClasses = {
    low: 'animate-ping',
    medium: 'animate-pulse',
    high: 'animate-bounce'
  };

  return (
    <div className="relative inline-block">
      <div className={`absolute inset-0 ${colorClasses[color]} ${sizeClasses[size]} ${intensityClasses[intensity]} rounded-full opacity-75`} />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

interface SuccessAnimationProps {
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  onComplete,
  size = 'md'
}) => {
  const [showCheck, setShowCheck] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCheck(true), 200);
    const timer2 = setTimeout(() => setShowConfetti(true), 400);
    const timer3 = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Success Circle */}
      <div className={`${sizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center transform transition-all duration-500 ${
        showCheck ? 'scale-100' : 'scale-0'
      }`}>
        <svg className="w-1/2 h-1/2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${50 + (Math.cos((i * 2 * Math.PI) / 12) * 40)}%`,
                top: `${50 + (Math.sin((i * 2 * Math.PI) / 12) * 40)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BouncingDotsProps {
  count?: number;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export const BouncingDots: React.FC<BouncingDotsProps> = ({
  count = 3,
  color = 'blue',
  size = 'md'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex space-x-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full animate-bounce`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
};

interface FloatingParticlesProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 20,
  color = '#3b82f6',
  size = 4,
  speed = 'medium'
}) => {
  const speedClasses = {
    slow: 'animate-float',
    medium: 'animate-pulse',
    fast: 'animate-ping'
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`absolute rounded-full opacity-20 ${speedClasses[speed]}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  );
};

interface GlowEffectProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  intensity?: 'low' | 'medium' | 'high';
  hover?: boolean;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  color = 'blue',
  intensity = 'medium',
  hover = false
}) => {
  const colorClasses = {
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
    purple: 'shadow-purple-500/50',
    red: 'shadow-red-500/50',
    yellow: 'shadow-yellow-500/50'
  };

  const intensityClasses = {
    low: 'shadow-md',
    medium: 'shadow-lg',
    high: 'shadow-2xl'
  };

  return (
    <div className={`
      ${colorClasses[color]} ${intensityClasses[intensity]}
      ${hover ? 'hover:shadow-2xl' : ''}
      transition-shadow duration-300
    `}>
      {children}
    </div>
  );
};

export default {
  AnimatedCounter,
  ProgressIndicator,
  HoverCard,
  FadeIn,
  PulseAnimation,
  SuccessAnimation,
  BouncingDots,
  FloatingParticles,
  GlowEffect
};