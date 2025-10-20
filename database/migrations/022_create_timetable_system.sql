-- Migration: Create timetable generation requests table
-- This table tracks timetable generation requests by coordinators

CREATE TABLE timetable_requests (
    request_id SERIAL PRIMARY KEY,
    request_name VARCHAR(100) NOT NULL, -- 'CSE Semester 3 - Oct 2025'
    department_id INTEGER REFERENCES departments(department_id),
    semester INTEGER NOT NULL,
    sections TEXT[] NOT NULL, -- Array of section names ['A', 'B', 'C']
    academic_year VARCHAR(20) NOT NULL, -- '2024-25'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'generating', 'generated', 'approved', 'active'
    settings JSONB, -- Configuration settings for generation
    created_by INTEGER REFERENCES users(user_id),
    approved_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- Create course sessions table for timetable planning
CREATE TABLE course_sessions (
    session_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES timetable_requests(request_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id),
    section VARCHAR(10) NOT NULL,
    session_type VARCHAR(20) NOT NULL, -- 'theory', 'lab', 'tutorial'
    sessions_per_week INTEGER NOT NULL DEFAULT 1,
    session_duration INTEGER NOT NULL DEFAULT 1, -- Duration in time slots
    teacher_id INTEGER REFERENCES teachers(teacher_id),
    room_preference VARCHAR(100), -- 'Lab-1', 'Classroom-A'
    special_requirements TEXT, -- 'Projector needed', 'Computer lab required'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create generated timetables table
CREATE TABLE generated_timetables (
    timetable_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES timetable_requests(request_id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    day_of_week VARCHAR(10) NOT NULL, -- 'monday', 'tuesday', etc.
    slot_id INTEGER REFERENCES time_slots(slot_id),
    course_id INTEGER REFERENCES courses(course_id),
    session_type VARCHAR(20) NOT NULL, -- 'theory', 'lab', 'tutorial'
    teacher_id INTEGER REFERENCES teachers(teacher_id),
    room_assignment VARCHAR(100),
    week_type VARCHAR(20) DEFAULT 'all', -- 'all', 'odd', 'even' for alternating weeks
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_timetable_requests_dept_sem ON timetable_requests(department_id, semester);
CREATE INDEX idx_timetable_requests_status ON timetable_requests(status);
CREATE INDEX idx_course_sessions_request ON course_sessions(request_id);
CREATE INDEX idx_course_sessions_teacher ON course_sessions(teacher_id);
CREATE INDEX idx_generated_timetables_request ON generated_timetables(request_id);
CREATE INDEX idx_generated_timetables_schedule ON generated_timetables(department_id, semester, section, day_of_week);
CREATE INDEX idx_generated_timetables_teacher ON generated_timetables(teacher_id, day_of_week, slot_id);

-- Add constraints
ALTER TABLE course_sessions ADD CONSTRAINT chk_session_type 
    CHECK (session_type IN ('theory', 'lab', 'tutorial'));
    
ALTER TABLE generated_timetables ADD CONSTRAINT chk_day_of_week 
    CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'));
    
ALTER TABLE generated_timetables ADD CONSTRAINT chk_session_type_gen 
    CHECK (session_type IN ('theory', 'lab', 'tutorial'));