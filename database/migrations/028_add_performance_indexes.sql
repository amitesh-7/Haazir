-- Migration: Add Performance Indexes
-- Description: Adds indexes to frequently queried columns for better performance
-- Date: 2024-12-23

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date 
ON attendance(student_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_schedule_date 
ON attendance(schedule_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_date 
ON attendance(date);

-- Timetable table indexes
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_day 
ON timetable(teacher_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_timetable_course 
ON timetable(course_id);

CREATE INDEX IF NOT EXISTS idx_timetable_section 
ON timetable(section_id);

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_department_section 
ON students(department_id, section_id);

CREATE INDEX IF NOT EXISTS idx_students_batch 
ON students(batch_id);

CREATE INDEX IF NOT EXISTS idx_students_roll_number 
ON students(roll_number);

-- Smart attendance indexes
CREATE INDEX IF NOT EXISTS idx_smart_attendance_session 
ON smart_attendance_records(session_id);

CREATE INDEX IF NOT EXISTS idx_smart_attendance_student 
ON smart_attendance_records(student_id);

-- Teachers table indexes
CREATE INDEX IF NOT EXISTS idx_teachers_department 
ON teachers(department_id);

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_department 
ON courses(department_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications(user_id, is_read);

-- Comment: Run this migration to improve query performance
-- These indexes target the most common query patterns in the application
