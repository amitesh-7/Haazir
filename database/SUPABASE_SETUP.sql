-- ==========================================
-- HAAZIR SUPABASE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension (useful for future)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if you want a fresh start (CAREFUL!)
-- Uncomment the following lines ONLY if you want to reset everything
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS smart_attendance_records CASCADE;
-- DROP TABLE IF EXISTS smart_attendance_sessions CASCADE;
-- DROP TABLE IF EXISTS student_face_encodings CASCADE;
-- DROP TABLE IF EXISTS timetable CASCADE;
-- DROP TABLE IF EXISTS saved_timetables CASCADE;
-- DROP TABLE IF EXISTS student_courses CASCADE;
-- DROP TABLE IF EXISTS teacher_courses CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS teachers CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS sections CASCADE;
-- DROP TABLE IF EXISTS batches CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coordinator', 'teacher', 'student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    batch_id SERIAL PRIMARY KEY,
    batch_name VARCHAR(50) NOT NULL UNIQUE,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    section_id SERIAL PRIMARY KEY,
    section_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE (section_name, department_id, semester)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    section_id INT,
    batch_id INT,
    semester INT DEFAULT 1,
    contact_number VARCHAR(20),
    parent_name VARCHAR(255),
    parent_contact VARCHAR(20),
    address TEXT,
    profile_photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    contact_number VARCHAR(20),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    semester INT,
    credits INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE (course_code, department_id)
);

-- Teacher-Courses mapping table
CREATE TABLE IF NOT EXISTS teacher_courses (
    id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE (teacher_id, course_id)
);

-- Student-Courses enrollment table
CREATE TABLE IF NOT EXISTS student_courses (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id)
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
    schedule_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    section_id INT,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(50),
    class_type VARCHAR(20) DEFAULT 'lecture' CHECK (class_type IN ('lecture', 'lab', 'tutorial')),
    target_audience VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL
);

-- Saved Timetables table
CREATE TABLE IF NOT EXISTS saved_timetables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    semester INT NOT NULL,
    section_id INT,
    timetable_data JSONB NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('present', 'absent', 'late')),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES timetable(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE (schedule_id, student_id, date)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- SMART ATTENDANCE TABLES
-- ==========================================

-- Student Face Encodings table
CREATE TABLE IF NOT EXISTS student_face_encodings (
    encoding_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    encoding_data JSONB NOT NULL,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Smart Attendance Sessions table
CREATE TABLE IF NOT EXISTS smart_attendance_sessions (
    session_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    qr_expires_at TIMESTAMP NOT NULL,
    class_photo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES timetable(schedule_id) ON DELETE CASCADE
);

-- Smart Attendance Records table
CREATE TABLE IF NOT EXISTS smart_attendance_records (
    record_id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    attendance_method VARCHAR(20) CHECK (attendance_method IN ('qr_code', 'face_recognition', 'manual')),
    confidence_score DECIMAL(5,2),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES smart_attendance_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE (session_id, student_id)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_teachers_dept ON teachers(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_timetable_course ON timetable(course_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_section ON timetable(section_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable(day_of_week);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_sessions_schedule ON smart_attendance_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_smart_records_session ON smart_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_smart_records_student ON smart_attendance_records(student_id);

-- ==========================================
-- SAMPLE DATA (Optional - for testing)
-- ==========================================

-- Insert sample department
INSERT INTO departments (name) VALUES ('Computer Science') ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (name) VALUES ('Electronics') ON CONFLICT (name) DO NOTHING;

-- Insert sample batch
INSERT INTO batches (batch_name, start_year, end_year) VALUES ('2021-2025', 2021, 2025) ON CONFLICT (batch_name) DO NOTHING;

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================

SELECT 'Database setup completed successfully!' AS message;
