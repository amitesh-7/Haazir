import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const role: string | undefined = user?.role;

  const activeClass =
    "bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border-r-2 border-indigo-500";
  const baseClass =
    "flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/50 transition-all duration-200 text-slate-700 hover:text-slate-900";

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const getRoleGradient = () => {
    switch (role) {
      case "coordinator":
        return "from-purple-600 to-indigo-700";
      case "teacher":
        return "from-emerald-600 to-teal-700";
      case "student":
        return "from-green-600 to-emerald-700";
      default:
        return "from-slate-600 to-gray-700";
    }
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-md border-r border-gray-200/50 transition-all duration-300 flex flex-col h-full ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 bg-gradient-to-r ${getRoleGradient()} rounded-xl flex items-center justify-center shadow-lg`}
            >
              <span className="text-white font-bold">H</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-slate-800">Haazir</h2>
                <p className="text-xs text-slate-500 capitalize">
                  {role} Portal
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {(role === "coordinator" || !role) && (
          <div className="mb-6">
            {!isCollapsed && (
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-4">
                Management
              </div>
            )}
            <nav className="space-y-1">
              <NavLink
                exact
                to="/coordinator"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🏠</span>
                </div>
                {!isCollapsed && <span className="font-medium">Dashboard</span>}
              </NavLink>
              <NavLink
                to="/students"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🎓</span>
                </div>
                {!isCollapsed && <span className="font-medium">Students</span>}
              </NavLink>
              <NavLink
                to="/teachers"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">👩‍🏫</span>
                </div>
                {!isCollapsed && <span className="font-medium">Teachers</span>}
              </NavLink>
              <NavLink
                to="/departments"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🏢</span>
                </div>
                {!isCollapsed && (
                  <span className="font-medium">Departments</span>
                )}
              </NavLink>
              <NavLink
                to="/courses"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📚</span>
                </div>
                {!isCollapsed && <span className="font-medium">Courses</span>}
              </NavLink>
              <NavLink
                to="/timetable"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🗓️</span>
                </div>
                {!isCollapsed && <span className="font-medium">Timetable</span>}
              </NavLink>
              <NavLink
                to="/attendance"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-pink-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📝</span>
                </div>
                {!isCollapsed && (
                  <span className="font-medium">Attendance</span>
                )}
              </NavLink>
            </nav>
          </div>
        )}
        {role === "teacher" && (
          <div className="mb-6">
            {!isCollapsed && (
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-4">
                Teaching
              </div>
            )}
            <nav className="space-y-1">
              <NavLink
                to="/teacher"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🏠</span>
                </div>
                {!isCollapsed && <span className="font-medium">Dashboard</span>}
              </NavLink>
              <NavLink
                to="/my-timetable"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🗓️</span>
                </div>
                {!isCollapsed && (
                  <span className="font-medium">My Schedule</span>
                )}
              </NavLink>
              <NavLink
                to="/attendance/take"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📝</span>
                </div>
                {!isCollapsed && (
                  <span className="font-medium">Take Attendance</span>
                )}
              </NavLink>
            </nav>
          </div>
        )}
        {role === "student" && (
          <div className="mb-6">
            {!isCollapsed && (
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-4">
                My Academic
              </div>
            )}
            <nav className="space-y-1">
              <NavLink
                to="/student"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🏠</span>
                </div>
                {!isCollapsed && <span className="font-medium">Dashboard</span>}
              </NavLink>
              <NavLink
                to="/my-timetable"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🗓️</span>
                </div>
                {!isCollapsed && (
                  <span className="font-medium">My Timetable</span>
                )}
              </NavLink>
              <NavLink
                to="/student/attendance"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📊</span>
                </div>
                {!isCollapsed && (
                  <span className="font-medium">My Attendance</span>
                )}
              </NavLink>
              <NavLink
                to="/student/profile"
                className={baseClass}
                activeClassName={activeClass}
              >
                <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
                {!isCollapsed && <span className="font-medium">Profile</span>}
              </NavLink>
            </nav>
          </div>
        )}
        {!role && (
          <div className="mb-4">
            <div className="text-xs uppercase text-gray-500 mb-1">General</div>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/profile"
                  className={baseClass}
                  activeClassName={activeClass}
                >
                  👤 My Profile
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t border-gray-200/50">
          <div className="mb-4">
            <div
              className={`flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r ${getRoleGradient()}/10 border border-white/50`}
            >
              <div
                className={`w-10 h-10 bg-gradient-to-r ${getRoleGradient()} rounded-xl flex items-center justify-center text-white shadow-lg`}
              >
                <span className="text-sm">
                  {role === "coordinator"
                    ? "👔"
                    : role === "teacher"
                    ? "👨‍🏫"
                    : "🎓"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {user.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {role} Account
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200 font-medium"
          >
            <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🚪</span>
            </div>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
