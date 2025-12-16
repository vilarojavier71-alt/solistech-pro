-- FIX: Create missing 'documents' table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, 
    mime_type TEXT,
    size_bytes BIGINT,
    status TEXT DEFAULT 'approved',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DO $$ 
BEGIN
    -- 1. View
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can view their organization documents') THEN
        CREATE POLICY "Users can view their organization documents" ON public.documents
        FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
        );
    END IF;

    -- 2. Insert
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can insert documents') THEN
        CREATE POLICY "Users can insert documents" ON public.documents
        FOR INSERT WITH CHECK (
            organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
        );
    END IF;

    -- 3. Delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Users can delete documents') THEN
        CREATE POLICY "Users can delete documents" ON public.documents
        FOR DELETE USING (
             organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
        );
    END IF;
END $$;
