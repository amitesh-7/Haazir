-- Migration: Add class_type column to timetable table
-- This field stores whether the class is a lecture, lab, or tutorial

ALTER TABLE timetable 
ADD COLUMN class_type VARCHAR(20) DEFAULT 'lecture' CHECK (class_type IN ('lecture', 'lab', 'tutorial'));

-- Update existing records to have 'lecture' as default
UPDATE timetable SET class_type = 'lecture' WHERE class_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE timetable 
ALTER COLUMN class_type SET NOT NULL;