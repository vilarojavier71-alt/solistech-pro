-- Advanced RBAC & Segregation of Duties (SoD) Migration
-- Implements "Blind Installer" Strategy and Granular Permissions

-- 1. ENHANCE APP_ROLE ENUM
-- We first check if the type exists and add values if needed
-- Note: 'user' is legacy, we keep it for backward compat but move to specific roles
DO $$
BEGIN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pica';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'installer';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'engineer';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. SECURE VIEW FOR INSTALLERS (The "Blind" View)
-- Installers need project details but MUST NOT see prices/financials
DROP VIEW IF EXISTS projects_technical_view;

CREATE VIEW projects_technical_view AS
SELECT
    id,
    organization_id,
    name,
    status,
    notes as description,
    location->>'address' as address,
    location->>'city' as city,
    location->>'postal_code' as postal_code,
    NULL::text as province,
    NULL::timestamp as start_date,
    NULL::timestamp as end_date,
    customer_id,
    assigned_to,
    NULL::text as priority,
    installation_type as project_type,
    NULL::text as image_url,
    -- EXCLUDED: budget, cost, margin, financial_notes
    NULL::jsonb as custom_attributes,
    NULL::jsonb as import_metadata,
    created_at,
    updated_at
FROM projects;

-- Grant access to the view
GRANT SELECT ON projects_technical_view TO authenticated;


-- 3. RLS POLICIES UPDATE

-- LEADS:
-- Pica: Only their own leads
-- Sales/Admin: All organization leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_access_policy" ON leads;
DROP POLICY IF EXISTS "leads_sod_policy" ON leads;

CREATE POLICY "leads_sod_policy" ON leads
FOR ALL
USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin/Sales/Owner see all
        (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'commercial', 'sales')
        OR
        -- Pica/others see only created_by or assigned_to
        (created_by = auth.uid() OR assigned_to = auth.uid())
    )
);

-- PROJECTS:
-- Installer: Only assigned projects (via view preferably, but RLS protects raw table too)
-- Engineer: Assigned projects + Read access to others
-- Sales/Admin: All organization
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_access_policy" ON projects;
DROP POLICY IF EXISTS "projects_sod_policy" ON projects;

CREATE POLICY "projects_sod_policy" ON projects
FOR ALL
USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin/Sales/Owner/Engineer see all (Engineer needs context)
        (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'commercial', 'sales', 'engineer')
        OR
        -- Installer/Pica see only assigned
        (assigned_to = auth.uid() OR created_by = auth.uid())
    )
);

-- QUOTES (Financial Data):
-- Installer: NO ACCESS (Critical)
-- Pica: Only their own quotes
-- Sales/Admin: All
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotes_access_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_sod_policy" ON quotes;

CREATE POLICY "quotes_sod_policy" ON quotes
FOR ALL
USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin/Sales/Owner/Engineer see all
        (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'commercial', 'sales', 'engineer')
        OR
        -- Pica sees only created_by
        (created_by = auth.uid() AND (SELECT role FROM users WHERE id = auth.uid()) = 'pica')
    )
    -- Installer automatically excluded as they are not in the list and don't match created_by usually
);

-- 4. HELPER FUNCTION FOR FRONTEND PERMISSIONS
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role::app_role FROM users WHERE id = user_uuid;
$$;
