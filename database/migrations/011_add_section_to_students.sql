-- Migration: 011_add_section_to_students
-- Purpose: Add section field to students table to support sections like "A", "B", "C"
-- Notes:
-- - SQLite and Postgres compatible
-- - Section field allows for department subdivisions (e.g., CSE A, CSE B)

-- Add section column to students table
ALTER TABLE students ADD COLUMN section VARCHAR(10);

-- Optional: Update existing students with default section 'A'
-- UPDATE students SET section = 'A' WHERE section IS NULL;

-- Note: For production systems, you might want to make this NOT NULL after backfilling