-- FIX: Add missing Foreign Key to allow PostgREST joins
-- Error: "Could not find a relationship between 'user_roles' and 'users'"

-- 1. Ensure the constraint exists explicitly for public.users
-- We drop it first to avoid "already exists" errors with different names
DO $$
BEGIN
    ALTER TABLE IF EXISTS user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 2. Ensure organization_id is also linked correctly if missing
DO $$
BEGIN
    ALTER TABLE IF EXISTS user_roles
    DROP CONSTRAINT IF EXISTS user_roles_organization_id_fkey;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;

-- 3. Verify user_roles table exists (if not, creating a hollow one to prevent errors)
-- Note: In the new Enum-based architecture, this table might be deprecated, 
-- but we fix it to support legacy code/mixed state.
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID, -- Legacy or link to roles table
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
