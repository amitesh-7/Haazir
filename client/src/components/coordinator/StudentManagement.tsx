import React, { useEffect, useMemo, useState } from "react";
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
  uploadStudentsCsv,
  fetchSectionsByDepartment,
} from "../../services/api";

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({
    email: "",
    password: "",
    name: "",
    rollNumber: "",
    departmentId: "",
    sectionId: "",
    semester: "",
    contactNumber: "",
    parentName: "",
    parentContact: "",
    address: "",
  });
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<{
    name?: string;
    roll_number?: string;
    department_id?: string;
    section_id?: string;
    semester?: string | number;
    contact_number?: string;
    parent_name?: string;
    parent_contact?: string;
    address?: string;
  }>({});
  const [newErrors, setNewErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [editSections, setEditSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<any | null>(null);
  const [studentCourses, setStudentCourses] = useState<
    Record<string | number, any[]>
  >({});

  // Course assignment modal states
  const [assigningCoursesTo, setAssigningCoursesTo] = useState<
    number | string | null
  >(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseAssignmentLoading, setCourseAssignmentLoading] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const data = await fetchAllStudents();
        setStudents(data);
      } catch (err: any) {
        console.error("Error loading students:", err);
        setError(err?.message ?? "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    const loadMeta = async () => {
      try {
        const [deps, crs] = await Promise.all([
          fetchAllDepartments(),
          fetchAllCourses(),
        ]);
        setDepartments(deps);
        setCourses(crs);
      } catch (e) {
        console.warn("Failed to load departments/courses");
      }
    };

    loadStudents();
    loadMeta();
  }, []);

  // Load sections when department changes
  const loadSections = async (departmentId: string) => {
    if (!departmentId) {
      setSections([]);
      return;
    }
    try {
      const sectionsData = await fetchSectionsByDepartment(departmentId);
      setSections(sectionsData);
    } catch (e) {
      console.warn("Failed to load sections");
      setSections([]);
    }
  };

  // Handle department change
  const handleDepartmentChange = (departmentId: string) => {
    setNewStudent({ ...newStudent, departmentId, sectionId: "" });
    loadSections(departmentId);
  };

  const handleAddStudent = async () => {
    try {
      const errs: Record<string, string> = {};
      if (!newStudent.email) errs.email = "Email is required";
      if (!newStudent.password) errs.password = "Password is required";
      if (!newStudent.name) errs.name = "Name is required";
      if (!newStudent.rollNumber) errs.rollNumber = "Roll number is required";
      if (!newStudent.departmentId) errs.departmentId = "Department is required";
      if (!newStudent.semester) errs.semester = "Semester is required";
      const semesterNum = Number(newStudent.semester);
      if (
        newStudent.semester &&
        (!Number.isInteger(semesterNum) || semesterNum < 1 || semesterNum > 8)
      ) {
        errs.semester = "Semester must be an integer between 1 and 8";
      }
      const phone10 = /^\d{10}$/;
      if (newStudent.contactNumber && !phone10.test(newStudent.contactNumber)) {
        errs.contactNumber = "Contact number must be exactly 10 digits";
      }
      if (newStudent.parentContact && !phone10.test(newStudent.parentContact)) {
        errs.parentContact = "Parent contact must be exactly 10 digits";
      }
      setNewErrors(errs);
      if (Object.keys(errs).length > 0) return;
      
      console.log("Attempting to register student:", {
        email: newStudent.email,
        password: newStudent.password ? "[PROVIDED]" : "[MISSING]",
        name: newStudent.name,
        rollNumber: newStudent.rollNumber,
        departmentId: newStudent.departmentId,
        sectionId: newStudent.sectionId,
        semester: newStudent.semester,
        contactNumber: newStudent.contactNumber,
        parentName: newStudent.parentName,
        parentContact: newStudent.parentContact,
        address: newStudent.address,
      });
      
      const requestData = {
        email: newStudent.email,
        password: newStudent.password,
        name: newStudent.name,
        rollNumber: newStudent.rollNumber,
        departmentId: newStudent.departmentId,
        sectionId: newStudent.sectionId || undefined,
        semester: Number(newStudent.semester),
        contactNumber: newStudent.contactNumber || undefined,
        parentName: newStudent.parentName || undefined,
        parentContact: newStudent.parentContact || undefined,
        address: newStudent.address || undefined,
      };
      
      console.log("📤 Sending registration request with data:", requestData);
      
      const res = await registerStudent(requestData);
      
      console.log("Student registration successful:", res);
      
      // Reload list to reflect associated student profile
      const data = await fetchAllStudents();
      setStudents(data);
      setNewStudent({
        email: "",
        password: "",
        name: "",
        rollNumber: "",
        departmentId: "",
        sectionId: "",
        semester: "",
        contactNumber: "",
        parentName: "",
        parentContact: "",
        address: "",
      });
      setNewErrors({});
      
      console.log("Student added successfully and form cleared");
    } catch (error: any) {
      console.error("Error adding student:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to add student. Please try again.";
      console.error("Final error message:", errorMessage);
      
      setNewErrors({
        general: errorMessage
      });
    }
  };

  const handleDeleteStudent = async (studentId: number | string) => {
    await apiDeleteStudent(String(studentId));
    setStudents((prev) =>
      prev.filter((s) => (s.student_id ?? s.id) !== studentId)
    );
  };

  const startEdit = async (s: any) => {
    setEditingId(s.student_id ?? s.id);
    const departmentId = String(s.department_id ?? s.departmentId ?? "");
    setEditDraft({
      name: s.name,
      roll_number: s.roll_number ?? s.rollNumber,
      department_id: departmentId,
      section_id: String(s.section_id ?? ""),
      semester: s.semester ?? s.year ?? "",
      contact_number: s.contact_number ?? "",
      parent_name: s.parent_name ?? "",
      parent_contact: s.parent_contact ?? "",
      address: s.address ?? "",
    });
    setEditErrors({});

    // Load sections for the student's department
    if (departmentId) {
      try {
        const sectionsData = await fetchSectionsByDepartment(departmentId);
        setEditSections(sectionsData);
      } catch (e) {
        console.warn("Failed to load sections for edit");
        setEditSections([]);
      }
    } else {
      setEditSections([]);
    }

    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const errs: Record<string, string> = {};
    if (!editDraft?.name) errs.name = "Name is required";
    if (!editDraft?.roll_number) errs.roll_number = "Roll number is required";
    if (!editDraft?.department_id)
      errs.department_id = "Department is required";
    if (
      editDraft?.semester !== undefined &&
      String(editDraft.semester).length > 0
    ) {
      const s = Number(editDraft.semester);
      if (!Number.isInteger(s) || s < 1 || s > 8)
        errs.semester = "Semester must be 1-8";
    }
    const phone10 = /^\d{10}$/;
    if (editDraft?.contact_number && !phone10.test(editDraft.contact_number))
      errs.contact_number = "Contact must be 10 digits";
    if (editDraft?.parent_contact && !phone10.test(editDraft.parent_contact))
      errs.parent_contact = "Parent contact must be 10 digits";
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await apiUpdateStudent(editingId, {
      ...editDraft,
      semester:
        editDraft.semester === "" ? undefined : Number(editDraft.semester),
    });
    const data = await fetchAllStudents();
    setStudents(data);
    setEditingId(null);
    setEditDraft({});
    setEditOpen(false);
  };

  // Get current student for course assignment
  const getCurrentStudent = () => {
    return students.find((s) => (s.student_id ?? s.id) === assigningCoursesTo);
  };

  // Filter courses by student's semester for better matching
  const getFilteredCourses = () => {
    const currentStudent = getCurrentStudent();
    const studentSemester =
      currentStudent?.semester ?? currentStudent?.year ?? null;
    if (!currentStudent || !studentSemester) {
      return courses; // Return all courses if no semester info available
    }

    // Filter courses that match student's semester, or courses without semester specified
    return courses.filter(
      (course: any) => !course.semester || course.semester === studentSemester
    );
  };

  // Course assignment modal functions
  const openCourseAssignmentModal = async (student: any) => {
    setAssigningCoursesTo(student.student_id);
    setSelectedCourses([]);
    try {
      const assignedCourses = await getStudentCourses(student.student_id);
      setStudentCourses((prev) => ({
        ...prev,
        [student.student_id]: assignedCourses,
      }));
      setSelectedCourses(
        assignedCourses.map((c: any) => c.course_id.toString())
      );
    } catch (error) {
      console.error("Error loading student courses:", error);
    }
  };

  const handleBulkCourseAssignment = async () => {
    if (!assigningCoursesTo) return;
    setCourseAssignmentLoading(true);

    try {
      // Get currently assigned courses
      const currentCourses = studentCourses[assigningCoursesTo] || [];
      const currentCourseIds = currentCourses.map((c: any) =>
        c.course_id.toString()
      );

      // Find courses to add and remove
      const coursesToAdd = selectedCourses.filter(
        (id) => !currentCourseIds.includes(id)
      );
      const coursesToRemove = currentCourseIds.filter(
        (id) => !selectedCourses.includes(id)
      );

      // Add new courses
      for (const courseId of coursesToAdd) {
        await assignCourseToStudent(assigningCoursesTo, courseId);
      }

      // Remove unselected courses
      for (const courseId of coursesToRemove) {
        await removeCourseFromStudent(assigningCoursesTo, courseId);
      }

      // Refresh the student's courses
      const updatedCourses = await getStudentCourses(assigningCoursesTo);
      setStudentCourses((prev) => ({
        ...prev,
        [assigningCoursesTo]: updatedCourses,
      }));

      setAssigningCoursesTo(null);
    } catch (error) {
      console.error("Error assigning courses:", error);
      setError("Failed to assign courses to student");
    } finally {
      setCourseAssignmentLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  if (loading) return <div>Loading students…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Student Management</h1>

      {/* Add new student */}
      <div className="bg-white rounded shadow p-4 space-y-3">
        <h2 className="font-semibold">Add New Student</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <input
              className={`border rounded px-2 py-1 w-full ${
                newErrors.email ? "border-red-500" : ""
              }`}
              placeholder="Email"
              value={newStudent.email}
              onChange={(e) =>
                setNewStudent({ ...newStudent, email: e.target.value })
              }
            />
            {newErrors.email && (
              <div className="text-xs text-red-600 mt-1">{newErrors.email}</div>
            )}
          </div>
          <div>
            <input
              className={`border rounded px-2 py-1 w-full ${
                newErrors.password ? "border-red-500" : ""
              }`}
              placeholder="Password"
              type="password"
              value={newStudent.password}
              onChange={(e) =>
                setNewStudent({ ...newStudent, password: e.target.value })
              }
            />
            {newErrors.password && (
              <div className="text-xs text-red-600 mt-1">
                {newErrors.password}
              </div>
            )}
          </div>
          <div>
            <input
              className={`border rounded px-2 py-1 w-full ${
                newErrors.name ? "border-red-500" : ""
              }`}
              placeholder="Name"
              value={newStudent.name}
              onChange={(e) =>
                setNewStudent({ ...newStudent, name: e.target.value })
              }
            />
            {newErrors.name && (
              <div className="text-xs text-red-600 mt-1">{newErrors.name}</div>
            )}
          </div>
          <div>
            <input
              className={`border rounded px-2 py-1 w-full ${
                newErrors.rollNumber ? "border-red-500" : ""
              }`}
              placeholder="Roll Number"
              value={newStudent.rollNumber}
              onChange={(e) =>
                setNewStudent({ ...newStudent, rollNumber: e.target.value })
              }
            />
            {newErrors.rollNumber && (
              <div className="text-xs text-red-600 mt-1">
                {newErrors.rollNumber}
              </div>
            )}
          </div>
          <div>
            <select
              className={`border rounded px-2 py-1 w-full ${
                newErrors.departmentId ? "border-red-500" : ""
              }`}
              value={newStudent.departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((d: any) => (
                <option
                  key={d.department_id ?? d.id}
                  value={String(d.department_id ?? d.id)}
                >
                  {d.name ?? d.department_name}
                </option>
              ))}
            </select>
            {newErrors.departmentId && (
              <div className="text-xs text-red-600 mt-1">
                {newErrors.departmentId}
              </div>
            )}
          </div>
          <div>
            <select
              className="border rounded px-2 py-1 w-full bg-white text-gray-900"
              value={newStudent.sectionId}
              onChange={(e) =>
                setNewStudent({ ...newStudent, sectionId: e.target.value })
              }
              disabled={!newStudent.departmentId}
            >
              <option value="" className="bg-white text-gray-900">
                {!newStudent.departmentId
                  ? "Select Department First"
                  : "Select Section"}
              </option>
              {sections.map((section: any) => (
                <option
                  key={section.section_id}
                  value={section.section_id}
                  className="bg-white text-gray-900"
                >
                  {section.section_name}{" "}
                  {section.description && `(${section.description})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className={`border rounded px-2 py-1 w-full ${
                newErrors.semester ? "border-red-500" : ""
              }`}
              value={newStudent.semester}
              onChange={(e) =>
                setNewStudent({ ...newStudent, semester: e.target.value })
              }
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
            {newErrors.semester && (
              <div className="text-xs text-red-600 mt-1">
                {newErrors.semester}
              </div>
            )}
          </div>
          <div>
            <input
              className={`border rounded px-2 py-1 w-full ${
                newErrors.contactNumber ? "border-red-500" : ""
              }`}
              placeholder="Contact Number (10 digits)"
              value={newStudent.contactNumber}
              onChange={(e) =>
                setNewStudent({ ...newStudent, contactNumber: e.target.value })
              }
            />
            {newErrors.contactNumber && (
              <div className="text-xs text-red-600 mt-1">
                {newErrors.contactNumber}
              </div>
            )}
          </div>
          <div>
            <input
              className="border rounded px-2 py-1 w-full"
              placeholder="Parent Name"
              value={newStudent.parentName}
              onChange={(e) =>
                setNewStudent({ ...newStudent, parentName: e.target.value })
              }
            />
          </div>
          <div>
            <input
              className={`border rounded px-2 py-1 w-full ${
                newErrors.parentContact ? "border-red-500" : ""
              }`}
              placeholder="Parent Contact (10 digits)"
              value={newStudent.parentContact}
              onChange={(e) =>
                setNewStudent({ ...newStudent, parentContact: e.target.value })
              }
            />
            {newErrors.parentContact && (
              <div className="text-xs text-red-600 mt-1">
                {newErrors.parentContact}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <input
              className="border rounded px-2 py-1 w-full"
              placeholder="Address"
              value={newStudent.address}
              onChange={(e) =>
                setNewStudent({ ...newStudent, address: e.target.value })
              }
            />
          </div>
        </div>
        
        {/* General error display */}
        {newErrors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {newErrors.general}
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={handleAddStudent}
          >
            Create Student
          </button>
          <div className="text-gray-500">or</div>
          <label className="bg-purple-600 text-white px-3 py-1 rounded cursor-pointer">
            {csvUploading ? "Uploading…" : "Import CSV"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setCsvUploading(true);
                setCsvResult(null);
                try {
                  const summary = await uploadStudentsCsv(f);
                  setCsvResult(summary);
                  // refresh list
                  const data = await fetchAllStudents();
                  setStudents(data);
                } catch (err: any) {
                  setCsvResult({
                    error:
                      err?.response?.data?.message ||
                      err?.message ||
                      "Upload failed",
                  });
                } finally {
                  setCsvUploading(false);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </label>
        </div>
        {csvResult && (
          <div className="mt-2 text-sm">
            {csvResult.error ? (
              <div className="text-red-600">{csvResult.error}</div>
            ) : (
              <div className="space-y-1">
                <div className="font-medium">Import Summary</div>
                <div>
                  Total: {csvResult.total} • Created: {csvResult.created} •
                  Skipped: {csvResult.skipped} • Errors: {csvResult.errors}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Students list */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">All Students</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Roll Number</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Section</th>
                <th className="py-2 pr-4 hidden md:table-cell">Semester</th>
                <th className="py-2 pr-4 hidden md:table-cell">Contact</th>
                <th className="py-2 pr-4 hidden md:table-cell">Parent Name</th>
                <th className="py-2 pr-4 hidden md:table-cell">
                  Parent Contact
                </th>
                <th className="py-2 pr-4 hidden md:table-cell">Address</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => {
                const id = s.student_id ?? s.id;
                const email = s.user?.email ?? s.email ?? "";
                const departmentName =
                  s.department?.name ??
                  s.department?.department_name ??
                  s.departmentName ??
                  s.department_id ??
                  "-";
                const isEditing = editingId === id;
                return (
                  <>
                    <tr key={id} className="border-b">
                      <td className="py-2 pr-4">{s.name}</td>
                      <td className="py-2 pr-4">
                        {s.roll_number ?? s.rollNumber}
                      </td>
                      <td className="py-2 pr-4">{departmentName}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {s.section?.section_name || "N/A"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 hidden md:table-cell">
                        {s.semester ?? s.year ?? "-"}
                      </td>
                      <td className="py-2 pr-4 hidden md:table-cell">
                        {s.contact_number ?? "-"}
                      </td>
                      <td className="py-2 pr-4 hidden md:table-cell">
                        {s.parent_name ?? "-"}
                      </td>
                      <td className="py-2 pr-4 hidden md:table-cell">
                        {s.parent_contact ?? "-"}
                      </td>
                      <td className="py-2 pr-4 hidden md:table-cell">
                        {s.address ?? "-"}
                      </td>
                      <td className="py-2 pr-4">{email}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <>
                          <button
                            className="bg-blue-600 text-white px-2 py-1 rounded"
                            onClick={() => startEdit(s)}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            onClick={() => openCourseAssignmentModal(s)}
                          >
                            Assign Courses
                          </button>
                          <button
                            className="bg-purple-600 text-white px-2 py-1 rounded"
                            onClick={async () => {
                              setExpandedRow((prev) =>
                                prev === id ? null : id
                              );
                              if (!studentCourses[id]) {
                                const sc = await getStudentCourses(id);
                                setStudentCourses((prev) => ({
                                  ...prev,
                                  [id]: sc,
                                }));
                              }
                            }}
                          >
                            Courses
                          </button>
                          <button
                            className="bg-red-600 text-white px-2 py-1 rounded"
                            onClick={() => handleDeleteStudent(id)}
                          >
                            Delete
                          </button>
                        </>
                      </td>
                    </tr>
                    {expandedRow === id && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="p-3">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-2">
                                Assigned Courses
                              </h3>
                              <ul className="list-disc pl-5 space-y-1">
                                {(studentCourses[id] ?? []).map((c: any) => (
                                  <li
                                    key={c.course_id}
                                    className="flex items-center justify-between"
                                  >
                                    <span>
                                      {c.course_name} ({c.course_code})
                                    </span>
                                    <button
                                      className="text-red-600"
                                      onClick={async () => {
                                        await removeCourseFromStudent(
                                          id,
                                          c.course_id
                                        );
                                        const sc = await getStudentCourses(id);
                                        setStudentCourses((prev) => ({
                                          ...prev,
                                          [id]: sc,
                                        }));
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="w-full md:w-80">
                              <h3 className="font-semibold mb-2">
                                Assign Course
                              </h3>
                              <div className="flex gap-2">
                                <select
                                  className="border rounded px-2 py-1 flex-1"
                                  id={`assign_${id}`}
                                >
                                  <option value="">Select Course</option>
                                  {courses
                                    .filter(
                                      (c: any) =>
                                        !c.semester ||
                                        c.semester === (s.semester ?? s.year)
                                    )
                                    .map((c: any) => (
                                      <option
                                        key={c.course_id}
                                        value={String(c.course_id)}
                                      >
                                        {c.course_name} ({c.course_code})
                                        {c.semester && ` - Sem ${c.semester}`}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  className="bg-green-600 text-white px-3 py-1 rounded"
                                  onClick={async () => {
                                    const select = document.getElementById(
                                      `assign_${id}`
                                    ) as HTMLSelectElement | null;
                                    const val = select?.value;
                                    if (!val) return;
                                    await assignCourseToStudent(id, val);
                                    select!.value = "";
                                    const sc = await getStudentCourses(id);
                                    setStudentCourses((prev) => ({
                                      ...prev,
                                      [id]: sc,
                                    }));
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Assignment Modal */}
      {assigningCoursesTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Courses to Student
              </h3>
              <button
                onClick={() => setAssigningCoursesTo(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            <div className="mb-6">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Select courses for the student:
                </h4>
                {getCurrentStudent() && (
                  <p className="text-xs text-gray-500">
                    Student is in Semester{" "}
                    {getCurrentStudent()?.semester ??
                      getCurrentStudent()?.year ??
                      "Unknown"}
                    . Showing{" "}
                    {getFilteredCourses().length > 0
                      ? "matching and available"
                      : "all"}{" "}
                    courses.
                  </p>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {getFilteredCourses().map((course: any) => (
                  <label
                    key={course.course_id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(
                        course.course_id.toString()
                      )}
                      onChange={() =>
                        toggleCourseSelection(course.course_id.toString())
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {course.course_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {course.course_code}
                        {course.credits && ` - ${course.credits} credits`}
                        {course.semester && ` - Semester ${course.semester}`}
                      </div>
                    </div>
                  </label>
                ))}
                {getFilteredCourses().length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No courses available for this semester. Contact
                    administrator to add courses.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAssigningCoursesTo(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCourseAssignment}
                disabled={courseAssignmentLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
              >
                {courseAssignmentLoading ? "Assigning..." : "Assign Courses"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button
                className="text-gray-500"
                onClick={() => {
                  setEditOpen(false);
                  setEditingId(null);
                  setEditDraft({});
                }}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className={`border rounded px-2 py-1 w-full ${
                    editErrors.name ? "border-red-500" : ""
                  }`}
                  value={editDraft.name ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
                {editErrors.name && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.name}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Roll Number</label>
                <input
                  className={`border rounded px-2 py-1 w-full ${
                    editErrors.roll_number ? "border-red-500" : ""
                  }`}
                  value={editDraft.roll_number ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, roll_number: e.target.value }))
                  }
                />
                {editErrors.roll_number && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.roll_number}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Department</label>
                <select
                  className={`border rounded px-2 py-1 w-full ${
                    editErrors.department_id ? "border-red-500" : ""
                  }`}
                  value={editDraft.department_id ?? ""}
                  onChange={async (e) => {
                    const departmentId = e.target.value;
                    setEditDraft((d) => ({
                      ...d,
                      department_id: departmentId,
                      section_id: "", // Reset section when department changes
                    }));
                    // Load sections for new department
                    if (departmentId) {
                      try {
                        const sectionsData = await fetchSectionsByDepartment(
                          departmentId
                        );
                        setEditSections(sectionsData);
                      } catch (e) {
                        console.warn("Failed to load sections");
                        setEditSections([]);
                      }
                    } else {
                      setEditSections([]);
                    }
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((d: any) => (
                    <option
                      key={d.department_id ?? d.id}
                      value={String(d.department_id ?? d.id)}
                    >
                      {d.name ?? d.department_name}
                    </option>
                  ))}
                </select>
                {editErrors.department_id && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.department_id}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Section</label>
                <select
                  className="border rounded px-2 py-1 w-full bg-white text-gray-900"
                  value={editDraft.section_id ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, section_id: e.target.value }))
                  }
                  disabled={!editDraft.department_id}
                >
                  <option value="" className="bg-white text-gray-900">
                    {!editDraft.department_id
                      ? "Select Department First"
                      : "Select Section"}
                  </option>
                  {editSections.map((section: any) => (
                    <option
                      key={section.section_id}
                      value={section.section_id}
                      className="bg-white text-gray-900"
                    >
                      {section.section_name}{" "}
                      {section.description && `(${section.description})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Semester (1-8)</label>
                <select
                  className={`border rounded px-2 py-1 w-full ${
                    editErrors.semester ? "border-red-500" : ""
                  }`}
                  value={String(editDraft.semester ?? "")}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, semester: e.target.value }))
                  }
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
                {editErrors.semester && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.semester}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Contact Number (10 digits)
                </label>
                <input
                  className={`border rounded px-2 py-1 w-full ${
                    editErrors.contact_number ? "border-red-500" : ""
                  }`}
                  value={editDraft.contact_number ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      contact_number: e.target.value,
                    }))
                  }
                />
                {editErrors.contact_number && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.contact_number}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Parent Name</label>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={editDraft.parent_name ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, parent_name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Parent Contact (10 digits)
                </label>
                <input
                  className={`border rounded px-2 py-1 w-full ${
                    editErrors.parent_contact ? "border-red-500" : ""
                  }`}
                  value={editDraft.parent_contact ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      parent_contact: e.target.value,
                    }))
                  }
                />
                {editErrors.parent_contact && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.parent_contact}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Address</label>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={editDraft.address ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, address: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                className="px-3 py-1 rounded bg-gray-200"
                onClick={() => {
                  setEditOpen(false);
                  setEditingId(null);
                  setEditDraft({});
                }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-green-600 text-white"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
