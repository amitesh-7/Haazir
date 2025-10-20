-- Quick fix for missing columns in timetable table
-- This script adds the missing target_audience and batch_id columns

-- Add target_audience column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='timetable' AND column_name='target_audience') THEN
        ALTER TABLE timetable 
        ADD COLUMN target_audience VARCHAR(20) DEFAULT 'Section' CHECK (target_audience IN ('Section', 'Batch'));
        
        -- Update existing records
        UPDATE timetable SET target_audience = 'Section' WHERE target_audience IS NULL;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_timetable_target_audience ON timetable(target_audience);
        
        RAISE NOTICE 'Added target_audience column to timetable table';
    ELSE
        RAISE NOTICE 'target_audience column already exists in timetable table';
    END IF;
END $$;

-- Add batch_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='timetable' AND column_name='batch_id') THEN
        ALTER TABLE timetable ADD COLUMN batch_id INT;
        
        -- Add foreign key constraint if batches table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='batches') THEN
            ALTER TABLE timetable ADD CONSTRAINT fk_timetable_batch 
            FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_timetable_batch_id ON timetable(batch_id);
        
        RAISE NOTICE 'Added batch_id column to timetable table';
    ELSE
        RAISE NOTICE 'batch_id column already exists in timetable table';
    END IF;
END $$;