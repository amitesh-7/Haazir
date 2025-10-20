import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAllDepartments,
  fetchSectionsByDepartmentAndSemester,
  fetchAllStudents,
  fetchStudentsBySection,
  fetchUnassignedStudents,
  enrollStudentInSection,
  unenrollStudentFromSection,
  bulkEnrollStudents,
} from '../../services/api';

interface Department {
  department_id: number;
  name: string;
}

interface Section {
  section_id: number;
  section_name: string;
  department_id: number;
  semester: number;
  description?: string;
}

interface Student {
  student_id: number;
  user_id: number;
  name: string;
  roll_number: string;
  department_id: number;
  section_id?: number;
  email?: string;
  department?: { name: string };
  section?: { section_name: string };
}

const StudentEnrollment: React.FC = () => {
  // State Management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  
  // Form State
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'enrolled' | 'unassigned'>('enrolled');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [deptData, studentData] = await Promise.all([
          fetchAllDepartments(),
          fetchAllStudents(),
        ]);
        setDepartments(deptData);
        setAllStudents(studentData);
      } catch (err) {
        setError('Failed to load initial data');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load sections when department/semester changes
  useEffect(() => {
    const loadSections = async () => {
      if (!selectedDepartment || !selectedSemester) {
        setSections([]);
        return;
      }

      try {
        const sectionData = await fetchSectionsByDepartmentAndSemester(
          selectedDepartment,
          parseInt(selectedSemester)
        );
        setSections(sectionData);
      } catch (err) {
        console.error('Error loading sections:', err);
        setSections([]);
      }
    };

    loadSections();
  }, [selectedDepartment, selectedSemester]);

  // Load students when section changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSection) {
        setEnrolledStudents([]);
        setUnassignedStudents([]);
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Loading students for section:', { selectedSection, selectedDepartment });
        
        const [enrolled, unassigned] = await Promise.all([
          fetchStudentsBySection(selectedSection),
          fetchUnassignedStudents(selectedDepartment),
        ]);
        
        console.log('📊 Loaded students:', { 
          enrolled: enrolled.length, 
          unassigned: unassigned.length,
          enrolledData: enrolled,
          unassignedData: unassigned
        });
        
        setEnrolledStudents(enrolled);
        setUnassignedStudents(unassigned);
      } catch (err: any) {
        console.error('❌ Failed to load students:', err);
        setError(`Failed to load students: ${err?.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedSection, selectedDepartment]);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    const students = activeTab === 'enrolled' ? enrolledStudents : unassignedStudents;
    if (!searchTerm) return students;
    
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [enrolledStudents, unassignedStudents, searchTerm, activeTab]);

  // Handle student selection
  const toggleStudentSelection = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Handle bulk enrollment
  const handleBulkEnroll = async () => {
    if (!selectedSection || selectedStudents.size === 0) {
      console.warn('⚠️ Bulk enroll called but missing data:', { selectedSection, selectedStudentsCount: selectedStudents.size });
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Starting bulk enrollment:', {
        sectionId: selectedSection,
        studentIds: Array.from(selectedStudents),
        studentCount: selectedStudents.size
      });
      
      const result = await bulkEnrollStudents(Array.from(selectedStudents), selectedSection);
      console.log('✅ Bulk enrollment successful:', result);
      
      // Refresh student lists
      console.log('🔄 Refreshing student lists...');
      const [enrolled, unassigned] = await Promise.all([
        fetchStudentsBySection(selectedSection),
        fetchUnassignedStudents(selectedDepartment),
      ]);
      
      console.log('📊 Updated lists:', { enrolled: enrolled.length, unassigned: unassigned.length });
      setEnrolledStudents(enrolled);
      setUnassignedStudents(unassigned);
      setSelectedStudents(new Set());
      
      setActiveTab('enrolled');
    } catch (err: any) {
      console.error('❌ Bulk enrollment failed:', err);
      setError(`Failed to enroll students: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle individual enrollment
  const handleEnrollStudent = async (studentId: number) => {
    if (!selectedSection) {
      console.warn('⚠️ Individual enroll called but no section selected');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Starting individual enrollment:', { studentId, sectionId: selectedSection });
      
      const result = await enrollStudentInSection(studentId, selectedSection);
      console.log('✅ Individual enrollment successful:', result);
      
      // Refresh student lists
      console.log('🔄 Refreshing student lists...');
      const [enrolled, unassigned] = await Promise.all([
        fetchStudentsBySection(selectedSection),
        fetchUnassignedStudents(selectedDepartment),
      ]);
      
      console.log('📊 Updated lists:', { enrolled: enrolled.length, unassigned: unassigned.length });
      setEnrolledStudents(enrolled);
      setUnassignedStudents(unassigned);
    } catch (err: any) {
      console.error('❌ Individual enrollment failed:', err);
      setError(`Failed to enroll student: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle unenrollment
  const handleUnenrollStudent = async (studentId: number) => {
    try {
      setLoading(true);
      await unenrollStudentFromSection(studentId);
      
      // Refresh student lists
      const [enrolled, unassigned] = await Promise.all([
        fetchStudentsBySection(selectedSection),
        fetchUnassignedStudents(selectedDepartment),
      ]);
      setEnrolledStudents(enrolled);
      setUnassignedStudents(unassigned);
    } catch (err) {
      setError('Failed to unenroll student');
      console.error('Error unenrolling student:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !departments.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading enrollment system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <style>{`
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .student-card {
          transition: all 0.2s ease;
        }
        .student-card:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .selected-student {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎓 Student Enrollment Management
            </h1>
            <p className="text-gray-600 text-lg">
              Enroll students in their respective sections and manage class assignments
            </p>
          </div>
          
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allStudents.length}</div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selection Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Department Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📚 Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedSemester('');
                setSelectedSection('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSection('');
              }}
              disabled={!selectedDepartment}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100"
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👥 Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedSemester}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100"
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  Section {section.section_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Management Interface */}
      {selectedSection && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('enrolled')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'enrolled'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                  }`}
                >
                  👥 Enrolled Students ({enrolledStudents.length})
                </button>
                <button
                  onClick={() => setActiveTab('unassigned')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'unassigned'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                  }`}
                >
                  📋 Available Students ({unassignedStudents.length})
                </button>
              </div>

              {/* Bulk Actions */}
              {activeTab === 'unassigned' && selectedStudents.size > 0 && (
                <button
                  onClick={handleBulkEnroll}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                >
                  ✅ Enroll {selectedStudents.size} Students
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search students by name, roll number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {activeTab === 'enrolled' ? '👥' : '📝'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {activeTab === 'enrolled' ? 'No Students Enrolled' : 'No Available Students'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'enrolled'
                    ? 'This section has no enrolled students yet.'
                    : 'All students in this department are already enrolled in sections.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.student_id}
                    className={`student-card p-4 rounded-xl border-2 cursor-pointer ${
                      selectedStudents.has(student.student_id)
                        ? 'selected-student border-blue-500'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                    onClick={() => activeTab === 'unassigned' && toggleStudentSelection(student.student_id)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{student.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{student.roll_number}</p>
                      </div>
                    </div>

                    {student.email && (
                      <p className="text-xs text-gray-600 mb-3 truncate">📧 {student.email}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {activeTab === 'enrolled' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnenrollStudent(student.student_id);
                          }}
                          disabled={loading}
                          className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          ❌ Remove
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnrollStudent(student.student_id);
                          }}
                          disabled={loading}
                          className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          ✅ Enroll
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedSection && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Getting Started</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select a department, semester, and section to view and manage student enrollments. 
            You can enroll unassigned students or remove students from their current sections.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentEnrollment;