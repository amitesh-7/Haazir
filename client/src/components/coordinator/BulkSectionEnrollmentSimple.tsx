import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { 
  fetchSectionsByDepartment,
  getUnassignedStudents,
  bulkEnrollStudentsToSection
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
      console.error('Load data error:', err);
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
    if (!selectedSemester) return [];
    return students.filter(s => s.semester.toString() === selectedSemester);
  };

  const getFilteredSections = () => {
    if (!selectedSemester) return [];
    return sections.filter(s => s.semester.toString() === selectedSemester);
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

    if (!selectedSemester) {
      setError('Please select a semester first');
      return;
    }

    setEnrolling(true);
    setError('');
    setSuccess('');
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
  
  // Get available semesters from sections (hierarchy: Department → Semester → Section)
  const availableSemesters = Array.from(new Set(sections.map(s => s.semester))).sort();
  
  // Debug logging
  console.log('Debug BulkSectionEnrollment:', {
    students: students.length,
    sections: sections.length,
    availableSemesters,
    selectedSemester,
    selectedSection,
    filteredSections: filteredSections.length,
    filteredStudents: filteredStudents.length
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Section Enrollment</h2>
            <p className="text-gray-600">Follow: Department → Semester → Section → Students</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredStudents.length} available students
        </div>
      </div>

      {/* Debug Info - temporary */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-yellow-800 text-sm">
            <strong>Debug Info:</strong><br/>
            Students: {students.length} | Sections: {sections.length} | Available Semesters: {availableSemesters.join(', ')}<br/>
            Selected Semester: {selectedSemester || 'None'} | Filtered Sections: {filteredSections.length}
          </div>
        </div>
      )}

      {/* Hierarchy Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Select Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step 1: Select Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSection(''); // Reset section when semester changes
                setSelectedStudents(new Set()); // Reset selected students
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {availableSemesters.length === 0 ? 'No semesters available' : 'Choose Semester First'}
              </option>
              {availableSemesters.map(sem => (
                <option key={sem} value={sem.toString()}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step 2: Select Target Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedSemester}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">
                {!selectedSemester ? 'Select Semester First' : 'Choose Section'}
              </option>
              {filteredSections.map(section => (
                <option key={section.section_id} value={section.section_id}>
                  {section.section_name} (Semester {section.semester})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        {selectedSemester && selectedSection && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                disabled={filteredStudents.length === 0}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <button
              onClick={handleEnrollment}
              disabled={selectedStudents.size === 0 || enrolling}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrolling ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Enroll to Section</span>
            </button>
          </div>
        )}
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
      ) : !selectedSemester ? (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Semester First</h3>
          <p className="text-gray-600">Choose a semester to see available students and sections.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Unassigned Students</h3>
          <p className="text-gray-600">All students in semester {selectedSemester} are already assigned to sections.</p>
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