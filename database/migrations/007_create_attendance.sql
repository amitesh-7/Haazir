CREATE TABLE Attendance (
    attendance_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('present', 'absent')),
    FOREIGN KEY (schedule_id) REFERENCES Timetable(schedule_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
);