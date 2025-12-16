-- ============================================
-- SCRIPT MAESTRO CONSOLIDADO - SOLISTECH PRO V2
-- Ejecutar TODO este script en Supabase SQL Editor
-- ============================================
-- IMPORTANTE: Ejecutar en una sola vez para evitar errores de dependencias
-- ============================================

-- PASO 1: EXTENSIONES NECESARIAS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ============================================
-- PASO 2: SISTEMA DE SUBVENCIONES
-- ============================================

-- Tabla de subvenciones regionales
CREATE TABLE IF NOT EXISTS subsidies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL,
    subsidy_type TEXT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    max_amount NUMERIC(10,2),
    conditions JSONB DEFAULT '{}'::jsonb,
    valid_from DATE NOT NULL,
    valid_until DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subsidies_region ON subsidies(region);
CREATE INDEX IF NOT EXISTS idx_subsidies_active ON subsidies(is_active);
CREATE INDEX IF NOT EXISTS idx_subsidies_type ON subsidies(subsidy_type);

-- Datos de subvenciones
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until)
SELECT * FROM (VALUES
    ('Comunidad Valenciana', 'direct_grant', 40.00, 3000.00, 'Ayuda Next Generation EU - Hasta 40% del presupuesto con tope de 3.000€', '2024-01-01'::date, '2026-02-27'::date),
    ('Comunidad Valenciana', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40% por reducción de consumo energético ≥30%', '2024-01-01'::date, '2026-12-31'::date),
    ('Madrid', 'direct_grant', 30.00, NULL, 'Subvención directa fondos autonómicos (30% de la inversión)', '2024-01-01'::date, '2025-12-31'::date),
    ('Madrid', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40% por reducción de consumo energético', '2024-01-01'::date, '2026-12-31'::date),
    ('Cataluña', 'direct_grant', 40.00, NULL, 'Fondos NextGen con línea específica para baterías (40%)', '2025-01-01'::date, '2026-12-31'::date),
    ('Andalucía', 'direct_grant', 35.00, NULL, 'Subvención autonómica para autoconsumo (35%)', '2024-01-01'::date, '2025-12-31'::date),
    ('Aragón', 'direct_grant', 35.00, NULL, 'Subvención autonómica para autoconsumo (35%)', '2024-01-01'::date, '2025-12-31'::date),
    ('Aragón', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40%', '2024-01-01'::date, '2026-12-31'::date)
) AS v(region, subsidy_type, percentage, max_amount, description, valid_from, valid_until)
WHERE NOT EXISTS (SELECT 1 FROM subsidies LIMIT 1);

-- ============================================
-- PASO 3: CRM DE TRAMITACIÓN DE SUBVENCIONES
-- ============================================

-- Tabla de expedientes de subvenciones
CREATE TABLE IF NOT EXISTS subsidy_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    application_number TEXT UNIQUE NOT NULL,
    region TEXT NOT NULL,
    subsidy_type TEXT NOT NULL,
    estimated_amount NUMERIC(10,2),
    
    status TEXT NOT NULL DEFAULT 'collecting_docs',
    
    submission_deadline DATE,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    required_docs JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subsidy_apps_org ON subsidy_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_customer ON subsidy_applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_status ON subsidy_applications(status);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_deadline ON subsidy_applications(submission_deadline);

-- Función para auto-generar número de expediente
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YY');
    
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(application_number FROM 'SUB-(\d+)-') AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM subsidy_applications
    WHERE organization_id = NEW.organization_id;
    
    NEW.application_number := 'SUB-' || LPAD(next_number::TEXT, 4, '0') || '-' || year_suffix;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_application_number ON subsidy_applications;
CREATE TRIGGER auto_generate_application_number
    BEFORE INSERT ON subsidy_applications
    FOR EACH ROW
    WHEN (NEW.application_number IS NULL)
    EXECUTE FUNCTION generate_application_number();

-- RLS para subsidy_applications
ALTER TABLE subsidy_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org applications" ON subsidy_applications;
CREATE POLICY "Users can view org applications"
    ON subsidy_applications FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert org applications" ON subsidy_applications;
CREATE POLICY "Users can insert org applications"
    ON subsidy_applications FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update org applications" ON subsidy_applications;
CREATE POLICY "Users can update org applications"
    ON subsidy_applications FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Tabla de documentos de subvenciones
CREATE TABLE IF NOT EXISTS subsidy_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES subsidy_applications(id) ON DELETE CASCADE NOT NULL,
    
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_subsidy_docs_app ON subsidy_documents(application_id);

ALTER TABLE subsidy_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org subsidy documents" ON subsidy_documents;
CREATE POLICY "Users can view org subsidy documents"
    ON subsidy_documents FOR SELECT
    USING (application_id IN (
        SELECT id FROM subsidy_applications 
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

DROP POLICY IF EXISTS "Users can insert org subsidy documents" ON subsidy_documents;
CREATE POLICY "Users can insert org subsidy documents"
    ON subsidy_documents FOR INSERT
    WITH CHECK (application_id IN (
        SELECT id FROM subsidy_applications 
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- ============================================
-- PASO 4: SISTEMA DE PRESENTACIONES POWERPOINT
-- ============================================

-- Tabla de configuración de organización
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) UNIQUE NOT NULL,
    
    -- API Keys para generación de imágenes con IA
    ai_provider TEXT CHECK (ai_provider IN ('replicate', 'openai', 'stability')),
    ai_api_key_encrypted TEXT,
    ai_api_key_valid BOOLEAN DEFAULT false,
    ai_api_key_last_validated TIMESTAMP,
    
    -- Configuración de presentaciones
    presentation_template TEXT DEFAULT 'ebro-solar',
    default_fiscal_deduction TEXT DEFAULT '40' CHECK (default_fiscal_deduction IN ('20', '40', '60')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_settings_org ON organization_settings(organization_id);

CREATE OR REPLACE FUNCTION update_org_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_settings_updated_at ON organization_settings;
CREATE TRIGGER org_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_org_settings_updated_at();

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org settings" ON organization_settings;
CREATE POLICY "Users can view own org settings"
    ON organization_settings FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert own org settings" ON organization_settings;
CREATE POLICY "Users can insert own org settings"
    ON organization_settings FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update own org settings" ON organization_settings;
CREATE POLICY "Users can update own org settings"
    ON organization_settings FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Tabla de presentaciones
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'sent', 'error')),
    
    template TEXT DEFAULT 'ebro-solar',
    fiscal_deduction_type TEXT CHECK (fiscal_deduction_type IN ('20', '40', '60')),
    
    original_photo_url TEXT,
    simulated_photo_url TEXT,
    
    pptx_file_url TEXT,
    pptx_file_size INTEGER,
    
    generation_error TEXT,
    generated_at TIMESTAMP,
    sent_at TIMESTAMP,
    sent_to_email TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentations_org ON presentations(organization_id);
CREATE INDEX IF NOT EXISTS idx_presentations_customer ON presentations(customer_id);
CREATE INDEX IF NOT EXISTS idx_presentations_project ON presentations(project_id);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);

CREATE OR REPLACE FUNCTION update_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS presentations_updated_at ON presentations;
CREATE TRIGGER presentations_updated_at
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_presentations_updated_at();

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org presentations" ON presentations;
CREATE POLICY "Users can view org presentations"
    ON presentations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert org presentations" ON presentations;
CREATE POLICY "Users can insert org presentations"
    ON presentations FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update org presentations" ON presentations;
CREATE POLICY "Users can update org presentations"
    ON presentations FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete org presentations" ON presentations;
CREATE POLICY "Users can delete org presentations"
    ON presentations FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- ============================================
-- PASO 5: BONIFICACIONES MUNICIPALES IBI/ICIO
-- ============================================

-- Tabla de bonificaciones municipales
CREATE TABLE IF NOT EXISTS municipal_tax_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    municipality TEXT NOT NULL,
    province TEXT NOT NULL,
    autonomous_community TEXT NOT NULL,
    postal_code TEXT,
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    ibi_percentage DECIMAL(5, 2),
    ibi_duration_years INTEGER,
    ibi_conditions TEXT,
    
    icio_percentage DECIMAL(5, 2),
    icio_conditions TEXT,
    
    source_url TEXT,
    last_verified DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mtb_municipality ON municipal_tax_benefits(municipality);
CREATE INDEX IF NOT EXISTS idx_mtb_province ON municipal_tax_benefits(province);
CREATE INDEX IF NOT EXISTS idx_mtb_community ON municipal_tax_benefits(autonomous_community);
CREATE INDEX IF NOT EXISTS idx_mtb_active ON municipal_tax_benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_mtb_location ON municipal_tax_benefits 
USING GIST (ll_to_earth(latitude, longitude));

CREATE OR REPLACE FUNCTION update_mtb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mtb_updated_at ON municipal_tax_benefits;
CREATE TRIGGER mtb_updated_at
    BEFORE UPDATE ON municipal_tax_benefits
    FOR EACH ROW
    EXECUTE FUNCTION update_mtb_updated_at();

ALTER TABLE municipal_tax_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view municipal benefits" ON municipal_tax_benefits;
CREATE POLICY "Anyone can view municipal benefits"
    ON municipal_tax_benefits FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can modify municipal benefits" ON municipal_tax_benefits;
CREATE POLICY "Only admins can modify municipal benefits"
    ON municipal_tax_benefits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Función para buscar bonificaciones por proximidad
CREATE OR REPLACE FUNCTION find_nearby_benefits(
    search_lat DECIMAL,
    search_lng DECIMAL,
    radius_km INTEGER DEFAULT 50
)
RETURNS SETOF municipal_tax_benefits
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM municipal_tax_benefits
    WHERE is_active = true
    AND earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(search_lat, search_lng)
    ) <= (radius_km * 1000)
    ORDER BY earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(search_lat, search_lng)
    )
    LIMIT 1;
$$;

-- Datos de bonificaciones municipales (Aragón y comunidades cercanas)
INSERT INTO municipal_tax_benefits (
    municipality, province, autonomous_community,
    latitude, longitude,
    ibi_percentage, ibi_duration_years, ibi_conditions,
    icio_percentage, icio_conditions,
    source_url, last_verified
) VALUES
    -- ARAGÓN
    ('Zaragoza', 'Zaragoza', 'Aragón', 41.6488, -0.8891, 50.00, 3, 'Instalaciones de autoconsumo fotovoltaico con potencia ≥3kW', 95.00, 'Instalaciones de energías renovables', 'https://www.zaragoza.es/sede/portal/hacienda/ordenanzas-fiscales', '2024-12-10'),
    ('Huesca', 'Huesca', 'Aragón', 42.1401, -0.4080, 50.00, 3, 'Instalaciones fotovoltaicas de autoconsumo', 95.00, 'Instalaciones de energías renovables', NULL, '2024-12-10'),
    ('Teruel', 'Teruel', 'Aragón', 40.3456, -1.1065, 50.00, 3, 'Instalaciones de energía solar', 95.00, 'Energías renovables', NULL, '2024-12-10'),
    
    -- MADRID
    ('Madrid', 'Madrid', 'Comunidad de Madrid', 40.4168, -3.7038, 50.00, 3, 'Instalaciones de autoconsumo fotovoltaico', 95.00, 'Instalaciones sostenibles y energías renovables', 'https://www.madrid.es/portales/munimadrid/es/Inicio/Ayuntamiento/Hacienda-y-Administracion-Publica/Ordenanzas-Fiscales', '2024-12-10'),
    
    -- NAVARRA
    ('Pamplona', 'Navarra', 'Navarra', 42.8125, -1.6458, 50.00, 3, 'Instalaciones de autoconsumo fotovoltaico', 95.00, 'Instalaciones de energías renovables', NULL, '2024-12-10'),
    
    -- CATALUÑA
    ('Barcelona', 'Barcelona', 'Cataluña', 41.3851, 2.1734, 50.00, 3, 'Instalaciones fotovoltaicas de autoconsumo', 95.00, 'Instalaciones de energías renovables', 'https://www.barcelona.cat/ca/ordenances-fiscals', '2024-12-10'),
    ('Lleida', 'Lleida', 'Cataluña', 41.6176, 0.6200, 50.00, 3, 'Instalaciones fotovoltaicas', 95.00, 'Energías renovables', NULL, '2024-12-10'),
    
    -- COMUNIDAD VALENCIANA
    ('Valencia', 'Valencia', 'Comunidad Valenciana', 39.4699, -0.3763, 50.00, 3, 'Instalaciones de autoconsumo con potencia ≥5kW', 95.00, 'Instalaciones de energías renovables', 'https://www.valencia.es/ayuntamiento/ordenanzas.nsf', '2024-12-10'),
    
    -- CASTILLA-LA MANCHA
    ('Toledo', 'Toledo', 'Castilla-La Mancha', 39.8628, -4.0273, 50.00, 3, 'Instalaciones de autoconsumo fotovoltaico', 95.00, 'Instalaciones de energías renovables', NULL, '2024-12-10'),
    ('Guadalajara', 'Guadalajara', 'Castilla-La Mancha', 40.6331, -3.1672, 50.00, 3, 'Instalaciones de autoconsumo', 95.00, 'Energías renovables', NULL, '2024-12-10'),
    
    -- LA RIOJA
    ('Logroño', 'La Rioja', 'La Rioja', 42.4627, -2.4450, 50.00, 3, 'Instalaciones de autoconsumo fotovoltaico', 95.00, 'Instalaciones de energías renovables', NULL, '2024-12-10')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 'Script maestro ejecutado correctamente' AS status;

-- Verificar tablas creadas
SELECT 
    'subsidies' AS tabla,
    COUNT(*) AS registros
FROM subsidies
UNION ALL
SELECT 
    'subsidy_applications' AS tabla,
    COUNT(*) AS registros
FROM subsidy_applications
UNION ALL
SELECT 
    'organization_settings' AS tabla,
    COUNT(*) AS registros
FROM organization_settings
UNION ALL
SELECT 
    'presentations' AS tabla,
    COUNT(*) AS registros
FROM presentations
UNION ALL
SELECT 
    'municipal_tax_benefits' AS tabla,
    COUNT(*) AS registros
FROM municipal_tax_benefits;

-- Verificar bonificaciones por comunidad
SELECT 
    autonomous_community,
    COUNT(*) as municipios
FROM municipal_tax_benefits
GROUP BY autonomous_community
ORDER BY autonomous_community;
