-- Add organization_id and metadata to components for Universal Import
-- Date: 2024-12-09

-- 1. Ensure organization_id exists (critical for tenancy)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'organization_id') THEN 
        ALTER TABLE components ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF; 
END $$;

-- 2. Add metadata for flexible import
ALTER TABLE components ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Update RLS policies to use organization_id if not already doing so
-- (The fix_rls_complete script removed old policies, assuming new ones would use org_id)
-- We need to ensure components are scoped by organization for the "Import" logic to be safe.

DROP POLICY IF EXISTS "Users can view organization components" ON components;
CREATE POLICY "Users can view organization components"
  ON components FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert components" ON components;
CREATE POLICY "Users can insert components"
  ON components FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update organization components" ON components;
CREATE POLICY "Users can update organization components"
  ON components FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete organization components" ON components;
CREATE POLICY "Users can delete organization components"
  ON components FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
