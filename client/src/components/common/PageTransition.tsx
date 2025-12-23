import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Fade and slide up transition
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      {children}
    </div>
  );
};

// Staggered children animation
interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  className = '',
}) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    children.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, index]);
      }, index * staggerDelay);
    });
  }, [children.length, staggerDelay]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="transition-all duration-400 ease-out"
          style={{
            opacity: visibleItems.includes(index) ? 1 : 0,
            transform: visibleItems.includes(index) ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Fade transition for modals/overlays
interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  children,
  duration = 300,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), duration);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: isAnimating ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Scale and fade for cards/modals
interface ScaleTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  show,
  children,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 200);
    }
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-all duration-200 ease-out ${className}`}
      style={{
        opacity: isAnimating ? 1 : 0,
        transform: isAnimating ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      {children}
    </div>
  );
};

// Slide transition for sidebars/drawers
interface SlideTransitionProps {
  show: boolean;
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  children,
  direction = 'right',
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [show]);

  const getTransform = () => {
    if (isAnimating) return 'translate(0, 0)';
    switch (direction) {
      case 'left': return 'translateX(-100%)';
      case 'right': return 'translateX(100%)';
      case 'up': return 'translateY(-100%)';
      case 'down': return 'translateY(100%)';
      default: return 'translateX(100%)';
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transform: getTransform() }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
