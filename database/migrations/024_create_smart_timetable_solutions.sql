-- Migration: Create smart_timetable_solutions table
-- Description: Store AI-generated timetable solutions with complete metadata

CREATE TABLE IF NOT EXISTS smart_timetable_solutions (
    id SERIAL PRIMARY KEY,
    solution_id VARCHAR(255) UNIQUE NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Solution details
    solution_name VARCHAR(255) NOT NULL,
    optimization_type VARCHAR(50) NOT NULL, -- 'teacher-focused', 'student-focused', 'balanced'
    overall_score DECIMAL(5,2) NOT NULL,
    conflicts INTEGER DEFAULT 0,
    
    -- Quality metrics (stored as JSONB for flexibility)
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Complete timetable data (all entries from the solution)
    timetable_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Additional metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Department and semester for filtering
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
    semester INTEGER,
    
    -- Audit fields
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_smart_solutions_solution_id ON smart_timetable_solutions(solution_id);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_institution ON smart_timetable_solutions(institution_name);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_academic_year ON smart_timetable_solutions(academic_year);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_optimization ON smart_timetable_solutions(optimization_type);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_department ON smart_timetable_solutions(department_id);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_semester ON smart_timetable_solutions(semester);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_created_by ON smart_timetable_solutions(created_by);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_created_at ON smart_timetable_solutions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_solutions_score ON smart_timetable_solutions(overall_score DESC);

-- Add constraints
ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_solution_name_not_empty 
CHECK (LENGTH(TRIM(solution_name)) > 0);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_institution_not_empty 
CHECK (LENGTH(TRIM(institution_name)) > 0);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_academic_year_not_empty 
CHECK (LENGTH(TRIM(academic_year)) > 0);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_score_range 
CHECK (overall_score >= 0 AND overall_score <= 100);

ALTER TABLE smart_timetable_solutions 
ADD CONSTRAINT check_conflicts_non_negative 
CHECK (conflicts >= 0);

-- Add comment for documentation
COMMENT ON TABLE smart_timetable_solutions IS 'Stores AI-generated timetable solutions with complete metadata and entries';
COMMENT ON COLUMN smart_timetable_solutions.solution_id IS 'Unique identifier for the solution (e.g., teacher-optimized-1728480000000)';
COMMENT ON COLUMN smart_timetable_solutions.optimization_type IS 'Type of optimization: teacher-focused, student-focused, or balanced';
COMMENT ON COLUMN smart_timetable_solutions.quality_metrics IS 'JSON object containing overall_score, teacher_satisfaction, student_satisfaction, resource_utilization';
COMMENT ON COLUMN smart_timetable_solutions.timetable_entries IS 'JSON array containing all schedule entries with day, time, course, teacher, room details';
COMMENT ON COLUMN smart_timetable_solutions.metadata IS 'JSON object containing total_classes, teachers_involved, rooms_used, conflicts_resolved';
