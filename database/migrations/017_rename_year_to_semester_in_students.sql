-- Migration: 017_rename_year_to_semester_in_students
-- Purpose: Rename 'year' column to 'semester' in students table for better academic alignment
-- Notes:
-- - SQLite doesn't support RENAME COLUMN directly, so we use a more compatible approach
-- - PostgreSQL supports ALTER TABLE ... RENAME COLUMN directly

-- For PostgreSQL (comment out for SQLite)
-- ALTER TABLE students RENAME COLUMN year TO semester;

-- For SQLite and cross-database compatibility:
-- Step 1: Add new semester column
ALTER TABLE students ADD COLUMN semester INTEGER;

-- Step 2: Copy data from year to semester column
UPDATE students SET semester = year WHERE year IS NOT NULL;

-- Step 3: Add constraint to ensure semester is between 1 and 8
-- Note: SQLite doesn't support adding constraints to existing tables easily
-- This constraint should be added in application logic for SQLite
-- For PostgreSQL, you can uncomment the following:
-- ALTER TABLE students ADD CONSTRAINT check_semester_range_students CHECK (semester >= 1 AND semester <= 8);

-- Step 4: Create index for better performance when filtering by semester
CREATE INDEX idx_students_semester ON students(semester);

-- Step 5: Drop the old year column (uncomment when ready to fully migrate)
-- Note: SQLite doesn't support DROP COLUMN directly
-- For PostgreSQL: ALTER TABLE students DROP COLUMN year;
-- For SQLite: This requires recreating the table, which is more complex

-- Temporary: Keep both columns during transition period
-- You can drop the year column later once all application code is updated