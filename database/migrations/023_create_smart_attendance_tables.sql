-- Migration 023: Create Smart Attendance System Tables
-- This includes QR sessions, face recognition, and smart attendance tracking

-- 1. Attendance Sessions (QR Code Sessions)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  session_id VARCHAR(100) PRIMARY KEY,
  schedule_id INT NOT NULL,
  teacher_id INT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  qr_token TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, completed
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES timetable(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

-- 2. Student Face Embeddings (Pre-registered faces)
CREATE TABLE IF NOT EXISTS student_faces (
  face_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  face_descriptor TEXT NOT NULL, -- JSON array of 128 floats
  image_url TEXT,
  registered_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 3. Student Scan Records (QR scan + face capture)
CREATE TABLE IF NOT EXISTS student_scan_records (
  scan_id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  student_id INT NOT NULL,
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  face_image_url TEXT,
  face_descriptor TEXT, -- JSON array
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  distance_from_class DECIMAL(10, 2), -- meters
  face_match_confidence DECIMAL(5, 4), -- 0-1
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  rejection_reason TEXT,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  UNIQUE(session_id, student_id)
);

-- 4. Teacher Class Captures (Bulk face detection)
CREATE TABLE IF NOT EXISTS teacher_class_captures (
  capture_id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  capture_timestamp TIMESTAMP DEFAULT NOW(),
  image_url TEXT NOT NULL,
  detected_faces_count INT DEFAULT 0,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE
);

-- 5. Detected Faces from Teacher Capture
CREATE TABLE IF NOT EXISTS detected_class_faces (
  detection_id SERIAL PRIMARY KEY,
  capture_id INT NOT NULL,
  face_descriptor TEXT, -- JSON array
  face_bbox JSON, -- bounding box {x, y, width, height}
  matched_student_id INT,
  confidence DECIMAL(5, 4),
  FOREIGN KEY (capture_id) REFERENCES teacher_class_captures(capture_id) ON DELETE CASCADE,
  FOREIGN KEY (matched_student_id) REFERENCES students(student_id) ON DELETE SET NULL
);

-- 6. Smart Attendance Records (Final attendance)
CREATE TABLE IF NOT EXISTS smart_attendance_records (
  record_id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  student_id INT NOT NULL,
  schedule_id INT NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present', -- present, absent
  verified_by_scan BOOLEAN DEFAULT false,
  verified_by_class_photo BOOLEAN DEFAULT false,
  manually_marked BOOLEAN DEFAULT false,
  marked_by_teacher_id INT,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES timetable(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by_teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  UNIQUE(session_id, student_id)
);

-- 7. Notifications Log
CREATE TABLE IF NOT EXISTS attendance_notifications (
  notification_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- absent_alert, final_reminder
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_schedule ON attendance_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_student_faces_student ON student_faces(student_id);
CREATE INDEX IF NOT EXISTS idx_student_faces_active ON student_faces(is_active);
CREATE INDEX IF NOT EXISTS idx_scan_records_session ON student_scan_records(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_student ON student_scan_records(student_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_status ON student_scan_records(status);
CREATE INDEX IF NOT EXISTS idx_class_captures_session ON teacher_class_captures(session_id);
CREATE INDEX IF NOT EXISTS idx_detected_faces_capture ON detected_class_faces(capture_id);
CREATE INDEX IF NOT EXISTS idx_detected_faces_student ON detected_class_faces(matched_student_id);
CREATE INDEX IF NOT EXISTS idx_smart_attendance_session ON smart_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_smart_attendance_student ON smart_attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_smart_attendance_schedule_date ON smart_attendance_records(schedule_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON attendance_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON attendance_notifications(session_id);

-- Comments
COMMENT ON TABLE attendance_sessions IS 'QR code sessions for smart attendance';
COMMENT ON TABLE student_faces IS 'Pre-registered student face embeddings for verification';
COMMENT ON TABLE student_scan_records IS 'Records of student QR scans with face verification';
COMMENT ON TABLE teacher_class_captures IS 'Photos captured by teacher during class';
COMMENT ON TABLE detected_class_faces IS 'Faces detected in teacher class photos';
COMMENT ON TABLE smart_attendance_records IS 'Final attendance records after cross-verification';
COMMENT ON TABLE attendance_notifications IS 'Notifications sent to students about attendance';
