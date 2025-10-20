import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { useTheme } from "../../hooks/useTheme";
import {
  Menu,
  X,
  Home,
  Info,
  Mail,
  LogIn,
  Sparkles,
  DollarSign,
} from "lucide-react";

// Import theme toggle animation
import themeToggleAnimation from "../../assets/lottie/theme-toggle.json";

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Features", path: "/features", icon: Sparkles },
    { name: "Pricing", path: "/pricing", icon: DollarSign },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Mail },
  ];

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? theme === "dark"
              ? "bg-slate-900/85 backdrop-blur-xl border-b border-slate-800 shadow-xl"
              : "bg-white/85 backdrop-blur-xl border-b border-gray-200 shadow-lg"
            : theme === "dark"
            ? "bg-slate-900/40 backdrop-blur-md"
            : "bg-white/40 backdrop-blur-md"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative w-12 h-12 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Background Glow Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Main Logo Container */}
                <motion.div
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
                      : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
                  } shadow-lg shadow-purple-500/30`}
                  whileHover={{
                    rotate: [0, -5, 5, -5, 0],
                    transition: { duration: 0.5 },
                  }}
                >
                  {/* Animated Sparkle Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Letter H with Enhanced Styling */}
                  <motion.span
                    className="relative text-2xl font-black text-white z-10"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      letterSpacing: "-0.05em",
                      textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    }}
                    whileHover={{
                      scale: 1.1,
                      textShadow: "0 0 20px rgba(255,255,255,0.8)",
                    }}
                  >
                    H
                  </motion.span>

                  {/* Corner Accent */}
                  <motion.div
                    className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Brand Text */}
              <div className="flex flex-col">
                <motion.span
                  className={`text-xl font-bold tracking-tight ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  whileHover={{
                    letterSpacing: "0.05em",
                    transition: { duration: 0.2 },
                  }}
                >
                  Haazir
                </motion.span>
                <span
                  className={`text-xs font-medium ${
                    theme === "dark"
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
                      : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"
                  }`}
                >
                  Made in India 🇮🇳
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <motion.div key={link.name} className="relative">
                    {link.path.startsWith("#") ? (
                      <a
                        href={link.path}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === "dark"
                            ? "text-gray-300 hover:text-white hover:bg-slate-800"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isActive
                            ? theme === "dark"
                              ? "text-white bg-slate-800"
                              : "text-gray-900 bg-gray-100"
                            : theme === "dark"
                            ? "text-gray-300 hover:text-white hover:bg-slate-800"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                        layoutId="activeNav"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle with Lottie */}
              <motion.button
                onClick={() => {
                  toggleTheme();
                  if (lottieRef.current) {
                    lottieRef.current.setDirection(theme === "dark" ? 1 : -1);
                    lottieRef.current.play();
                  }
                }}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center shadow-md overflow-hidden ${
                  theme === "dark"
                    ? "bg-slate-800 hover:bg-slate-700 border border-slate-700"
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                } transition-all`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle theme"
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={themeToggleAnimation}
                  loop={false}
                  autoplay={false}
                  style={{ width: 28, height: 28 }}
                />
              </motion.button>

              {/* Login Button - Desktop */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block"
              >
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </Link>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === "dark"
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-gray-100 hover:bg-gray-200"
                } transition-colors`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X
                        className={`w-6 h-6 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu
                        className={`w-6 h-6 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className={`absolute top-20 right-4 left-4 rounded-2xl overflow-hidden shadow-2xl ${
                theme === "dark"
                  ? "bg-slate-900 border border-slate-800"
                  : "bg-white border border-gray-200"
              }`}
              initial={{ y: -20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {link.path.startsWith("#") ? (
                      <a
                        href={link.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                          theme === "dark"
                            ? "text-gray-300 hover:text-white hover:bg-slate-800"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <link.icon className="w-5 h-5" />
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                          location.pathname === link.path
                            ? theme === "dark"
                              ? "text-white bg-slate-800"
                              : "text-gray-900 bg-gray-100"
                            : theme === "dark"
                            ? "text-gray-300 hover:text-white hover:bg-slate-800"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <link.icon className="w-5 h-5" />
                        {link.name}
                      </Link>
                    )}
                  </motion.div>
                ))}

                {/* Login Button - Mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  className="pt-2"
                >
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold"
                  >
                    <LogIn className="w-5 h-5" />
                    Login
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
