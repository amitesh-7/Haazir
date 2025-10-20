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