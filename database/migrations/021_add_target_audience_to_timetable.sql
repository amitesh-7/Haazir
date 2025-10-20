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