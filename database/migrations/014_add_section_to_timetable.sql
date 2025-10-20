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