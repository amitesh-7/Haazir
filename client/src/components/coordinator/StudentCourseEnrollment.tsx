import React, { useState, useEffect } from 'react';
import { 
  fetchAllStudents, 
  fetchAllCourses, 
  enrollStudentsInCourse,
  fetchAllDepartments 
} from '../../services/api';

interface Student {
  student_id: number;
  name: string;
  roll_number: string;
  department_id: number;
  section_id?: number;
  semester: number;
  department?: {
    department_id: number;
    name: string;
  };
}

interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
  department_id: number;
  semester?: number;
  department?: {
    department_id: number;
    name: string;
  };
}

interface Department {
  department_id: number;
  name: string;
}

const StudentCourseEnrollment: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, departmentFilter, semesterFilter, searchFilter, selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData, departmentsData] = await Promise.all([
        fetchAllStudents(),
        fetchAllCourses(),
        fetchAllDepartments()
      ]);
      
      setStudents(studentsData.students || studentsData);
      setCourses(coursesData.courses || coursesData);
      setDepartments(departmentsData.departments || departmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(student => 
        student.department_id === parseInt(departmentFilter)
      );
    }

    // Filter by semester
    if (semesterFilter) {
      filtered = filtered.filter(student => 
        student.semester === parseInt(semesterFilter)
      );
    }

    // Filter by course department if course is selected
    if (selectedCourse && selectedCourse.department_id) {
      filtered = filtered.filter(student => 
        student.department_id === selectedCourse.department_id
      );
    }

    // Filter by course semester if course has semester specified
    if (selectedCourse && selectedCourse.semester) {
      filtered = filtered.filter(student => 
        student.semester === selectedCourse.semester
      );
    }

    // Search filter
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(search) ||
        student.roll_number.toLowerCase().includes(search)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setSelectedStudents([]);
    setMessage(null);
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.student_id));
    }
  };

  const handleEnrollment = async () => {
    if (!selectedCourse || selectedStudents.length === 0) {
      setMessage({ type: 'error', text: 'Please select a course and at least one student' });
      return;
    }

    try {
      setEnrolling(true);
      const result = await enrollStudentsInCourse(selectedCourse.course_id, selectedStudents);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully enrolled ${result.successful_enrollments} students in ${selectedCourse.course_name}` 
      });
      
      if (result.failed_enrollments > 0) {
        console.warn('Some enrollments failed:', result.errors);
      }
      
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error enrolling students:', error);
      setMessage({ type: 'error', text: 'Failed to enroll students' });
    } finally {
      setEnrolling(false);
    }
  };

  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Student Course Enrollment</h1>
        
        {message && (
          <div className={`p-4 rounded-md mb-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Course Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.course_id}
                onClick={() => handleCourseSelect(course)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedCourse?.course_id === course.course_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                }`}
              >
                <div className="font-medium text-gray-800">
                  {course.course_name}
                </div>
                <div className="text-sm text-gray-600">
                  Code: {course.course_code}
                </div>
                <div className="text-sm text-gray-600">
                  Department: {getDepartmentName(course.department_id)}
                </div>
                {course.semester && (
                  <div className="text-sm text-gray-600">
                    Semester: {course.semester}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Student Selection */}
        {selectedCourse && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Select Students for: {selectedCourse.course_name}
              </h2>
              <button
                onClick={handleEnrollment}
                disabled={enrolling || selectedStudents.length === 0}
                className={`px-6 py-2 rounded-md font-medium ${
                  enrolling || selectedStudents.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {enrolling ? 'Enrolling...' : `Enroll ${selectedStudents.length} Students`}
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name or Roll Number"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleSelectAll}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredStudents.length} students • {selectedStudents.length} selected
              </div>
              
              {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.student_id}
                      onClick={() => handleStudentToggle(student.student_id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudents.includes(student.student_id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.student_id)}
                          onChange={() => handleStudentToggle(student.student_id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{student.name}</div>
                          <div className="text-sm text-gray-600">
                            Roll: {student.roll_number}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getDepartmentName(student.department_id)} • Sem {student.semester}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students found matching the filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseEnrollment;