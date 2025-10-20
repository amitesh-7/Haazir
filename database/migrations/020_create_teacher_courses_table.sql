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
