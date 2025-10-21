-- ==========================================
-- Migration: 001_create_users.sql
-- ==========================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coordinator', 'teacher', 'student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Migration: 002_create_departments.sql
-- ==========================================

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- ==========================================
-- Migration: 003_create_students.sql
-- ==========================================

CREATE TABLE Students (
    student_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

-- ==========================================
-- Migration: 004_create_teachers.sql
-- ==========================================

CREATE TABLE Teachers (
    teacher_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

-- ==========================================
-- Migration: 005_create_courses.sql
-- ==========================================

CREATE TABLE Courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE
);

-- ==========================================
-- Migration: 006_create_timetable.sql
-- ==========================================

CREATE TABLE Timetable (
    schedule_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE CASCADE
);

-- ==========================================
-- Migration: 007_create_attendance.sql
-- ==========================================

CREATE TABLE Attendance (
    attendance_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('present', 'absent')),
    FOREIGN KEY (schedule_id) REFERENCES Timetable(schedule_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
);

-- ==========================================
-- Migration: 008_alter_students_add_profile_fields.sql
-- ==========================================

-- Migration: 008_alter_students_add_profile_fields
-- Purpose: Add year and personal info fields to students table for production DBs
-- Notes:
-- - SQLite prior to 3.35 has limited ALTER TABLE support; we use simple ADD COLUMNs which are supported
-- - Columns are added as NULLable to avoid issues with existing rows
-- - For Postgres/MySQL, the same ADD COLUMN statements work; adjust types as needed

-- SQLite / Postgres-compatible
ALTER TABLE students ADD COLUMN year INTEGER;
ALTER TABLE students ADD COLUMN contact_number TEXT;
ALTER TABLE students ADD COLUMN parent_name TEXT;
ALTER TABLE students ADD COLUMN parent_contact TEXT;
ALTER TABLE students ADD COLUMN address TEXT;

-- Optional: backfill defaults if desired
-- UPDATE students SET year = 1 WHERE year IS NULL;

-- If you need NOT NULL constraints in Postgres, run:
-- ALTER TABLE students ALTER COLUMN year SET NOT NULL;


-- ==========================================
-- Migration: 009_add_classroom_to_timetable.sql
-- ==========================================

-- Migration: 009_add_classroom_to_timetable
-- Purpose: Add classroom field to timetable table as mentioned in the blueprint
-- This allows coordinators to assign specific classrooms to scheduled classes

-- Add classroom column to timetable table
ALTER TABLE timetable ADD COLUMN classroom VARCHAR(50);

-- Create index for better performance when checking classroom conflicts
CREATE INDEX IF NOT EXISTS idx_timetable_classroom_day ON timetable(classroom, day_of_week);

-- Optional: Update existing records with sample classrooms (for demo purposes)
-- UPDATE timetable SET classroom = 'Room ' || (schedule_id % 10 + 1) || (CASE 
--     WHEN course_id IN (SELECT course_id FROM courses WHERE course_code LIKE 'CS%') THEN 'A'
--     WHEN course_id IN (SELECT course_id FROM courses WHERE course_code LIKE 'ME%') THEN 'B'
--     ELSE 'C'
-- END) WHERE classroom IS NULL;

-- ==========================================
-- Migration: 010_create_student_courses.sql
-- ==========================================

-- Create student_courses junction table for many-to-many relationship between students and courses
CREATE TABLE IF NOT EXISTS student_courses (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (student_id, course_id),
    
    CONSTRAINT fk_student_courses_student 
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_courses_course 
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);

-- ==========================================
-- Migration: 011_add_section_to_students.sql
-- ==========================================

-- Migration: 011_add_section_to_students
-- Purpose: Add section field to students table to support sections like "A", "B", "C"
-- Notes:
-- - SQLite and Postgres compatible
-- - Section field allows for department subdivisions (e.g., CSE A, CSE B)

-- Add section column to students table
ALTER TABLE students ADD COLUMN section VARCHAR(10);

-- Optional: Update existing students with default section 'A'
-- UPDATE students SET section = 'A' WHERE section IS NULL;

-- Note: For production systems, you might want to make this NOT NULL after backfilling

-- ==========================================
-- Migration: 012_add_semester_to_courses.sql
-- ==========================================

-- Add semester field to courses table
-- This allows courses to be semester-specific

ALTER TABLE Courses 
ADD COLUMN semester INTEGER;

-- Add constraint to ensure semester is between 1 and 8
ALTER TABLE Courses 
ADD CONSTRAINT check_semester_range 
CHECK (semester >= 1 AND semester <= 8);

-- Add index for better performance when filtering by semester
CREATE INDEX idx_courses_semester ON Courses(semester);

-- Add composite index for department and semester filtering
CREATE INDEX idx_courses_dept_semester ON Courses(department_id, semester);

-- ==========================================
-- Migration: 012_create_sections_table.sql
-- ==========================================

-- Migration: 012_create_sections_table
-- Purpose: Create sections table to manage department sections dynamically
-- Notes:
-- - Each department can have multiple sections
-- - Section names can be customized (A, B, Morning, Evening, etc.)
-- - Foreign key relationship with departments table

CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE(department_id, section_name)
);

-- Create index for faster queries
CREATE INDEX idx_sections_department_id ON sections(department_id);

-- Insert some default sections for existing departments
-- INSERT INTO sections (department_id, section_name, description) 
-- SELECT department_id, 'A', 'Section A' FROM departments
-- UNION ALL
-- SELECT department_id, 'B', 'Section B' FROM departments;

-- ==========================================
-- Migration: 013_add_section_id_to_students.sql
-- ==========================================

-- Migration: 013_add_section_id_to_students
-- Purpose: Add section_id foreign key to students table, replacing the section string field
-- Notes:
-- - Adds proper foreign key relationship to sections table
-- - Keeps the old section field for backward compatibility during transition

ALTER TABLE students ADD COLUMN section_id INTEGER;

-- Add foreign key constraint
ALTER TABLE students ADD CONSTRAINT fk_students_section_id 
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_students_section_id ON students(section_id);

-- ==========================================
-- Migration: 014_add_section_to_timetable.sql
-- ==========================================

-- Migration: 014_add_section_to_timetable
-- Purpose: Add section_id field to timetable table to support section-specific schedules
-- This allows different sections of the same course to have different timetables

-- Add section_id column to timetable table
ALTER TABLE timetable ADD COLUMN section_id INT;

-- Create foreign key constraint to sections table
ALTER TABLE timetable ADD CONSTRAINT fk_timetable_section 
  FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;

-- Create index for better performance when filtering by section
CREATE INDEX IF NOT EXISTS idx_timetable_section_id ON timetable(section_id);

-- Create composite index for section and day filtering
CREATE INDEX IF NOT EXISTS idx_timetable_section_day ON timetable(section_id, day_of_week);

-- ==========================================
-- Migration: 015_add_semester_to_sections.sql
-- ==========================================

-- Migration: 015_add_semester_to_sections
-- Purpose: Add semester field to sections table to support semester-specific sections
-- This allows sections to be organized by semester (1st Sem, 2nd Sem, etc.)

-- Add semester column to sections table
ALTER TABLE sections ADD COLUMN semester INTEGER;

-- Add a check constraint to ensure semester is between 1 and 8 (typical engineering semesters)
ALTER TABLE sections ADD CONSTRAINT chk_semester_range CHECK (semester >= 1 AND semester <= 8);

-- Create index for better performance when filtering by semester
CREATE INDEX IF NOT EXISTS idx_sections_semester ON sections(semester);

-- Create composite index for department, semester, and section filtering
CREATE INDEX IF NOT EXISTS idx_sections_dept_semester ON sections(department_id, semester);

-- Update existing sections to have semester 1 as default (can be updated later)
UPDATE sections SET semester = 1 WHERE semester IS NULL;

-- ==========================================
-- Migration: 016_create_saved_timetables.sql
-- ==========================================

-- Migration: Create saved_timetables table
-- Description: Table to store saved timetable configurations that can be shared across users

CREATE TABLE IF NOT EXISTS saved_timetables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL DEFAULT 'all',
    department VARCHAR(255) NOT NULL DEFAULT 'all',
    section VARCHAR(255) NOT NULL DEFAULT 'all',
    entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    grid_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_timetables_semester ON saved_timetables(semester);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_department ON saved_timetables(department);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_section ON saved_timetables(section);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_created_by ON saved_timetables(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_created_at ON saved_timetables(created_at);

-- Add constraint to ensure name is not empty
ALTER TABLE saved_timetables ADD CONSTRAINT check_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

-- ==========================================
-- Migration: 017_rename_year_to_semester_in_students.sql
-- ==========================================

-- Migration: 017_rename_year_to_semester_in_students
-- Purpose: Rename 'year' column to 'semester' in students table for better academic alignment
-- Notes:
-- - SQLite doesn't support RENAME COLUMN directly, so we use a more compatible approach
-- - PostgreSQL supports ALTER TABLE ... RENAME COLUMN directly

-- For PostgreSQL (comment out for SQLite)
-- ALTER TABLE students RENAME COLUMN year TO semester;

-- For SQLite and cross-database compatibility:
-- Step 1: Add new semester column
ALTER TABLE students ADD COLUMN semester INTEGER;

-- Step 2: Copy data from year to semester column
UPDATE students SET semester = year WHERE year IS NOT NULL;

-- Step 3: Add constraint to ensure semester is between 1 and 8
-- Note: SQLite doesn't support adding constraints to existing tables easily
-- This constraint should be added in application logic for SQLite
-- For PostgreSQL, you can uncomment the following:
-- ALTER TABLE students ADD CONSTRAINT check_semester_range_students CHECK (semester >= 1 AND semester <= 8);

-- Step 4: Create index for better performance when filtering by semester
CREATE INDEX idx_students_semester ON students(semester);

-- Step 5: Drop the old year column (uncomment when ready to fully migrate)
-- Note: SQLite doesn't support DROP COLUMN directly
-- For PostgreSQL: ALTER TABLE students DROP COLUMN year;
-- For SQLite: This requires recreating the table, which is more complex

-- Temporary: Keep both columns during transition period
-- You can drop the year column later once all application code is updated

-- ==========================================
-- Migration: 018_create_batches_table.sql
-- ==========================================

-- Migration: 018_create_batches_table
-- Purpose: Create batches table for tutorial and practical class divisions
-- Notes:
-- - Each section can have multiple batches for tutorials/practicals
-- - Batch names can be customized (Batch 1, Batch A, Group 1, etc.)
-- - Foreign key relationship with sections table

CREATE TABLE batches (
    batch_id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL,
    batch_name VARCHAR(50) NOT NULL,
    batch_size INTEGER DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    UNIQUE(section_id, batch_name)
);

-- Create index for faster queries
CREATE INDEX idx_batches_section_id ON batches(section_id);

-- Add batch_id column to timetable for tutorial/practical classes
ALTER TABLE timetable ADD COLUMN batch_id INTEGER;
ALTER TABLE timetable ADD FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL;

-- Create index for batch queries in timetable
CREATE INDEX idx_timetable_batch_id ON timetable(batch_id);

-- Insert some default batches for existing sections
-- This will create 3 batches for each existing section
INSERT INTO batches (section_id, batch_name, description) 
SELECT section_id, 'Batch 1', 'Batch 1 for tutorials and practicals' FROM sections
UNION ALL
SELECT section_id, 'Batch 2', 'Batch 2 for tutorials and practicals' FROM sections
UNION ALL
SELECT section_id, 'Batch 3', 'Batch 3 for tutorials and practicals' FROM sections;

-- ==========================================
-- Migration: 019_add_class_type_to_timetable.sql
-- ==========================================

-- Migration: Add class_type column to timetable table
-- This field stores whether the class is a lecture, lab, or tutorial

ALTER TABLE timetable 
ADD COLUMN class_type VARCHAR(20) DEFAULT 'lecture' CHECK (class_type IN ('lecture', 'lab', 'tutorial'));

-- Update existing records to have 'lecture' as default
UPDATE timetable SET class_type = 'lecture' WHERE class_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE timetable 
ALTER COLUMN class_type SET NOT NULL;

-- ==========================================
-- Migration: 020_create_notifications.sql
-- ==========================================

-- Create notifications table for real-time student notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(50) NOT NULL DEFAULT 'student',
    type VARCHAR(50) NOT NULL, -- 'attendance_absent', 'attendance_warning', 'grade_update', 'announcement', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_data JSONB, -- Store additional context like course_id, date, etc.
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
    -- Note: Foreign key removed for compatibility. User IDs are validated at application level.
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create composite index for common queries (unread notifications for a user)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores all user notifications including attendance alerts, grades, announcements';
COMMENT ON COLUMN notifications.type IS 'Type of notification: attendance_absent, attendance_warning, grade_update, announcement, etc.';
COMMENT ON COLUMN notifications.related_data IS 'JSON object with context like {course_id, date, attendance_id, etc.}';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';


-- ==========================================
-- Migration: 020_create_teacher_courses_table.sql
-- ==========================================

-- Migration: Create teacher_courses junction table for many-to-many relationship
-- This separates teacher-course assignments from actual timetable schedules

CREATE TABLE IF NOT EXISTS teacher_courses (
  teacher_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_id, course_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher ON teacher_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course ON teacher_courses(course_id);

-- Migrate existing placeholder timetable entries (00:00-00:00) to teacher_courses table
-- These are assignments, not actual schedules
INSERT INTO teacher_courses (teacher_id, course_id, created_at, updated_at)
SELECT DISTINCT 
  teacher_id, 
  course_id,
  created_at,
  updated_at
FROM timetable
WHERE start_time = '00:00' AND end_time = '00:00'
ON CONFLICT (teacher_id, course_id) DO NOTHING;

-- Remove placeholder entries from timetable (keep only actual schedules)
-- Comment out the DELETE if you want to review data first
DELETE FROM timetable 
WHERE start_time = '00:00' AND end_time = '00:00' AND classroom = 'TBD';

-- Add comment to table
COMMENT ON TABLE teacher_courses IS 'Junction table for teacher-course assignments (many-to-many relationship). Actual class schedules are stored in the timetable table.';


-- ==========================================
-- Migration: 021_add_target_audience_to_timetable.sql
-- ==========================================

-- Migration: Add target_audience column to timetable table
-- Purpose: Add target_audience field to support section vs batch-level classes
-- This field indicates whether a class is for an entire section or specific batches

-- Add target_audience column to timetable table
ALTER TABLE timetable 
ADD COLUMN target_audience VARCHAR(20) DEFAULT 'Section' CHECK (target_audience IN ('Section', 'Batch'));

-- Update existing records to have 'Section' as default
UPDATE timetable SET target_audience = 'Section' WHERE target_audience IS NULL;

-- Create index for better performance when filtering by target audience
CREATE INDEX IF NOT EXISTS idx_timetable_target_audience ON timetable(target_audience);

-- Create composite index for section and target audience filtering
CREATE INDEX IF NOT EXISTS idx_timetable_section_target ON timetable(section_id, target_audience);

-- ==========================================
-- Migration: 022_create_timetable_system.sql
-- ==========================================

-- Migration: Create timetable generation requests table
-- This table tracks timetable generation requests by coordinators

CREATE TABLE timetable_requests (
    request_id SERIAL PRIMARY KEY,
    request_name VARCHAR(100) NOT NULL, -- 'CSE Semester 3 - Oct 2025'
    department_id INTEGER REFERENCES departments(department_id),
    semester INTEGER NOT NULL,
    sections TEXT[] NOT NULL, -- Array of section names ['A', 'B', 'C']
    academic_year VARCHAR(20) NOT NULL, -- '2024-25'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'generating', 'generated', 'approved', 'active'
    settings JSONB, -- Configuration settings for generation
    created_by INTEGER REFERENCES users(user_id),
    approved_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- Create course sessions table for timetable planning
CREATE TABLE course_sessions (
    session_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES timetable_requests(request_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id),
    section VARCHAR(10) NOT NULL,
    session_type VARCHAR(20) NOT NULL, -- 'theory', 'lab', 'tutorial'
    sessions_per_week INTEGER NOT NULL DEFAULT 1,
    session_duration INTEGER NOT NULL DEFAULT 1, -- Duration in time slots
    teacher_id INTEGER REFERENCES teachers(teacher_id),
    room_preference VARCHAR(100), -- 'Lab-1', 'Classroom-A'
    special_requirements TEXT, -- 'Projector needed', 'Computer lab required'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create generated timetables table
CREATE TABLE generated_timetables (
    timetable_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES timetable_requests(request_id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    day_of_week VARCHAR(10) NOT NULL, -- 'monday', 'tuesday', etc.
    slot_id INTEGER REFERENCES time_slots(slot_id),
    course_id INTEGER REFERENCES courses(course_id),
    session_type VARCHAR(20) NOT NULL, -- 'theory', 'lab', 'tutorial'
    teacher_id INTEGER REFERENCES teachers(teacher_id),
    room_assignment VARCHAR(100),
    week_type VARCHAR(20) DEFAULT 'all', -- 'all', 'odd', 'even' for alternating weeks
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_timetable_requests_dept_sem ON timetable_requests(department_id, semester);
CREATE INDEX idx_timetable_requests_status ON timetable_requests(status);
CREATE INDEX idx_course_sessions_request ON course_sessions(request_id);
CREATE INDEX idx_course_sessions_teacher ON course_sessions(teacher_id);
CREATE INDEX idx_generated_timetables_request ON generated_timetables(request_id);
CREATE INDEX idx_generated_timetables_schedule ON generated_timetables(department_id, semester, section, day_of_week);
CREATE INDEX idx_generated_timetables_teacher ON generated_timetables(teacher_id, day_of_week, slot_id);

-- Add constraints
ALTER TABLE course_sessions ADD CONSTRAINT chk_session_type 
    CHECK (session_type IN ('theory', 'lab', 'tutorial'));
    
ALTER TABLE generated_timetables ADD CONSTRAINT chk_day_of_week 
    CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'));
    
ALTER TABLE generated_timetables ADD CONSTRAINT chk_session_type_gen 
    CHECK (session_type IN ('theory', 'lab', 'tutorial'));

-- ==========================================
-- Migration: 023_add_batch_id_to_students.sql
-- ==========================================

-- Migration: 023_add_batch_id_to_students
-- Purpose: Add batch_id to students table for student-batch relationship
-- Notes:
-- - Students can be assigned to batches within their sections
-- - batch_id is optional (nullable) to allow students without batch assignment
-- - Foreign key constraint ensures referential integrity

-- Add batch_id column to students table
ALTER TABLE students ADD COLUMN batch_id INTEGER;

-- Add foreign key constraint
ALTER TABLE students ADD CONSTRAINT fk_students_batch_id 
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_students_batch_id ON students(batch_id);

-- Create composite index for section and batch queries
CREATE INDEX idx_students_section_batch ON students(section_id, batch_id);

-- Update existing students to have no batch assignment initially
-- (batch_id will be NULL by default)

-- ==========================================
-- Migration: 023_create_smart_attendance_tables.sql
-- ==========================================

-- Migration 023: Create Smart Attendance System Tables
-- This includes QR sessions, face recognition, and smart attendance tracking

-- 1. Attendance Sessions (QR Code Sessions)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  session_id VARCHAR(100) PRIMARY KEY,
  schedule_id INT NOT NULL,
  teacher_id INT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  qr_token TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, completed
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES timetable(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

-- 2. Student Face Embeddings (Pre-registered faces)
CREATE TABLE IF NOT EXISTS student_faces (
  face_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  face_descriptor TEXT NOT NULL, -- JSON array of 128 floats
  image_url TEXT,
  registered_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 3. Student Scan Records (QR scan + face capture)
CREATE TABLE IF NOT EXISTS student_scan_records (
  scan_id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  student_id INT NOT NULL,
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  face_image_url TEXT,
  face_descriptor TEXT, -- JSON array
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  distance_from_class DECIMAL(10, 2), -- meters
  face_match_confidence DECIMAL(5, 4), -- 0-1
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  rejection_reason TEXT,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  UNIQUE(session_id, student_id)
);

-- 4. Teacher Class Captures (Bulk face detection)
CREATE TABLE IF NOT EXISTS teacher_class_captures (
  capture_id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  capture_timestamp TIMESTAMP DEFAULT NOW(),
  image_url TEXT NOT NULL,
  detected_faces_count INT DEFAULT 0,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE
);

-- 5. Detected Faces from Teacher Capture
CREATE TABLE IF NOT EXISTS detected_class_faces (
  detection_id SERIAL PRIMARY KEY,
  capture_id INT NOT NULL,
  face_descriptor TEXT, -- JSON array
  face_bbox JSON, -- bounding box {x, y, width, height}
  matched_student_id INT,
  confidence DECIMAL(5, 4),
  FOREIGN KEY (capture_id) REFERENCES teacher_class_captures(capture_id) ON DELETE CASCADE,
  FOREIGN KEY (matched_student_id) REFERENCES students(student_id) ON DELETE SET NULL
);

-- 6. Smart Attendance Records (Final attendance)
CREATE TABLE IF NOT EXISTS smart_attendance_records (
  record_id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  student_id INT NOT NULL,
  schedule_id INT NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present', -- present, absent
  verified_by_scan BOOLEAN DEFAULT false,
  verified_by_class_photo BOOLEAN DEFAULT false,
  manually_marked BOOLEAN DEFAULT false,
  marked_by_teacher_id INT,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES timetable(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by_teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  UNIQUE(session_id, student_id)
);

-- 7. Notifications Log
CREATE TABLE IF NOT EXISTS attendance_notifications (
  notification_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- absent_alert, final_reminder
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_schedule ON attendance_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_student_faces_student ON student_faces(student_id);
CREATE INDEX IF NOT EXISTS idx_student_faces_active ON student_faces(is_active);
CREATE INDEX IF NOT EXISTS idx_scan_records_session ON student_scan_records(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_student ON student_scan_records(student_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_status ON student_scan_records(status);
CREATE INDEX IF NOT EXISTS idx_class_captures_session ON teacher_class_captures(session_id);
CREATE INDEX IF NOT EXISTS idx_detected_faces_capture ON detected_class_faces(capture_id);
CREATE INDEX IF NOT EXISTS idx_detected_faces_student ON detected_class_faces(matched_student_id);
CREATE INDEX IF NOT EXISTS idx_smart_attendance_session ON smart_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_smart_attendance_student ON smart_attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_smart_attendance_schedule_date ON smart_attendance_records(schedule_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON attendance_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON attendance_notifications(session_id);

-- Comments
COMMENT ON TABLE attendance_sessions IS 'QR code sessions for smart attendance';
COMMENT ON TABLE student_faces IS 'Pre-registered student face embeddings for verification';
COMMENT ON TABLE student_scan_records IS 'Records of student QR scans with face verification';
COMMENT ON TABLE teacher_class_captures IS 'Photos captured by teacher during class';
COMMENT ON TABLE detected_class_faces IS 'Faces detected in teacher class photos';
COMMENT ON TABLE smart_attendance_records IS 'Final attendance records after cross-verification';
COMMENT ON TABLE attendance_notifications IS 'Notifications sent to students about attendance';


-- ==========================================
-- Migration: 024_create_smart_timetable_solutions.sql
-- ==========================================

-- Migration: Create smart_timetable_solutions table
-- Description: Store AI-generated timetable solutions with complete metadata

CREATE TABLE IF NOT EXISTS smart_timetable_solutions (
    id SERIAL PRIMARY KEY,
    solution_id VARCHAR(255) UNIQUE NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Solution details
    solution_name VARCHAR(255) NOT NULL,
    optimization_type VARCHAR(50) NOT NULL, -- 'teacher-focused', 'student-focused', 'balanced'
    overall_score DECIMAL(5,2) NOT NULL,
    conflicts INTEGER DEFAULT 0,
    
    -- Quality metrics (stored as JSONB for flexibility)
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Complete timetable data (all entries from the solution)
    timetable_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Additional metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Department and semester for filtering
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
    semester INTEGER,
    
    -- Audit fields
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_smart_solutions_solution_id ON smart_timetable_solutions(solution_id);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_institution ON smart_timetable_solutions(institution_name);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_academic_year ON smart_timetable_solutions(academic_year);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_optimization ON smart_timetable_solutions(optimization_type);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_department ON smart_timetable_solutions(department_id);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_semester ON smart_timetable_solutions(semester);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_created_by ON smart_timetable_solutions(created_by);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_created_at ON smart_timetable_solutions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_score ON smart_timetable_solutions(overall_score DESC);

-- Add constraints
ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_solution_name_not_empty 
CHECK (LENGTH(TRIM(solution_name)) > 0);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_institution_not_empty 
CHECK (LENGTH(TRIM(institution_name)) > 0);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_academic_year_not_empty 
CHECK (LENGTH(TRIM(academic_year)) > 0);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_score_range 
CHECK (overall_score >= 0 AND overall_score <= 100);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_conflicts_non_negative 
CHECK (conflicts >= 0);

-- Add comment for documentation
COMMENT ON TABLE smart_timetable_solutions IS 'Stores AI-generated timetable solutions with complete metadata and entries';
COMMENT ON COLUMN smart_timetable_solutions.solution_id IS 'Unique identifier for the solution (e.g., teacher-optimized-1728480000000)';
COMMENT ON COLUMN smart_timetable_solutions.optimization_type IS 'Type of optimization: teacher-focused, student-focused, or balanced';
COMMENT ON COLUMN smart_timetable_solutions.quality_metrics IS 'JSON object containing overall_score, teacher_satisfaction, student_satisfaction, resource_utilization';
COMMENT ON COLUMN smart_timetable_solutions.timetable_entries IS 'JSON array containing all schedule entries with day, time, course, teacher, room details';
COMMENT ON COLUMN smart_timetable_solutions.metadata IS 'JSON object containing total_classes, teachers_involved, rooms_used, conflicts_resolved';


-- ==========================================
-- Migration: 024_fix_sections_unique_constraint.sql
-- ==========================================

-- Migration: 024_fix_sections_unique_constraint
-- Purpose: Update unique constraint on sections table to include semester
-- This allows same section name to exist in different semesters within same department
-- Example: Section A can exist in Semester 1, 2, 3, etc.

-- Drop both old and new constraints to ensure clean state
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_department_id_section_name_key;
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_dept_name_semester_unique;

-- Create new unique constraint including semester
-- This ensures uniqueness based on (department_id, section_name, semester)
ALTER TABLE sections ADD CONSTRAINT sections_dept_name_semester_unique 
    UNIQUE (department_id, section_name, semester);

-- Note: This allows:
-- âœ… Section A - Semester 1
-- âœ… Section A - Semester 2
-- âœ… Section A - Semester 3
-- But prevents:
-- âŒ Duplicate Section A - Semester 1 in same department


-- ==========================================
-- Migration: 025_update_course_unique_constraint.sql
-- ==========================================

-- Migration: 025_update_course_unique_constraint
-- Purpose: Allow same course code in different departments
-- Changes the unique constraint from course_code only to (course_code, department_id)

-- Drop the old unique constraint on course_code
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_course_code_key;

-- Drop the old index if it exists
DROP INDEX IF EXISTS courses_course_code_key;

-- Create a new composite unique constraint on (course_code, department_id)
-- This allows the same course code to exist in different departments
CREATE UNIQUE INDEX unique_course_per_department 
ON courses (course_code, department_id);

-- Add comment explaining the constraint
COMMENT ON INDEX unique_course_per_department IS 'Ensures course code is unique within each department, allowing same course to be taught in multiple departments';



