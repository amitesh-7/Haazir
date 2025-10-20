import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Navbar from '../components/landing/Navbar';
import loginIllustration from '../assets/lottie/login-illustration.json';
import faceRecognitionIcon from '../assets/lottie/face-recogniiton-icon.json';
import securityShieldIcon from '../assets/lottie/security-shield-icon.json';
import analyticsIcon from '../assets/lottie/analytics-icon.json';
import multiUserIcon from '../assets/lottie/multi-user-icon.json';

interface LocationState {
  from?: { pathname: string };
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const EnhancedLogin: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Animated Background Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resizeCanvas);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = theme === 'dark' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > height) particle.speedY *= -1;

        ctx.fillStyle = theme === 'dark' 
          ? `rgba(139, 92, 246, ${particle.opacity})`
          : `rgba(99, 102, 241, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        particles.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.strokeStyle = theme === 'dark'
                ? `rgba(139, 92, 246, ${0.1 * (1 - distance / 100)})`
                : `rgba(99, 102, 241, ${0.1 * (1 - distance / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % 4);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Show success animation
      setShowSuccess(true);

      // Redirect after animation
      setTimeout(() => {
        const from = location.state?.from?.pathname || `/${data.user.role}`;
        history.replace(from);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: theme === 'dark' ? '#0f172a' : '#f9fafb' }}
      />

      {/* Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden pt-4">
        {/* Left Side - Illustration with Lottie */}
        <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-8 ${
          theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-purple-50 to-indigo-50'
        }`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full max-w-lg"
          >
            {/* Illustration Content */}
            <div className="space-y-6">
              {/* Main Heading */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    Smart Attendance System
                  </span>
                </motion.div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Welcome Back!
                </h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Experience AI-powered attendance tracking
                </p>
              </div>

              {/* Feature Carousel with Lottie Icons */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {(() => {
                    const features = [
                      {
                        lottie: faceRecognitionIcon,
                        title: 'Face Recognition',
                        description: 'AI-powered instant marking',
                      },
                      {
                        lottie: securityShieldIcon,
                        title: 'Secure & Safe',
                        description: 'Enterprise security',
                      },
                      {
                        lottie: analyticsIcon,
                        title: 'Real-time Insights',
                        description: 'Comprehensive reports',
                      },
                      {
                        lottie: multiUserIcon,
                        title: 'Multi-role Access',
                        description: 'For everyone',
                      },
                    ];

                    const feature = features[currentFeatureIndex];

                    return (
                      <motion.div
                        key={currentFeatureIndex}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className={`p-8 rounded-2xl backdrop-blur-sm text-center ${
                          theme === 'dark'
                            ? 'bg-slate-700/40 border border-slate-600/40'
                            : 'bg-white/60 border border-purple-200'
                        }`}
                      >
                        <div className="w-40 h-40 mx-auto mb-6">
                          <Lottie 
                            animationData={feature.lottie} 
                            loop={true}
                          />
                        </div>
                        <h3 className={`font-bold text-2xl mb-3 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {feature.title}
                        </h3>
                        <p className={`text-base ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {feature.description}
                        </p>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Carousel Indicators */}
                <div className="flex justify-center gap-3 mt-6">
                  {[0, 1, 2, 3].map((index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeatureIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentFeatureIndex === index
                          ? 'w-8 bg-purple-500'
                          : theme === 'dark'
                          ? 'bg-slate-600 hover:bg-slate-500'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to feature ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <motion.div 
              className="text-center mb-6 mt-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Welcome Back
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Sign in to your account to continue
              </p>
            </motion.div>

            {/* Login Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-xl rounded-2xl shadow-2xl p-8 ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border border-slate-700/50' 
                  : 'bg-white/80 border border-gray-200/50'
              }`}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email" 
                    className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-200 backdrop-blur-md ${
                        validationErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:bg-slate-700'
                          : 'bg-white/60 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-indigo-500 focus:bg-white/80'
                      } focus:outline-none focus:ring-2`}
                      placeholder="Enter your email"
                    />
                  </div>
                  <AnimatePresence>
                    {validationErrors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{validationErrors.email}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Field */}
                <div>
                  <label 
                    htmlFor="password" 
                    className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 rounded-xl border transition-all duration-200 backdrop-blur-md ${
                        validationErrors.password
                          ? 'border-red-500 focus:ring-red-500'
                          : theme === 'dark'
                          ? 'bg-slate-700/30 border-slate-600/50 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:bg-slate-700/40'
                          : 'bg-white/60 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-indigo-500 focus:bg-white/80'
                      } focus:outline-none focus:ring-2`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      } transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {validationErrors.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{validationErrors.password}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className={`ml-2 text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Remember me
                    </span>
                  </label>
                  <a 
                    href="#" 
                    className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-500">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className={`absolute inset-0 flex items-center ${
                  theme === 'dark' ? 'opacity-20' : 'opacity-40'
                }`}>
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-4 ${
                    theme === 'dark' ? 'bg-slate-800/50 text-gray-400' : 'bg-white/80 text-gray-500'
                  }`}>
                    New to Haazir?
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <a 
                  href="#" 
                  className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Create an account
                </a>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`mt-8 text-center text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              © 2025 Haazir. All rights reserved.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className={`p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}
            >
              <div className="text-center">
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </motion.div>
                </motion.div>

                {/* Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: '50%', 
                        y: '50%', 
                        scale: 0,
                        opacity: 1 
                      }}
                      animate={{
                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                        y: `${50 + (Math.random() - 0.5) * 100}%`,
                        scale: [0, 1, 0],
                        opacity: [1, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: Math.random() * 0.3,
                        ease: 'easeOut',
                      }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981'][
                          Math.floor(Math.random() * 4)
                        ],
                      }}
                    />
                  ))}
                </div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`text-2xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Login Successful!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                >
                  Redirecting to your dashboard...
                </motion.p>

                {/* Loading Bar */}
                <motion.div
                  className="mt-6 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: 'linear' }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedLogin;
