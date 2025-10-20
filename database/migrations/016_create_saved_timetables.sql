-- Migration: Create saved_timetables table
-- Description: Table to store saved timetable configurations that can be shared across users

CREATE TABLE IF NOT EXISTS saved_timetables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL DEFAULT 'all',
    department VARCHAR(255) NOT NULL DEFAULT 'all',
    section VARCHAR(255) NOT NULL DEFAULT 'all',
    entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    grid_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_timetables_semester ON saved_timetables(semester);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_department ON saved_timetables(department);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_section ON saved_timetables(section);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_created_by ON saved_timetables(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_created_at ON saved_timetables(created_at);

-- Add constraint to ensure name is not empty
ALTER TABLE saved_timetables ADD CONSTRAINT check_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);