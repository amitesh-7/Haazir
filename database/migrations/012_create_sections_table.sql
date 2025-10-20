-- Migration: 012_create_sections_table
-- Purpose: Create sections table to manage department sections dynamically
-- Notes:
-- - Each department can have multiple sections
-- - Section names can be customized (A, B, Morning, Evening, etc.)
-- - Foreign key relationship with departments table

CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE(department_id, section_name)
);

-- Create index for faster queries
CREATE INDEX idx_sections_department_id ON sections(department_id);

-- Insert some default sections for existing departments
-- INSERT INTO sections (department_id, section_name, description) 
-- SELECT department_id, 'A', 'Section A' FROM departments
-- UNION ALL
-- SELECT department_id, 'B', 'Section B' FROM departments;