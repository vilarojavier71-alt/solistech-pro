-- ============================================================================
-- RBAC SYSTEM MIGRATION (Role-Based Access Control)
-- ============================================================================

-- 1. Create Role Enum
CREATE TYPE app_role AS ENUM ('admin', 'comercial', 'instalador', 'cliente');

-- 2. Create User Roles Table (The Source of Truth)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id) -- One role per user per org (simplification)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);

-- 3. Sync to Public Users (Optimization for Client-Side)
-- Add role column to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role app_role DEFAULT 'cliente';
    END IF;
END $$;

-- Trigger to keep users.role in sync with user_roles (Optional but good for performance)
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET role = NEW.role 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_role_change ON user_roles;
CREATE TRIGGER on_user_role_change
    AFTER INSERT OR UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_role();


-- ============================================================================
-- RLS POLICIES (THE WALL)
-- ============================================================================

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS app_role AS $$
BEGIN
    RETURN (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.1 USERS Table Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all users in their org"
    ON users
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND organization_id = users.organization_id
        )
    );

CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- 4.2 LEADS Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Admin: All leads in Org
CREATE POLICY "Admins see all leads"
    ON leads
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND organization_id = leads.organization_id
        )
    );

-- Comercial: Only assigned leads
CREATE POLICY "Comerciales see assigned leads"
    ON leads
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'comercial'
        )
        AND assigned_to = auth.uid()
    );

-- 4.3 PROJECTS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Admin: All Projects
CREATE POLICY "Admins see all projects"
    ON projects
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND organization_id = projects.organization_id
        )
    );

-- Comercial: Own Projects (created by or assigned)
CREATE POLICY "Comerciales see own projects"
    ON projects
    USING (
        (EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'comercial'
        ) AND created_by = auth.uid())
    );

-- Instalador: Assigned Projects (via tasks or direct assignment - simplified to Org for now, or need specific assignment table)
-- Assuming Instaladores need to see projects in their Org but maybe restricted?
-- For now, let's say Instaladores see all projects in Org to facilitate work, or restrict if 'assigned_installer' column exists.
-- Let's assume strict: Only if they have a task in it? Too complex for SQL join.
-- Let's go with: Instaladores see all projects in Org (Read Only)
CREATE POLICY "Instaladores see all projects read-only"
    ON projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'instalador' 
            AND organization_id = projects.organization_id
        )
    );

-- Cliente: Only their project
CREATE POLICY "Clients see own project"
    ON projects
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

