-- ============================================================================
-- DOCUMENT MANAGEMENT MODULE
-- ============================================================================

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Metadata
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_type TEXT CHECK (file_type IN ('contract', 'technical_memory', 'subsidy', 'invoice', 'other')) DEFAULT 'other',
    mime_type TEXT,
    size_bytes BIGINT,
    
    -- State
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(file_type);

-- 3. RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization documents"
    ON documents FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents"
    ON documents FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update documents"
    ON documents FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents"
    ON documents FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- 4. Storage Bucket Setup (This usually needs to be done via API/Dashboard, but we can set policies)
-- Assuming bucket 'documents' exists.

-- Storage Policy: Users can upload to their organization folder
-- Folder structure: /{organization_id}/{project_id?}/{filename}

-- NOTE: Storage policies are often managed separately or via the `storage.objects` table.
-- Here is a standard policy for the 'documents' bucket if we could execute it directly.
-- For now, we will assume the bucket is managed or we will create it manually/via script if possible.
