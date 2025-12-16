-- Grant permissions on public.users
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO service_role;

-- Ensure RLS is enabled but allows reading for authenticated users (if policies don't exist)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read basic info of other users (needed for 'created_by' display)
-- Or at least read their own.
-- For the documents table `getDocuments` query: `users (full_name)` JOIN.
-- We need to read *any* user referenced by a document in the org.
CREATE POLICY "Users can view members of their organization"
    ON public.users FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );
