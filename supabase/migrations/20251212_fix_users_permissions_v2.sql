-- ============================================================================
-- FIX: PERMISOS TABLA USERS (V2)
-- Solves "permission denied for table users"
-- ============================================================================

-- 1. Grant Basic SQL Permissions (CRUD) to standard Supabase roles
-- 'authenticated' is the role used by logged-in users via API
-- 'service_role' is used by server-side admin clients
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO service_role;
-- GRANT SELECT ON TABLE public.users TO anon; -- Uncomment if public profiles are needed

-- 2. Ensure Row Level Security (RLS) is enabled (Best Practice)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Idempotent)
-- Allow users to see their own profile
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" 
        ON public.users FOR SELECT 
        USING (auth.uid() = id);
    END IF;
END $$;

-- Allow users to see basic info of ANY user (for 'created_by' / 'assigned_to' joins)
-- OR restrict to Organization.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view organization members') THEN
        CREATE POLICY "Users can view organization members" 
        ON public.users FOR SELECT 
        USING (
            organization_id IN (
                -- Caution: This subquery might be slow or recursive if not careful.
                -- A simpler approach for standard apps is often just checking if org_id matches auth.jwt()->org_id if available,
                -- or just `true` if user names are not sensitive public info.
                -- Using a safe approach:
                SELECT organization_id FROM public.users WHERE id = auth.uid()
            )
        );
    END IF;
END $$;
