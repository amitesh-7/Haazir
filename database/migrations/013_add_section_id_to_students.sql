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