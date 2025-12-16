-- FIX: Add missing 'public_token' column to 'projects' table
-- Error 42703: column "public_token" does not exist

DO $$
BEGIN
    -- Check if column exists to avoid errors on retry
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='public_token') THEN
        
        ALTER TABLE projects 
        ADD COLUMN public_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');

        -- Add Unique Constraint to ensure it works as a secure ID
        ALTER TABLE projects 
        ADD CONSTRAINT projects_public_token_key UNIQUE (public_token);

        -- Optional: Index for faster lookup
        CREATE INDEX IF NOT EXISTS idx_projects_public_token ON projects(public_token);

    END IF;
END $$;
