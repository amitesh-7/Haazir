import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAllDepartments,
  fetchAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  api,
} from "../../services/api";
import SectionManagement from "./SectionManagement";
import BulkSectionEnrollment from './BulkSectionEnrollmentSimple';
import BatchBifurcation from "./BatchBifurcation";
import Lottie from 'lottie-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Import Lottie animations
import BuildingIcon from '../../assets/lottie/building-icon.json';
import CourseIcon from '../../assets/lottie/Courses.json';
import StudentIcon from '../../assets/lottie/STUDENT.json';
import AnalyticsIcon from '../../assets/lottie/analytics-icon.json';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [courseForm, setCourseForm] = useState({
    course_name: "",
    course_code: "",
  });
  const [courseError, setCourseError] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  // Student enrollment and batch bifurcation states
  const [selectedSectionForBifurcation, setSelectedSectionForBifurcation] = useState<any>(null);
  const [showStudentEnrollment, setShowStudentEnrollment] = useState(false);
  const [showBatchBifurcation, setShowBatchBifurcation] = useState(false);
  const [availableSections, setAvailableSections] = useState<any[]>([]);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const deps = await fetchAllDepartments();
      setDepartments(deps);
      if (!selectedDeptId && deps.length > 0) {
        setSelectedDeptId(String(deps[0].department_id ?? deps[0].id));
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (deptId: string) => {
    if (!deptId) {
      setCourses([]);
      return;
    }
    try {
      // Server-side filter
      const { data } = await api.get(`/courses?department_id=${deptId}`);
      setCourses(data);
    } catch (e) {
      setCourses([]);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDeptId) loadCourses(selectedDeptId);
  }, [selectedDeptId]);

  // Load sections for the selected department
  const loadSections = async (deptId: string) => {
    if (!deptId) {
      setAvailableSections([]);
      return;
    }
    try {
      const { data } = await api.get(`/sections?department_id=${deptId}`);
      setAvailableSections(data || []);
    } catch (e) {
      setAvailableSections([]);
    }
  };

  useEffect(() => {
    if (selectedDeptId) {
      loadCourses(selectedDeptId);
      loadSections(selectedDeptId);
    }
  }, [selectedDeptId]);

  const createDepartment = async () => {
    if (!newDeptName.trim()) return;
    await api.post("/departments", { name: newDeptName.trim() });
    setNewDeptName("");
    await loadDepartments();
  };

  const startEditDept = (d: any) => {
    setEditingDeptId(String(d.department_id ?? d.id));
    setEditingDeptName(d.name ?? d.department_name ?? "");
  };

  const saveDept = async () => {
    if (!editingDeptId) return;
    await api.put(`/departments/${editingDeptId}`, { name: editingDeptName });
    setEditingDeptId(null);
    setEditingDeptName("");
    await loadDepartments();
  };

  const deleteDept = async (id: string) => {
    await api.delete(`/departments/${id}`);
    if (selectedDeptId === id) setSelectedDeptId("");
    await loadDepartments();
  };

  const submitCourse = async () => {
    setCourseError(null);
    if (!selectedDeptId) {
      alert("Select a department first");
      return;
    }
    if (!courseForm.course_name || !courseForm.course_code) {
      setCourseError("Course name and code are required");
      return;
    }
    if (
      courseForm.course_name.trim().length < 2 ||
      courseForm.course_code.trim().length < 2
    ) {
      setCourseError("Course name and code must be at least 2 characters");
      return;
    }
    try {
      if (editingCourseId) {
        await updateCourse(editingCourseId, {
          ...courseForm,
          department_id: Number(selectedDeptId),
        });
        setEditingCourseId(null);
      } else {
        await createCourse({
          ...courseForm,
          department_id: Number(selectedDeptId),
        });
      }
      setCourseForm({ course_name: "", course_code: "" });
      await loadCourses(selectedDeptId);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to save course";
      setCourseError(msg);
    }
  };

  const startEditCourse = (c: any) => {
    setEditingCourseId(String(c.course_id));
    setCourseForm({ course_name: c.course_name, course_code: c.course_code });
  };

  const removeCourse = async (courseId: string) => {
    await deleteCourse(courseId);
    await loadCourses(selectedDeptId);
  };

  // Chart Data - Department Statistics
  const departmentStatsData = {
    labels: departments.map(d => (d.name ?? d.department_name).split(' ')[0]),
    datasets: [
      {
        label: 'Courses',
        data: departments.map(() => Math.floor(Math.random() * 20) + 5),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Students',
        data: departments.map(() => Math.floor(Math.random() * 200) + 50),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const departmentStatsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
          <div className="w-24 h-24">
            <Lottie animationData={BuildingIcon} loop={true} />
          </div>
          <div className="text-xl font-semibold text-gray-700">Loading Departments...</div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-4 sm:p-6 md:p-8">
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
          background: linear-gradient(to bottom, #8b5cf6, #6366f1); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(to bottom, #7c3aed, #4f46e5); 
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🏢 Department Management
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">
              Manage departments, courses, and academic structure
            </p>
          </div>
        </div>
      </div>

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
        {/* Total Departments Card */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Total Departments</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{departments.length}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  🏛️ Academic units
                </span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={BuildingIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Total Courses Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Courses</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{courses.length}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  {selectedDeptId ? `In selected dept` : 'All departments'}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-90 group-hover:scale-110 transition-all duration-300">
              <Lottie animationData={CourseIcon} loop={true} />
            </div>
          </div>
        </div>

        {/* Active Sections Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden animate-slideInUp" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Active Sections</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{availableSections.length}</p>
              <div className="flex items-center mt-2">
                <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  👥 Student groups
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
              <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Avg Courses/Dept</p>
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

      {/* Department Statistics Chart */}
      {departments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-purple-500 animate-slideInUp" style={{animationDelay: '0.5s'}}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">📊</span>
            <span className="text-sm sm:text-base">Department Statistics</span>
          </h3>
          <div className="h-[300px] sm:h-[350px] md:h-[400px]">
            <Bar data={departmentStatsData} options={departmentStatsOptions} />
          </div>
        </div>
      )}

      {/* Departments Management */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 animate-slideInLeft" style={{animationDelay: '0.6s'}}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl sm:text-3xl mr-2">🏛️</span>
            Departments
          </h2>
        </div>

        {/* Add New Department */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6 border border-purple-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="mr-2">➕</span>
            Add New Department
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm text-sm"
              placeholder="Enter department name (e.g., Computer Science)"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createDepartment()}
            />
            <button
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              onClick={createDepartment}
            >
              <span className="text-lg">➕</span>
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d: any, index) => {
            const id = String(d.department_id ?? d.id);
            const isEditing = editingDeptId === id;
            const isSelected = selectedDeptId === id;
            return (
              <div
                key={id}
                className={`bg-gradient-to-br ${
                  isSelected 
                    ? 'from-purple-500 to-indigo-600 text-white shadow-xl' 
                    : 'from-gray-50 to-gray-100 text-gray-900 hover:from-purple-50 hover:to-indigo-50'
                } rounded-xl p-5 transition-all duration-300 hover:shadow-lg cursor-pointer border-2 ${
                  isSelected ? 'border-purple-300' : 'border-transparent hover:border-purple-200'
                } animate-scaleIn`}
                style={{animationDelay: `${0.1 * index}s`}}
                onClick={() => !isEditing && setSelectedDeptId(id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-purple-400'}`}></div>
                    {isEditing ? (
                      <input
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-purple-500"
                        value={editingDeptName}
                        onChange={(e) => setEditingDeptName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.key === 'Enter' && saveDept()}
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-lg font-bold truncate">{d.name ?? d.department_name}</h3>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  {isEditing ? (
                    <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                        onClick={saveDept}
                      >
                        ✓ Save
                      </button>
                      <button
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                        onClick={() => {
                          setEditingDeptId(null);
                          setEditingDeptName("");
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`flex-1 ${isSelected ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-3 py-2 rounded-lg font-medium text-sm transition-all`}
                        onClick={() => startEditDept(d)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={`flex-1 ${isSelected ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} px-3 py-2 rounded-lg font-medium text-sm transition-all`}
                        onClick={() => {
                          if (window.confirm(`Delete department "${d.name ?? d.department_name}"?`)) {
                            deleteDept(id);
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-24 h-24 mx-auto mb-4 opacity-50">
              <Lottie animationData={BuildingIcon} loop={true} />
            </div>
            <p className="text-gray-500 text-lg font-medium">No departments yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first department above</p>
          </div>
        )}
      </div>

      {/* Dynamic Sections Management */}
      {selectedDeptId && <SectionManagement departmentId={selectedDeptId} />}

      {/* Student Enrollment Management */}
      {selectedDeptId && (
        <div className="bg-white rounded shadow p-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowStudentEnrollment(!showStudentEnrollment);
                  setShowBatchBifurcation(false);
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  showStudentEnrollment
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bulk Section Enrollment
              </button>
              <button
                onClick={() => {
                  setShowBatchBifurcation(!showBatchBifurcation);
                  setShowStudentEnrollment(false);
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  showBatchBifurcation
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Batch Bifurcation
              </button>
            </div>
          </div>

          {showStudentEnrollment && (
            <div className="mt-4">
              <BulkSectionEnrollment 
                departmentId={selectedDeptId}
                onEnrollmentComplete={() => {
                  // Refresh data if needed
                  loadSections(selectedDeptId);
                }}
              />
            </div>
          )}

          {showBatchBifurcation && (
            <div className="mt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section for Batch Bifurcation
                </label>
                <select
                  value={selectedSectionForBifurcation?.section_id || ''}
                  onChange={(e) => {
                    const section = availableSections.find(s => s.section_id === Number(e.target.value));
                    setSelectedSectionForBifurcation(section || null);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[300px]"
                >
                  <option value="">Select a section</option>
                  {availableSections.map(section => (
                    <option key={section.section_id} value={section.section_id}>
                      {section.section_name} (Semester {section.semester})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSectionForBifurcation && (
                <BatchBifurcation
                  sectionId={selectedSectionForBifurcation.section_id}
                  sectionName={selectedSectionForBifurcation.section_name}
                  onBifurcationComplete={() => {
                    // Refresh data if needed
                    loadSections(selectedDeptId);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Courses Management */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 animate-slideInRight" style={{animationDelay: '0.7s'}}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl sm:text-3xl mr-2">📚</span>
            Courses {selectedDeptId && `in ${departments.find(d => String(d.department_id ?? d.id) === selectedDeptId)?.name ?? 'Selected Department'}`}
          </h2>
        </div>

        {courseError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <p className="text-red-700 font-medium text-sm">{courseError}</p>
            </div>
          </div>
        )}

        {/* Add/Edit Course Form */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="mr-2">{editingCourseId ? '✏️' : '➕'}</span>
            {editingCourseId ? 'Edit Course' : 'Add New Course'}
          </h3>
          {!selectedDeptId && (
            <div className="mb-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
              <p className="text-amber-700 text-sm">⚠️ Please select a department first</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
              placeholder="Course Name (e.g., Data Structures)"
              value={courseForm.course_name}
              onChange={(e) => setCourseForm((f) => ({ ...f, course_name: e.target.value }))}
              disabled={!selectedDeptId}
            />
            <input
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
              placeholder="Course Code (e.g., CS101)"
              value={courseForm.course_code}
              onChange={(e) => setCourseForm((f) => ({ ...f, course_code: e.target.value }))}
              disabled={!selectedDeptId}
            />
            <button
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={submitCourse}
              disabled={!selectedDeptId}
            >
              <span className="text-lg">{editingCourseId ? '💾' : '➕'}</span>
              <span>{editingCourseId ? "Update Course" : "Add Course"}</span>
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {selectedDeptId && courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c: any, index) => (
              <div
                key={c.course_id}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg animate-scaleIn"
                style={{animationDelay: `${0.1 * index}s`}}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">📖</span>
                      <h3 className="text-base font-bold text-gray-900">{c.course_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                        {c.course_code}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-1"
                    onClick={() => startEditCourse(c)}
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-1"
                    onClick={() => {
                      if (window.confirm(`Delete course "${c.course_name}"?`)) {
                        removeCourse(String(c.course_id));
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
        ) : selectedDeptId ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-20 h-20 mx-auto mb-4 opacity-50">
              <Lottie animationData={CourseIcon} loop={true} />
            </div>
            <p className="text-gray-500 text-lg font-medium">No courses in this department</p>
            <p className="text-gray-400 text-sm mt-1">Add your first course above</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-20 h-20 mx-auto mb-4 opacity-50">
              <Lottie animationData={CourseIcon} loop={true} />
            </div>
            <p className="text-gray-500 text-lg font-medium">Select a department to manage courses</p>
            <p className="text-gray-400 text-sm mt-1">Choose a department from the list above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
