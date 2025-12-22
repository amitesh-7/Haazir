-- Migration 026: Add embedding_version column to student_faces table
-- This tracks whether embeddings are 128D (face-api.js) or 512D (RetinaFace)

ALTER TABLE student_faces 
ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 512;

-- Update existing records to mark them as 512D (RetinaFace embeddings)
-- Any old 128D embeddings should already be marked as is_active = false
UPDATE student_faces 
SET embedding_version = 512 
WHERE embedding_version IS NULL;

-- Add comment to column for documentation
COMMENT ON COLUMN student_faces.embedding_version IS '128 for face-api.js embeddings, 512 for RetinaFace embeddings';
