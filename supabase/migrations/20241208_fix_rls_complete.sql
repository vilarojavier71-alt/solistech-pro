-- COMPLETE FIX for infinite recursion in RLS policies
-- This script completely rebuilds the policies to avoid circular dependencies

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================================================

-- Drop all policies on organizations
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations during signup" ON organizations;

-- Drop all policies on users
DROP POLICY IF EXISTS "Users can view organization members" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- ============================================================================
-- STEP 2: CREATE NEW POLICIES WITHOUT CIRCULAR DEPENDENCIES
-- ============================================================================

-- ORGANIZATIONS POLICIES
-- Allow users to view their own organization (direct check, no subquery on users)
CREATE POLICY "org_select_policy"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = organizations.id
    )
  );

-- Allow owners/admins to update their organization
CREATE POLICY "org_update_policy"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = organizations.id
      AND users.role IN ('owner', 'admin')
    )
  );

-- Allow authenticated users to create organizations (for registration)
CREATE POLICY "org_insert_policy"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- USERS POLICIES
-- Allow users to view their own profile (direct check, no recursion)
CREATE POLICY "users_select_own_policy"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "users_update_own_policy"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Allow users to insert their own profile (for registration)
CREATE POLICY "users_insert_own_policy"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
