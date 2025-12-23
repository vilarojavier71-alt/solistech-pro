-- Migration: add_project_dates
-- Description: Add start_date and end_date columns to projects table
-- Run this on production database to fix: "The column projects.start_date does not exist"
-- Date: 2025-12-23
-- Add start_date column if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projects'
        AND column_name = 'start_date'
) THEN
ALTER TABLE projects
ADD COLUMN start_date DATE;
END IF;
END $$;
-- Add end_date column if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projects'
        AND column_name = 'end_date'
) THEN
ALTER TABLE projects
ADD COLUMN end_date DATE;
END IF;
END $$;
-- Verify columns exist
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'projects'
    AND column_name IN ('start_date', 'end_date');