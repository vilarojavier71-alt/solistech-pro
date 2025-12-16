-- Fix INSERT policy for organizations to allow registration
-- The WITH CHECK clause was too restrictive

DROP POLICY IF EXISTS "org_insert_policy" ON organizations;

-- Allow any authenticated user to create an organization
-- No additional checks needed since this is for new user registration
CREATE POLICY "org_insert_policy"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);
