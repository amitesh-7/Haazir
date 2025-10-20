-- Create notifications table for real-time student notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(50) NOT NULL DEFAULT 'student',
    type VARCHAR(50) NOT NULL, -- 'attendance_absent', 'attendance_warning', 'grade_update', 'announcement', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_data JSONB, -- Store additional context like course_id, date, etc.
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
    -- Note: Foreign key removed for compatibility. User IDs are validated at application level.
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create composite index for common queries (unread notifications for a user)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores all user notifications including attendance alerts, grades, announcements';
COMMENT ON COLUMN notifications.type IS 'Type of notification: attendance_absent, attendance_warning, grade_update, announcement, etc.';
COMMENT ON COLUMN notifications.related_data IS 'JSON object with context like {course_id, date, attendance_id, etc.}';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
