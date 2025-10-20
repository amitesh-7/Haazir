-- Migration: 018_create_batches_table
-- Purpose: Create batches table for tutorial and practical class divisions
-- Notes:
-- - Each section can have multiple batches for tutorials/practicals
-- - Batch names can be customized (Batch 1, Batch A, Group 1, etc.)
-- - Foreign key relationship with sections table

CREATE TABLE batches (
    batch_id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL,
    batch_name VARCHAR(50) NOT NULL,
    batch_size INTEGER DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    UNIQUE(section_id, batch_name)
);

-- Create index for faster queries
CREATE INDEX idx_batches_section_id ON batches(section_id);

-- Add batch_id column to timetable for tutorial/practical classes
ALTER TABLE timetable ADD COLUMN batch_id INTEGER;
ALTER TABLE timetable ADD FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL;

-- Create index for batch queries in timetable
CREATE INDEX idx_timetable_batch_id ON timetable(batch_id);

-- Insert some default batches for existing sections
-- This will create 3 batches for each existing section
INSERT INTO batches (section_id, batch_name, description) 
SELECT section_id, 'Batch 1', 'Batch 1 for tutorials and practicals' FROM sections
UNION ALL
SELECT section_id, 'Batch 2', 'Batch 2 for tutorials and practicals' FROM sections
UNION ALL
SELECT section_id, 'Batch 3', 'Batch 3 for tutorials and practicals' FROM sections;