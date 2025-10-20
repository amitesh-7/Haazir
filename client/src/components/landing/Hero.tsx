import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Lottie from "lottie-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

// Import Lottie animations
import heroAnimationData from "../../assets/lottie/hero-animation.json";
import backgroundAnimationData from "../../assets/lottie/background.json";

const Hero: React.FC = () => {
  const { theme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Scroll animations - Reduced scroll distance for faster transitions
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 150], [0, -30]);
  const y2 = useTransform(scrollY, [0, 150], [0, 50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.3]);
  const scale = useTransform(scrollY, [0, 150], [1, 0.98]);

  // Smooth spring animations
  const springConfig = { stiffness: 150, damping: 30 };
  const smoothY1 = useSpring(y1, springConfig);
  const smoothY2 = useSpring(y2, springConfig);

  // Mouse move 3D effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.section
      ref={heroRef}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden pt-6 ${
        theme === "dark" ? "" : "bg-white"
      }`}
      style={{ opacity }}
    >
      {/* Lottie Background Animation for Hero Section - Only in Dark Mode */}
      {theme === "dark" && (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <Lottie
            animationData={backgroundAnimationData}
            loop
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ y: smoothY1 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 mb-6"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                AI-Powered Attendance System
              </span>
              <motion.span
                className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Live
              </motion.span>
            </motion.div>

            {/* Heading */}
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="block">Attendance</span>
              <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>

            {/* Subheading */}
            <p
              className={`text-xl md:text-2xl mb-8 leading-relaxed ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              India's most trusted attendance management system with face
              recognition, real-time analytics, and automated reporting. Built
              for Indian educational institutions.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                {
                  icon: CheckCircle2,
                  text: "Face Recognition",
                  color: "text-green-500",
                },
                {
                  icon: BarChart3,
                  text: "Real-time Analytics",
                  color: "text-blue-500",
                },
                {
                  icon: Users,
                  text: "Multi-role Access",
                  color: "text-purple-500",
                },
                {
                  icon: Shield,
                  text: "Secure & Private",
                  color: "text-orange-500",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    theme === "dark"
                      ? "bg-slate-800/50 text-gray-300"
                      : "bg-white/50 text-gray-700"
                  } backdrop-blur-sm border ${
                    theme === "dark" ? "border-slate-700" : "border-gray-200"
                  } shadow-sm hover:shadow-md cursor-pointer`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(99, 102, 241, 0.2)"
                        : "rgba(99, 102, 241, 0.1)",
                  }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  >
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  </motion.div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-indigo-500/50 overflow-hidden"
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              <motion.button
                onClick={() => setIsVideoPlaying(true)}
                className={`group px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 ${
                  theme === "dark"
                    ? "bg-slate-800/50 text-white border border-slate-700 hover:bg-slate-800"
                    : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
                } backdrop-blur-sm transition-all`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </motion.div>
                Watch Demo
              </motion.button>
            </div>

            {/* Trust Indicators */}
            <motion.div
              className="mt-12 flex items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div>
                <div
                  className={`text-3xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  50K+
                </div>
                <div
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Active Users
                </div>
              </div>
              <div
                className={`h-12 w-px ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                }`}
              />
              <div>
                <div
                  className={`text-3xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  150+
                </div>
                <div
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Institutions
                </div>
              </div>
              <div
                className={`h-12 w-px ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                }`}
              />
              <div>
                <div
                  className={`text-3xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  98%
                </div>
                <div
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Satisfaction
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - 3D Animation */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              y: smoothY2,
              rotateX: mousePosition.y * 5,
              rotateY: mousePosition.x * 5,
            }}
          >
            <div className="relative">
              {/* Lottie Animation */}
              <Lottie
                animationData={heroAnimationData}
                loop
                className="w-full h-auto"
              />

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-lg opacity-20"
                animate={{
                  y: [0, -20, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full blur-lg opacity-15"
                animate={{
                  y: [0, 20, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className={`flex flex-col items-center gap-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-current rounded-full p-1">
            <motion.div
              className="w-1.5 h-1.5 bg-current rounded-full mx-auto"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsVideoPlaying(false)}
        >
          <motion.div
            className="relative w-full max-w-4xl mx-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-3xl">×</span>
            </button>
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Haazir Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.section>
  );
};

export default Hero;
