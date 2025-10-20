import React, { useState, useEffect, useMemo } from "react";
import { Link, useHistory } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  fetchAllStudents,
  deleteStudent as apiDeleteStudent,
  registerStudent,
  updateStudent as apiUpdateStudent,
  fetchAllDepartments,
  fetchAllCourses,
  getStudentCourses,
  assignCourseToStudent,
  removeCourseFromStudent,
  fetchTeachersByCourse,
  getStudentCourseAssignments,
  fetchSectionsByDepartmentAndSemester,
} from "../../services/api";
import ReportGenerator from "../common/ReportGenerator";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface Student {
  student_id?: number;
  user_id: number;
  email?: string;
  name: string;
  roll_number: string;
  department_id: number;
  section_id?: number;
  year?: number;
  semester?: number;
  contact_number?: string;
  parent_name?: string;
  parent_contact?: string;
  address?: string;
  department_name?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    email: string;
    role: string;
  };
  department?: {
    name: string;
  };
  section?: {
    section_name: string;
  };
}

interface Department {
  department_id: number;
  name: string;
}

interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  semester?: number;
  department?: {
    name: string;
  };
  teachers?: Teacher[];
}

interface Teacher {
  teacher_id: number;
  name: string;
  email?: string;
  department?: {
    name: string;
  };
  schedules?: {
    schedule_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    classroom: string;
  }[];
}

const EnhancedStudentManagement: React.FC = () => {
  const history = useHistory();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards" | "analytics">(
    "table"
  );

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [sortField, setSortField] = useState<keyof Student>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(
    new Set()
  );

  // Course assignment states
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseTeachersMap, setCourseTeachersMap] = useState<
    Map<number, Teacher[]>
  >(new Map());
  const [selectedTeachers, setSelectedTeachers] = useState<
    Map<number, Teacher | null>
  >(new Map());

  // Form data
  const [newStudent, setNewStudent] = useState({
    email: "",
    password: "",
    name: "",
    rollNumber: "",
    departmentId: "",
    semester: "",
    sectionId: "",
    contactNumber: "",
    parentName: "",
    parentContact: "",
    address: "",
  });

  // Edit form data - separate state for editing
  const [editFormData, setEditFormData] = useState({
    email: "",
    name: "",
    rollNumber: "",
    departmentId: "",
    semester: "",
    sectionId: "",
    contactNumber: "",
    parentName: "",
    parentContact: "",
    address: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, departmentsResponse, coursesResponse] =
        await Promise.all([
          fetchAllStudents(),
          fetchAllDepartments(),
          fetchAllCourses(),
        ]);
      // Ensure we have valid arrays and handle response structure
      const students = Array.isArray(studentsResponse?.data)
        ? studentsResponse.data
        : Array.isArray(studentsResponse)
        ? studentsResponse
        : [];
      const departments = Array.isArray(departmentsResponse?.data)
        ? departmentsResponse.data
        : Array.isArray(departmentsResponse)
        ? departmentsResponse
        : [];
      const courses = Array.isArray(coursesResponse?.data)
        ? coursesResponse.data
        : Array.isArray(coursesResponse)
        ? coursesResponse
        : [];

      console.log("📊 Loaded students:", students);
      console.log("📊 Loaded departments:", departments);

      setStudents(students);
      setDepartments(departments);
      setCourses(courses);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      // Set empty arrays in case of error
      setStudents([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // Advanced filtering and sorting
  const filteredAndSortedStudents = useMemo(() => {
    // Safety check: ensure students is an array
    if (!students || !Array.isArray(students)) {
      return [];
    }

    let filtered = students.filter((student) => {
      const matchesSearch =
        searchTerm === "" ||
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        selectedDepartment === "" ||
        student.department_id.toString() === selectedDepartment;

      const matchesSemester =
        selectedSemester === "" ||
        (student.semester || student.year || "").toString() ===
          selectedSemester;
      return matchesSearch && matchesDepartment && matchesSemester;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    students,
    searchTerm,
    selectedDepartment,
    selectedSemester,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStudents.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredAndSortedStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);

  // Analytics data
  const analyticsData = useMemo(() => {
    // Safety checks: ensure arrays exist
    if (
      !students ||
      !Array.isArray(students) ||
      !departments ||
      !Array.isArray(departments)
    ) {
      return {
        departmentCounts: [],
        semesterCounts: [
          { semester: 1, count: 0 },
          { semester: 2, count: 0 },
          { semester: 3, count: 0 },
          { semester: 4, count: 0 },
          { semester: 5, count: 0 },
          { semester: 6, count: 0 },
          { semester: 7, count: 0 },
          { semester: 8, count: 0 },
        ],
      };
    }

    const departmentCounts = departments.map((dept) => ({
      name: dept.name,
      count: students.filter((s) => s.department_id === dept.department_id)
        .length,
    }));

    const semesterCounts = [1, 2, 3, 4, 5, 6, 7, 8].map((semester) => ({
      semester,
      count: students.filter((s) => (s.semester || s.year) === semester).length,
    }));

    return { departmentCounts, semesterCounts };
  }, [students, departments]);

  // Chart configurations
  const departmentChartData = {
    labels: analyticsData.departmentCounts.map((d) => d.name),
    datasets: [
      {
        data: analyticsData.departmentCounts.map((d) => d.count),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const semesterChartData = {
    labels: [
      "Semester 1",
      "Semester 2",
      "Semester 3",
      "Semester 4",
      "Semester 5",
      "Semester 6",
      "Semester 7",
      "Semester 8",
    ],
    datasets: [
      {
        label: "Students",
        data: analyticsData.semesterCounts.map((s) => s.count),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === paginatedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(paginatedStudents.map((s) => s.user_id)));
    }
  };

  const handleAddStudent = async () => {
    try {
      // Basic validation
      if (
        !newStudent.name ||
        !newStudent.email ||
        !newStudent.rollNumber ||
        !newStudent.departmentId ||
        !newStudent.semester
      ) {
        setError(
          "Please fill in all required fields (Name, Email, Roll Number, Department, and Semester are required)"
        );
        return;
      }

      // Validate password
      if (!newStudent.password || newStudent.password.length < 6) {
        setError("Password is required and must be at least 6 characters");
        return;
      }

      console.log("🔄 Adding student:", newStudent);
      const result = await registerStudent(newStudent);
      console.log("✅ Student added successfully:", result);

      await loadData();
      setShowAddModal(false);
      setNewStudent({
        email: "",
        password: "",
        name: "",
        rollNumber: "",
        departmentId: "",
        semester: "",
        sectionId: "",
        contactNumber: "",
        parentName: "",
        parentContact: "",
        address: "",
      });
      setSections([]);
      setError(null);
    } catch (err: any) {
      console.error("❌ Failed to add student:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to add student"
      );
    }
  };

  const handleEditStudent = async () => {
    try {
      if (
        !selectedStudent ||
        !editFormData.name ||
        !editFormData.email ||
        !editFormData.rollNumber
      ) {
        setError("Please fill in all required fields");
        return;
      }

      console.log(
        "🔄 Updating student:",
        selectedStudent.student_id ?? selectedStudent.user_id,
        editFormData
      );
      await apiUpdateStudent(
        selectedStudent.student_id ?? selectedStudent.user_id,
        {
          name: editFormData.name,
          roll_number: editFormData.rollNumber,
          department_id: parseInt(editFormData.departmentId),
          semester: parseInt(editFormData.semester),
          section_id: editFormData.sectionId || undefined,
          contact_number: editFormData.contactNumber,
          parent_name: editFormData.parentName,
          parent_contact: editFormData.parentContact,
          address: editFormData.address,
        }
      );

      console.log("✅ Student updated successfully");
      await loadData();
      setShowEditModal(false);
      setSelectedStudent(null);
      setEditFormData({
        email: "",
        name: "",
        rollNumber: "",
        departmentId: "",
        semester: "",
        sectionId: "",
        contactNumber: "",
        parentName: "",
        parentContact: "",
        address: "",
      });
      setError(null);
    } catch (err: any) {
      console.error("❌ Failed to update student:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to update student"
      );
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      console.log(
        "🗑️ Deleting student:",
        selectedStudent.student_id ?? selectedStudent.user_id
      );
      await apiDeleteStudent(
        String(selectedStudent.student_id ?? selectedStudent.user_id)
      );
      console.log("✅ Student deleted successfully");
      await loadData();
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (err: any) {
      console.error("❌ Failed to delete student:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to delete student"
      );
    }
  };

  const handleEditClick = async (student: Student) => {
    setSelectedStudent(student);
    setEditFormData({
      email: student.user?.email || student.email || "",
      name: student.name,
      rollNumber: student.roll_number,
      departmentId: student.department_id.toString(),
      semester: (student.semester || student.year || "").toString(),
      sectionId: student.section_id ? student.section_id.toString() : "",
      contactNumber: student.contact_number || "",
      parentName: student.parent_name || "",
      parentContact: student.parent_contact || "",
      address: student.address || "",
    });

    // Load sections for the student's current department and semester
    if (student.department_id && (student.semester || student.year)) {
      try {
        const sectionsData = await fetchSectionsByDepartmentAndSemester(
          student.department_id,
          student.semester || student.year || 1
        );
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
      } catch (error) {
        console.error("Error loading sections for edit:", error);
        setSections([]);
      }
    }

    setShowEditModal(true);
  };

  // Course assignment handlers
  const handleAssignCourses = async (student: Student) => {
    setSelectedStudent(student);
    setCourseLoading(true);
    setShowCourseModal(true);
    setError(null);

    try {
      // Get current student courses with teacher info
      const currentCourses = await getStudentCourseAssignments(
        student.student_id ?? student.user_id
      );
      setStudentCourses(Array.isArray(currentCourses) ? currentCourses : []);

      // Filter available courses based on student's department and semester
      const studentDepartment = student.department_id;
      const studentSemester = student.semester;

      const matchingCourses = courses.filter(
        (course) =>
          course.department_id === studentDepartment &&
          (!course.semester || course.semester === studentSemester) &&
          !currentCourses.some(
            (enrolled: any) => enrolled.course_id === course.course_id
          )
      );

      setAvailableCourses(matchingCourses);
      setShowCourseModal(true);
    } catch (err: any) {
      console.error("❌ Failed to load course data:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load courses"
      );
    } finally {
      setCourseLoading(false);
    }
  };

  const handleAssignCourse = async (courseId: number) => {
    if (!selectedStudent) return;

    try {
      const selectedTeacher = selectedTeachers.get(courseId);
      await proceedWithCourseAssignment(courseId, selectedTeacher?.teacher_id);
    } catch (err: any) {
      console.error("❌ Failed to assign course:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to assign course"
      );
    }
  };
  const proceedWithCourseAssignment = async (
    courseId: number,
    teacherId?: number
  ) => {
    if (!selectedStudent) return;

    try {
      await assignCourseToStudent(
        selectedStudent.student_id ?? selectedStudent.user_id,
        courseId,
        teacherId
      );

      // Refresh course data with teacher info
      const currentCourses = await getStudentCourseAssignments(
        selectedStudent.student_id ?? selectedStudent.user_id
      );
      setStudentCourses(Array.isArray(currentCourses) ? currentCourses : []);

      // Update available courses
      const course = courses.find((c) => c.course_id === courseId);
      if (course) {
        setAvailableCourses((prev) =>
          prev.filter((c) => c.course_id !== courseId)
        );
      }

      // Reset teacher selection for this course
      const newSelectedTeachers = new Map(selectedTeachers);
      newSelectedTeachers.delete(courseId);
      setSelectedTeachers(newSelectedTeachers);

      console.log(
        "✅ Course assigned successfully" + (teacherId ? " with teacher" : "")
      );
    } catch (err: any) {
      console.error("❌ Failed to assign course:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to assign course"
      );
    }
  };

  const handleRemoveCourse = async (courseId: number) => {
    if (!selectedStudent) return;

    try {
      await removeCourseFromStudent(
        selectedStudent.student_id ?? selectedStudent.user_id,
        courseId
      );

      // Refresh course data
      const currentCourses = await getStudentCourses(
        selectedStudent.student_id ?? selectedStudent.user_id
      );
      setStudentCourses(Array.isArray(currentCourses) ? currentCourses : []);

      // Add back to available courses if it matches student's criteria
      const course = courses.find((c) => c.course_id === courseId);
      const studentSemester = selectedStudent.semester ?? selectedStudent.year;
      const studentDepartment = selectedStudent.department_id;

      if (
        course &&
        course.department_id === studentDepartment &&
        (!course.semester || course.semester === studentSemester)
      ) {
        setAvailableCourses((prev) => [...prev, course]);
      }

      console.log("✅ Course removed successfully");
    } catch (err: any) {
      console.error("❌ Failed to remove course:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to remove course"
      );
    }
  };

  const renderTableView = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  checked={
                    selectedStudents.size === paginatedStudents.length &&
                    paginatedStudents.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              {[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "roll_number", label: "Roll Number" },
                { key: "department_name", label: "Department" },
                { key: "year", label: "Semester" },
                { key: "section", label: "Section" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors duration-200"
                  onClick={() => handleSort(key as keyof Student)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {sortField === key && (
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right text-sm font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedStudents.map((student, index) => (
              <tr
                key={student.user_id}
                className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                    checked={selectedStudents.has(student.user_id)}
                    onChange={() => handleSelectStudent(student.user_id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.contact_number}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {student.user?.email || student.email || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {student.roll_number}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {student.department?.name || student.department_name || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(() => {
                      const sem = (student.semester ?? student.year) as
                        | number
                        | undefined;
                      if (!sem) return "bg-gray-100 text-gray-800";
                      if (sem <= 2) return "bg-green-100 text-green-800";
                      if (sem <= 4) return "bg-yellow-100 text-yellow-800";
                      if (sem <= 6) return "bg-orange-100 text-orange-800";
                      return "bg-red-100 text-red-800";
                    })()}`}
                  >
                    Sem {String(student.semester ?? student.year)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {student.section?.section_name || "Not Assigned"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`/students/${student.student_id ?? student.user_id}`}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
                      title="View Profile"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleEditClick(student)}
                      className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-2 rounded-lg transition-colors duration-200"
                      title="Edit Student"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleAssignCourses(student)}
                      className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-lg transition-colors duration-200"
                      title="Assign Courses"
                      disabled={courseLoading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                      title="Delete Student"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedStudents.map((student) => (
        <div
          key={student.user_id}
          className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {student.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {student.name}
                  </h3>
                  <p className="text-blue-100 text-sm">{student.roll_number}</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="rounded border-white text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                checked={selectedStudents.has(student.user_id)}
                onChange={() => handleSelectStudent(student.user_id)}
              />
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  {student.user?.email || student.email || "N/A"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  {student.department?.name || student.department_name || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(() => {
                    const sem = (student.semester ?? student.year) as
                      | number
                      | undefined;
                    if (!sem) return "bg-gray-100 text-gray-800";
                    if (sem <= 2) return "bg-green-100 text-green-800";
                    if (sem <= 4) return "bg-yellow-100 text-yellow-800";
                    if (sem <= 6) return "bg-orange-100 text-orange-800";
                    return "bg-red-100 text-red-800";
                  })()}`}
                >
                  Sem {String(student.semester ?? student.year)}
                </span>

                <div className="flex space-x-2">
                  <Link
                    to={`/students/${student.student_id ?? student.user_id}`}
                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
                    title="View Profile"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleEditClick(student)}
                    className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-2 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAssignCourses(student)}
                    className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-lg transition-colors duration-200"
                    title="Assign Courses"
                    disabled={courseLoading}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Department Distribution */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Students by Department
        </h3>
        <div className="h-80">
          <Doughnut
            data={departmentChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom" as const,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Year Distribution */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Students by Year
        </h3>
        <div className="h-80">
          <Bar
            data={semesterChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Departments
                </p>
                <p className="text-3xl font-bold">{departments.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  New This Month
                </p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Active Today
                </p>
                <p className="text-3xl font-bold">156</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor student information, analytics, and
                performance
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="bg-white rounded-xl p-1 shadow-lg">
                <div className="flex space-x-1">
                  {["table", "cards", "analytics"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${
                        viewMode === mode
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <Link
                to="/smart-data-entry"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Smart Data Entry</span>
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                  PREMIUM
                </span>
              </Link>

              <button
                onClick={() => setShowReportModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Generate Report</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Add Student</span>
              </button>

              <button
                onClick={() => history.push("/coordinator/student-enrollment")}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Student Enrollment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedStudents.size} student
                  {selectedStudents.size > 1 ? "s" : ""} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Generate Report
                  </button>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    Export Selected
                  </button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-8">
          {viewMode === "table" && renderTableView()}
          {viewMode === "cards" && renderCardsView()}
          {viewMode === "analytics" && renderAnalyticsView()}
        </div>

        {/* Pagination */}
        {viewMode !== "analytics" && totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredAndSortedStudents.length
                )}{" "}
                to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedStudents.length
                )}{" "}
                of {filteredAndSortedStudents.length} results
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber =
                    currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNumber > totalPages) return null;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        currentPage === pageNumber
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right ml-4 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Add New Student</h2>
              <p className="text-blue-100 mt-1 text-sm">
                Fill in the student information
              </p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    value={newStudent.rollNumber}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        rollNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter roll number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newStudent.password}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={newStudent.departmentId}
                    onChange={async (e) => {
                      const departmentId = e.target.value;
                      setNewStudent({
                        ...newStudent,
                        departmentId,
                        sectionId: "", // Reset section when department changes
                      });
                      setSections([]); // Clear sections

                      // Load sections if both department and semester are selected
                      if (departmentId && newStudent.semester) {
                        try {
                          const sectionsData =
                            await fetchSectionsByDepartmentAndSemester(
                              departmentId,
                              newStudent.semester
                            );
                          setSections(
                            Array.isArray(sectionsData) ? sectionsData : []
                          );
                        } catch (error) {
                          console.error("Error loading sections:", error);
                          setSections([]);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option
                        key={dept.department_id}
                        value={dept.department_id}
                      >
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <select
                    value={newStudent.semester}
                    onChange={async (e) => {
                      const semester = e.target.value;
                      setNewStudent({
                        ...newStudent,
                        semester,
                        sectionId: "", // Reset section when semester changes
                      });
                      setSections([]); // Clear sections

                      // Load sections if both department and semester are selected
                      if (newStudent.departmentId && semester) {
                        try {
                          const sectionsData =
                            await fetchSectionsByDepartmentAndSemester(
                              newStudent.departmentId,
                              semester
                            );
                          setSections(
                            Array.isArray(sectionsData) ? sectionsData : []
                          );
                        } catch (error) {
                          console.error("Error loading sections:", error);
                          setSections([]);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section {sections.length > 0 && "*"}
                  </label>
                  <select
                    value={newStudent.sectionId}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        sectionId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={
                      !newStudent.departmentId ||
                      !newStudent.semester ||
                      sections.length === 0
                    }
                  >
                    <option value="">
                      {!newStudent.departmentId || !newStudent.semester
                        ? "Select Department & Semester first"
                        : sections.length === 0
                        ? "No sections available"
                        : "Select Section (Optional)"}
                    </option>
                    {sections.map((section: any) => (
                      <option
                        key={section.section_id}
                        value={section.section_id}
                      >
                        {section.section_name}
                      </option>
                    ))}
                  </select>
                  {sections.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {sections.length} section(s) available for this department
                      & semester
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={newStudent.contactNumber}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.parentName}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        parentName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter parent name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Contact
                  </label>
                  <input
                    type="tel"
                    value={newStudent.parentContact}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        parentContact: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter parent contact"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={newStudent.address}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-medium transition-all duration-200"
                >
                  Add Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Edit Student</h2>
              <p className="text-indigo-100 mt-1 text-sm">
                Update student information
              </p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-100"
                    placeholder="Enter email address"
                    disabled
                    title="Email cannot be changed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    value={editFormData.rollNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        rollNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter roll number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={editFormData.departmentId}
                    onChange={async (e) => {
                      const departmentId = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        departmentId,
                        sectionId: "", // Reset section when department changes
                      });
                      setSections([]); // Clear sections

                      // Load sections if both department and semester are selected
                      if (departmentId && editFormData.semester) {
                        try {
                          const sectionsData =
                            await fetchSectionsByDepartmentAndSemester(
                              departmentId,
                              editFormData.semester
                            );
                          setSections(
                            Array.isArray(sectionsData) ? sectionsData : []
                          );
                        } catch (error) {
                          console.error("Error loading sections:", error);
                          setSections([]);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option
                        key={dept.department_id}
                        value={dept.department_id}
                      >
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <select
                    value={editFormData.semester}
                    onChange={async (e) => {
                      const semester = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        semester,
                        sectionId: "", // Reset section when semester changes
                      });
                      setSections([]); // Clear sections

                      // Load sections if both department and semester are selected
                      if (editFormData.departmentId && semester) {
                        try {
                          const sectionsData =
                            await fetchSectionsByDepartmentAndSemester(
                              editFormData.departmentId,
                              semester
                            );
                          setSections(
                            Array.isArray(sectionsData) ? sectionsData : []
                          );
                        } catch (error) {
                          console.error("Error loading sections:", error);
                          setSections([]);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section {sections.length > 0 && "*"}
                  </label>
                  <select
                    value={editFormData.sectionId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        sectionId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={
                      !editFormData.departmentId ||
                      !editFormData.semester ||
                      sections.length === 0
                    }
                  >
                    <option value="">
                      {!editFormData.departmentId || !editFormData.semester
                        ? "Select Department & Semester first"
                        : sections.length === 0
                        ? "No sections available"
                        : "Select Section (Optional)"}
                    </option>
                    {sections.map((section: any) => (
                      <option
                        key={section.section_id}
                        value={section.section_id}
                      >
                        {section.section_name}
                      </option>
                    ))}
                  </select>
                  {sections.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {sections.length} section(s) available for this department
                      & semester
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.contactNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.parentName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        parentName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter parent name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Contact
                  </label>
                  <input
                    type="tel"
                    value={editFormData.parentContact}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        parentContact: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter parent contact"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={editFormData.address}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStudent(null);
                    setEditFormData({
                      email: "",
                      name: "",
                      rollNumber: "",
                      departmentId: "",
                      semester: "",
                      sectionId: "",
                      contactNumber: "",
                      parentName: "",
                      parentContact: "",
                      address: "",
                    });
                  }}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStudent}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-medium transition-all duration-200"
                >
                  Update Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.167 3.924 19 5.464 19z"
                  />
                </svg>
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Student
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete {selectedStudent.name}? This
                  action cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Assignment Modal */}
      {showCourseModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Assign Courses - {selectedStudent.name}
                </h2>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-green-100 text-sm mt-1">
                Semester: {selectedStudent.semester ?? selectedStudent.year} |
                Department:{" "}
                {selectedStudent.department?.name ||
                  selectedStudent.department_name}
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {courseLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Current Courses */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 text-green-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Enrolled Courses ({studentCourses.length})
                    </h3>
                    <div className="space-y-3">
                      {studentCourses.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No courses assigned yet
                        </p>
                      ) : (
                        studentCourses.map((course: any) => (
                          <div
                            key={course.course_id}
                            className="bg-green-50 border border-green-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {course.course_name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {course.course_code}
                                </p>
                                {course.semester && (
                                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Semester {course.semester}
                                  </span>
                                )}
                                {course.teachers &&
                                  course.teachers.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-purple-700">
                                        Teachers:
                                      </p>
                                      {course.teachers.map(
                                        (teacher: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="text-xs text-purple-600 bg-purple-50 rounded px-2 py-1 mt-1 inline-block mr-1"
                                          >
                                            {teacher.name}
                                            {teacher.schedule && (
                                              <span className="ml-1 text-purple-500">
                                                ({teacher.schedule.day_of_week})
                                              </span>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveCourse(course.course_id)
                                }
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors duration-200 ml-2"
                                title="Remove Course"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Available Courses */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Available Courses ({availableCourses.length})
                    </h3>
                    <div className="space-y-3">
                      {availableCourses.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No matching courses available for this semester and
                          department
                        </p>
                      ) : (
                        availableCourses.map((course) => {
                          const courseTeachers =
                            courseTeachersMap.get(course.course_id) || [];
                          const selectedTeacher = selectedTeachers.get(
                            course.course_id
                          );

                          return (
                            <div
                              key={course.course_id}
                              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {course.course_name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {course.course_code}
                                    </p>
                                    {course.semester && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        Semester {course.semester}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleAssignCourse(course.course_id)
                                    }
                                    className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                    title="Assign Course"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Teacher Selection */}
                                {courseTeachers.length > 0 && (
                                  <div className="border-t border-blue-200 pt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Select Teacher (Optional):
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      <div
                                        className={`p-2 border rounded cursor-pointer text-sm ${
                                          !selectedTeacher
                                            ? "border-blue-300 bg-blue-100"
                                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                        onClick={() => {
                                          const newSelected = new Map(
                                            selectedTeachers
                                          );
                                          newSelected.delete(course.course_id);
                                          setSelectedTeachers(newSelected);
                                        }}
                                      >
                                        No teacher selected
                                      </div>
                                      {courseTeachers.map((teacher) => (
                                        <div
                                          key={teacher.teacher_id}
                                          className={`p-2 border rounded cursor-pointer text-sm ${
                                            selectedTeacher?.teacher_id ===
                                            teacher.teacher_id
                                              ? "border-purple-300 bg-purple-100"
                                              : "border-gray-200 bg-white hover:bg-gray-50"
                                          }`}
                                          onClick={() => {
                                            const newSelected = new Map(
                                              selectedTeachers
                                            );
                                            newSelected.set(
                                              course.course_id,
                                              teacher
                                            );
                                            setSelectedTeachers(newSelected);
                                          }}
                                        >
                                          <div className="font-medium">
                                            {teacher.name}
                                          </div>
                                          {teacher.email && (
                                            <div className="text-xs text-gray-500">
                                              {teacher.email}
                                            </div>
                                          )}
                                          {teacher.schedules &&
                                            teacher.schedules.map(
                                              (schedule, idx) => (
                                                <div
                                                  key={idx}
                                                  className="text-xs text-gray-500"
                                                >
                                                  {schedule.day_of_week}{" "}
                                                  {schedule.start_time}-
                                                  {schedule.end_time}
                                                  {schedule.classroom &&
                                                    ` (${schedule.classroom})`}
                                                </div>
                                              )
                                            )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generator Modal */}
      {showReportModal && (
        <ReportGenerator
          data={
            selectedStudents.size > 0
              ? students.filter((s) => selectedStudents.has(s.user_id))
              : filteredAndSortedStudents
          }
          reportType="students"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default EnhancedStudentManagement;
