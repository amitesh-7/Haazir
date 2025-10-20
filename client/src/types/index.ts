export interface User {
  userId: number;
  email: string;
  role: 'student' | 'teacher' | 'coordinator';
}

export interface Department {
  departmentId: number;
  name: string;
}

export interface Student {
  studentId: number;
  userId: number;
  name: string;
  rollNumber: string;
  departmentId: number;
}

export interface Teacher {
  teacher_id: number;
  name: string;
  department_name?: string;
  email?: string;
}

export interface Course {
  courseId: number;
  courseCode: string;
  courseName: string;
  departmentId: number;
}

export interface Timetable {
  scheduleId: number;
  courseId: number;
  teacherId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Attendance {
  attendanceId: number;
  scheduleId: number;
  studentId: number;
  date: string;
  status: 'present' | 'absent';
}