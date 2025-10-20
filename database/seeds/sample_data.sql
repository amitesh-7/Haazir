INSERT INTO Departments (name, created_at, updated_at) VALUES 
('Computer Science', datetime('now'), datetime('now')),
('Mechanical Engineering', datetime('now'), datetime('now')),
('Electrical Engineering', datetime('now'), datetime('now'));

-- Insert sample sections for each department
INSERT INTO sections (department_id, section_name, description) VALUES 
(1, 'A', 'Computer Science Section A'),
(1, 'B', 'Computer Science Section B'),
(1, 'C', 'Computer Science Section C'),
(2, 'A', 'Mechanical Engineering Section A'),
(2, 'B', 'Mechanical Engineering Section B'),
(3, 'A', 'Electrical Engineering Section A'),
(3, 'B', 'Electrical Engineering Section B'),
(3, 'C', 'Electrical Engineering Section C');

INSERT INTO Users (email, password_hash, role, created_at, updated_at) VALUES 
('coordinator@example.com', 'hashed_password_1', 'coordinator', datetime('now'), datetime('now')),
('teacher1@example.com', 'hashed_password_2', 'teacher', datetime('now'), datetime('now')),
('teacher2@example.com', 'hashed_password_3', 'teacher', datetime('now'), datetime('now')),
('student1@example.com', 'hashed_password_4', 'student', datetime('now'), datetime('now')),
('student2@example.com', 'hashed_password_5', 'student', datetime('now'), datetime('now'));

INSERT INTO Students (user_id, name, roll_number, department_id, year, created_at, updated_at) VALUES 
(4, 'John Doe', 'CS101', 1, 1, datetime('now'), datetime('now')),
(5, 'Jane Smith', 'ME102', 2, 1, datetime('now'), datetime('now'));

INSERT INTO Teachers (user_id, name, department_id, created_at, updated_at) VALUES 
(2, 'Mr. Anderson', 1, datetime('now'), datetime('now')),
(3, 'Ms. Johnson', 2, datetime('now'), datetime('now'));

INSERT INTO Courses (course_code, course_name, department_id, created_at, updated_at) VALUES 
('CS101', 'Intro to Programming', 1, datetime('now'), datetime('now')),
('ME201', 'Thermodynamics', 2, datetime('now'), datetime('now'));

INSERT INTO Timetable (course_id, teacher_id, day_of_week, start_time, end_time, created_at, updated_at) VALUES 
(1, 1, 'Monday', '09:00:00', '10:30:00', datetime('now'), datetime('now')),
(2, 2, 'Tuesday', '11:00:00', '12:30:00', datetime('now'), datetime('now'));

INSERT INTO Attendance (schedule_id, student_id, date, status, created_at, updated_at) VALUES 
(1, 1, '2023-10-01', 'present', datetime('now'), datetime('now')),
(1, 2, '2023-10-01', 'absent', datetime('now'), datetime('now')),
(2, 1, '2023-10-02', 'present', datetime('now'), datetime('now')),
(2, 2, '2023-10-02', 'present', datetime('now'), datetime('now'));