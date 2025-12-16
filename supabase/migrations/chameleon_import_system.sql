-- ============================================
-- CHAMELEON IMPORT SYSTEM - DATABASE MIGRATION
-- ============================================
-- Adds flexible JSONB storage and import tracking

-- ============================================
-- PHASE 1: Add JSONB columns to existing tables
-- ============================================

-- Customers: Add custom attributes and import metadata
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}';

-- Create GIN index for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_customers_custom_attributes ON customers USING GIN (custom_attributes);
CREATE INDEX IF NOT EXISTS idx_customers_import_metadata ON customers USING GIN (import_metadata);

COMMENT ON COLUMN customers.custom_attributes IS 'Custom fields from client Excel that do not fit standard schema';
COMMENT ON COLUMN customers.import_metadata IS 'Import tracking: source file, date, mapping used';

-- Projects: Add custom attributes and import metadata
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_projects_custom_attributes ON projects USING GIN (custom_attributes);
CREATE INDEX IF NOT EXISTS idx_projects_import_metadata ON projects USING GIN (import_metadata);

COMMENT ON COLUMN projects.custom_attributes IS 'Custom fields from client Excel that do not fit standard schema';
COMMENT ON COLUMN projects.import_metadata IS 'Import tracking: source file, date, mapping used';

-- Calculations: Add custom attributes and import metadata
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_calculations_custom_attributes ON calculations USING GIN (custom_attributes);
CREATE INDEX IF NOT EXISTS idx_calculations_import_metadata ON calculations USING GIN (import_metadata);

COMMENT ON COLUMN calculations.custom_attributes IS 'Custom fields from client Excel that do not fit standard schema';
COMMENT ON COLUMN calculations.import_metadata IS 'Import tracking: source file, date, mapping used';

-- ============================================
-- PHASE 2: Create import_templates table
-- ============================================

CREATE TABLE IF NOT EXISTS import_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('customers', 'projects', 'calculations')),
    
    -- Column mapping configuration
    -- Example: {"Nom.": "full_name", "Tlf": "phone", "Código": "custom_attributes.codigo"}
    column_mapping JSONB NOT NULL,
    
    -- Import configuration
    -- Example: {"skip_duplicates": true, "update_existing": false, "required_fields": ["full_name"]}
    import_config JSONB DEFAULT '{}',
    
    -- Usage statistics
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT import_templates_name_org_unique UNIQUE (organization_id, name, entity_type)
);

-- Indexes for import_templates
CREATE INDEX IF NOT EXISTS idx_import_templates_org ON import_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_import_templates_entity ON import_templates(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_templates_created ON import_templates(created_at DESC);

COMMENT ON TABLE import_templates IS 'Reusable column mapping templates for Excel/CSV imports';
COMMENT ON COLUMN import_templates.column_mapping IS 'Maps source Excel columns to target database fields';
COMMENT ON COLUMN import_templates.import_config IS 'Import behavior settings (skip duplicates, update existing, etc)';

-- ============================================
-- PHASE 3: Create import_jobs table
-- ============================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('customers', 'projects', 'calculations')),
    
    -- Source file information
    file_name VARCHAR(500) NOT NULL,
    file_url TEXT,
    file_size_bytes BIGINT,
    
    -- Job status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Progress tracking
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    skipped_rows INTEGER DEFAULT 0,
    
    -- Error details
    -- Example: [{"row": 5, "field": "email", "error": "Invalid email format", "value": "invalid@"}]
    errors JSONB DEFAULT '[]',
    
    -- Mapping used for this import
    column_mapping JSONB,
    template_id UUID REFERENCES import_templates(id) ON DELETE SET NULL,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for import_jobs
CREATE INDEX IF NOT EXISTS idx_import_jobs_org ON import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON import_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_jobs_entity ON import_jobs(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_jobs_template ON import_jobs(template_id);

COMMENT ON TABLE import_jobs IS 'Tracks all import operations with full audit trail';
COMMENT ON COLUMN import_jobs.errors IS 'Detailed error log for failed rows';
COMMENT ON COLUMN import_jobs.column_mapping IS 'Snapshot of mapping used for this specific import';

-- ============================================
-- PHASE 4: Helper functions
-- ============================================

-- Function to update import_templates.updated_at automatically
CREATE OR REPLACE FUNCTION update_import_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_import_template_timestamp
    BEFORE UPDATE ON import_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_import_template_timestamp();

-- Function to calculate import_jobs.duration_seconds automatically
CREATE OR REPLACE FUNCTION calculate_import_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_import_duration
    BEFORE UPDATE ON import_jobs
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL)
    EXECUTE FUNCTION calculate_import_duration();

-- ============================================
-- PHASE 5: RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- import_templates policies
CREATE POLICY import_templates_org_isolation ON import_templates
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- import_jobs policies
CREATE POLICY import_jobs_org_isolation ON import_jobs
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify JSONB columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'custom_attributes'
    ) THEN
        RAISE NOTICE '✅ customers.custom_attributes column added';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'custom_attributes'
    ) THEN
        RAISE NOTICE '✅ projects.custom_attributes column added';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calculations' AND column_name = 'custom_attributes'
    ) THEN
        RAISE NOTICE '✅ calculations.custom_attributes column added';
    END IF;
END $$;

-- Verify new tables were created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'import_templates') THEN
        RAISE NOTICE '✅ import_templates table created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'import_jobs') THEN
        RAISE NOTICE '✅ import_jobs table created';
    END IF;
END $$;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Example: Insert a sample template
-- INSERT INTO import_templates (
--     organization_id,
--     name,
--     description,
--     entity_type,
--     column_mapping,
--     import_config
-- ) VALUES (
--     'your-org-id',
--     'Clientes Formato Antiguo',
--     'Template para importar clientes del sistema anterior',
--     'customers',
--     '{"Nom.": "full_name", "Tlf": "phone", "Dir.": "address", "Código": "custom_attributes.codigo_antiguo"}',
--     '{"skip_duplicates": true, "update_existing": false, "required_fields": ["full_name"]}'
-- );

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS import_jobs CASCADE;
-- DROP TABLE IF EXISTS import_templates CASCADE;
-- ALTER TABLE customers DROP COLUMN IF EXISTS custom_attributes, DROP COLUMN IF EXISTS import_metadata;
-- ALTER TABLE projects DROP COLUMN IF EXISTS custom_attributes, DROP COLUMN IF EXISTS import_metadata;
-- ALTER TABLE calculations DROP COLUMN IF EXISTS custom_attributes, DROP COLUMN IF EXISTS import_metadata;
-- DROP FUNCTION IF EXISTS update_import_template_timestamp CASCADE;
-- DROP FUNCTION IF EXISTS calculate_import_duration CASCADE;
