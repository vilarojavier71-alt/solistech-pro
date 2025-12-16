-- Fix RLS policies for import_jobs to allow proper insertion and updates
-- Based on error diagnosis: "Error creating import job" (likely 42501)

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Drop generic/old policies to avoid conflicts
DROP POLICY IF EXISTS "import_jobs_org_isolation" ON import_jobs;
DROP POLICY IF EXISTS "import_jobs_select_policy" ON import_jobs;
DROP POLICY IF EXISTS "import_jobs_insert_policy" ON import_jobs;
DROP POLICY IF EXISTS "import_jobs_update_policy" ON import_jobs;

-- 1. SELECT: Users can see imports from their organization
CREATE POLICY "import_jobs_select_policy" ON import_jobs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 2. INSERT: Users can create imports for their organization
-- Validation: The organization_id in the row must match the user's organization
CREATE POLICY "import_jobs_insert_policy" ON import_jobs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 3. UPDATE: Users can update imports (e.g. status) for their organization
CREATE POLICY "import_jobs_update_policy" ON import_jobs
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Ensure indexes exist for performance (often missed in initial schemas)
CREATE INDEX IF NOT EXISTS idx_import_jobs_org_id ON import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON import_jobs(created_by);
