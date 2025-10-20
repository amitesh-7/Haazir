import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailyAttendance: 0,
    activeClasses: 0,
    reportsGenerated: 0,
  });
  const [currentMockupScreen, setCurrentMockupScreen] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      title: "Real-time Attendance Tracking",
      description:
        "Track student attendance instantly with our advanced system",
      icon: "📊",
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "Smart Analytics",
      description: "Get insights and analytics on attendance patterns",
      icon: "📈",
      color: "from-green-500 to-blue-500",
    },
    {
      title: "Multi-Role Dashboard",
      description:
        "Separate dashboards for students, teachers, and coordinators",
      icon: "👥",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Automated Reporting",
      description: "Generate comprehensive attendance reports automatically",
      icon: "📋",
      color: "from-orange-500 to-red-500",
    },
  ];

  const mockupScreens = [
    {
      title: "Student Dashboard",
      description: "Clean, intuitive interface for students",
      screen: "student",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Teacher Interface",
      description: "Efficient attendance tracking for educators",
      screen: "teacher",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Admin Panel",
      description: "Comprehensive management for coordinators",
      screen: "coordinator",
      color: "from-purple-500 to-violet-500",
    },
    {
      title: "Analytics View",
      description: "Advanced insights and reporting",
      screen: "analytics",
      color: "from-orange-500 to-red-500",
    },
  ];

  const achievementStats = [
    { number: "50000", label: "Students Tracked", icon: "🎓" },
    { number: "2500", label: "Teachers", icon: "👨‍🏫" },
    { number: "150", label: "Institutions", icon: "🏫" },
    { number: "98%", label: "System Uptime", icon: "⚡" },
  ];

  const testimonials: Array<{
    name: string;
    role: string;
    content: string;
    avatar: string;
  }> = [
    {
      name: "Dr. Sarah Johnson",
      role: "Principal, Greenfield High School",
      content: "Haazir has transformed our attendance tracking completely. The real-time insights help us identify patterns and improve student engagement significantly.",
      avatar: "👩‍🏫"
    },
    {
      name: "Michael Chen",
      role: "IT Administrator, Riverside Academy",
      content: "Implementation was seamless and the support team was exceptional. Our teachers love the intuitive interface and automated reporting features.",
      avatar: "👨‍💻"
    },
    {
      name: "Emma Rodriguez",
      role: "Vice Principal, Oakwood Elementary",
      content: "The parent notification system has improved our communication dramatically. Parents appreciate the real-time updates about their children's attendance.",
      avatar: "👩‍💼"
    },
    {
      name: "James Wilson",
      role: "Teacher, Maple Grove Middle School",
      content: "Taking attendance is now effortless and gives me more time to focus on teaching. The analytics help me understand my students better.",
      avatar: "👨‍🏫"
    },
    {
      name: "Lisa Thompson",
      role: "School Coordinator, Sunshine Elementary",
      content: "Haazir's multi-role dashboard is perfect for our needs. Each staff member gets exactly the tools they need without complexity.",
      avatar: "👩‍🎓"
    },
    {
      name: "Robert Kumar",
      role: "Principal, Tech Valley High",
      content: "The performance metrics and trend analysis have helped us improve our overall attendance rates by 15% in just one semester.",
      avatar: "👨‍💼"
    }
  ];

  const loadingSteps = [
    "Loading core components...",
    "Connecting to services...", 
    "Initializing dashboard...",
    "Preparing authentication...",
    "Setting up user interface...",
    "Ready to launch!",
  ];

  useEffect(() => {
    setIsLoading(true);
    setIsVisible(true);

    // Feature carousel
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    // Mockup screen rotation
    const mockupInterval = setInterval(() => {
      setCurrentMockupScreen((prev) => (prev + 1) % mockupScreens.length);
    }, 3000);

    // Real-time data fetching - disabled to prevent CORS errors
    const fetchRealTimeData = async () => {
      // Only fetch if page is visible to avoid unnecessary API calls
      if (document.hidden) {
        return;
      }

      // TODO: Enable when backend server is running
      // For now, keep stats at zero to avoid CORS errors
      console.log("Backend API not available - keeping stats at zero");
      
      /* 
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/stats/live`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          throw new Error("API not available");
        }
      } catch (error) {
        console.log("API not available:", error);
      }
      */
    };

    // Initial data fetch - disabled to prevent CORS errors
    // fetchRealTimeData();

    // Update real-time data - disabled to prevent CORS errors  
    // const statsInterval = setInterval(fetchRealTimeData, 30000);

    // Handle page visibility changes to pause/resume polling
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, fetch fresh data  
        // fetchRealTimeData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Progressive loading simulation
    const loadingStepsInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          setLoadingProgress(((prev + 1) / loadingSteps.length) * 100);
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    // Complete loading after all steps
    setTimeout(() => {
      clearInterval(loadingStepsInterval);
      setIsLoading(false);
    }, 3500);

    // Scroll effect for parallax
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Intersection Observer for section visibility
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => [
            ...prev.filter((id) => id !== entry.target.id),
            entry.target.id,
          ]);
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    // Create floating particles
    createFloatingParticles();

    // Touch interactions for app-like experience
    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY || !touchStartX) return;

      const touchEndY = e.touches[0].clientY;
      const touchEndX = e.touches[0].clientX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;

      // Pull to refresh (swipe down at top of page)
      if (window.scrollY === 0 && diffY < -50) {
        // Trigger refresh animation
        const refreshIndicator = document.createElement("div");
        refreshIndicator.className =
          "fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 shadow-lg z-50 animate-bounce";
        refreshIndicator.innerHTML =
          '<span class="text-blue-600 text-xl">🔄</span>';
        document.body.appendChild(refreshIndicator);

        setTimeout(() => {
          document.body.removeChild(refreshIndicator);
          // Trigger data refresh
          // fetchRealTimeData();
        }, 1500);
      }

      // Swipe gestures for feature navigation
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left - next feature
          setCurrentFeature((prev) => (prev + 1) % features.length);
        } else {
          // Swipe right - previous feature
          setCurrentFeature(
            (prev) => (prev - 1 + features.length) % features.length
          );
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartY = 0;
      touchStartX = 0;
    };

    // Add touch event listeners
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearInterval(featureInterval);
      clearInterval(mockupInterval);
      // clearInterval(statsInterval);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const createFloatingParticles = () => {
    if (!particlesRef.current) return;

    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.className = "floating-particle";
      particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 6 + 2}px;
                height: ${Math.random() * 6 + 2}px;
                background: rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 15}s infinite linear;
                pointer-events: none;
            `;
      particles.push(particle);
    }
    particles.forEach((p) => particlesRef.current?.appendChild(p));
  };

  const AnimatedCounter = ({
    target,
    label,
    icon,
  }: {
    target: string;
    label: string;
    icon: string;
  }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated && !isAnimating) {
            setHasAnimated(true);
            setIsAnimating(true);
            const numericTarget = parseInt(target.replace(/[^0-9]/g, ""));
            const increment = numericTarget / 50;
            let current = 0;

            timerRef.current = setInterval(() => {
              current += increment;
              if (current >= numericTarget) {
                setCount(numericTarget);
                setIsAnimating(false);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
              } else {
                setCount(Math.floor(current));
              }
            }, 50);
          }
        },
        { threshold: 0.5 }
      );

      if (ref.current) observer.observe(ref.current);
      return () => {
        observer.disconnect();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [target, hasAnimated, isAnimating]);

    const displayValue = target.includes("%")
      ? `${count}%`
      : target.includes("K")
      ? `${Math.floor(count / 1000)}K+`
      : `${count}+`;

    return (
      <div
        ref={ref}
        className="text-center transform transition-all duration-700 hover:scale-110 group"
      >
        <div className="text-4xl mb-3 group-hover:animate-bounce transition-all duration-300">
          {icon}
        </div>
        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {displayValue}
        </div>
        <div className="text-gray-600 font-medium">{label}</div>
      </div>
    );
  };

  const MorphingIcon = ({
    icons,
    className = "",
    speed = 2000,
  }: {
    icons: string[];
    className?: string;
    speed?: number;
  }) => {
    const [currentIcon, setCurrentIcon] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      if (!isHovered) {
        const interval = setInterval(() => {
          setCurrentIcon((prev) => (prev + 1) % icons.length);
        }, speed);
        return () => clearInterval(interval);
      }
    }, [icons.length, speed, isHovered]);

    return (
      <div
        className={`morphing-icon ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setCurrentIcon((prev) => (prev + 1) % icons.length)}
      >
        <span className="icon-content">{icons[currentIcon]}</span>
      </div>
    );
  };

  const LoadingSkeleton = ({ className = "" }: { className?: string }) => {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-200 animate-shimmer rounded-lg h-full"></div>
      </div>
    );
  };

  const DeviceMockup = ({
    type,
    screen,
  }: {
    type: "phone" | "laptop";
    screen: string;
  }) => {
    const screenContent = {
      student: {
        title: "Student Dashboard",
        elements: [
          {
            icon: "📊",
            text: "Attendance: 95.2%",
            color: "bg-green-100 text-green-800",
          },
          {
            icon: "📚",
            text: "Today's Classes: 4",
            color: "bg-blue-100 text-blue-800",
          },
          {
            icon: "⏰",
            text: "Next: Math at 2:00 PM",
            color: "bg-purple-100 text-purple-800",
          },
          {
            icon: "🎯",
            text: "Weekly Goal: 98%",
            color: "bg-orange-100 text-orange-800",
          },
        ],
      },
      teacher: {
        title: "Teacher Panel",
        elements: [
          {
            icon: "👥",
            text: "Take Attendance",
            color: "bg-blue-100 text-blue-800",
          },
          {
            icon: "📈",
            text: "Class Analytics",
            color: "bg-green-100 text-green-800",
          },
          {
            icon: "📝",
            text: "Generate Reports",
            color: "bg-purple-100 text-purple-800",
          },
          {
            icon: "🔔",
            text: "Send Notifications",
            color: "bg-red-100 text-red-800",
          },
        ],
      },
      coordinator: {
        title: "Admin Dashboard",
        elements: [
          {
            icon: "🏫",
            text: "Manage Schools",
            color: "bg-indigo-100 text-indigo-800",
          },
          {
            icon: "👨‍🏫",
            text: "Teacher Overview",
            color: "bg-green-100 text-green-800",
          },
          {
            icon: "📊",
            text: "System Analytics",
            color: "bg-blue-100 text-blue-800",
          },
          {
            icon: "⚙️",
            text: "Configuration",
            color: "bg-gray-100 text-gray-800",
          },
        ],
      },
      analytics: {
        title: "Analytics View",
        elements: [
          {
            icon: "📈",
            text: "Attendance Trends",
            color: "bg-green-100 text-green-800",
          },
          {
            icon: "📊",
            text: "Performance Metrics",
            color: "bg-blue-100 text-blue-800",
          },
          {
            icon: "🎯",
            text: "Insights & Reports",
            color: "bg-purple-100 text-purple-800",
          },
          {
            icon: "📉",
            text: "Risk Analysis",
            color: "bg-red-100 text-red-800",
          },
        ],
      },
    };

    const content = screenContent[screen as keyof typeof screenContent];

    if (type === "phone") {
      return (
        <div className="relative group cursor-pointer">
          {/* Phone Frame */}
          <div className="w-72 h-[600px] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl transform transition-all duration-700 group-hover:scale-105 group-hover:rotate-2 relative">
            {/* Phone Notch */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10"></div>

            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
              {/* Status Bar */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-12 flex items-center justify-between px-6 text-white text-sm">
                <span>9:41</span>
                <span>📶 🔋</span>
              </div>

              {/* Screen Content */}
              <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {content.title}
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
                </div>

                <div className="space-y-4">
                  {content.elements.map((item, index) => (
                    <div
                      key={index}
                      className={`${item.color} backdrop-blur-sm p-4 rounded-2xl shadow-sm text-sm font-medium border border-white/50 transform transition-all duration-300 hover:scale-105`}
                      style={{
                        animationDelay: `${index * 200}ms`,
                        animation: "fadeInUp 0.8s ease forwards",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-semibold">{item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Navigation */}
                <div className="absolute bottom-8 left-6 right-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                    <div className="flex justify-around">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-xl mb-1"></div>
                        <span className="text-xs text-gray-600">Home</span>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-xl mb-1"></div>
                        <span className="text-xs text-gray-600">Classes</span>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-xl mb-1"></div>
                        <span className="text-xs text-gray-600">Profile</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Reflection */}
          <div className="absolute top-full left-0 w-full h-40 bg-gradient-to-b from-gray-900/20 to-transparent rounded-[3rem] blur-sm opacity-30 transform scale-y-50"></div>
        </div>
      );
    }

    // Enhanced Laptop mockup
    return (
      <div className="relative group cursor-pointer">
        <div className="w-[480px] h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl transform transition-all duration-700 group-hover:scale-105 group-hover:-rotate-1">
          {/* Screen */}
          <div className="w-full h-64 bg-black rounded-t-2xl p-4 relative overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden">
              {/* Mac-style window controls */}
              <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {content.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-sm">🔔</span>
                  <span className="text-sm">👤</span>
                </div>
              </div>

              <div className="p-4 h-full">
                <div className="grid grid-cols-2 gap-3 h-full">
                  {content.elements.map((item, index) => (
                    <div
                      key={index}
                      className={`${item.color} backdrop-blur-sm p-4 rounded-2xl shadow-sm font-medium transform transition-all duration-300 hover:scale-105 border border-white/30`}
                      style={{
                        animationDelay: `${index * 300}ms`,
                        animation: "slideInRight 1s ease forwards",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="font-bold text-sm">{item.text}</div>
                          <div className="text-xs opacity-70">Active</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Base */}
          <div className="w-full h-16 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-2xl relative">
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-3 bg-gray-600 rounded-t-xl"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-gray-900 rounded-full"></div>
          </div>
        </div>

        {/* Laptop Shadow */}
        <div className="absolute top-full left-0 w-full h-20 bg-gradient-to-b from-gray-900/30 to-transparent rounded-2xl blur-lg opacity-40 transform scale-y-30"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Add keyframes and custom styles */}
      <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-20px) rotate(90deg); }
                    50% { transform: translateY(-10px) rotate(180deg); }
                    75% { transform: translateY(-30px) rotate(270deg); }
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                @keyframes slideInRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }
                @keyframes morphIcon {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(90deg) scale(1.1); }
                    50% { transform: rotate(180deg) scale(0.9); }
                    75% { transform: rotate(270deg) scale(1.1); }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(100px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                @keyframes scaleIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.5); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1); 
                    }
                }
                @keyframes bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes typewriter {
                    from { width: 0; }
                    to { width: 100%; }
                }
                .gradient-animation {
                    background-size: 200% 200%;
                    animation: gradient-shift 6s ease infinite;
                }
                .glass-effect {
                    backdrop-filter: blur(20px);
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .mobile-menu-slide {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease-in-out;
                }
                .mobile-menu-slide.open {
                    transform: translateX(0);
                }
                .scroll-indicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #3B82F6, #8B5CF6);
                    z-index: 9999;
                    transition: width 0.3s ease;
                }
                .section-fade-in {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.8s ease;
                }
                .section-fade-in.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .morphing-icon {
                    display: inline-block;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .morphing-icon:hover .icon-content {
                    animation: morphIcon 1s ease infinite;
                }
                .icon-content {
                    display: inline-block;
                    transition: all 0.3s ease;
                }
                .animate-shimmer {
                    background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite linear;
                }
                .bg-size-200 {
                    background-size: 200% 100%;
                }
                .stagger-animation {
                    animation: fadeInUp 0.6s ease forwards;
                }
                .parallax-element {
                    transition: transform 0.1s ease-out;
                }
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.05), transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.05), transparent 50%),
                        linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.5s ease, visibility 0.5s ease;
                    overflow: hidden;
                }
                .tech-loader {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .orbital-spinner {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin-bottom: 2rem;
                }
                .orbit {
                    position: absolute;
                    border: 2px solid transparent;
                    border-radius: 50%;
                    animation: rotate 3s linear infinite;
                }
                .orbit:nth-child(1) {
                    width: 120px;
                    height: 120px;
                    border-top: 3px solid #3b82f6;
                    border-right: 3px solid #3b82f6;
                    animation-duration: 2s;
                    opacity: 0.8;
                }
                .orbit:nth-child(2) {
                    width: 90px;
                    height: 90px;
                    top: 15px;
                    left: 15px;
                    border-left: 3px solid #6366f1;
                    border-bottom: 3px solid #6366f1;
                    animation-duration: 1.5s;
                    animation-direction: reverse;
                    opacity: 0.7;
                }
                .orbit:nth-child(3) {
                    width: 60px;
                    height: 60px;
                    top: 30px;
                    left: 30px;
                    border-top: 3px solid #8b5cf6;
                    border-right: 3px solid #8b5cf6;
                    animation-duration: 1s;
                    opacity: 0.6;
                }
                .center-core {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: 
                        linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
                    border-radius: 50%;
                    animation: pulse-core 2s ease-in-out infinite;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
                }
                .data-stream {
                    position: absolute;
                    width: 200px;
                    height: 4px;
                    background: linear-gradient(90deg, 
                        transparent 0%, 
                        #00ffff 20%, 
                        #ffffff 50%, 
                        #ff00ff 80%, 
                        transparent 100%);
                    border-radius: 2px;
                    animation: stream 1.5s ease-in-out infinite;
                }
                .data-stream:nth-child(5) {
                    top: -20px;
                    animation-delay: 0s;
                }
                .data-stream:nth-child(6) {
                    bottom: -20px;
                    animation-delay: 0.5s;
                }
                .data-stream:nth-child(7) {
                    left: -20px;
                    top: 50%;
                    transform: translateY(-50%) rotate(90deg);
                    animation-delay: 1s;
                }
                .data-stream:nth-child(8) {
                    right: -20px;
                    top: 50%;
                    transform: translateY(-50%) rotate(90deg);
                    animation-delay: 1.5s;
                }
                /* Modern loading styles integrated into Tailwind classes */
                .loading-dots {
                    display: flex;
                    gap: 4px;
                    margin-top: 1rem;
                }
                .loading-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #00ffff, #ff00ff);
                    animation: dot-pulse 1.5s ease-in-out infinite;
                }
                .loading-dot:nth-child(2) { animation-delay: 0.2s; }
                .loading-dot:nth-child(3) { animation-delay: 0.4s; }
                .loading-dot:nth-child(4) { animation-delay: 0.6s; }
                .loading-dot:nth-child(5) { animation-delay: 0.8s; }
                .tech-grid {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.1;
                    background-image: 
                        linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 255, 0.2) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: grid-pulse 4s ease-in-out infinite;
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-core {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1);
                        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.2);
                        box-shadow: 0 0 30px rgba(255, 0, 255, 0.8);
                    }
                }
                @keyframes stream {
                    0% { 
                        transform: translateX(-100px);
                        opacity: 0;
                    }
                    50% { 
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(100px);
                        opacity: 0;
                    }
                }
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes text-flicker {
                    0%, 100% { 
                        opacity: 1;
                        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                    }
                    50% { 
                        opacity: 0.8;
                        text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                    }
                }
                @keyframes dot-pulse {
                    0%, 100% { 
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% { 
                        transform: scale(1.5);
                        opacity: 1;
                    }
                }
                @keyframes grid-pulse {
                    0%, 100% { opacity: 0.05; }
                    50% { opacity: 0.15; }
                }
                .chat-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    transition: all 0.3s ease;
                }
                .chat-bubble {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .chat-bubble:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
                }
                .pulse-ring {
                    position: absolute;
                    border: 3px solid rgba(102, 126, 234, 0.3);
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
                }
                @keyframes pulse-ring {
                    0% {
                        transform: scale(0.8);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }
            `}</style>

      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-overlay">

          <div className="tech-loader">
            <div className="orbital-spinner">
              <div className="orbit"></div>
              <div className="orbit"></div>
              <div className="orbit"></div>
              <div className="center-core"></div>
              <div className="data-stream"></div>
              <div className="data-stream"></div>
              <div className="data-stream"></div>
              <div className="data-stream"></div>
            </div>

            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-2xl">H</span>
                </div>
                <h2 className="text-4xl font-bold text-slate-800 mb-2">
                  Welcome to Haazir
                </h2>
                <p className="text-slate-600 text-lg mb-6">
                  Preparing your attendance management system...
                </p>
              </div>

              {loadingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center mb-3 transition-all duration-300 ${
                    index < loadingStep
                      ? "text-emerald-600"
                      : index === loadingStep
                      ? "text-blue-600 animate-pulse"
                      : "text-slate-400"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    index < loadingStep
                      ? "bg-emerald-500"
                      : index === loadingStep
                      ? "bg-blue-500 animate-pulse"
                      : "bg-slate-300"
                  }`}></div>
                  <span className="text-sm font-medium">{step}</span>
                  {index < loadingStep && (
                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      ✓ Complete
                    </span>
                  )}
                </div>
              ))}

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 text-sm font-medium">
                    Loading Progress
                  </span>
                  <span className="text-slate-800 font-semibold">
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
                <div className="w-80 h-3 bg-slate-200 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-center items-center mt-4 space-x-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/98 backdrop-blur-xl shadow-xl border-b border-gray-200/50"
            : "bg-white/95 backdrop-blur-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Haazir
              </h1>
            </div>

            {/* Scroll Progress Indicator */}
            <div
              className="scroll-indicator"
              style={{
                width: `${
                  (scrollY /
                    (document.body.scrollHeight - window.innerHeight)) *
                  100
                }%`,
              }}
            ></div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {["features", "about", "testimonials"].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-lg capitalize relative group ${
                    visibleSections.includes(section) ? "text-blue-600" : ""
                  }`}
                >
                  {section}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold text-lg gradient-animation"
              >
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`bg-gray-600 block h-0.5 w-6 rounded-sm transition-all duration-300 transform ${
                    isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                ></span>
                <span
                  className={`bg-gray-600 block h-0.5 w-6 rounded-sm my-1 transition-opacity duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`bg-gray-600 block h-0.5 w-6 rounded-sm transition-all duration-300 transform ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden mobile-menu-slide ${
            isMobileMenuOpen ? "open" : ""
          } fixed top-0 left-0 w-full h-screen bg-white z-40`}
        >
          <div className="pt-20 px-6">
            {["features", "about", "testimonials"].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className="block w-full text-left py-4 text-xl font-semibold text-gray-700 hover:text-blue-600 transition-colors capitalize border-b border-gray-100"
              >
                {section}
              </button>
            ))}
            <Link
              to="/login"
              className="block w-full text-center mt-8 bg-gradient-to-r from-blue-600 to-purple-700 text-white py-4 rounded-full font-semibold text-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern School Management */}
      <section
        ref={heroRef}
        className="relative pt-20 pb-10 min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/60 to-indigo-100/80"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="grid grid-cols-20 gap-1 h-full">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="w-full h-8 bg-blue-200 rounded-sm animate-pulse" style={{ animationDelay: `${i * 50}ms` }}></div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-100 to-blue-100 px-6 py-2 rounded-full text-cyan-800 font-medium text-sm mb-6">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              School Management System
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-6">
              A Creative Solution for
              <br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                School Management
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-4">
              Streamline Your School's Operations with Haazir
            </p>
            <p className="text-lg text-slate-500 font-medium mb-12">
              Unlock More Time for What Matters
            </p>
          </div>

          {/* Main Dashboard Layout */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/50">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <span className="font-bold text-slate-800">Haazir</span>
              </div>
              
              <nav className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-600 font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Home
                </div>
                {['Academics', 'Notice', 'Teachers', 'Students', 'Admission', 'Attendance', 'Fee', 'Result', "What's New", 'Communication'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                    {item}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👨‍💼</span>
                  </div>
                  <div className="text-sm text-slate-500 mb-1">Admins</div>
                  <div className="text-3xl font-bold text-slate-800">10</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👨‍🏫</span>
                  </div>
                  <div className="text-sm text-slate-500 mb-1">Teachers</div>
                  <div className="text-3xl font-bold text-slate-800">51</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div className="text-sm text-slate-500 mb-1">Students</div>
                  <div className="text-3xl font-bold text-slate-800">946</div>
                </div>
              </div>

              {/* Attendance Chart */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Attendance Stats - Interactive</h3>
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1">
                    <option>Last 7 days</option>
                  </select>
                </div>
                <div className="text-xs text-slate-500 mb-4">Showing total attendances for the last 7 days</div>
                
                {/* Chart Area */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 flex items-end justify-around p-4">
                    {['Jun 24', 'Jun 25', 'Jun 26', 'Jun 27', 'Jun 28', 'Jun 29', 'Jun 30'].map((date, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className={`w-8 bg-gradient-to-t ${
                            idx % 2 === 0 ? 'from-blue-400 to-blue-500' : 'from-purple-400 to-purple-500'
                          } rounded-t-lg transition-all duration-1000 hover:scale-110`}
                          style={{ height: `${Math.random() * 80 + 40}px` }}
                        ></div>
                        <span className="text-xs text-slate-500 mt-2">{date}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Present</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Section */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="text-lg font-bold text-slate-800 mb-4">System Overview</h3>
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="w-0 h-0 border-l-8 border-l-white border-t-6 border-t-transparent border-b-6 border-b-transparent ml-2"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-lg font-bold">Haazir Demo Video</div>
                    <div className="text-sm opacity-80">See how our system works</div>
                  </div>
                  {/* Add actual video here when available */}
                  <video 
                    className="w-full h-full object-cover opacity-0" 
                    poster="" 
                    controls
                  >
                    <source src="/demo-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Today's Attendance */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="font-bold text-slate-800 mb-4">Today's Attendance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Present</span>
                      <span>95.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full" style={{ width: '95.2%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>On Leave</span>
                      <span>4.8%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full" style={{ width: '4.8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '📚', label: 'Subjects' },
                    { icon: '👥', label: 'Classes' },
                    { icon: '📊', label: 'Attendance' },
                    { icon: '👥', label: 'Students' }
                  ].map((action, idx) => (
                    <button key={idx} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors group">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
                      <div className="text-xs font-medium text-slate-600">{action.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Board */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="font-bold text-slate-800 mb-4">Notice Board</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="text-sm font-medium text-slate-800">Parent-Teacher Meeting</div>
                    <div className="text-xs text-slate-500">Tomorrow at 2:00 PM</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="text-sm font-medium text-slate-800">Annual Sports Day</div>
                    <div className="text-xs text-slate-500">March 15, 2024</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div className="text-sm font-medium text-slate-800">Exam Schedule</div>
                    <div className="text-xs text-slate-500">Available in portal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Experience Haazir</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section
        ref={demoSectionRef}
        className={`py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden section-fade-in ${
          visibleSections.includes("demo") ? "visible" : ""
        }`}
        id="demo"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce">
              🚀 Interactive Demo
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Experience
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                Haazir{" "}
              </span>
              in Action
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              See how our platform works across different devices and user
              roles. Click on the devices to explore different interfaces.
            </p>
          </div>

          {/* Device Showcase */}
          <div className="grid lg:grid-cols-3 gap-16 items-center justify-items-center">
            {/* Phone Mockup */}
            <div
              className="transform transition-all duration-700 hover:scale-110"
              onClick={() =>
                setCurrentMockupScreen(
                  (prev) => (prev + 1) % mockupScreens.length
                )
              }
            >
              <DeviceMockup
                type="phone"
                screen={mockupScreens[currentMockupScreen].screen}
              />
              <div className="text-center mt-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Mobile Experience
                </h3>
                <p className="text-blue-200">
                  {mockupScreens[currentMockupScreen].description}
                </p>
              </div>
            </div>

            {/* Central Control */}
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl mx-auto transform transition-all duration-500 hover:scale-110 hover:rotate-12">
                  <MorphingIcon
                    icons={["📱", "💻", "📊", "⚡"]}
                    className="text-4xl text-white"
                    speed={1500}
                  />
                </div>
                <div className="absolute inset-0 w-32 h-32 border-4 border-cyan-400/30 rounded-full animate-ping mx-auto"></div>
              </div>

              <div className="space-y-4">
                {mockupScreens.map((screen, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMockupScreen(index)}
                    className={`block w-full p-4 rounded-xl transition-all duration-300 ${
                      index === currentMockupScreen
                        ? "bg-white/20 backdrop-blur-sm border-2 border-cyan-400 text-white"
                        : "bg-white/5 backdrop-blur-sm border border-white/10 text-blue-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold">{screen.title}</div>
                    <div className="text-sm opacity-80">
                      {screen.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Laptop Mockup */}
            <div
              className="transform transition-all duration-700 hover:scale-105"
              onClick={() =>
                setCurrentMockupScreen(
                  (prev) => (prev + 1) % mockupScreens.length
                )
              }
            >
              <DeviceMockup
                type="laptop"
                screen={mockupScreens[currentMockupScreen].screen}
              />
              <div className="text-center mt-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Desktop Power
                </h3>
                <p className="text-blue-200">Full-featured admin interface</p>
              </div>
            </div>
          </div>

          {/* Interactive Features */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ["🎯", "⚡", "🚀"],
                title: "Real-time Updates",
                desc: "Instant notifications and live data sync",
                delay: 0,
              },
              {
                icon: ["📱", "💻", "⌚"],
                title: "Cross-platform",
                desc: "Works seamlessly on all devices",
                delay: 200,
              },
              {
                icon: ["🔒", "🛡️", "🔐"],
                title: "Secure & Private",
                desc: "Bank-level security for your data",
                delay: 400,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-500 transform hover:scale-105 section-fade-in ${
                  visibleSections.includes("demo") ? "visible" : ""
                }`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                <div className="mb-6">
                  <MorphingIcon
                    icons={feature.icon}
                    className="text-5xl"
                    speed={2000}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-blue-200 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='nonzero'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Educational Leaders
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of institutions already transforming their
              attendance management
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedCounter
              target="10000"
              label="Students Tracked"
              icon="🎓"
            />
            <AnimatedCounter target="500" label="Teachers" icon="👨‍🏫" />
            <AnimatedCounter target="100" label="Institutions" icon="🏫" />
            <AnimatedCounter target="99" label="Uptime %" icon="⚡" />
          </div>

          {/* Additional Info Cards */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚀",
                title: "Launch Ready",
                desc: "Get started in minutes",
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                desc: "Bank-level security",
              },
              {
                icon: "📱",
                title: "Mobile First",
                desc: "Works on all devices",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`text-center p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100 section-fade-in ${
                  visibleSections.includes("stats") ? "visible" : ""
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-5xl mb-4 transform hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden section-fade-in ${
          visibleSections.includes("features") ? "visible" : ""
        }`}
      >
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-6 py-2 rounded-full text-sm font-semibold mb-6">
              ⚡ Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Modern Education
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive suite of tools makes attendance tracking
              effortless and insightful for educational institutions of all
              sizes.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Feature Showcase */}
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-500 border border-white/50 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-50"></div>

                <div className="relative z-10">
                  <div
                    className={`text-7xl mb-6 transition-all duration-500 transform hover:scale-110`}
                  >
                    {features[currentFeature].icon}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-gray-600 text-xl leading-relaxed mb-8">
                    {features[currentFeature].description}
                  </p>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${features[currentFeature].color} rounded-full transition-all duration-4000 ease-linear`}
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-3 text-sm text-gray-500">
                      <span>Feature Demo</span>
                      <span>
                        {currentFeature + 1} of {features.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-500 opacity-75"></div>
              </div>
            </div>

            {/* Interactive Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                    index === currentFeature
                      ? "bg-white/90 backdrop-blur-md shadow-2xl border-2 border-blue-200 scale-105"
                      : "bg-white/60 backdrop-blur-sm shadow-lg hover:bg-white/80 hover:shadow-2xl"
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  {/* Active Indicator */}
                  {index === currentFeature && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  )}

                  <div className="relative z-10">
                    <div
                      className={`text-4xl mb-4 transition-all duration-300 group-hover:scale-110 ${
                        index === currentFeature ? "animate-bounce" : ""
                      }`}
                    >
                      {feature.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Feature Benefits */}
          <div className="mt-20 text-center">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  number: "24/7",
                  label: "Support",
                  color: "from-green-400 to-green-600",
                },
                {
                  number: "99.9%",
                  label: "Accuracy",
                  color: "from-blue-400 to-blue-600",
                },
                {
                  number: "< 1s",
                  label: "Response",
                  color: "from-purple-400 to-purple-600",
                },
                {
                  number: "100%",
                  label: "Satisfaction",
                  color: "from-pink-400 to-pink-600",
                },
              ].map((item, index) => (
                <div key={index} className="group">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}
                  >
                    <span className="text-white font-bold text-xl">✓</span>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-1">
                    {item.number}
                  </h4>
                  <p className="text-gray-600 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for Modern Educational Institutions
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our attendance tracking system is designed with the needs of
                today's educational institutions in mind. From small classrooms
                to large universities, we provide scalable solutions that grow
                with your organization.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">
                    Real-time synchronization across all devices
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">
                    Advanced reporting and analytics
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">
                    Multi-role access with secure authentication
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">
                    Mobile-responsive design for all screen sizes
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-xl">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center shadow-md">
                    <div className="text-2xl mb-2">🎓</div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-md">
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <div className="text-sm text-gray-600">Teachers</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-md">
                    <div className="text-2xl mb-2">👩‍💼</div>
                    <div className="text-sm text-gray-600">Admins</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Unified Dashboard
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-green-100 h-3 rounded-full w-4/5"></div>
                    <div className="bg-blue-100 h-3 rounded-full w-3/4"></div>
                    <div className="bg-purple-100 h-3 rounded-full w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Live Statistics Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 animate-pulse">
              📊 Live System Statistics
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Real-time
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                Performance{" "}
              </span>
              Metrics
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Watch our system in action with live data from educational
              institutions worldwide
            </p>
          </div>

          {/* Live Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: "🎓",
                value: stats.totalUsers.toLocaleString(),
                label: "Students Online",
                color: "from-green-400 to-emerald-500",
                pulse: true,
              },
              {
                icon: "📚",
                value: stats.activeClasses.toString(),
                label: "Active Classes",
                color: "from-blue-400 to-cyan-500",
                pulse: false,
              },
              {
                icon: "📊",
                value: `${stats.dailyAttendance}%`,
                label: "Attendance Rate",
                color: "from-purple-400 to-violet-500",
                pulse: false,
              },
              {
                icon: "🏫",
                value: stats.reportsGenerated.toString(),
                label: "Institutions Connected",
                color: "from-orange-400 to-red-500",
                pulse: true,
              },
            ].map((stat, index) => (
              <div key={index} className="relative group">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 relative overflow-hidden">
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
                  ></div>

                  <div className="relative z-10 text-center">
                    <div
                      className={`text-5xl mb-4 ${
                        stat.pulse ? "animate-pulse" : ""
                      }`}
                    >
                      {stat.icon}
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 font-mono">
                      {stat.value}
                    </div>
                    <div className="text-blue-200 font-medium">
                      {stat.label}
                    </div>

                    {/* Live Indicator */}
                    {stat.pulse && (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-300">LIVE</span>
                      </div>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-3xl transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-semibold">
                  System Status: Operational
                </span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <span className="text-blue-200">Uptime: 99.9%</span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <span className="text-purple-200">Last Updated: Just now</span>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-500"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              🚀 Ready to Transform?
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Attendance Tracking?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of institutions already using our platform to
            streamline their operations and boost student engagement.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              to="/login"
              className="group bg-white text-blue-600 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Start Free Trial
                <svg
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  ></path>
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 opacity-10"></div>
            </Link>

            <button className="group border-2 border-white/50 backdrop-blur-sm text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/10 hover:border-white transition-all duration-300 relative overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-3">
                📅 Schedule Demo
              </span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span className="font-semibold">SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-semibold">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              <span className="font-semibold">No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <span className="font-semibold">Mobile Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                What Educators Say About Haazir
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Trusted by schools worldwide to revolutionize attendance management
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{testimonial.name}</h4>
                      <p className="text-slate-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{testimonial.content}</p>
                  <div className="flex mt-6">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">⭐</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Haazir Section - Interactive Demo */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-semibold text-blue-600 mb-6 shadow-lg border border-white/50">
              <span className="mr-2">🚀</span>
              Interactive Demo
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Experience <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Haazir</span> in Action
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              See how our platform works across different devices and user roles. Click on the devices to explore different interfaces.
            </p>
          </div>

          {/* Interactive Demo Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Mobile Device */}
            <div className="lg:col-span-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3">
                    <span className="text-white text-xs font-semibold">9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                      <span className="text-white text-xs">📶</span>
                      <span className="text-white text-xs">🔋</span>
                    </div>
                  </div>
                  
                  {/* Mobile Content */}
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-800 text-center">Analytics View</h4>
                    <div className="space-y-2">
                      <div className="bg-green-50 rounded-lg p-3 flex items-center space-x-2">
                        <span className="text-lg">📈</span>
                        <div>
                          <div className="text-xs font-semibold text-green-700">Attendance Trends</div>
                          <div className="text-xs text-slate-600">Active</div>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 flex items-center space-x-2">
                        <span className="text-lg">📊</span>
                        <div>
                          <div className="text-xs font-semibold text-blue-700">Performance Metrics</div>
                          <div className="text-xs text-slate-600">Active</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Interactive Elements */}
            <div className="lg:col-span-6 text-center">
              <div className="relative">
                {/* Central Hub */}
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-white text-4xl">💻</span>
                </div>

                {/* Dashboard Options */}
                <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Student Dashboard</h4>
                    <p className="text-sm text-slate-600">Clean, intuitive interface for students</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">Teacher Interface</h4>
                    <p className="text-sm text-slate-600">Comprehensive tools for educators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Device */}
            <div className="lg:col-span-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl">
                  {/* Desktop Header */}
                  <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Analytics View</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🔔</span>
                      <span className="text-lg">👤</span>
                    </div>
                  </div>
                  
                  {/* Desktop Content */}
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">📈</span>
                          <div>
                            <div className="text-xs font-semibold text-green-700">Attendance Trends</div>
                            <div className="text-xs text-slate-600">Active</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">📊</span>
                          <div>
                            <div className="text-xs font-semibold text-blue-700">Performance Metrics</div>
                            <div className="text-xs text-slate-600">Active</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">📋</span>
                          <div>
                            <div className="text-xs font-semibold text-purple-700">Insights & Reports</div>
                            <div className="text-xs text-slate-600">Active</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">⚠️</span>
                          <div>
                            <div className="text-xs font-semibold text-red-700">Risk Indicators</div>
                            <div className="text-xs text-slate-600">Active</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Real-Time Analytics</h3>
              <p className="text-slate-600 leading-relaxed">Monitor attendance patterns and generate insights with our comprehensive analytics dashboard.</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Multi-Role Access</h3>
              <p className="text-slate-600 leading-relaxed">Tailored interfaces for administrators, teachers, and students with role-based permissions.</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 text-center group">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Instant Notifications</h3>
              <p className="text-slate-600 leading-relaxed">Keep parents and administrators informed with real-time notifications and automated reporting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Performance Matrix */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Real-Time Performance Matrix
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Track and analyze attendance metrics with live updates and comprehensive insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {achievementStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-slate-800 mb-2">
                  <AnimatedCounter target={stat.number} label={stat.label} icon={stat.icon} />
                </div>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Attendance Trends</h3>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📈</div>
                    <p className="text-slate-600">Interactive Charts Coming Soon</p>
                    <p className="text-sm text-slate-500 mt-2">Real-time data visualization</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-slate-800">Key Metrics</h4>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-700 font-medium">Overall Attendance</span>
                      <span className="text-blue-600 font-bold">92.5%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '92.5%'}}></div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-700 font-medium">On-Time Arrival</span>
                      <span className="text-emerald-600 font-bold">87.3%</span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{width: '87.3%'}}></div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-700 font-medium">Weekly Average</span>
                      <span className="text-purple-600 font-bold">89.1%</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '89.1%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Transform Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your School's Attendance Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of educational institutions worldwide who have revolutionized their attendance tracking with Haazir's comprehensive solution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/login"
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Free Trial
              </Link>
              <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300">
                Schedule Demo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="text-white">
                <div className="text-2xl mb-2">✅</div>
                <h4 className="font-semibold mb-2">No Setup Fees</h4>
                <p className="text-blue-100 text-sm">Get started immediately with zero upfront costs</p>
              </div>
              <div className="text-white">
                <div className="text-2xl mb-2">🚀</div>
                <h4 className="font-semibold mb-2">Quick Implementation</h4>
                <p className="text-blue-100 text-sm">Deploy in your school within 24 hours</p>
              </div>
              <div className="text-white">
                <div className="text-2xl mb-2">💯</div>
                <h4 className="font-semibold mb-2">24/7 Support</h4>
                <p className="text-blue-100 text-sm">Expert assistance whenever you need it</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indigle-Style Footer */}
      <footer className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Enhanced Brand Section */}
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">Haazir School</span>
                  <div className="text-sm text-blue-600 font-semibold border-b-2 border-blue-600 inline-block">Management System</div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📍</span>
                  <span>Education City, Innovation District</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">�</span>
                  <span>+1-800-HAAZIR-1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">✉️</span>
                  <span className="text-blue-600">support@haazir.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">�</span>
                  <span>Mon - Fri: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-blue-600 mr-2">→</span>
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2">
                    <span className="text-gray-400">🏠</span>
                    <span>Home</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2">
                    <span className="text-gray-400">ℹ️</span>
                    <span>About Us</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2">
                    <span className="text-gray-400">🔧</span>
                    <span>Services</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2">
                    <span className="text-gray-400">📝</span>
                    <span>Blog</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2">
                    <span className="text-gray-400">🌐</span>
                    <span>Demo Website</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2">
                    <span className="text-gray-400">🔒</span>
                    <span>Privacy Policy</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter Section */}
            <div className="lg:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Subscribe to Our Newsletter</h4>
              <p className="text-sm text-gray-600 mb-4">
                Get the latest updates on school events, news, and more.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
                  <span>✉️</span>
                  <span>Subscribe</span>
                </button>
              </div>

              {/* Important Policies */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-purple-600 mr-2">⚖️</span>
                  Important Policies
                </h5>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <a href="#" className="hover:text-blue-600 transition-colors flex items-center space-x-1">
                    <span>🔒</span>
                    <span>Privacy Policy</span>
                  </a>
                  <a href="#" className="hover:text-blue-600 transition-colors flex items-center space-x-1">
                    <span>📋</span>
                    <span>Terms of Use</span>
                  </a>
                  <a href="#" className="hover:text-blue-600 transition-colors flex items-center space-x-1">
                    <span>↩️</span>
                    <span>Refund Policy</span>
                  </a>
                  <a href="#" className="hover:text-blue-600 transition-colors flex items-center space-x-1">
                    <span>⚖️</span>
                    <span>Code of Conduct</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 text-center md:text-left mb-4 md:mb-0">
              © 2024 Haazir School Management. All Rights Reserved.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a href="#" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors" title="Facebook">
                <span className="text-white text-sm">📘</span>
              </a>
              <a href="#" className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-orange-500 transition-all" title="Instagram">
                <span className="text-white text-sm">📷</span>
              </a>
              <a href="#" className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors" title="Telegram">
                <span className="text-white text-sm">✈️</span>
              </a>
              <a href="#" className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors" title="YouTube">
                <span className="text-white text-sm">📺</span>
              </a>
              <a href="#" className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors" title="LinkedIn">
                <span className="text-white text-sm">💼</span>
              </a>
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
};

export default LandingPage;
