import React, { useState, useEffect, useMemo } from 'react';

interface Student {
  student_id: string;
  name: string;
  email: string;
  student_number: string;
  department?: string;
  semester?: string;
  profile_picture?: string;
}

interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
  credits: number;
  semester: string;
  academic_year: string;
  department?: string;
}

interface ResultRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  course_id: string;
  course_name: string;
  course_code: string;
  semester: string;
  academic_year: string;
  assessment_type: 'assignment' | 'quiz' | 'midterm' | 'final' | 'project' | 'presentation';
  assessment_name: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  date_conducted: string;
  date_uploaded: string;
  uploaded_by: string;
  remarks?: string;
  is_published: boolean;
}

interface CourseResult {
  course_id: string;
  course_name: string;
  course_code: string;
  semester: string;
  academic_year: string;
  total_students: number;
  results_uploaded: number;
  average_score: number;
  pass_percentage: number;
  records: ResultRecord[];
}

const EnhancedResultManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [resultRecords, setResultRecords] = useState<ResultRecord[]>([]);
  const [courseResults, setCourseResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'upload' | 'edit' | 'analytics'>('overview');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ResultRecord | null>(null);
  const [uploadForm, setUploadForm] = useState({
    course_id: '',
    assessment_type: 'assignment' as const,
    assessment_name: '',
    total_marks: 100,
    date_conducted: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockCourses: Course[] = [
        {
          course_id: 'CS101',
          course_name: 'Introduction to Computer Science',
          course_code: 'CS101',
          credits: 3,
          semester: 'Fall',
          academic_year: '2024-25',
          department: 'Computer Science'
        },
        {
          course_id: 'MATH201',
          course_name: 'Calculus II',
          course_code: 'MATH201',
          credits: 4,
          semester: 'Fall',
          academic_year: '2024-25',
          department: 'Mathematics'
        },
        {
          course_id: 'ENG101',
          course_name: 'English Composition',
          course_code: 'ENG101',
          credits: 3,
          semester: 'Fall',
          academic_year: '2024-25',
          department: 'English'
        }
      ];

      const mockStudents: Student[] = [
        {
          student_id: '1',
          name: 'John Doe',
          email: 'john.doe@university.edu',
          student_number: 'ST001',
          department: 'Computer Science',
          semester: 'Fall 2024'
        },
        {
          student_id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@university.edu',
          student_number: 'ST002',
          department: 'Computer Science',
          semester: 'Fall 2024'
        },
        {
          student_id: '3',
          name: 'Mike Johnson',
          email: 'mike.johnson@university.edu',
          student_number: 'ST003',
          department: 'Mathematics',
          semester: 'Fall 2024'
        }
      ];

      const mockResults: ResultRecord[] = [
        {
          id: '1',
          student_id: '1',
          student_name: 'John Doe',
          student_number: 'ST001',
          course_id: 'CS101',
          course_name: 'Introduction to Computer Science',
          course_code: 'CS101',
          semester: 'Fall',
          academic_year: '2024-25',
          assessment_type: 'midterm',
          assessment_name: 'Midterm Exam',
          marks_obtained: 85,
          total_marks: 100,
          percentage: 85,
          grade: 'A',
          date_conducted: '2024-10-15',
          date_uploaded: new Date().toISOString().split('T')[0],
          uploaded_by: 'Dr. Sarah Johnson',
          is_published: true,
          remarks: 'Good performance'
        },
        {
          id: '2',
          student_id: '2',
          student_name: 'Jane Smith',
          student_number: 'ST002',
          course_id: 'CS101',
          course_name: 'Introduction to Computer Science',
          course_code: 'CS101',
          semester: 'Fall',
          academic_year: '2024-25',
          assessment_type: 'midterm',
          assessment_name: 'Midterm Exam',
          marks_obtained: 92,
          total_marks: 100,
          percentage: 92,
          grade: 'A',
          date_conducted: '2024-10-15',
          date_uploaded: new Date().toISOString().split('T')[0],
          uploaded_by: 'Dr. Sarah Johnson',
          is_published: true
        }
      ];

      setCourses(mockCourses);
      setStudents(mockStudents);
      setResultRecords(mockResults);
      processCourseResults(mockResults, mockCourses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCourseResults = (records: ResultRecord[], courses: Course[]) => {
    const courseMap = new Map<string, CourseResult>();

    courses.forEach(course => {
      const courseRecords = records.filter(r => r.course_id === course.course_id);
      const totalStudents = new Set(courseRecords.map(r => r.student_id)).size;
      const averageScore = courseRecords.length > 0 
        ? courseRecords.reduce((sum, r) => sum + r.percentage, 0) / courseRecords.length 
        : 0;
      const passCount = courseRecords.filter(r => r.percentage >= 60).length;
      const passPercentage = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;

      courseMap.set(course.course_id, {
        course_id: course.course_id,
        course_name: course.course_name,
        course_code: course.course_code,
        semester: course.semester,
        academic_year: course.academic_year,
        total_students: totalStudents,
        results_uploaded: courseRecords.length,
        average_score: Math.round(averageScore * 10) / 10,
        pass_percentage: Math.round(passPercentage * 10) / 10,
        records: courseRecords
      });
    });

    setCourseResults(Array.from(courseMap.values()));
  };

  const handleUploadResult = async (studentResults: { student_id: string; marks_obtained: number; remarks?: string }[]) => {
    try {
      // Create new result records
      const newRecords: ResultRecord[] = studentResults.map(result => {
        const student = students.find(s => s.student_id === result.student_id);
        const course = courses.find(c => c.course_id === uploadForm.course_id);
        const percentage = (result.marks_obtained / uploadForm.total_marks) * 100;
        
        return {
          id: `${Date.now()}_${result.student_id}`,
          student_id: result.student_id,
          student_name: student?.name || 'Unknown',
          student_number: student?.student_number || 'Unknown',
          course_id: uploadForm.course_id,
          course_name: course?.course_name || 'Unknown',
          course_code: course?.course_code || 'Unknown',
          semester: course?.semester || 'Fall',
          academic_year: course?.academic_year || '2024-25',
          assessment_type: uploadForm.assessment_type,
          assessment_name: uploadForm.assessment_name,
          marks_obtained: result.marks_obtained,
          total_marks: uploadForm.total_marks,
          percentage: Math.round(percentage * 10) / 10,
          grade: getLetterGrade(percentage),
          date_conducted: uploadForm.date_conducted,
          date_uploaded: new Date().toISOString().split('T')[0],
          uploaded_by: 'Current User',
          remarks: result.remarks,
          is_published: false
        };
      });

      // Update state
      const updatedRecords = [...resultRecords, ...newRecords];
      setResultRecords(updatedRecords);
      processCourseResults(updatedRecords, courses);
      
      // Reset form and close modal
      setUploadForm({
        course_id: '',
        assessment_type: 'assignment',
        assessment_name: '',
        total_marks: 100,
        date_conducted: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Error uploading results:', error);
    }
  };

  const handleEditResult = async (updatedRecord: ResultRecord) => {
    try {
      const updatedRecords = resultRecords.map(record => 
        record.id === updatedRecord.id ? updatedRecord : record
      );
      setResultRecords(updatedRecords);
      processCourseResults(updatedRecords, courses);
      setIsEditModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error updating result:', error);
    }
  };

  const publishResults = async (courseId: string, assessmentName: string) => {
    try {
      const updatedRecords = resultRecords.map(record => 
        record.course_id === courseId && record.assessment_name === assessmentName
          ? { ...record, is_published: true }
          : record
      );
      setResultRecords(updatedRecords);
      processCourseResults(updatedRecords, courses);
    } catch (error) {
      console.error('Error publishing results:', error);
    }
  };

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (grade === 'D') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filteredResults = useMemo(() => {
    let filtered = courseResults;
    
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(result => result.course_id === selectedCourse);
    }
    
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(result => result.semester === selectedSemester);
    }
    
    return filtered;
  }, [courseResults, selectedCourse, selectedSemester]);

  const overallStats = useMemo(() => {
    const totalCourses = courseResults.length;
    const totalStudentsAcrossAllCourses = courseResults.reduce((sum, course) => sum + course.total_students, 0);
    const totalResultsUploaded = courseResults.reduce((sum, course) => sum + course.results_uploaded, 0);
    const overallAverage = courseResults.length > 0 
      ? courseResults.reduce((sum, course) => sum + course.average_score, 0) / courseResults.length 
      : 0;

    return {
      totalCourses,
      totalStudents: totalStudentsAcrossAllCourses,
      totalResultsUploaded,
      overallAverage: Math.round(overallAverage * 10) / 10
    };
  }, [courseResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading results management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Results Management 📊
          </h1>
          <p className="text-gray-600 text-lg">Upload, edit, and manage student examination results</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-purple-600">{overallStats.totalCourses}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{overallStats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Results Uploaded</p>
                <p className="text-3xl font-bold text-green-600">{overallStats.totalResultsUploaded}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Overall Average</p>
                <p className="text-3xl font-bold text-indigo-600">{overallStats.overallAverage}%</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* View Selection and Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-xl p-1">
                <div className="flex space-x-1">
                  {['overview', 'upload', 'edit', 'analytics'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view as any)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${
                        selectedView === view
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Semesters</option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>

              {selectedView === 'overview' && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Upload Results
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content based on selected view */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {filteredResults.map(courseResult => (
              <div key={courseResult.course_id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {courseResult.course_code} - {courseResult.course_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {courseResult.semester} {courseResult.academic_year}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {courseResult.average_score}%
                      </div>
                      <div className="text-xs text-gray-500">Average Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-lg font-semibold text-blue-600">{courseResult.total_students}</div>
                      <div className="text-xs text-blue-800">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-lg font-semibold text-green-600">{courseResult.results_uploaded}</div>
                      <div className="text-xs text-green-800">Results Uploaded</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <div className="text-lg font-semibold text-purple-600">{courseResult.average_score}%</div>
                      <div className="text-xs text-purple-800">Average Score</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-xl">
                      <div className="text-lg font-semibold text-indigo-600">{courseResult.pass_percentage}%</div>
                      <div className="text-xs text-indigo-800">Pass Rate</div>
                    </div>
                  </div>

                  {courseResult.records.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Student</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Assessment</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Marks</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Grade</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseResult.records.slice(0, 5).map(record => (
                            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{record.student_name}</div>
                                  <div className="text-sm text-gray-500">{record.student_number}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{record.assessment_name}</div>
                                  <div className="text-sm text-gray-500 capitalize">{record.assessment_type}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-medium">
                                  {record.marks_obtained}/{record.total_marks}
                                </div>
                                <div className="text-sm text-gray-500">{record.percentage}%</div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getGradeColor(record.grade)}`}>
                                  {record.grade}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  record.is_published 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {record.is_published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      setIsEditModalOpen(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  {!record.is_published && (
                                    <button
                                      onClick={() => publishResults(record.course_id, record.assessment_name)}
                                      className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                      Publish
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Results Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Upload Results</h2>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <select
                      value={uploadForm.course_id}
                      onChange={(e) => setUploadForm({...uploadForm, course_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
                    <select
                      value={uploadForm.assessment_type}
                      onChange={(e) => setUploadForm({...uploadForm, assessment_type: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="midterm">Midterm</option>
                      <option value="final">Final Exam</option>
                      <option value="project">Project</option>
                      <option value="presentation">Presentation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Name</label>
                    <input
                      type="text"
                      value={uploadForm.assessment_name}
                      onChange={(e) => setUploadForm({...uploadForm, assessment_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Midterm Exam, Assignment 1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                    <input
                      type="number"
                      value={uploadForm.total_marks}
                      onChange={(e) => setUploadForm({...uploadForm, total_marks: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Conducted</label>
                    <input
                      type="date"
                      value={uploadForm.date_conducted}
                      onChange={(e) => setUploadForm({...uploadForm, date_conducted: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
                    <input
                      type="text"
                      value={uploadForm.remarks}
                      onChange={(e) => setUploadForm({...uploadForm, remarks: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="General remarks about the assessment"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Results</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {students.map(student => (
                      <div key={student.student_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.student_number}</div>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Marks"
                            min="0"
                            max={uploadForm.total_marks}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="text"
                            placeholder="Remarks"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Collect student results from form
                      const studentResults = students.map(student => ({
                        student_id: student.student_id,
                        marks_obtained: 85, // Mock data - would get from form inputs
                        remarks: 'Good performance'
                      }));
                      handleUploadResult(studentResults);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    Upload Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Result Modal */}
        {isEditModalOpen && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Result</h2>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedRecord(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="font-medium text-gray-900">{selectedRecord.student_name}</div>
                      <div className="text-sm text-gray-500">{selectedRecord.student_number}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marks Obtained</label>
                      <input
                        type="number"
                        defaultValue={selectedRecord.marks_obtained}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        max={selectedRecord.total_marks}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                      <input
                        type="number"
                        defaultValue={selectedRecord.total_marks}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      defaultValue={selectedRecord.remarks}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Additional remarks or feedback"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRecord.is_published}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Publish this result (visible to student)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedRecord(null);
                    }}
                    className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Update the record with form values
                      handleEditResult({
                        ...selectedRecord,
                        marks_obtained: 90, // Mock updated value
                        percentage: 90,
                        grade: getLetterGrade(90),
                        remarks: 'Updated remarks'
                      });
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedResultManagement;