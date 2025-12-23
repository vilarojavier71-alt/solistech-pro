-- Add created_by column to presentations table
-- ISO 27001: A.8.15 - Audit Trail (track who created presentations)

ALTER TABLE presentations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_presentations_created_by ON presentations(created_by);

-- Add comment for documentation
COMMENT ON COLUMN presentations.created_by IS 'User ID who created this presentation (ISO 27001: A.8.15 - Audit Trail)';

