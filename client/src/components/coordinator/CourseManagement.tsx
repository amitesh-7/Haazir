import React, { useEffect, useState, useMemo } from "react";
import {
  fetchAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  fetchAllDepartments,
} from "../../services/api";
import Lottie from 'lottie-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Import Lottie animations
import CourseIcon from '../../assets/lottie/Courses.json';
import BuildingIcon from '../../assets/lottie/building-icon.json';
import StudentIcon from '../../assets/lottie/STUDENT.json';
import AnalyticsIcon from '../../assets/lottie/analytics-icon.json';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSemester, setFilterSemester] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name"); // name, code, semester
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadCourses();
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await fetchAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !courseName.trim() ||
      !courseCode.trim() ||
      !semester.trim() ||
      !departmentId.trim()
    ) {
      setError("Please fill in all fields including semester and department");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingCourseId) {
        console.log("🔄 Attempting to update course:", {
          id: editingCourseId,
          course_name: courseName,
          course_code: courseCode,
          department_id: parseInt(departmentId),
          semester: parseInt(semester),
        });

        const result = await updateCourse(editingCourseId, {
          course_name: courseName,
          course_code: courseCode,
          department_id: parseInt(departmentId),
          semester: parseInt(semester),
        } as any);

        console.log("✅ Update result:", result);
        setEditingCourseId(null);
      } else {
        await createCourse({
          course_name: courseName,
          course_code: courseCode,
          department_id: parseInt(departmentId),
          semester: parseInt(semester),
        } as any);
      }

      setCourseName("");
      setCourseCode("");
      setSemester("");
      setDepartmentId("");
      await loadCourses();
    } catch (error: any) {
      console.error("Error saving course:", error);

      if (error?.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (error?.response?.status === 404) {
        setError("Course not found. Please refresh and try again.");
      } else {
        setError(
          `Failed to save course: ${
            error?.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: any) => {
    console.log("✏️ Editing course data:", course);
    setCourseName(course.course_name);
    setCourseCode(course.course_code);
    setSemester(course.semester ? course.semester.toString() : "");
    setDepartmentId(
      course.department_id ? course.department_id.toString() : ""
    );
    setEditingCourseId(course.course_id);
    setError(null);
    console.log("📝 Form state after edit:", {
      courseName: course.course_name,
      courseCode: course.course_code,
      semester: course.semester ? course.semester.toString() : "",
      departmentId: course.department_id ? course.department_id.toString() : "",
      editingCourseId: course.course_id,
    });
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteCourse(courseId);
      await loadCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingCourseId(null);
    setCourseName("");
    setCourseCode("");
    setSemester("");
    setDepartmentId("");
    setError(null);
  };

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(
      (dept) => dept.department_id === departmentId
    );
    return department ? department.name : "Unknown Department";
  };

  // Filtered and sorted courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter((course) => {
      // Search filter
      const searchMatch = !searchQuery || 
        course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Semester filter
      const semesterMatch = !filterSemester || String(course.semester) === String(filterSemester);
      
      // Department filter
      const departmentMatch = !filterDepartment || String(course.department_id) === String(filterDepartment);
      
      return searchMatch && semesterMatch && departmentMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.course_name.localeCompare(b.course_name);
      if (sortBy === 'code') return a.course_code.localeCompare(b.course_code);
      if (sortBy === 'semester') return (a.semester || 0) - (b.semester || 0);
      return 0;
    });

    return filtered;
  }, [courses, searchQuery, filterSemester, filterDepartment, sortBy]);

  // Department distribution for Pie chart
  const departmentDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    courses.forEach(course => {
      const deptName = getDepartmentName(course.department_id);
      distribution[deptName] = (distribution[deptName] || 0) + 1;
    });
    return distribution;
  }, [courses, departments]);

  const departmentChartData = {
    labels: Object.keys(departmentDistribution),
    datasets: [{
      data: Object.values(departmentDistribution),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(168, 85, 247)',
        'rgb(251, 146, 60)',
        'rgb(236, 72, 153)',
        'rgb(14, 165, 233)',
      ],
      borderWidth: 2,
    }],
  };

  // Semester distribution for Bar chart
  const semesterDistribution = useMemo(() => {
    const distribution: number[] = new Array(8).fill(0);
    courses.forEach(course => {
      if (course.semester >= 1 && course.semester <= 8) {
        distribution[course.semester - 1]++;
      }
    });
    return distribution;
  }, [courses]);

  const semesterChartData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
    datasets: [{
      label: 'Number of Courses',
      data: semesterDistribution,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 15, font: { size: 11 }, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
      x: { grid: { display: false } },
    },
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
          <div className="w-24 h-24">
            <Lottie animationData={CourseIcon} loop={true} />
          </div>
          <div className="text-xl font-semibold text-gray-700">Loading Courses...</div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 sm:p-6 md:p-8">
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-slideInUp { animation: slideInUp 0.6s ease-out forwards; opacity: 0; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out forwards; opacity: 0; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out forwards; opacity: 0; }
        .animate-scaleIn { animation: scaleIn 0.6s ease-out forwards; opacity: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, #3b82f6, #06b6d4); 
          border-radius: 10px; 
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">
              📚 Course Management
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">
              Manage courses across all departments and semesters
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center"
          >
            <span className="text-lg sm:text-xl">➕</span>
            <span className="text-sm sm:text-base">Add Course</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-slideInUp">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
        {/* Total Courses Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Courses</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{courses.length}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  📖 All departments
                </span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={CourseIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Departments Card */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Departments</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{departments.length}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  🏛️ Active units
                </span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={BuildingIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Filtered Results Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Showing Results</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{filteredAndSortedCourses.length}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  {(filterSemester || filterDepartment || searchQuery) ? '🔍 Filtered' : '✓ All courses'}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={StudentIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.4s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Avg Per Department</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">
                {departments.length > 0 ? Math.ceil(courses.length / departments.length) : 0}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  📊 Distribution
                </span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={AnalyticsIcon} loop={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          {/* Department Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-500 animate-slideInLeft" style={{animationDelay: '0.5s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">🎯</span>
              <span className="text-sm sm:text-base">Courses by Department</span>
            </h3>
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <Pie data={departmentChartData} options={chartOptions} />
            </div>
          </div>

          {/* Semester Distribution Bar Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-purple-500 animate-slideInRight" style={{animationDelay: '0.5s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">📊</span>
              <span className="text-sm sm:text-base">Courses by Semester</span>
            </h3>
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <Bar data={semesterChartData} options={barChartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 mb-6 animate-slideInUp" style={{animationDelay: '0.6s'}}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search courses by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="semester">Sort by Semester</option>
            </select>

            {(filterSemester || filterDepartment || searchQuery) && (
              <button
                onClick={() => {
                  setFilterSemester("");
                  setFilterDepartment("");
                  setSearchQuery("");
                }}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-all transform hover:scale-105"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 animate-slideInUp" style={{animationDelay: '0.7s'}}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl sm:text-3xl mr-2">📋</span>
            Course Catalog
          </h2>
        </div>

        {filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-20 h-20 mx-auto mb-4 opacity-50">
              <Lottie animationData={CourseIcon} loop={true} />
            </div>
            <p className="text-gray-500 text-lg font-medium">
              {courses.length === 0 ? 'No courses yet' : 'No courses match your filters'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {courses.length === 0 ? 'Add your first course to get started' : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedCourses.map((course, index) => (
              <div
                key={course.course_id}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg animate-scaleIn"
                style={{animationDelay: `${0.05 * index}s`}}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📖</span>
                      <h3 className="text-base font-bold text-gray-900 line-clamp-2">{course.course_name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                        {course.course_code}
                      </span>
                      {course.semester && (
                        <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-medium">
                          Sem {course.semester}
                        </span>
                      )}
                    </div>
                    {course.department_id && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <span>🏢</span>
                        <span className="truncate">{getDepartmentName(course.department_id)}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-1"
                    onClick={() => {
                      handleEdit(course);
                      setShowAddModal(true);
                    }}
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-1"
                    onClick={() => {
                      if (window.confirm(`Delete course "${course.course_name}"?`)) {
                        handleDelete(course.course_id, course.course_name);
                      }
                    }}
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">{editingCourseId ? '✏️' : '➕'}</span>
                {editingCourseId ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  handleCancel();
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CS-301"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{editingCourseId ? 'Updating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">{editingCourseId ? '💾' : '➕'}</span>
                      <span>{editingCourseId ? 'Update Course' : 'Add Course'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    handleCancel();
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
