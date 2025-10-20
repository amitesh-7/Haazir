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