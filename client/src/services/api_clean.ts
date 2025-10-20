import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types for API responses
interface AttendanceData {
  scheduleId: string;
  studentId: string;
  status: "present" | "absent" | "late";
  date: string;
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
export const fetchStudentAttendance = async (studentId: string) => {
  const response = await api.get(`/attendance/${studentId}`);
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

export const submitAttendance = async (attendanceData: AttendanceData) => {
  const response = await api.post("/attendance", attendanceData);
  return response.data;
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

// General API functions to prevent import errors
export const fetchAttendanceData = async () => {
  const response = await api.get("/attendance");
  return response.data;
};

export const getTimetable = async () => {
  const response = await api.get("/timetable");
  return response.data;
};

export const fetchAttendanceHistory = async () => {
  const response = await api.get("/attendance/history");
  return response.data;
};

export const getClasses = async () => {
  const response = await api.get("/classes");
  return response.data;
};

export const fetchTimetable = async () => {
  const response = await api.get("/timetable");
  return response.data;
};

export default api;
