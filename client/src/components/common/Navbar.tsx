import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Enhanced icons for better visual appeal
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  teachers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  courses: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  departments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  timetable: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  attendance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
};

// Navigation configuration based on user roles
const navigationConfig = {
  coordinator: [
    { 
      path: '/coordinator', 
      label: 'Dashboard', 
      icon: icons.dashboard,
      description: 'Overview & Analytics',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      path: '/students', 
      label: 'Students', 
      icon: icons.students,
      description: 'Student Management',
      color: 'from-green-500 to-green-600'
    },
    { 
      path: '/teachers', 
      label: 'Teachers', 
      icon: icons.teachers,
      description: 'Teacher Management',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      path: '/courses', 
      label: 'Courses', 
      icon: icons.courses,
      description: 'Course Management',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      path: '/departments', 
      label: 'Departments', 
      icon: icons.departments,
      description: 'Department Management',
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      path: '/timetable', 
      label: 'Timetable', 
      icon: icons.timetable,
      description: 'Schedule Management',
      color: 'from-red-500 to-red-600'
    },
    { 
      path: '/attendance', 
      label: 'Attendance', 
      icon: icons.attendance,
      description: 'Attendance Reports',
      color: 'from-yellow-500 to-yellow-600'
    },
    { 
      path: '/analytics', 
      label: 'Analytics', 
      icon: icons.analytics,
      description: 'Advanced Analytics',
      color: 'from-pink-500 to-pink-600'
    }
  ],
  teacher: [
    { 
      path: '/teacher', 
      label: 'Dashboard', 
      icon: icons.dashboard,
      description: 'Your Overview',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      path: '/my-timetable', 
      label: 'My Schedule', 
      icon: icons.timetable,
      description: 'Your Classes',
      color: 'from-green-500 to-green-600'
    },
    { 
      path: '/attendance/take', 
      label: 'Take Attendance', 
      icon: icons.check,
      description: 'Mark Attendance',
      color: 'from-purple-500 to-purple-600'
    }
  ],
  student: [
    { 
      path: '/student', 
      label: 'Dashboard', 
      icon: icons.dashboard,
      description: 'Your Overview',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      path: '/my-timetable', 
      label: 'My Schedule', 
      icon: icons.timetable,
      description: 'Your Classes',
      color: 'from-green-500 to-green-600'
    },
    { 
      path: '/attendance/me', 
      label: 'My Attendance', 
      icon: icons.analytics,
      description: 'Attendance Record',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      path: '/student/profile', 
      label: 'Profile', 
      icon: icons.profile,
      description: 'Personal Info',
      color: 'from-orange-500 to-orange-600'
    }
  ]
};

interface User {
  user_id: number;
  email: string;
  role: 'coordinator' | 'teacher' | 'student';
  name?: string;
}

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const user = useMemo((): User | null => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const navigation = useMemo(() => {
    if (!user) return [];
    return navigationConfig[user.role] || [];
  }, [user]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      coordinator: 'Administrator',
      teacher: 'Teacher',
      student: 'Student'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      coordinator: 'bg-purple-500',
      teacher: 'bg-blue-500',
      student: 'bg-green-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  const getRoleGradient = (role: string) => {
    const gradients = {
      coordinator: 'from-purple-500 to-pink-600',
      teacher: 'from-blue-500 to-indigo-600',
      student: 'from-green-500 to-emerald-600'
    };
    return gradients[role as keyof typeof gradients] || 'from-gray-500 to-gray-600';
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles = {
      coordinator: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      teacher: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      student: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
    };
    return styles[role as keyof typeof styles] || 'bg-gray-500 text-white';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };

    if (isProfileDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileDropdownOpen, isMobileMenuOpen]);

  if (!user) {
    return null; // Don't show navbar if user is not logged in
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group cursor-pointer">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:scale-110 transition-all duration-300">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Haazir
                </h1>
                <span className="text-xs text-gray-400 -mt-1">
                  {getRoleDisplayName(user.role)} Portal
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-2">
            {navigation.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                exact={item.path === `/${user.role}`}
                className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 group text-gray-300 hover:text-white"
                activeClassName="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg backdrop-blur-sm border border-white/10"
              >
                <div className="relative z-10 flex items-center space-x-2">
                  <div className={`p-1 rounded-lg bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
                
                {/* Animated background on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"></div>
                
                {/* Tooltip */}
                <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 px-3 py-2 text-xs text-white bg-gray-900/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-gray-700/50 shadow-xl">
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                  {item.description}
                </div>
              </NavLink>
            ))}
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 text-sm bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400/50 p-1 hover:from-white/20 hover:to-white/10 transition-all duration-300 border border-white/10"
              >
                <div className="flex items-center space-x-3 px-2 py-1">
                  <div className="relative">
                    <div className={`h-8 w-8 bg-gradient-to-br ${getRoleGradient(user.role)} rounded-full flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-sm font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-white font-medium text-sm truncate max-w-32">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeStyle(user.role)} font-medium`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  {icons.chevronDown}
                </div>
              </button>

              {/* Enhanced Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/10 focus:outline-none z-50 border border-gray-700/50">
                  <div className="p-1">
                    {/* Profile Header */}
                    <div className="px-4 py-4 border-b border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 bg-gradient-to-br ${getRoleGradient(user.role)} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-white text-lg font-bold">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name || user.email.split('@')[0]}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          <span className={`inline-block text-xs px-2 py-1 rounded-full ${getRoleBadgeStyle(user.role)} font-medium mt-1`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile Links */}
                    <div className="py-2">
                      <NavLink
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 rounded-xl transition-all duration-200 mx-1"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        {icons.profile}
                        <div>
                          <span className="block font-medium">Profile Settings</span>
                          <span className="text-xs text-gray-500">Manage your account</span>
                        </div>
                      </NavLink>
                      
                      {user.role === 'student' && (
                        <NavLink
                          to="/student/profile"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 rounded-xl transition-all duration-200 mx-1"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          {icons.students}
                          <div>
                            <span className="block font-medium">Student Profile</span>
                            <span className="text-xs text-gray-500">View academic details</span>
                          </div>
                        </NavLink>
                      )}

                      <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 rounded-xl transition-all duration-200 mx-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <span className="block font-medium">Preferences</span>
                          <span className="text-xs text-gray-500">Theme & notifications</span>
                        </div>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-700/50 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/10 rounded-xl transition-all duration-200 mx-1"
                      >
                        {icons.logout}
                        <div>
                          <span className="block font-medium">Sign Out</span>
                          <span className="text-xs text-gray-500">End your session</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 border border-white/10"
              >
                {isMobileMenuOpen ? icons.close : icons.menu}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-t border-gray-700/50 shadow-2xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navigation.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                exact={item.path === `/${user.role}`}
                className="flex items-center space-x-4 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 group"
                activeClassName="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg backdrop-blur-sm border border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <span className="block font-medium">{item.label}</span>
                  <span className="text-sm text-gray-500">{item.description}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;