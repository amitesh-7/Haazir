export type UserRole = 'student' | 'teacher' | 'coordinator';

export interface User {
    user_id: number;
    email: string;
    password_hash: string;
    role: UserRole;
}

export interface Department {
    department_id: number;
    name: string;
}

export interface Student {
    student_id: number;
    user_id: number;
    name: string;
    roll_number: string;
    department_id: number;
}

export interface Teacher {
    teacher_id: number;
    user_id: number;
    name: string;
    department_id: number;
}

export interface Course {
    course_id: number;
    course_code: string;
    course_name: string;
    department_id: number;
}

export interface Timetable {
    schedule_id: number;
    course_id: number;
    teacher_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

export interface Attendance {
    attendance_id: number;
    schedule_id: number;
    student_id: number;
    date: string;
    status: 'present' | 'absent';
}