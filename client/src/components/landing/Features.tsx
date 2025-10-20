import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Lottie from 'lottie-react';
import { useTheme } from '../../hooks/useTheme';
import {
  CheckCircle2,
  Users,
  BarChart3,
  FileText,
  Shield,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';

// Import Lottie animations
import attendanceCheckData from '../../assets/lottie/attendence-check.json';
import analyticsChartData from '../../assets/lottie/analytics-chart.json';
import multiUserData from '../../assets/lottie/multi-user.json';
import reportAutoData from '../../assets/lottie/report-auto.json';

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  lottieData?: any;
  gradient: string;
  highlights: string[];
}

const Features: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const features: Feature[] = [
    {
      icon: CheckCircle2,
      title: "AI-Powered Attendance",
      description: "Face recognition technology built for Indian classrooms. Works with diverse lighting and crowd conditions.",
      lottieData: attendanceCheckData,
      gradient: "from-blue-500 to-cyan-500",
      highlights: ["99.7% accuracy", "Works in Indian conditions", "Instant marking"]
    },
    {
      icon: BarChart3,
      title: "Indian Education Analytics",
      description: "Dashboards designed for Indian academic calendars, exam patterns, and institutional requirements.",
      lottieData: analyticsChartData,
      gradient: "from-purple-500 to-pink-500",
      highlights: ["CBSE/State board support", "Semester tracking", "Parent notifications"]
    },
    {
      icon: Users,
      title: "Multi-Campus Management",
      description: "Manage multiple branches, departments, and courses. Perfect for universities and coaching chains.",
      lottieData: multiUserData,
      gradient: "from-orange-500 to-red-500",
      highlights: ["Branch management", "Bulk student import", "Department wise access"]
    },
    {
      icon: FileText,
      title: "Government Compliant Reports",
      description: "Generate reports in formats required by UGC, AICTE, and state education boards.",
      lottieData: reportAutoData,
      gradient: "from-green-500 to-emerald-500",
      highlights: ["UGC format", "AICTE compliance", "State board ready"]
    },
    {
      icon: Shield,
      title: "Data Localization",
      description: "All student data stored in India with compliance to local data protection laws.",
      gradient: "from-indigo-500 to-purple-500",
      highlights: ["India-based servers", "DPDP Act compliant", "Local support"]
    },
    {
      icon: Zap,
      title: "Works Offline",
      description: "Attendance marking works even with poor internet. Auto-syncs when connection is restored.",
      gradient: "from-yellow-500 to-orange-500",
      highlights: ["Offline capable", "Auto-sync", "Low bandwidth optimized"]
    },
    {
      icon: Clock,
      title: "Indian Academic Calendar",
      description: "Built-in support for Indian holidays, exam schedules, and academic year patterns.",
      gradient: "from-teal-500 to-cyan-500",
      highlights: ["Festival holidays", "Exam integration", "Academic year support"]
    },
    {
      icon: TrendingUp,
      title: "75% Attendance Tracking",
      description: "Automated alerts for students approaching 75% attendance threshold as per Indian regulations.",
      gradient: "from-pink-500 to-rose-500",
      highlights: ["75% alerts", "Parent notifications", "Early warnings"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`relative py-16 md:py-20 overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900'
          : 'bg-gradient-to-b from-blue-50 via-white to-gray-50'
      }`}
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 8,
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
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-4 h-4 text-blue-500" />
            <span className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Powerful Features
            </span>
          </motion.div>

          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Everything You Need,{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              All in One Place
            </span>
          </h2>

          <p className={`text-lg max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            From AI-powered attendance to comprehensive analytics, we've built every feature
            to make attendance management effortless and intelligent.
          </p>
        </motion.div>

        {/* Features Grid - Bento Layout */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLarge = index < 4; // First 4 cards are larger

            return (
              <motion.div
                key={index}
                className={`group relative ${
                  isLarge ? 'lg:col-span-2 lg:row-span-1' : 'lg:col-span-1'
                }`}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`relative h-full p-8 rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/80 hover:border-gray-600'
                      : 'bg-white/50 border-gray-200 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Gradient Background on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon or Lottie */}
                    {feature.lottieData && isLarge ? (
                      <div className="mb-6 w-32 h-32 mx-auto lg:mx-0">
                        <Lottie
                          animationData={feature.lottieData}
                          loop
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className={`mb-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Decorative Corner Element */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-bl-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className={`text-lg mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Ready to transform your attendance management?
          </p>
          <motion.button
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore All Features
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
