import axios from "axios";

// API URL - defaults to port 5000 (server's default port)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for API responses
export interface AttendanceData {
  scheduleId: string;
  studentId: string;
  status: "present" | "absent" | "late";
  date: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  departmentId: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
  department_id?: number;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  classType?: string; // "Lecture", "Tutorial", "Lab"
  targetAudience?: string; // "Section", "Batch"
  batchId?: string; // Only for Tutorial and Lab
}

export interface DashboardStats {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalDepartments: number;
    activeUsers: number;
  };
  recentActivity: {
    recentStudents: Array<{
      id: number;
      name: string;
      rollNumber: string;
      department: string;
      createdAt: string;
    }>;
    recentTeachers: Array<{
      id: number;
      name: string;
      email: string;
      department: string;
      createdAt: string;
    }>;
  };
  statistics: {
    departmentBreakdown: Array<{
      department_name: string;
      student_count: number;
    }>;
  };
}

export interface SystemHealth {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    database: string;
    authentication: string;
  };
  version: string;
}

// Auth API
export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const register = async (
  email: string,
  password: string,
  role: string
) => {
  const response = await api.post("/auth/register", { email, password, role });
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// Student API
export const fetchStudentAttendance = async (studentId: string | number) => {
  const response = await api.get(`/attendance/student/${studentId}`);
  return response.data;
};

export const fetchStudentTimetable = async (studentId: string) => {
  const response = await api.get(`/timetable/student/${studentId}`);
  return response.data;
};

// Teacher API
export const fetchTeacherTimetable = async (teacherId: string) => {
  const response = await api.get(`/timetable/teacher/${teacherId}`);
  return response.data;
};

export const fetchAttendanceHistory = async (studentId: string | number) => {
  const response = await api.get(`/attendance/history/${studentId}`);
  return response.data;
};

export const submitAttendance = async (attendanceData: AttendanceData) => {
  const response = await api.post("/attendance", attendanceData);
  return response.data;
};

export const submitAttendanceBulk = async (
  items: Array<{
    scheduleId: string | number;
    studentId: string | number;
    date: string;
    status: "present" | "absent";
  }>
) => {
  const normalized = items.map((i) => ({
    schedule_id: i.scheduleId,
    student_id: i.studentId,
    date: i.date,
    status: i.status,
  }));
  const response = await api.post("/attendance/bulk", { items: normalized });
  return response.data;
};

export const fetchRosterForSchedule = async (
  scheduleId: number | string,
  date?: string
) => {
  const resp = await api.get(`/attendance/timetable/${scheduleId}/students`, {
    params: date ? { date } : {},
  });
  // Backend returns eligibleStudents, map it to roster for consistency
  return {
    ...resp.data,
    roster: resp.data.eligibleStudents || [],
  };
};

// Coordinator API
export const fetchAllStudents = async () => {
  const response = await api.get("/students");
  return response.data;
};

export const fetchAllTeachers = async () => {
  const response = await api.get("/teachers");
  return response.data;
};

export const fetchAllCourses = async () => {
  const response = await api.get("/courses");
  return response.data;
};

export const fetchAllDepartments = async () => {
  const response = await api.get("/departments");
  return response.data;
};

export const createDepartment = async (name: string) => {
  const response = await api.post("/departments", { name });
  return response.data;
};

export const updateDepartment = async (id: string | number, name: string) => {
  const response = await api.put(`/departments/${id}`, { name });
  return response.data;
};

export const deleteDepartment = async (id: string | number) => {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
};

export const addStudent = async (studentData: Partial<Student>) => {
  const response = await api.post("/students", studentData);
  return response.data;
};

// Register a new student (creates both user and student profile via auth service)
export const registerStudent = async (params: {
  email: string;
  password: string;
  name: string;
  rollNumber: string;
  departmentId: number | string;
  year?: number | string;
  semester?: number | string;
  sectionId?: string;
  contactNumber?: string;
  parentName?: string;
  parentContact?: string;
  address?: string;
}) => {
  const {
    email,
    password,
    name,
    rollNumber,
    departmentId,
    year,
    semester,
    sectionId,
    contactNumber,
    parentName,
    parentContact,
    address,
  } = params;
  const response = await api.post("/auth/register", {
    email,
    password,
    role: "student",
    name,
    rollNumber,
    departmentId,
    year,
    semester,
    sectionId,
    contactNumber,
    parentName,
    parentContact,
    address,
  });
  return response.data;
};

export const updateStudent = async (
  studentId: number | string,
  data: {
    name?: string;
    roll_number?: string;
    department_id?: number | string;
    year?: number | string;
    semester?: number | string;
    section_id?: string;
    contact_number?: string;
    parent_name?: string;
    parent_contact?: string;
    address?: string;
  }
) => {
  const response = await api.put(`/students/${studentId}`, data);
  return response.data;
};

export const deleteStudent = async (studentId: string) => {
  const response = await api.delete(`/students/${studentId}`);
  return response.data;
};

export const deleteTeacher = async (teacherId: number) => {
  const response = await api.delete(`/teachers/${teacherId}`);
  return response.data;
};

// Register a new teacher (creates both user and teacher profile via auth service)
export const registerTeacher = async (params: {
  email: string;
  password: string;
  name: string;
  departmentId: number | string;
}) => {
  const { email, password, name, departmentId } = params;
  const response = await api.post("/auth/register", {
    email,
    password,
    role: "teacher",
    name,
    departmentId,
  });
  return response.data;
};

export const updateTeacherProfile = async (
  teacherId: number | string,
  data: { name?: string; department_id?: number | string }
) => {
  const response = await api.put(`/teachers/${teacherId}`, data);
  return response.data;
};

export const createCourse = async (
  courseData: Partial<Course> & { department_id?: number | string }
) => {
  const response = await api.post("/courses", courseData);
  return response.data;
};

export const updateCourse = async (
  courseId: string,
  courseData: Partial<Course> & { department_id?: number | string }
) => {
  const response = await api.put(`/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId: string) => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

// Student-course assignment APIs
export const getStudentCourses = async (studentId: number | string) => {
  const response = await api.get(`/students/${studentId}/courses`);
  return response.data;
};

export const assignCourseToStudent = async (
  studentId: number | string,
  courseId: number | string,
  teacherId?: number | string
) => {
  const payload: any = { course_id: courseId };
  if (teacherId) {
    payload.teacher_id = teacherId;
  }
  const response = await api.post(`/students/${studentId}/courses`, payload);
  return response.data;
};

export const removeCourseFromStudent = async (
  studentId: number | string,
  courseId: number | string
) => {
  const response = await api.delete(
    `/students/${studentId}/courses/${courseId}`
  );
  return response.data;
};

// CSV upload for students
export const uploadStudentsCsv = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post("/upload/students", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchTimetable = async (options?: {
  signal?: AbortSignal;
  params?: Record<string, any>;
  timeoutMs?: number;
}) => {
  try {
    const axiosConfig: any = {};
    if (options?.signal) axiosConfig.signal = options.signal;
    if (options?.params) axiosConfig.params = options.params;
    if (options?.timeoutMs) axiosConfig.timeout = options.timeoutMs;

    const { data } = await api.get("/timetable", axiosConfig);

    // Handle null, undefined, or non-array responses
    if (!data || !Array.isArray(data)) {
      console.warn("fetchTimetable received invalid data:", data);
      return [];
    }

    // Helper function to normalize time format
    const normalizeTime = (timeStr: string) => {
      if (!timeStr) return timeStr;
      // Convert HH:MM:SS to HH:MM format
      return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
    };

    // map server snake_case to client camelCase expected by UI
    return data.map((e: any) => ({
      id: String(e.schedule_id),
      courseId: String(e.course_id),
      teacherId: String(e.teacher_id),
      dayOfWeek: e.day_of_week,
      startTime: normalizeTime(e.start_time),
      endTime: normalizeTime(e.end_time),
      classroom: e.classroom || "",
      classType: e.class_type || "",
      targetAudience: e.target_audience || "",
      batchId: e.batch_id ? String(e.batch_id) : "",
    }));
  } catch (error: any) {
    console.error("Error fetching timetable:", error);
    // Re-throw with more context
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch timetable"
    );
  }
};

export const fetchTimetableBySection = async (
  sectionId: string | number,
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
  }
) => {
  try {
    const axiosConfig: any = {};
    if (options?.signal) axiosConfig.signal = options.signal;
    if (options?.timeoutMs) axiosConfig.timeout = options.timeoutMs;

    const { data } = await api.get(
      `/timetable/section/${sectionId}`,
      axiosConfig
    );

    // Handle null, undefined, or non-array responses
    if (!data || !Array.isArray(data)) {
      console.warn("fetchTimetableBySection received invalid data:", data);
      return [];
    }

    // Helper function to normalize time format
    const normalizeTime = (timeStr: string) => {
      if (!timeStr) return timeStr;
      // Convert HH:MM:SS to HH:MM format
      return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
    };

    // map server snake_case to client camelCase expected by UI
    return data.map((e: any) => ({
      id: String(e.schedule_id),
      courseId: String(e.course_id),
      teacherId: String(e.teacher_id),
      dayOfWeek: e.day_of_week,
      startTime: normalizeTime(e.start_time),
      endTime: normalizeTime(e.end_time),
      classroom: e.classroom || "",
      classType: e.class_type || "",
      targetAudience: e.target_audience || "",
      batchId: e.batch_id ? String(e.batch_id) : "",
    }));
  } catch (error: any) {
    console.error("Error fetching timetable by section:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch timetable for section"
    );
  }
};

export const createTimetableEntry = async (
  entryData: Partial<TimetableEntry> & {
    classroom?: string;
    sectionId?: string;
  }
) => {
  const payload: any = {
    course_id: entryData.courseId,
    teacher_id: entryData.teacherId,
    day_of_week: entryData.dayOfWeek,
    start_time: entryData.startTime,
    end_time: entryData.endTime,
    classroom: entryData.classroom,
  };

  // Include optional fields if provided and they exist in database
  if (entryData.sectionId) payload.section_id = entryData.sectionId;
  if (entryData.classType) payload.class_type = entryData.classType;

  // Note: target_audience and batch_id are not in database schema yet
  // These will be implemented when batch functionality is added to backend
  // if (entryData.targetAudience) payload.target_audience = entryData.targetAudience;
  // if (entryData.batchId) payload.batch_id = entryData.batchId;

  const response = await api.post("/timetable", payload);
  return response.data;
};

export const deleteTimetableEntry = async (scheduleId: string | number) => {
  const response = await api.delete(`/timetable/${scheduleId}`);
  return response.data;
};

export const updateTimetableEntryApi = async (
  scheduleId: string | number,
  entryData: {
    courseId?: string | number;
    teacherId?: string | number;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    classroom?: string;
    classType?: string;
    targetAudience?: string;
    batchId?: string | number;
  }
) => {
  const payload: any = {};
  if (entryData.courseId !== undefined) payload.course_id = entryData.courseId;
  if (entryData.teacherId !== undefined)
    payload.teacher_id = entryData.teacherId;
  if (entryData.dayOfWeek !== undefined)
    payload.day_of_week = entryData.dayOfWeek;
  if (entryData.startTime !== undefined)
    payload.start_time = entryData.startTime;
  if (entryData.endTime !== undefined) payload.end_time = entryData.endTime;
  if (entryData.classroom !== undefined)
    payload.classroom = entryData.classroom;
  if (entryData.classType !== undefined)
    payload.class_type = entryData.classType;

  // Note: target_audience and batch_id are not in database schema yet
  // These will be implemented when batch functionality is added to backend
  // if (entryData.targetAudience !== undefined) payload.target_audience = entryData.targetAudience;
  // if (entryData.batchId !== undefined) payload.batch_id = entryData.batchId;

  const response = await api.put(`/timetable/${scheduleId}`, payload);
  return response.data;
};

// Dashboard API
export const getDashboardData = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await api.get("/dashboard/health");
  return response.data;
};

// Profile management
export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data; // { user: {...} }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const response = await api.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// Analytics API
export const getStudentAnalytics = async (studentId?: string | number) => {
  const url = studentId
    ? `/analytics/student/${studentId}`
    : "/analytics/student";
  const response = await api.get(url);
  return response.data;
};

export const getClassAnalytics = async (scheduleId: string | number) => {
  const response = await api.get(`/analytics/class/${scheduleId}`);
  return response.data;
};

export const exportAttendanceReport = async (params?: {
  studentId?: string | number;
  scheduleId?: string | number;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get("/analytics/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};

// Attendance threshold check
export const checkAttendanceWarnings = async (studentId?: string | number) => {
  try {
    const analytics = await getStudentAnalytics(studentId);
    return analytics.warnings || [];
  } catch (error) {
    console.error("Error checking attendance warnings:", error);
    return [];
  }
};

// Enhanced timetable creation with classroom
export const createTimetableEntryWithClassroom = async (
  entryData: Partial<TimetableEntry> & { classroom?: string }
) => {
  const payload = {
    course_id: entryData.courseId,
    teacher_id: entryData.teacherId,
    day_of_week: entryData.dayOfWeek,
    start_time: entryData.startTime,
    end_time: entryData.endTime,
    classroom: entryData.classroom,
  };
  const response = await api.post("/timetable", payload);
  return response.data;
};

// For backward compatibility
export const fetchCourses = fetchAllCourses;
export const fetchStudents = fetchAllStudents;
export const fetchTeachers = fetchAllTeachers;
export const getStudentAttendance = fetchStudentAttendance;
export const getStudentTimetable = fetchStudentTimetable;

// Teacher-Course Management APIs
export const getTeacherCourses = async (teacherId: string | number) => {
  const response = await api.get(`/teachers/${teacherId}/courses`);
  return response.data;
};

export const assignCoursesToTeacher = async (
  teacherId: string | number,
  courseIds: number[]
) => {
  console.log("📡 API: Assigning courses to teacher (relationship only):", {
    teacherId,
    courseIds,
  });
  const response = await api.post(`/teachers/${teacherId}/courses`, {
    courseIds,
  });
  return response.data;
};

export const removeCourseFromTeacher = async (
  teacherId: string | number,
  courseId: string | number
) => {
  const response = await api.delete(
    `/teachers/${teacherId}/courses/${courseId}`
  );
  return response.data;
};

export const fetchTeachersByCourse = async (courseId: string | number) => {
  const response = await api.get(`/teachers/course/${courseId}`);
  return response.data;
};

// Student Course Assignments with Teacher Info
export const getStudentCourseAssignments = async (
  studentId: string | number
) => {
  const response = await api.get(`/students/${studentId}/course-assignments`);
  return response.data;
};

// Section Management APIs
export const fetchSectionsByDepartment = async (
  departmentId: string | number
) => {
  const response = await api.get(`/sections/department/${departmentId}`);
  return response.data;
};

export const fetchSectionsByDepartmentAndSemester = async (
  departmentId: string | number,
  semester: string | number
) => {
  const response = await api.get(
    `/sections/department/${departmentId}/semester/${semester}`
  );
  return response.data;
};

export const createSection = async (sectionData: {
  department_id: number;
  section_name: string;
  description?: string;
  semester?: number;
}) => {
  const response = await api.post("/sections", sectionData);
  return response.data;
};

export const updateSection = async (
  sectionId: string | number,
  sectionData: {
    section_name?: string;
    description?: string;
    semester?: number;
  }
) => {
  const response = await api.put(`/sections/${sectionId}`, sectionData);
  return response.data;
};

export const deleteSection = async (sectionId: string | number) => {
  const response = await api.delete(`/sections/${sectionId}`);
  return response.data;
};

// Batch Management APIs
export const fetchBatchesBySection = async (sectionId: string | number) => {
  const response = await api.get(`/batches/section/${sectionId}`);
  return response.data;
};

export const createBatch = async (batchData: {
  section_id: number;
  batch_name: string;
  batch_size?: number;
  description?: string;
}) => {
  const response = await api.post("/batches", batchData);
  return response.data;
};

export const updateBatch = async (
  batchId: string | number,
  batchData: {
    batch_name?: string;
    batch_size?: number;
    description?: string;
  }
) => {
  const response = await api.put(`/batches/${batchId}`, batchData);
  return response.data;
};

export const deleteBatch = async (batchId: string | number) => {
  const response = await api.delete(`/batches/${batchId}`);
  return response.data;
};

// Student Enrollment API
export const fetchStudentsBySection = async (sectionId: string | number) => {
  const response = await api.get(`/students/section/${sectionId}`);
  return response.data;
};

export const fetchUnassignedStudents = async (
  departmentId?: string | number
) => {
  const params = departmentId ? { department_id: departmentId } : {};
  const response = await api.get("/students/unassigned", { params });
  return response.data;
};

export const enrollStudentInSection = async (
  studentId: string | number,
  sectionId: string | number
) => {
  const response = await api.put(`/students/${studentId}/enroll`, {
    section_id: sectionId,
  });
  return response.data;
};

export const unenrollStudentFromSection = async (
  studentId: string | number
) => {
  const response = await api.put(`/students/${studentId}/unenroll`);
  return response.data;
};

export const bulkEnrollStudents = async (
  studentIds: (string | number)[],
  sectionId: string | number
) => {
  const response = await api.post("/students/bulk-enroll", {
    student_ids: studentIds,
    section_id: sectionId,
  });
  return response.data;
};

// Timetable View Settings API
export const saveTimetableViewSettings = async (
  departmentId: string | number,
  semester: string | number,
  sectionId: string | number,
  settings: {
    gridView: boolean;
    gridStart: string;
    gridEnd: string;
    slotMinutes: number;
    breakEnabled: boolean;
    breakStart: string;
    breakEnd: string;
  }
) => {
  const response = await api.post("/timetable/view-settings", {
    department_id: departmentId,
    semester,
    section_id: sectionId,
    grid_settings: settings,
  });
  return response.data;
};

export const fetchTimetableViewSettings = async (
  departmentId: string | number,
  semester: string | number,
  sectionId: string | number
) => {
  const response = await api.get(
    `/timetable/view-settings/${departmentId}/${semester}/${sectionId}`
  );
  return response.data;
};

export const fetchTimetableViewSettingsBySection = async (
  sectionId: string | number
) => {
  const response = await api.get(
    `/timetable/view-settings/section/${sectionId}`
  );
  return response.data;
};

// ===== ENHANCED ATTENDANCE MANAGEMENT API =====

// Types for enhanced attendance functionality
export interface TimetableSlot {
  schedule_id: number;
  course: {
    course_id: number;
    course_name: string;
    course_code: string;
  };
  teacher: {
    teacher_id: number;
    name: string;
  };
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom?: string;
}

export interface EligibleStudent {
  student_id: number;
  name: string;
  roll_number: string;
  department: {
    department_id: number;
    name: string;
  };
  section_id?: number;
}

export interface AttendanceRecord {
  student_id: number;
  status: "present" | "absent";
}

export interface AttendanceSummary {
  total_classes: number;
  present: number;
  absent: number;
  attendance_percentage: number;
}

export interface CourseWiseAttendance {
  [courseId: string]: {
    course_name: string;
    total_classes: number;
    present: number;
    absent: number;
    percentage: number;
  };
}

// Get students eligible for a timetable slot
export const getStudentsForTimetableSlot = async (
  scheduleId: string | number
) => {
  const response = await api.get(
    `/attendance/timetable/${scheduleId}/students`
  );
  return response.data as {
    timetableSlot: TimetableSlot;
    eligibleStudents: EligibleStudent[];
    totalStudents: number;
  };
};

// Mark attendance for a timetable slot
export const markTimetableAttendance = async (
  scheduleId: string | number,
  date: string,
  attendanceRecords: AttendanceRecord[]
) => {
  const response = await api.post(`/attendance/timetable/${scheduleId}/mark`, {
    date,
    attendance_records: attendanceRecords,
  });
  return response.data;
};

// Get attendance report for a course
export const getAttendanceReport = async (
  courseId: string | number,
  startDate?: string,
  endDate?: string,
  sectionId?: string | number
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (sectionId) params.append("section_id", sectionId.toString());

  const queryString = params.toString();
  const url = `/attendance/report/course/${courseId}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await api.get(url);
  return response.data;
};

// Get student attendance summary
export const getStudentAttendanceSummary = async (
  studentId: string | number,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const queryString = params.toString();
  const url = `/attendance/summary/student/${studentId}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await api.get(url);
  return response.data as {
    student_id: number;
    date_range: { start_date?: string; end_date?: string };
    summary: AttendanceSummary;
    course_wise_attendance: CourseWiseAttendance;
    recent_attendance: any[];
  };
};

// Enroll students in a course
export const enrollStudentsInCourse = async (
  courseId: string | number,
  studentIds: (string | number)[]
) => {
  const response = await api.post(`/attendance/course/${courseId}/enroll`, {
    student_ids: studentIds,
  });
  return response.data;
};

// Get teacher's timetable with attendance marking capability
export const getTeacherTimetableForAttendance = async (
  teacherId: string | number
) => {
  const response = await api.get(`/timetable/teacher/${teacherId}`);
  return response.data;
};

// Get today's classes for a teacher
export const getTodayClassesForTeacher = async (teacherId: string | number) => {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
  const response = await api.get(
    `/timetable/teacher/${teacherId}?date=${today}`
  );
  return response.data;
};

// Get attendance status for a specific date and schedule
export const getAttendanceStatus = async (
  scheduleId: string | number,
  date: string
) => {
  const response = await api.get(
    `/attendance/class/${scheduleId}?date=${date}`
  );
  return response.data;
};

// Get attendance history for a teacher
export const getAttendanceHistory = async (
  teacherId: string | number,
  date?: string,
  scheduleId?: string | number
) => {
  const params = new URLSearchParams();
  params.append("teacher_id", teacherId.toString());

  if (date) {
    params.append("date", date);
  }

  if (scheduleId) {
    params.append("schedule_id", scheduleId.toString());
  }

  const queryString = params.toString();
  const url = `/attendance/history${queryString ? `?${queryString}` : ""}`;

  const response = await api.get(url);
  return response.data;
};

// Get attendance dates for a teacher (calendar data)
export const getAttendanceDatesForTeacher = async (
  teacherId: string | number,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  const queryString = params.toString();
  const url = `/attendance/dates/teacher/${teacherId}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await api.get(url);
  return response.data;
};

// Get unified attendance (Manual + Smart) for a schedule/class
export const getUnifiedAttendance = async (
  scheduleId: string | number,
  date: string,
  filters?: {
    method?: "all" | "manual" | "smart";
    status?: "all" | "present" | "absent";
  }
) => {
  const params = new URLSearchParams();
  params.append("schedule_id", scheduleId.toString());
  params.append("date", date);

  if (filters?.method && filters.method !== "all") {
    params.append("method", filters.method);
  }

  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }

  const response = await api.get(`/attendance/unified?${params.toString()}`);
  return response.data;
};

// Get unified attendance history for teacher (all classes)
export const getTeacherUnifiedAttendanceHistory = async (
  teacherId: string | number,
  filters?: {
    startDate?: string;
    endDate?: string;
    method?: "all" | "manual" | "smart";
    courseId?: string | number;
  }
) => {
  const params = new URLSearchParams();
  params.append("teacher_id", teacherId.toString());

  if (filters?.startDate) {
    params.append("start_date", filters.startDate);
  }

  if (filters?.endDate) {
    params.append("end_date", filters.endDate);
  }

  if (filters?.method && filters.method !== "all") {
    params.append("method", filters.method);
  }

  if (filters?.courseId) {
    params.append("course_id", filters.courseId.toString());
  }

  const response = await api.get(
    `/attendance/unified/teacher?${params.toString()}`
  );
  return response.data;
};

// Smart Data Entry API Functions

// Download student template
export const downloadStudentTemplate = async (
  departmentId?: string,
  sectionId?: string,
  autoGenerate?: boolean
) => {
  const params = new URLSearchParams();

  if (departmentId) {
    params.append("department_id", departmentId);
  }

  if (sectionId) {
    params.append("section_id", sectionId);
  }

  if (autoGenerate) {
    params.append("autoGenerate", "true");
  }

  const queryString = params.toString();
  const url = `/data-entry/templates/student${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await api.get(url, {
    responseType: "blob",
  });
  return response;
};

// Download teacher template
export const downloadTeacherTemplate = async () => {
  const response = await api.get("/data-entry/templates/teacher", {
    responseType: "blob",
  });
  return response;
};

// Get validation rules for student or teacher data
export const getValidationRules = async (type: "student" | "teacher") => {
  const response = await api.get(`/data-entry/validation-rules/${type}`);
  return response;
};

// Parse uploaded file
export const parseUploadedFile = async (
  file: File,
  autoGenerate?: boolean,
  departmentId?: string
) => {
  const formData = new FormData();
  formData.append("file", file);

  if (autoGenerate) {
    formData.append("autoGenerate", "true");
  }

  if (departmentId) {
    formData.append("departmentId", departmentId);
  }

  const response = await api.post("/data-entry/parse", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
};

// Enhanced validation functions
export const validateSingleRecord = async (
  data: any,
  type: "student" | "teacher"
) => {
  const response = await api.post("/data-entry/validate", { data, type });
  return response;
};

export const validateBatchRecords = async (
  dataArray: any[],
  type: "student" | "teacher"
) => {
  const response = await api.post("/data-entry/validate-batch", {
    dataArray,
    type,
  });
  return response;
};

// Bulk import validated data
export const bulkImportData = async (
  data: any[],
  type: "student" | "teacher",
  autoGenerate?: boolean,
  departmentId?: number
) => {
  const dataType = type === "student" ? "students" : "teachers";
  const response = await api.post("/data-entry/import", {
    validatedData: data,
    dataType,
    autoGenerate: autoGenerate || false,
    departmentId: departmentId,
  });
  return response.data;
};

// Student Enrollment APIs
export const getUnassignedStudents = async (departmentId: string | number) => {
  const response = await api.get(
    `/student-enrollment/unassigned/${departmentId}`
  );
  return response.data;
};

export const bulkEnrollStudentsToSection = async (
  studentIds: (string | number)[],
  sectionId: string | number
) => {
  const response = await api.post("/student-enrollment/bulk-enroll-section", {
    studentIds,
    sectionId,
  });
  return response.data;
};

export const getStudentsBySection = async (
  sectionId: string | number,
  includeBatched: boolean = true
) => {
  const response = await api.get(
    `/student-enrollment/section/${sectionId}?includeBatched=${includeBatched}`
  );
  return response.data;
};

export const bulkAssignStudentsToBatches = async (
  assignments: Array<{ studentId: number; batchId: number }>
) => {
  const response = await api.post("/student-enrollment/bulk-assign-batches", {
    assignments,
  });
  return response.data;
};

export const autoDistributeStudentsToBatches = async (
  sectionId: string | number,
  batchIds: (string | number)[]
) => {
  const response = await api.post(
    "/student-enrollment/auto-distribute-batches",
    {
      sectionId,
      batchIds,
    }
  );
  return response.data;
};

export const removeStudentsFromBatch = async (
  studentIds: (string | number)[]
) => {
  const response = await api.post("/student-enrollment/remove-from-batch", {
    studentIds,
  });
  return response.data;
};

// ==================== NOTIFICATION API ====================

export interface Notification {
  id: number;
  user_id: number;
  user_role: string;
  type: string; // 'attendance_absent', 'attendance_warning', 'grade_update', 'announcement'
  title: string;
  message: string;
  related_data?: any;
  is_read: boolean;
  priority: string; // 'low', 'normal', 'high', 'urgent'
  created_at: string;
  read_at?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total?: number;
  page?: number;
  totalPages?: number;
}

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get("/notifications/count");
  return response.data.count;
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await api.get("/notifications/unread");
  return response.data.notifications;
};

/**
 * Get all notifications with pagination
 */
export const getAllNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<NotificationResponse> => {
  const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<Notification> => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data.notification;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<number> => {
  const response = await api.put("/notifications/mark-all-read");
  return response.data.count;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: number
): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

/**
 * Clear all read notifications
 */
export const clearReadNotifications = async (): Promise<number> => {
  const response = await api.delete("/notifications/clear-read");
  return response.data.count;
};

export default api;
