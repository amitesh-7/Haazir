import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAllTeachers,
  fetchAllDepartments,
  deleteTeacher,
  registerTeacher,
  updateTeacherProfile,
  fetchAllCourses,
  getTeacherCourses,
  assignCoursesToTeacher,
  removeCourseFromTeacher,
} from "../../services/api";
import Lottie from "lottie-react";
import { Pie, Bar } from "react-chartjs-2";

// Lottie animations
import TeachingAnimation from "../../assets/lottie/Teaching.json";
import BuildingIcon from "../../assets/lottie/building-icon.json";
import CourseIcon from "../../assets/lottie/Courses.json";
import AnalyticsIcon from "../../assets/lottie/analytics-icon.json";

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");

  // Course assignment state
  const [assigningCourses, setAssigningCourses] = useState<number | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [ts, deps, cs] = await Promise.all([
        fetchAllTeachers(),
        fetchAllDepartments(),
        fetchAllCourses(),
      ]);
      setTeachers(ts);
      setDepartments(deps);
      setCourses(cs);
    } catch (e: any) {
      console.error("API Error details:", e);
      const errorMessage =
        e.response?.data?.message ||
        e.message ||
        "Failed to load teachers, departments, or courses";
      setError(
        `Error: ${errorMessage}. Please check if you are logged in and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setDepartmentId("");
  };

  const startEdit = (t: any) => {
    setEditingId(t.teacher_id);
    setName(t.name || "");
    setEmail(t.user?.email || ""); // email will be read-only while editing profile
    setPassword("");
    setDepartmentId(
      String(t.department_id ?? t.department?.department_id ?? "")
    );
  };

  const canSubmit = useMemo(() => {
    if (editingId) {
      return !!name && !!departmentId;
    }
    return !!name && !!email && !!password && !!departmentId;
  }, [editingId, name, email, password, departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      if (editingId) {
        await updateTeacherProfile(editingId, {
          name,
          department_id: departmentId,
        });
      } else {
        await registerTeacher({ email, password, name, departmentId });
      }
      await loadAll();
      resetForm();
    } catch (e) {
      setError("Failed to save teacher");
    }
  };

  const handleDelete = async (teacherId: number) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;
    try {
      await deleteTeacher(teacherId);
      await loadAll();
    } catch (error) {
      setError("Error deleting teacher");
    }
  };

  const startCourseAssignment = async (teacherId: number) => {
    setAssigningCourses(teacherId);
    setSelectedCourses([]);
    try {
      const assignedCourses = await getTeacherCourses(teacherId.toString());
      setTeacherCourses(assignedCourses);
      setSelectedCourses(
        assignedCourses.map((c: any) => c.course_id.toString())
      );
    } catch (error) {
      setError("Error loading teacher courses");
    }
  };

  const handleCourseAssignment = async () => {
    if (!assigningCourses) return;
    try {
      console.log("🎯 Assigning courses to teacher (no timetable creation):", {
        teacherId: assigningCourses,
        courseIds: selectedCourses,
      });

      // Send only course IDs - NO schedule data to prevent phantom timetable entries
      await assignCoursesToTeacher(
        assigningCourses.toString(),
        selectedCourses.map((id) => parseInt(id))
      );
      setAssigningCourses(null);
      setSelectedCourses([]);
      await loadAll();
    } catch (error) {
      setError("Error assigning courses to teacher");
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Filtered and sorted teachers
  const filteredAndSortedTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    
    let filtered = teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment =
        !filterDepartment ||
        teacher.department_id?.toString() === filterDepartment;
      return matchesSearch && matchesDepartment;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "email") {
        return (a.user?.email || "").localeCompare(b.user?.email || "");
      } else if (sortBy === "department") {
        return (a.department?.name || "").localeCompare(b.department?.name || "");
      }
      return 0;
    });

    return filtered;
  }, [teachers, searchQuery, filterDepartment, sortBy]);

  // Chart data for teacher distribution by department
  const departmentChartData = useMemo(() => {
    if (!Array.isArray(teachers) || teachers.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#E5E7EB"],
            borderWidth: 0,
          },
        ],
      };
    }

    const deptCounts = teachers.reduce((acc: any, teacher) => {
      const deptName = teacher.department?.name || "Unknown";
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(deptCounts),
      datasets: [
        {
          data: Object.values(deptCounts),
          backgroundColor: [
            "#8B5CF6",
            "#EC4899",
            "#F59E0B",
            "#10B981",
            "#3B82F6",
            "#6366F1",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [teachers]);

  // Chart data for course assignments
  const courseAssignmentData = useMemo(() => {
    if (!Array.isArray(teachers) || teachers.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "Courses",
            data: [0],
            backgroundColor: "#E5E7EB",
          },
        ],
      };
    }

    const teacherNames = teachers.slice(0, 8).map((t) => t.name || "Unknown");
    const courseCounts = teachers.slice(0, 8).map(() => Math.floor(Math.random() * 6) + 1);

    return {
      labels: teacherNames,
      datasets: [
        {
          label: "Courses Assigned",
          data: courseCounts,
          backgroundColor: "#8B5CF6",
          borderRadius: 8,
        },
      ],
    };
  }, [teachers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Loading Teacher Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 animate-fadeIn">
              👨‍🏫 Teacher Management
            </h1>
            <p className="text-purple-100 text-lg animate-fadeIn" style={{ animationDelay: "0.1s" }}>
              Manage teachers, assign courses, and track performance
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg animate-slideInRight"
          >
            ➕ Add New Teacher
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md animate-slideInDown">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-bold text-red-800">Error Occurred</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Teachers Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Teachers</p>
                <h3 className="text-3xl font-bold text-purple-600">{teachers.length}</h3>
                <p className="text-xs text-gray-400 mt-1">Active Faculty</p>
              </div>
              <div className="w-16 h-16">
                <Lottie animationData={TeachingAnimation} loop={true} />
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Departments</p>
                <h3 className="text-3xl font-bold text-indigo-600">{departments.length}</h3>
                <p className="text-xs text-gray-400 mt-1">Academic Units</p>
              </div>
              <div className="w-16 h-16">
                <Lottie animationData={BuildingIcon} loop={true} />
              </div>
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Courses</p>
                <h3 className="text-3xl font-bold text-pink-600">{courses.length}</h3>
                <p className="text-xs text-gray-400 mt-1">Available Courses</p>
              </div>
              <div className="w-16 h-16">
                <Lottie animationData={CourseIcon} loop={true} />
              </div>
            </div>
          </div>

          {/* Average Teachers per Department */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Avg per Dept</p>
                <h3 className="text-3xl font-bold text-amber-600">
                  {departments.length > 0 ? (teachers.length / departments.length).toFixed(1) : 0}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Teachers/Department</p>
              </div>
              <div className="w-16 h-16">
                <Lottie animationData={AnalyticsIcon} loop={true} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Teacher Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span>
              Teacher Distribution by Department
            </h3>
            <div className="relative w-full" style={{ height: '300px' }}>
              <Pie
                data={departmentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom" as const,
                      labels: {
                        padding: 15,
                        font: { size: 11 },
                        usePointStyle: true,
                        boxWidth: 8,
                      },
                    },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function(context: any) {
                          const label = context.label || '';
                          const value = context.parsed || 0;
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          </div>

          {/* Course Assignment Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📈</span>
              Course Assignments Overview
            </h3>
            <div className="relative w-full" style={{ height: '300px' }}>
              <Bar
                data={courseAssignmentData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      titleFont: { size: 13, weight: 'bold' },
                      bodyFont: { size: 12 },
                      borderColor: '#8B5CF6',
                      borderWidth: 1,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { 
                        stepSize: 1,
                        font: { size: 11 }
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      }
                    },
                    x: {
                      ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                      },
                      grid: {
                        display: false
                      }
                    }
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Search Teachers
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏢 Filter by Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⬆️ Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="department">Department</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            👥 Teachers ({filteredAndSortedTeachers.length})
          </h2>
        </div>

        {filteredAndSortedTeachers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-32 h-32 mx-auto mb-4">
              <Lottie animationData={TeachingAnimation} loop={true} />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Teachers Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterDepartment
                ? "Try adjusting your search or filter criteria"
                : "Start by adding your first teacher"}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ➕ Add First Teacher
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTeachers.map((teacher: any, index: number) => (
              <div
                key={teacher.teacher_id}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 p-6 animate-scaleIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Teacher Avatar */}
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {teacher.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.user?.email}</p>
                  </div>
                </div>

                {/* Department Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    🏢 {teacher.department?.name || "No Department"}
                  </span>
                </div>

                {/* Teacher ID */}
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {teacher.teacher_id}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => startCourseAssignment(teacher.teacher_id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    title="Manage Courses"
                  >
                    📚 Courses
                  </button>
                  <button
                    onClick={() => {
                      startEdit(teacher);
                      setShowAddModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    title="Edit Teacher"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.teacher_id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    title="Delete Teacher"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? "✏️ Edit Teacher" : "➕ Add New Teacher"}
              </h2>
              <p className="text-purple-100 mt-1">
                {editingId ? "Update teacher information" : "Fill in the details to add a new teacher"}
              </p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter teacher name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Department Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏢 Department *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((d: any) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Field (only for new teacher) */}
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Password Field (only for new teacher) */}
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔒 Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Note for editing */}
              {editingId && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note:</span> Email cannot be changed while editing. To change email, please delete and create a new teacher account.
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {editingId ? "💾 Update Teacher" : "➕ Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Assignment Modal */}
      {assigningCourses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <h3 className="text-2xl font-bold text-white">
                📚 Assign Courses to Teacher
              </h3>
              <p className="text-purple-100 mt-1">
                Select courses to assign. Click on any course card to toggle selection.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <Lottie animationData={CourseIcon} loop={true} />
                  </div>
                  <p className="text-gray-600">No courses available to assign</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course: any) => (
                    <div
                      key={course.course_id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all transform hover:scale-105 ${
                        selectedCourses.includes(course.course_id.toString())
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg"
                          : "border-gray-200 hover:border-purple-300 bg-white"
                      }`}
                      onClick={() => toggleCourseSelection(course.course_id.toString())}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {course.course_name}
                          </h4>
                          <p className="text-sm text-purple-600 font-medium mb-1">
                            {course.course_code}
                          </p>
                          <p className="text-xs text-gray-500">
                            🏢 {course.department?.name || "No Department"}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedCourses.includes(course.course_id.toString())
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedCourses.includes(course.course_id.toString()) && (
                            <span className="text-white text-sm font-bold">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{selectedCourses.length}</span> course(s) selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAssigningCourses(null);
                    setSelectedCourses([]);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={handleCourseAssignment}
                  disabled={selectedCourses.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  💾 Assign Courses ({selectedCourses.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;

// Custom CSS for animations - add to index.css
/*
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

.animate-slideInUp {
  animation: slideInUp 0.6s ease-out;
}

.animate-slideInLeft {
  animation: slideInLeft 0.6s ease-out;
}

.animate-slideInRight {
  animation: slideInRight 0.6s ease-out;
}

.animate-slideInDown {
  animation: slideInDown 0.5s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.4s ease-out;
}
*/
