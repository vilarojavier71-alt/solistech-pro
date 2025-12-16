-- ============================================
-- ACTUALIZACIÓN: SISTEMA DE BONIFICACIONES JERÁRQUICAS
-- Opción 1 con capacidad de evolución a Opción 3
-- ============================================

-- Primero, permitir NULL en municipality y province (para bonificaciones regionales/comarcales)
ALTER TABLE municipal_tax_benefits 
ALTER COLUMN municipality DROP NOT NULL,
ALTER COLUMN province DROP NOT NULL;

-- Modificar tabla existente para añadir jerarquía
ALTER TABLE municipal_tax_benefits 
ADD COLUMN IF NOT EXISTS comarca TEXT,
ADD COLUMN IF NOT EXISTS scope_level TEXT DEFAULT 'municipality' 
    CHECK (scope_level IN ('region', 'comarca', 'municipality')),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'official' 
    CHECK (source IN ('official', 'user_reported', 'verified')),
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Índice para búsqueda jerárquica eficiente
CREATE INDEX IF NOT EXISTS idx_mtb_hierarchy 
ON municipal_tax_benefits(autonomous_community, province, comarca, municipality);

CREATE INDEX IF NOT EXISTS idx_mtb_scope_level 
ON municipal_tax_benefits(scope_level);

CREATE INDEX IF NOT EXISTS idx_mtb_source 
ON municipal_tax_benefits(source);

-- Comentarios
COMMENT ON COLUMN municipal_tax_benefits.comarca IS 'Comarca o región dentro de la provincia (opcional)';
COMMENT ON COLUMN municipal_tax_benefits.scope_level IS 'Nivel jerárquico: region (toda la CA), comarca (zona específica), municipality (municipio concreto)';
COMMENT ON COLUMN municipal_tax_benefits.priority IS 'Prioridad de búsqueda: 1=region, 2=comarca, 3=municipality (menor número = mayor prioridad)';
COMMENT ON COLUMN municipal_tax_benefits.source IS 'Origen del dato: official (verificado), user_reported (reportado por usuario), verified (reportado y verificado)';

-- Actualizar prioridades según scope_level
UPDATE municipal_tax_benefits 
SET priority = CASE 
    WHEN scope_level = 'region' THEN 1
    WHEN scope_level = 'comarca' THEN 2
    WHEN scope_level = 'municipality' THEN 3
    ELSE 3
END;

-- ============================================
-- FUNCIÓN MEJORADA: Búsqueda Jerárquica
-- ============================================

CREATE OR REPLACE FUNCTION find_benefits_hierarchical(
    search_municipality TEXT,
    search_province TEXT DEFAULT NULL,
    search_comarca TEXT DEFAULT NULL,
    search_community TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    municipality TEXT,
    province TEXT,
    comarca TEXT,
    autonomous_community TEXT,
    scope_level TEXT,
    ibi_percentage DECIMAL(5,2),
    ibi_duration_years INTEGER,
    ibi_conditions TEXT,
    icio_percentage DECIMAL(5,2),
    icio_conditions TEXT,
    source_url TEXT,
    priority INTEGER
)
LANGUAGE sql
STABLE
AS $$
    -- Búsqueda en cascada: municipio → comarca → región
    
    -- 1. Buscar municipio exacto
    SELECT 
        mtb.id,
        mtb.municipality,
        mtb.province,
        mtb.comarca,
        mtb.autonomous_community,
        mtb.scope_level,
        mtb.ibi_percentage,
        mtb.ibi_duration_years,
        mtb.ibi_conditions,
        mtb.icio_percentage,
        mtb.icio_conditions,
        mtb.source_url,
        mtb.priority
    FROM municipal_tax_benefits mtb
    WHERE mtb.is_active = true
    AND LOWER(mtb.municipality) = LOWER(search_municipality)
    AND (search_province IS NULL OR LOWER(mtb.province) = LOWER(search_province))
    AND mtb.scope_level = 'municipality'
    
    UNION ALL
    
    -- 2. Si no existe, buscar comarca
    SELECT 
        mtb.id,
        mtb.municipality,
        mtb.province,
        mtb.comarca,
        mtb.autonomous_community,
        mtb.scope_level,
        mtb.ibi_percentage,
        mtb.ibi_duration_years,
        mtb.ibi_conditions,
        mtb.icio_percentage,
        mtb.icio_conditions,
        mtb.source_url,
        mtb.priority
    FROM municipal_tax_benefits mtb
    WHERE mtb.is_active = true
    AND (search_comarca IS NOT NULL AND LOWER(mtb.comarca) = LOWER(search_comarca))
    AND (search_province IS NULL OR LOWER(mtb.province) = LOWER(search_province))
    AND mtb.scope_level = 'comarca'
    AND NOT EXISTS (
        SELECT 1 FROM municipal_tax_benefits m
        WHERE m.is_active = true
        AND LOWER(m.municipality) = LOWER(search_municipality)
        AND m.scope_level = 'municipality'
    )
    
    UNION ALL
    
    -- 3. Si no existe, buscar región
    SELECT 
        mtb.id,
        mtb.municipality,
        mtb.province,
        mtb.comarca,
        mtb.autonomous_community,
        mtb.scope_level,
        mtb.ibi_percentage,
        mtb.ibi_duration_years,
        mtb.ibi_conditions,
        mtb.icio_percentage,
        mtb.icio_conditions,
        mtb.source_url,
        mtb.priority
    FROM municipal_tax_benefits mtb
    WHERE mtb.is_active = true
    AND (search_community IS NOT NULL AND LOWER(mtb.autonomous_community) = LOWER(search_community))
    AND mtb.scope_level = 'region'
    AND NOT EXISTS (
        SELECT 1 FROM municipal_tax_benefits m
        WHERE m.is_active = true
        AND (
            (LOWER(m.municipality) = LOWER(search_municipality) AND m.scope_level = 'municipality')
            OR
            (search_comarca IS NOT NULL AND LOWER(m.comarca) = LOWER(search_comarca) AND m.scope_level = 'comarca')
        )
    )
    
    ORDER BY priority ASC
    LIMIT 1;
$$;

COMMENT ON FUNCTION find_benefits_hierarchical IS 'Busca bonificaciones con lógica jerárquica: municipio → comarca → región';

-- ============================================
-- DATOS INICIALES: Bonificaciones Regionales
-- ============================================

-- Insertar bonificaciones a nivel REGIONAL (por defecto para toda la CA)
INSERT INTO municipal_tax_benefits (
    autonomous_community, province, comarca, municipality,
    scope_level, priority,
    latitude, longitude,
    ibi_percentage, ibi_duration_years, ibi_conditions,
    icio_percentage, icio_conditions,
    source, last_verified
) VALUES
    -- Aragón (Regional - por defecto)
    ('Aragón', NULL, NULL, NULL,
     'region', 1,
     41.6488, -0.8891,
     50.00, 3, 'Bonificación general de Aragón para instalaciones fotovoltaicas',
     95.00, 'Bonificación general de Aragón',
     'official', '2024-12-10'),
    
    -- Madrid (Regional)
    ('Comunidad de Madrid', NULL, NULL, NULL,
     'region', 1,
     40.4168, -3.7038,
     50.00, 3, 'Bonificación general de Madrid',
     95.00, 'Bonificación general de Madrid',
     'official', '2024-12-10'),
    
    -- Cataluña (Regional)
    ('Cataluña', NULL, NULL, NULL,
     'region', 1,
     41.3851, 2.1734,
     50.00, 3, 'Bonificación general de Cataluña',
     95.00, 'Bonificación general de Cataluña',
     'official', '2024-12-10'),
    
    -- Comunidad Valenciana (Regional)
    ('Comunidad Valenciana', NULL, NULL, NULL,
     'region', 1,
     39.4699, -0.3763,
     50.00, 3, 'Bonificación general de la Comunidad Valenciana',
     95.00, 'Bonificación general de la Comunidad Valenciana',
     'official', '2024-12-10')
ON CONFLICT DO NOTHING;

-- Actualizar municipios existentes para marcarlos como nivel 'municipality'
UPDATE municipal_tax_benefits 
SET scope_level = 'municipality',
    priority = 3
WHERE municipality IS NOT NULL 
AND scope_level IS NULL;

-- ============================================
-- EJEMPLO: Añadir bonificaciones de COMARCA
-- ============================================

-- Comarca de Cinco Villas (Aragón) - Bonificación especial
INSERT INTO municipal_tax_benefits (
    autonomous_community, province, comarca, municipality,
    scope_level, priority,
    latitude, longitude,
    ibi_percentage, ibi_duration_years, ibi_conditions,
    icio_percentage, icio_conditions,
    source, last_verified
) VALUES
    ('Aragón', 'Zaragoza', 'Cinco Villas', NULL,
     'comarca', 2,
     42.1264, -1.1361,
     60.00, 4, 'Bonificación especial de la Comarca de Cinco Villas',
     95.00, 'Bonificación comarca',
     'official', '2024-12-10')
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLA PARA REPORTES DE USUARIOS (Preparación Opción 3)
-- ============================================

CREATE TABLE IF NOT EXISTS user_benefit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Usuario que reporta
    reported_by UUID REFERENCES users(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    
    -- Ubicación reportada
    municipality TEXT NOT NULL,
    province TEXT,
    comarca TEXT,
    autonomous_community TEXT NOT NULL,
    
    -- Bonificaciones reportadas
    ibi_percentage DECIMAL(5,2),
    ibi_duration_years INTEGER,
    ibi_conditions TEXT,
    icio_percentage DECIMAL(5,2),
    icio_conditions TEXT,
    
    -- Evidencia
    source_url TEXT,
    notes TEXT,
    attachment_url TEXT, -- PDF de la ordenanza
    
    -- Estado de verificación
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_benefit_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_municipality ON user_benefit_reports(municipality);

ALTER TABLE user_benefit_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden crear reportes
CREATE POLICY "Users can create benefit reports"
    ON user_benefit_reports FOR INSERT
    WITH CHECK (reported_by = auth.uid());

-- Policy: Usuarios ven sus propios reportes
CREATE POLICY "Users can view own reports"
    ON user_benefit_reports FOR SELECT
    USING (reported_by = auth.uid());

-- Policy: Solo admins pueden aprobar/rechazar
CREATE POLICY "Only admins can review reports"
    ON user_benefit_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

COMMENT ON TABLE user_benefit_reports IS 'Reportes de bonificaciones municipales enviados por usuarios (preparación para crowdsourcing)';

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Sistema de bonificaciones jerárquicas actualizado correctamente' AS status;

-- Ver estructura jerárquica
SELECT 
    scope_level,
    COUNT(*) as total,
    STRING_AGG(DISTINCT autonomous_community, ', ') as comunidades
FROM municipal_tax_benefits
WHERE is_active = true
GROUP BY scope_level
ORDER BY 
    CASE scope_level 
        WHEN 'region' THEN 1
        WHEN 'comarca' THEN 2
        WHEN 'municipality' THEN 3
    END;
