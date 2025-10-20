-- Add semester field to courses table
-- This allows courses to be semester-specific

ALTER TABLE Courses 
ADD COLUMN semester INTEGER;

-- Add constraint to ensure semester is between 1 and 8
ALTER TABLE Courses 
ADD CONSTRAINT check_semester_range 
CHECK (semester >= 1 AND semester <= 8);

-- Add index for better performance when filtering by semester
CREATE INDEX idx_courses_semester ON Courses(semester);

-- Add composite index for department and semester filtering
CREATE INDEX idx_courses_dept_semester ON Courses(department_id, semester);