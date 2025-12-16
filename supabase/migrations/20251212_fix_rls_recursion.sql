-- ============================================================================
-- FIX: RECURSION INFINITA EN RLS (TABLA USERS)
-- ============================================================================

-- 1. Create a helper function to get the current user's organization ID.
-- SECURITY DEFINER allows this function to run with the privileges of the creator (admin),
-- bypassing RLS on the 'users' table which causes the recursion.
CREATE OR REPLACE FUNCTION public.get_auth_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$;

-- 2. Drop the problematic recursive policies if they exist
DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
-- Also drop previous attempts if named differently to be clean
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;

-- 3. Create the new Policy using the secure function
-- This allows anyone to view users who share the SAME organization ID.
CREATE POLICY "Users can view organization members"
ON public.users
FOR SELECT
USING (
    organization_id = get_auth_user_organization_id()
);

-- Note: "Users can view own profile" policy (id = auth.uid()) usually stays as is, 
-- or is covered by this one if they are in their own org.
-- We ensure the basic self-view exists just in case organization_id is null/invalid.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" 
        ON public.users FOR SELECT 
        USING (auth.uid() = id);
    END IF;
END $$;
