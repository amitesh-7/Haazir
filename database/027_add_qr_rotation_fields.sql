-- Migration 027: Add QR rotation tracking fields to attendance_sessions table
-- This enables QR code rotation every 10 seconds to prevent QR sharing fraud

-- Add qr_rotation_count column to track how many times QR has been rotated
ALTER TABLE attendance_sessions 
ADD COLUMN IF NOT EXISTS qr_rotation_count INTEGER DEFAULT 0 NOT NULL;

-- Add last_rotation_at column to track when QR was last rotated
ALTER TABLE attendance_sessions 
ADD COLUMN IF NOT EXISTS last_rotation_at TIMESTAMP;

-- Update existing records to have rotation count = 0
UPDATE attendance_sessions 
SET qr_rotation_count = 0 
WHERE qr_rotation_count IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN attendance_sessions.qr_rotation_count IS 'Number of times QR code has been rotated for this session (increments every 10 seconds)';
COMMENT ON COLUMN attendance_sessions.last_rotation_at IS 'Timestamp when QR code was last rotated/refreshed';

-- Create index for faster lookups during validation
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_rotation 
ON attendance_sessions(session_id, qr_rotation_count);
