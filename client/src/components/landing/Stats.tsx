import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Lottie from 'lottie-react';
import { useTheme } from '../../hooks/useTheme';

// Import Lottie animations for stats icons
import userCountAnimation from '../../assets/lottie/user-count.json';
import buildingIconAnimation from '../../assets/lottie/building-icon.json';
import checkmarkCircleAnimation from '../../assets/lottie/checkmark-circle.json';
import trendingUpAnimation from '../../assets/lottie/trending-up.json';
import starRatingAnimation from '../../assets/lottie/star-rating.json';
import globeIconAnimation from '../../assets/lottie/globe-icon.json';

// Note: Connect to your backend API endpoint
// API Endpoint: /api/stats
// Expected response format:
// {
//   activeUsers: number,
//   institutions: number,
//   attendanceRecords: number,
//   accuracyRate: number,
//   customerSatisfaction: number,
//   countriesServed: number
// }

interface StatItem {
  lottieAnimation: any;
  value: number;
  suffix: string;
  label: string;
  gradient: string;
}

const Stats: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/stats');
        // const data = await response.json();
        
        // For now, using dynamic data structure ready for API integration
        const stats: StatItem[] = [
          {
            lottieAnimation: userCountAnimation,
            value: 200000, // 2 lakh students across India
            suffix: '+',
            label: 'Active Students',
            gradient: 'from-blue-500 to-cyan-500'
          },
          {
            lottieAnimation: buildingIconAnimation,
            value: 750, // Indian educational institutions
            suffix: '+',
            label: 'Indian Institutions',
            gradient: 'from-purple-500 to-pink-500'
          },
          {
            lottieAnimation: checkmarkCircleAnimation,
            value: 50000000, // 5 crore attendance records
            suffix: '+',
            label: 'Attendance Records',
            gradient: 'from-green-500 to-emerald-500'
          },
          {
            lottieAnimation: trendingUpAnimation,
            value: 99.7, // High accuracy rate
            suffix: '%',
            label: 'Accuracy Rate',
            gradient: 'from-orange-500 to-amber-500'
          },
          {
            lottieAnimation: starRatingAnimation,
            value: 4.9, // Customer rating out of 5
            suffix: '/5',
            label: 'Customer Rating',
            gradient: 'from-pink-500 to-rose-500'
          },
          {
            lottieAnimation: globeIconAnimation,
            value: 28, // Indian states and UTs covered
            suffix: '+',
            label: 'Indian States',
            gradient: 'from-indigo-500 to-blue-500'
          }
        ];        setStatsData(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative py-16 md:py-20 overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900'
          : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'
      }`}
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/4 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1.3, 1, 1.3]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Thousands Worldwide
            </span>
          </h2>

          <p className={`text-lg max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Join the leading institutions and organizations using our platform for
            seamless attendance management.
          </p>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl border backdrop-blur-sm animate-pulse ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-white/50 border-gray-200'
                }`}
              >
                <div className="w-12 h-12 bg-gray-300 rounded-xl mb-4"></div>
                <div className="w-24 h-8 bg-gray-300 rounded mb-2"></div>
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                stat={stat}
                index={index}
                isInView={isInView}
                theme={theme}
              />
            ))}
          </div>
        )}

        {/* Testimonial Section - Will be populated from API */}
        {/* TODO: Connect to testimonials API endpoint */}
      </div>
    </section>
  );
};

// Separate component for animated stat card
const StatCard: React.FC<{
  stat: StatItem;
  index: number;
  isInView: boolean;
  theme: string;
}> = ({ stat, index, isInView, theme }) => {
  const [count, setCount] = useState(0);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepValue = stat.value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(stat.value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(stepValue * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, stat.value]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div
        className={`relative p-8 rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/80 hover:border-gray-600'
            : 'bg-white/50 border-gray-200 hover:bg-white hover:border-gray-300'
        }`}
      >
        {/* Gradient Background on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Lottie Icon */}
          <div 
            className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 relative overflow-hidden`}
            onMouseEnter={() => lottieRef.current?.play()}
            onMouseLeave={() => lottieRef.current?.stop()}
          >
            <Lottie
              lottieRef={lottieRef}
              animationData={stat.lottieAnimation}
              loop={true}
              autoplay={false}
              style={{ width: 48, height: 48 }}
            />
          </div>

          {/* Animated Number */}
          <div className="mb-2">
            <span className={`text-4xl md:text-5xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {formatNumber(count)}
            </span>
            <span className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.suffix}
            </span>
          </div>

          {/* Label */}
          <p className={`text-lg font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {stat.label}
          </p>
        </div>

        {/* Decorative Corner Element */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-bl-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`}
        />
      </div>
    </motion.div>
  );
};

export default Stats;
