-- =====================================================
-- Dual Verification System Tables for Haazir
-- Migration: 025_create_dual_verification_tables.sql
-- =====================================================

-- =====================================================
-- 1. Update attendance_sessions for verification tracking
-- =====================================================
ALTER TABLE attendance_sessions
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS class_photo_id UUID,
ADD COLUMN IF NOT EXISTS verified_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspicious_count INTEGER DEFAULT 0;

-- =====================================================
-- 2. Update student_scan_records for self-verification embeddings
-- =====================================================
ALTER TABLE student_scan_records
ADD COLUMN IF NOT EXISTS face_match_score FLOAT,
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS self_verification_embedding TEXT,
ADD COLUMN IF NOT EXISTS self_verification_confidence FLOAT,
ADD COLUMN IF NOT EXISTS self_verification_bbox TEXT,
ADD COLUMN IF NOT EXISTS class_photo_match_score FLOAT,
ADD COLUMN IF NOT EXISTS class_photo_face_index INTEGER;

-- =====================================================
-- 2.5. Update smart_attendance_records for dual verification
-- =====================================================
ALTER TABLE smart_attendance_records
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_match_score FLOAT,
ADD COLUMN IF NOT EXISTS marked_at TIMESTAMP,
ALTER COLUMN schedule_id DROP NOT NULL,
ALTER COLUMN date DROP NOT NULL;

-- =====================================================
-- 3. Class Photos Table (stores teacher-captured class photos)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(user_id),
    image_url TEXT,
    total_faces_detected INTEGER NOT NULL DEFAULT 0,
    matched_faces INTEGER NOT NULL DEFAULT 0,
    unmatched_faces INTEGER NOT NULL DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_photos_session ON class_photos(session_id);

-- =====================================================
-- 4. Class Photo Faces Table (detected faces from class photos)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_photo_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_photo_id UUID NOT NULL REFERENCES class_photos(id) ON DELETE CASCADE,
    face_index INTEGER NOT NULL,
    embedding JSONB NOT NULL,              -- 512-dimensional vector stored as JSON array
    bbox JSONB NOT NULL,                   -- [x1, y1, x2, y2]
    confidence FLOAT NOT NULL,
    age INTEGER,
    gender INTEGER,                         -- 0 = female, 1 = male
    matched_student_id INTEGER REFERENCES students(student_id),
    match_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_photo_faces_photo ON class_photo_faces(class_photo_id);
CREATE INDEX IF NOT EXISTS idx_class_photo_faces_student ON class_photo_faces(matched_student_id);

-- =====================================================
-- 5. Verification Logs Table (audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL REFERENCES attendance_sessions(session_id),
    student_id INTEGER REFERENCES students(student_id),
    action VARCHAR(50) NOT NULL,           -- 'self_verify', 'class_verify', 'manual_override'
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    match_score FLOAT,
    metadata JSONB,
    performed_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_session ON verification_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_student ON verification_logs(student_id);

-- =====================================================
-- 6. Update smart_attendance_records status enum
-- Valid values: 'pending', 'verified', 'self_verified', 'suspicious', 'rejected', 'absent', 'manual'
-- =====================================================
-- Note: PostgreSQL doesn't easily support adding enum values, so we use VARCHAR

COMMENT ON TABLE class_photos IS 'Stores class photos captured by teachers for dual verification';
COMMENT ON TABLE class_photo_faces IS 'Detected faces from class photos with embeddings for matching';
COMMENT ON TABLE verification_logs IS 'Audit trail for all verification actions';

-- =====================================================
-- 7. OPTIONAL: Clear old face-api.js descriptors (128D)
-- Uncomment the following to clear old descriptors and require re-registration
-- This will remove all face data that uses the old face-api.js 128D format
-- The new RetinaFace system uses 512D embeddings
-- =====================================================

-- CAUTION: This deletes all existing face registrations!
-- Only run this if you want to force all students to re-register faces

-- DELETE FROM student_faces WHERE is_active = true;
-- -- Or to just deactivate them:
-- UPDATE student_faces SET is_active = false WHERE is_active = true;

-- To identify old format faces (128D face-api.js vs 512D RetinaFace):
-- SELECT face_id, student_id, 
--        jsonb_array_length(face_descriptor::jsonb) as embedding_dimension
-- FROM student_faces 
-- WHERE is_active = true;

-- To delete only old 128D descriptors:
-- DELETE FROM student_faces 
-- WHERE is_active = true 
-- AND jsonb_array_length(face_descriptor::jsonb) = 128;
