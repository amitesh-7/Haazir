import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";

const Header: React.FC = () => {
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileMenu]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowProfileMenu(false);
    };

    if (showProfileMenu) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showProfileMenu]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      setShowProfileMenu(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "coordinator":
        return "from-purple-500 to-indigo-600";
      case "teacher":
        return "from-emerald-500 to-teal-600";
      case "student":
        return "from-blue-500 to-indigo-600";
      default:
        return "from-gray-500 to-slate-600";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case "coordinator":
        return "👔";
      case "teacher":
        return "👨‍🏫";
      case "student":
        return "🎓";
      default:
        return "👤";
    }
  };

  const getInitials = (email: string) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 cursor-pointer">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Haazir
                </h1>
                <p className="text-xs text-slate-500">School ERP Software</p>
              </div>
            </div>
          </div>

          {/* Center - Navigation indicators */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">System Online</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Dashboard</span>
            </div>
          </div>

          {/* Right side - User menu */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button
                className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <div
                    className={`w-8 h-8 bg-gradient-to-r ${getRoleColor(
                      user.role
                    )} rounded-lg flex items-center justify-center text-white shadow-sm`}
                  >
                    <span className="text-sm">{getRoleIcon(user.role)}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-slate-800 truncate max-w-32">
                      {user.email?.split("@")[0] || "User"}
                    </div>
                    <div
                      className={`text-xs px-2 py-0.5 bg-gradient-to-r ${getRoleColor(
                        user.role
                      )} text-white rounded-full capitalize inline-block`}
                    >
                      {user.role}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      showProfileMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-20 animate-fadeIn">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 bg-gradient-to-r ${getRoleColor(
                            user.role
                          )} rounded-xl flex items-center justify-center text-white shadow-md`}
                        >
                          <span className="text-lg">{getRoleIcon(user.role)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {user.email}
                          </div>
                          <div className="text-sm text-slate-600 capitalize">
                            {user.role} Account
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-3">
                        <span className="text-lg">👤</span>
                        <span>Profile Settings</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-3">
                        <span className="text-lg">⚙️</span>
                        <span>Preferences</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-3">
                        <span className="text-lg">❓</span>
                        <span>Help & Support</span>
                      </button>
                      <div className="border-t border-slate-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 font-medium"
                      >
                        <span className="text-lg">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;