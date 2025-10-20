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
-- ✅ Section A - Semester 1
-- ✅ Section A - Semester 2
-- ✅ Section A - Semester 3
-- But prevents:
-- ❌ Duplicate Section A - Semester 1 in same department
