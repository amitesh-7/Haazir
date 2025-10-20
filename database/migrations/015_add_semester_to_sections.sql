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