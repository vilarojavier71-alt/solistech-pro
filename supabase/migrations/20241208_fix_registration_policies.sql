-- Fix for registration: Allow users to create organizations during signup
-- This adds INSERT policies for organizations and users tables

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Allow authenticated users to create organizations (needed during registration)
CREATE POLICY "Users can create organizations during signup"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
