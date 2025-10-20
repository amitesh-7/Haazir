import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  ArrowRight,
  GraduationCap,
  Building
} from 'lucide-react';
import { 
  fetchAllDepartments,
  fetchSectionsByDepartment,
  getUnassignedStudents,
  bulkEnrollStudentsToSection,
  api
} from '../../services/api';

interface Student {
  student_id: number;
  name: string;
  roll_number: string;
  semester: number;
  user: { email: string };
  department: { name: string };
}

interface Section {
  section_id: number;
  section_name: string;
  semester: number;
  description?: string;
}

interface BulkSectionEnrollmentProps {
  departmentId: string | number;
  onEnrollmentComplete?: () => void;
}

const BulkSectionEnrollment: React.FC<BulkSectionEnrollmentProps> = ({
  departmentId,
  onEnrollmentComplete
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<string>('all');

  useEffect(() => {
    if (departmentId) {
      loadData();
    }
  }, [departmentId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsData, sectionsData] = await Promise.all([
        getUnassignedStudents(departmentId),
        fetchSectionsByDepartment(departmentId)
      ]);

      setStudents(studentsData.data || []);
      setSections(sectionsData.data || []);
    } catch (err: any) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    const filteredStudents = getFilteredStudents();
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.student_id)));
    }
  };

  const getFilteredStudents = () => {
    if (filterSemester === 'all') return students;
    return students.filter(s => s.semester.toString() === filterSemester);
  };

  const getFilteredSections = () => {
    if (selectedSemester === 'all' || !selectedSemester) return sections;
    return sections.filter(s => s.semester.toString() === selectedSemester);
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setSelectedSection(''); // Reset section when semester changes
  };

  const handleEnrollment = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }

    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    if (!selectedSemester || selectedSemester === 'all') {
      setError('Please select a specific semester');
      return;
    }

    // Validate that selected students are from the same semester as the target section
    const selectedStudentsList = Array.from(selectedStudents);
    const studentsData = students.filter(s => selectedStudentsList.includes(s.student_id));
    const invalidStudents = studentsData.filter(s => s.semester.toString() !== selectedSemester);
    
    if (invalidStudents.length > 0) {
      setError(`Some selected students are from different semesters. Please ensure all students are from semester ${selectedSemester}.`);
      return;
    }

    setEnrolling(true);
    setError('');
    try {
      const result = await bulkEnrollStudentsToSection(
        Array.from(selectedStudents),
        selectedSection
      );

      setSuccess(`Successfully enrolled ${result.count} students to section`);
      setSelectedStudents(new Set());
      setSelectedSection('');
      
      // Reload data to reflect changes
      await loadData();
      
      if (onEnrollmentComplete) {
        onEnrollmentComplete();
      }
    } catch (err: any) {
      setError(`Enrollment failed: ${err.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  const filteredStudents = getFilteredStudents();
  const filteredSections = getFilteredSections();
  const uniqueSemesters = Array.from(new Set(students.map(s => s.semester))).sort();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Section Enrollment</h2>
            <p className="text-gray-600">Enroll multiple students into sections</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredStudents.length} unassigned students
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Step 1: Select Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center">
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-2">1</span>
                Select Semester
              </span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose Semester</option>
              {uniqueSemesters.map(sem => (
                <option key={sem} value={sem.toString()}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Filter Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center">
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-2">2</span>
                Filter Students
              </span>
            </label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Semesters</option>
              {uniqueSemesters.map(sem => (
                <option key={sem} value={sem.toString()}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Target Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center">
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-2">3</span>
                Target Section
              </span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedSemester || selectedSemester === ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedSemester ? 'Select semester first' : 'Choose Section'}
              </option>
              {filteredSections.map(section => (
                <option key={section.section_id} value={section.section_id}>
                  {section.section_name} (Semester {section.semester})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hierarchy Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-sm text-blue-800">
            <Building className="w-4 h-4 mr-2" />
            <span className="font-medium">Hierarchy:</span>
            <span className="ml-2">Department → Semester → Section → Batches</span>
          </div>
          {selectedSemester && (
            <div className="mt-2 text-sm text-blue-700">
              Currently working with: <span className="font-medium">Semester {selectedSemester}</span>
              {selectedSection && filteredSections.find(s => s.section_id.toString() === selectedSection) && (
                <span> → Section {filteredSections.find(s => s.section_id.toString() === selectedSection)?.section_name}</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleSelectAll}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
            {filteredStudents.length > 0 && ` (${filteredStudents.length})`}
          </button>

          {selectedStudents.size > 0 && selectedSection && selectedSemester && selectedSemester !== '' && (
            <button
              onClick={handleEnrollment}
              disabled={enrolling}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrolling ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Enroll {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Unassigned Students</h3>
          <p className="text-gray-600">All students in this department are already assigned to sections.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="grid gap-2 p-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.student_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.has(student.student_id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudentToggle(student.student_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.student_id)}
                        onChange={() => handleStudentToggle(student.student_id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.roll_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Semester {student.semester}</div>
                      <div className="text-xs text-gray-500">{student.user.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSectionEnrollment;