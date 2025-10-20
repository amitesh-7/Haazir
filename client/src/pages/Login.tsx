import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { EnhancedInput, EnhancedButton } from "../components/common/Forms";
import { AnimatedCounter, SuccessAnimation, FadeIn, BouncingDots } from "../components/common/MicroInteractions";
import { LoadingSpinner, PulseLoader } from "../components/common/EnhancedLoading";
import { colors, animations } from "../utils/designTokens";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({});
  const [touchedFields, setTouchedFields] = useState<{email?: boolean; password?: boolean}>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();

  // Focus management for better accessibility
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 1, 2, 3 for quick demo logins
      if (e.altKey && !loading) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleDemoLogin("coordinator@example.com", "Password123!");
            break;
          case '2':
            e.preventDefault();
            handleDemoLogin("teacher@test.com", "password123");
            break;
          case '3':
            e.preventDefault();
            handleDemoLogin("student@test.com", "password123");
            break;
        }
      }
      
      // Enter to submit when focused on remember me checkbox
      if (e.key === 'Enter' && document.activeElement?.id === 'remember-me') {
        e.preventDefault();
        const form = document.querySelector('form');
        form?.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading]);

  // Form validation
  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldBlur = (field: 'email' | 'password') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Mark all fields as touched
    setTouchedFields({ email: true, password: true });
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
      setShowSuccess(true);
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed");
    }
    setLoading(false);
  };

  // Demo login handlers with animation
  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setTouchedFields({ email: true, password: true });
    
    // Trigger form submission after state update
    setTimeout(() => {
      const form = document.querySelector('form');
      form?.requestSubmit();
    }, 100);
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd)) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const getStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-blue-100 flex">
      {/* Left side - Features showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-48 h-48 bg-purple-300/30 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-300/40 rounded-full blur-lg animate-ping"></div>
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-indigo-300/30 rounded-full blur-md animate-float"></div>
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-center text-white">
          <h1 className="text-5xl font-bold mb-8">
            Smart Attendance
            <span className="block text-purple-200">Management</span>
          </h1>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <FadeIn delay={100}>
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                <AnimatedCounter 
                  value={1247} 
                  className="text-3xl font-bold text-purple-200"
                  duration={2000}
                />
                <div className="text-sm opacity-90">Students Active</div>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                <AnimatedCounter 
                  value={89} 
                  className="text-3xl font-bold text-blue-200"
                  duration={2000}
                />
                <div className="text-sm opacity-90">Teachers Online</div>
              </div>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                <AnimatedCounter 
                  value={34} 
                  className="text-3xl font-bold text-indigo-200"
                  duration={2000}
                />
                <div className="text-sm opacity-90">Classes Running</div>
              </div>
            </FadeIn>
            <FadeIn delay={400}>
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                <AnimatedCounter 
                  value={94.2} 
                  suffix="%" 
                  className="text-3xl font-bold text-purple-300"
                  duration={2000}
                />
                <div className="text-sm opacity-90">Attendance Rate</div>
              </div>
            </FadeIn>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm opacity-80">
                  Track attendance patterns and insights
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold">Lightning Fast</h3>
                <p className="text-sm opacity-80">Mark attendance in seconds</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold">Secure & Reliable</h3>
                <p className="text-sm opacity-80">Enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Glassmorphism background overlay */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-purple-700 hover:text-purple-600 transition-colors mb-4 sm:mb-6 text-sm sm:text-base touch-manipulation font-medium"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Sign in to your account</p>
          </div>

          {error && (
            <FadeIn direction="down" className="mb-6">
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-xl shadow-lg animate-shake">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500/30 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="flex-1">{error}</span>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-300 hover:text-red-100 transition-colors p-1 rounded hover:bg-red-500/20"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </FadeIn>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <FadeIn delay={100}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touchedFields.email) validateForm();
                    }}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-3 bg-white/70 backdrop-blur-sm border rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ${
                      touchedFields.email && formErrors.email 
                        ? 'border-red-400 focus:ring-red-400' 
                        : 'border-purple-200 hover:border-purple-300'
                    }`}
                    required
                    autoComplete="email"
                    aria-describedby={formErrors.email ? 'email-error' : undefined}
                  />
                  {/* Email validation icon */}
                  {email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {touchedFields.email && !formErrors.email ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : touchedFields.email && formErrors.email ? (
                        <span className="text-red-500 text-lg">⚠</span>
                      ) : null}
                    </div>
                  )}
                </div>
                {touchedFields.email && formErrors.email && (
                  <div id="email-error" className="mt-2 text-sm text-red-300 flex items-center space-x-2 animate-slide-down">
                    <span className="w-4 h-4 bg-red-500/30 rounded-full flex items-center justify-center">
                      <span className="text-xs">!</span>
                    </span>
                    <span>{formErrors.email}</span>
                  </div>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-sm text-purple-600 hover:text-purple-500 transition-colors"
                    onClick={() => alert('Forgot password functionality would be implemented here')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touchedFields.password) validateForm();
                    }}
                    onBlur={() => handleFieldBlur('password')}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 bg-white/70 backdrop-blur-sm border rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ${
                      touchedFields.password && formErrors.password 
                        ? 'border-red-400 focus:ring-red-400' 
                        : 'border-purple-200 hover:border-purple-300'
                    }`}
                    required
                    autoComplete="current-password"
                    aria-describedby={formErrors.password ? 'password-error' : 'password-strength'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-600 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div id="password-strength" className="mt-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span className="flex items-center space-x-1">
                        <span>🔒</span>
                        <span>Password strength</span>
                      </span>
                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                        passwordStrength >= 75 ? 'text-green-700 bg-green-100' :
                        passwordStrength >= 50 ? 'text-yellow-700 bg-yellow-100' :
                        passwordStrength >= 25 ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'
                      }`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                            passwordStrength >= 75 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            passwordStrength >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            passwordStrength >= 25 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        >
                          {/* Animated shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                      </div>
                      {/* Strength indicators */}
                      <div className="flex justify-between mt-1">
                        {[25, 50, 75, 100].map((threshold, index) => (
                          <div
                            key={threshold}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              passwordStrength >= threshold 
                                ? 'bg-purple-500 scale-125' 
                                : 'bg-purple-200 scale-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {touchedFields.password && formErrors.password && (
                  <div id="password-error" className="mt-2 text-sm text-red-300 flex items-center space-x-2 animate-slide-down">
                    <span className="w-4 h-4 bg-red-500/30 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xs">!</span>
                    </span>
                    <span>{formErrors.password}</span>
                  </div>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-purple-600 bg-white/70 border-purple-300 rounded focus:ring-purple-500 focus:ring-2 touch-manipulation"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 touch-manipulation">
                    Remember me
                  </label>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/50 relative overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <PulseLoader size="sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                )}
              </button>
            </FadeIn>
          </form>

          {/* Demo credentials */}
          <FadeIn delay={500}>
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-purple-200">
              <h3 className="text-gray-700 font-medium mb-3 sm:mb-4 text-center flex items-center justify-center space-x-2 text-sm sm:text-base">
                <span>⚡</span>
                <span>Quick Login</span>
                <span className="text-xs text-gray-500 ml-2">(Alt + 1,2,3)</span>
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:gap-3 text-sm">
                <button
                  onClick={() => handleDemoLogin("coordinator@example.com", "Password123!")}
                  className="group bg-white/60 hover:bg-white/80 active:bg-white/90 backdrop-blur-sm border border-purple-200 hover:border-purple-300 text-purple-700 py-3 sm:py-3 px-4 rounded-xl transition-all duration-300 text-left hover:scale-105 active:scale-95 hover:shadow-lg touch-manipulation min-h-[44px]"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span>👔</span>
                      </div>
                      <div>
                        <div className="font-medium">Coordinator</div>
                        <div className="text-xs text-purple-600/70">Full system access</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <kbd className="px-1.5 py-0.5 text-xs bg-purple-100 rounded border border-purple-200 text-purple-600">Alt+1</kbd>
                      <div className="text-purple-500 group-hover:text-purple-600 transition-colors">→</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDemoLogin("teacher@test.com", "password123")}
                  className="group bg-white/60 hover:bg-white/80 active:bg-white/90 backdrop-blur-sm border border-blue-200 hover:border-blue-300 text-blue-700 py-3 sm:py-3 px-4 rounded-xl transition-all duration-300 text-left hover:scale-105 active:scale-95 hover:shadow-lg touch-manipulation min-h-[44px]"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span>👨‍🏫</span>
                      </div>
                      <div>
                        <div className="font-medium">Teacher</div>
                        <div className="text-xs text-blue-600/70">Manage classes & attendance</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <kbd className="px-1.5 py-0.5 text-xs bg-blue-100 rounded border border-blue-200 text-blue-600">Alt+2</kbd>
                      <div className="text-blue-500 group-hover:text-blue-600 transition-colors">→</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDemoLogin("student@test.com", "password123")}
                  className="group bg-white/60 hover:bg-white/80 active:bg-white/90 backdrop-blur-sm border border-indigo-200 hover:border-indigo-300 text-indigo-700 py-3 sm:py-3 px-4 rounded-xl transition-all duration-300 text-left hover:scale-105 active:scale-95 hover:shadow-lg touch-manipulation min-h-[44px]"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span>🎓</span>
                      </div>
                      <div>
                        <div className="font-medium">Student</div>
                        <div className="text-xs text-indigo-600/70">View attendance & timetable</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <kbd className="px-1.5 py-0.5 text-xs bg-indigo-100 rounded border border-indigo-200 text-indigo-600">Alt+3</kbd>
                      <div className="text-indigo-500 group-hover:text-indigo-600 transition-colors">→</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </FadeIn>
          
          {/* Success Animation */}
          {showSuccess && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 text-center border border-purple-200">
                <SuccessAnimation 
                  onComplete={() => setShowSuccess(false)}
                  size="lg"
                />
                <p className="mt-4 text-gray-700 font-medium">Successfully logged in!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
