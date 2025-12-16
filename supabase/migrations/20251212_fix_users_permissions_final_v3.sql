-- ============================================================================
-- FINAL FIX: USERS PERMISSIONS & RLS RECURSION (V3)
-- Solves "permission denied for table users" regardless of previous state.
-- ============================================================================

-- 1. Explicitly Grant SQL Permissions
-- Ensure "authenticated" role can actually access the public schema and read users.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO service_role;

-- 2. Helper function to get organization_id securely (Bypass RLS)
-- This prevents infinite recursion when RLS policies need to check the user's org.
CREATE OR REPLACE FUNCTION public.get_auth_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$;

-- 3. Cleanup: Drop potentially problematic/recursive policies
DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;

-- 4. Create proper "Organization Members" policy using the secure function
CREATE POLICY "Users can view organization members"
ON public.users
FOR SELECT
USING (
    -- User sees other users if they share the same organization_id
    organization_id = get_auth_user_organization_id()
);

-- 5. Ensure "View Own Profile" policy exists
-- This is technically redundant if they are in the same org, 
-- but essential if org_id is null or during onboarding.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" 
        ON public.users FOR SELECT 
        USING (auth.uid() = id);
    END IF;
END $$;
