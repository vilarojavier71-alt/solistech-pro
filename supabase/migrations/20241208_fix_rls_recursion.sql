-- Fix for infinite recursion in RLS policies
-- This script fixes the circular dependency in the users table policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Recreate organizations policies without circular dependency
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (id = (SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin') LIMIT 1));

-- Recreate users policies - allow users to see themselves and their org members
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view their organization members"
  ON users FOR SELECT
  USING (
    organization_id = (
      SELECT u.organization_id 
      FROM users u 
      WHERE u.id = auth.uid() 
      LIMIT 1
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Add INSERT policy for users (needed for registration)
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
