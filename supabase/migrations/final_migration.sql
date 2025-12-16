-- ============================================================================
-- SOLISTECH PRO V2 - MIGRACIONES FINALES (Compatible con Supabase)
-- ============================================================================

-- PARTE 1: EXTENSIÓN DE CALCULATIONS
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS roof_area_available DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS roof_area_required DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS engineering_viable BOOLEAN DEFAULT true;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS engineering_notes TEXT;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_region TEXT;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_municipality TEXT;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_irpf_type TEXT;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_irpf_percentage DECIMAL(5,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_irpf_amount DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_irpf_max_amount DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_ibi_percentage DECIMAL(5,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_ibi_duration_years INTEGER;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_ibi_annual DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_ibi_total DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_icio_percentage DECIMAL(5,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS subsidy_icio_amount DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS total_subsidies DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS net_cost DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS roi_with_subsidies DECIMAL(10,2);
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS payback_with_subsidies DECIMAL(5,2);

CREATE INDEX IF NOT EXISTS idx_calculations_roi_with_subsidies ON calculations(roi_with_subsidies);

-- PARTE 2: ORGANIZATION_SETTINGS
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ai_provider TEXT,
    ai_api_key_encrypted TEXT,
    ai_api_key_valid BOOLEAN DEFAULT false,
    presentation_template TEXT DEFAULT 'default',
    default_fiscal_deduction TEXT DEFAULT '40',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization settings" ON organization_settings;
DROP POLICY IF EXISTS "Users can update their organization settings" ON organization_settings;
DROP POLICY IF EXISTS "Users can insert their organization settings" ON organization_settings;

CREATE POLICY "Users can view their organization settings"
    ON organization_settings FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization settings"
    ON organization_settings FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization settings"
    ON organization_settings FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- PARTE 3: PRESENTATIONS
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    calculation_id UUID REFERENCES calculations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'generating',
    template TEXT DEFAULT 'default',
    fiscal_deduction_type TEXT,
    original_photo_url TEXT,
    simulated_photo_url TEXT,
    pptx_file_url TEXT,
    pptx_file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_presentations_organization ON presentations(organization_id);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization presentations" ON presentations;
DROP POLICY IF EXISTS "Users can create presentations" ON presentations;
DROP POLICY IF EXISTS "Users can update their presentations" ON presentations;

CREATE POLICY "Users can view their organization presentations"
    ON presentations FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create presentations"
    ON presentations FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their presentations"
    ON presentations FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- PARTE 4: SUBSIDIES
CREATE TABLE IF NOT EXISTS subsidies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region TEXT NOT NULL,
    autonomous_community TEXT,
    subsidy_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    percentage DECIMAL(5,2),
    max_amount DECIMAL(10,2),
    duration_years INTEGER,
    conditions JSONB,
    requirements TEXT[],
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    source_url TEXT,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subsidies_region ON subsidies(region);
CREATE INDEX IF NOT EXISTS idx_subsidies_type ON subsidies(subsidy_type);

ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subsidies are viewable by everyone" ON subsidies;

CREATE POLICY "Subsidies are viewable by everyone" 
    ON subsidies FOR SELECT 
    USING (true);

-- PARTE 5: MUNICIPAL_TAX_BENEFITS
CREATE TABLE IF NOT EXISTS municipal_tax_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality TEXT NOT NULL,
    province TEXT NOT NULL,
    autonomous_community TEXT NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    ibi_percentage DECIMAL(5,2),
    ibi_duration_years INTEGER,
    ibi_conditions TEXT,
    icio_percentage DECIMAL(5,2),
    icio_conditions TEXT,
    ordinance_url TEXT,
    last_verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_municipal_benefits_municipality ON municipal_tax_benefits(municipality);

ALTER TABLE municipal_tax_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Municipal benefits are viewable by everyone" ON municipal_tax_benefits;

CREATE POLICY "Municipal benefits are viewable by everyone" 
    ON municipal_tax_benefits FOR SELECT 
    USING (true);

-- DATOS DE EJEMPLO
INSERT INTO municipal_tax_benefits (municipality, province, autonomous_community, ibi_percentage, ibi_duration_years, icio_percentage, is_active)
VALUES
    ('Valencia', 'Valencia', 'Comunidad Valenciana', 50, 10, 95, true),
    ('Madrid', 'Madrid', 'Comunidad de Madrid', 50, 5, 95, true),
    ('Barcelona', 'Barcelona', 'Cataluña', 50, 5, 95, true),
    ('Sevilla', 'Sevilla', 'Andalucía', 50, 10, 95, true),
    ('Palma', 'Islas Baleares', 'Islas Baleares', 50, 10, 95, true),
    ('Zaragoza', 'Zaragoza', 'Aragón', 50, 5, 95, true),
    ('Málaga', 'Málaga', 'Andalucía', 50, 10, 95, true),
    ('Murcia', 'Murcia', 'Región de Murcia', 50, 5, 95, true),
    ('Alicante', 'Alicante', 'Comunidad Valenciana', 50, 10, 95, true),
    ('Bilbao', 'Vizcaya', 'País Vasco', 50, 5, 95, true)
ON CONFLICT DO NOTHING;

-- ✅ MIGRACIÓN COMPLETADA
SELECT 
    '✅ Migración completada con éxito' AS status,
    (SELECT COUNT(*) FROM municipal_tax_benefits) AS municipios_cargados;
