-- ============================================================================
-- SOLISTECH PRO - RLS POLICY AUDIT & OPTIMIZATION
-- ============================================================================
-- Description: Creates a security definer helper function to simplify
--              all organization-scoped RLS policies.
-- Date: 2025-12-13
-- ============================================================================

-- 1. CREATE HELPER FUNCTION FOR ORGANIZATION ID LOOKUP
-- This function returns the organization_id of the currently authenticated user.
-- Using SECURITY DEFINER allows it to bypass RLS for this specific lookup.
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION auth.user_organization_id() TO authenticated;

-- 2. CREATE HELPER FUNCTION FOR ROLE CHECK
CREATE OR REPLACE FUNCTION auth.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = required_role
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION auth.user_has_role(TEXT) TO authenticated;

-- 3. CREATE HELPER FUNCTION FOR ADMIN CHECK
CREATE OR REPLACE FUNCTION auth.user_is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'admin')
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION auth.user_is_admin() TO authenticated;

-- ============================================================================
-- POLICY OPTIMIZATION EXAMPLES (Reference Only)
-- ============================================================================
-- After creating these functions, existing policies can be simplified from:
--
-- CREATE POLICY "..." ON table FOR SELECT
--   USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
--
-- To:
--
-- CREATE POLICY "..." ON table FOR SELECT
--   USING (organization_id = auth.user_organization_id());
--
-- This reduces query complexity and improves performance.
-- ============================================================================

-- Verification
SELECT '✅ RLS Helper Functions Created' as status;
