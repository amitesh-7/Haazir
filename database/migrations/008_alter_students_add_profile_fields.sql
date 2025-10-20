-- Migration: 008_alter_students_add_profile_fields
-- Purpose: Add year and personal info fields to students table for production DBs
-- Notes:
-- - SQLite prior to 3.35 has limited ALTER TABLE support; we use simple ADD COLUMNs which are supported
-- - Columns are added as NULLable to avoid issues with existing rows
-- - For Postgres/MySQL, the same ADD COLUMN statements work; adjust types as needed

-- SQLite / Postgres-compatible
ALTER TABLE students ADD COLUMN year INTEGER;
ALTER TABLE students ADD COLUMN contact_number TEXT;
ALTER TABLE students ADD COLUMN parent_name TEXT;
ALTER TABLE students ADD COLUMN parent_contact TEXT;
ALTER TABLE students ADD COLUMN address TEXT;

-- Optional: backfill defaults if desired
-- UPDATE students SET year = 1 WHERE year IS NULL;

-- If you need NOT NULL constraints in Postgres, run:
-- ALTER TABLE students ALTER COLUMN year SET NOT NULL;
