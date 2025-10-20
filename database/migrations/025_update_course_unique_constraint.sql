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
