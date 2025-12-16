-- ============================================
-- SCRIPT CONSOLIDADO: SISTEMA COMPLETO DE SUBVENCIONES
-- Ejecutar TODO este script en Supabase SQL Editor
-- ============================================

-- PASO 1: Tabla de Subvenciones Regionales (si no existe)
-- --------------------------------------------------------
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

-- Datos de subvenciones (solo si la tabla está vacía)
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until)
SELECT * FROM (VALUES
    ('Comunidad Valenciana', 'direct_grant', 40.00, 3000.00, 'Ayuda Next Generation EU - Hasta 40% del presupuesto con tope de 3.000€', '2024-01-01'::date, '2026-02-27'::date),
    ('Comunidad Valenciana', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40% por reducción de consumo energético ≥30%', '2024-01-01'::date, '2026-12-31'::date),
    ('Madrid', 'direct_grant', 30.00, NULL, 'Subvención directa fondos autonómicos (30% de la inversión)', '2024-01-01'::date, '2025-12-31'::date),
    ('Madrid', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40% por reducción de consumo energético', '2024-01-01'::date, '2026-12-31'::date),
    ('Cataluña', 'direct_grant', 40.00, NULL, 'Fondos NextGen con línea específica para baterías (40%)', '2025-01-01'::date, '2026-12-31'::date),
    ('Andalucía', 'direct_grant', 35.00, NULL, 'Subvención autonómica para autoconsumo (35%)', '2024-01-01'::date, '2025-12-31'::date)
) AS v(region, subsidy_type, percentage, max_amount, description, valid_from, valid_until)
WHERE NOT EXISTS (SELECT 1 FROM subsidies LIMIT 1);


-- PASO 2: Tabla de Expedientes de Subvenciones
-- --------------------------------------------------------
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


-- PASO 3: Tabla de Documentos
-- --------------------------------------------------------
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
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 'Tablas creadas correctamente' AS status;

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
    'subsidy_documents' AS tabla,
    COUNT(*) AS registros
FROM subsidy_documents;
