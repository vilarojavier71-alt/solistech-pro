-- ============================================
-- GRANTS DATABASE - Subvenciones por C.A.
-- ============================================
-- Tabla centralizada de subvenciones solares por Comunidad Autónoma

CREATE TABLE IF NOT EXISTS grants_db (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ubicación
    autonomous_community VARCHAR(50) NOT NULL,
    province VARCHAR(50),
    municipality VARCHAR(100),
    
    -- Tipo de subvención
    grant_type VARCHAR(100) NOT NULL CHECK (grant_type IN (
        'IRPF',
        'IBI',
        'ICIO',
        'SUBVENCION_DIRECTA',
        'BONIFICACION_TASA',
        'AYUDA_INSTALACION'
    )),
    
    -- Detalles IRPF
    irpf_percentage INTEGER CHECK (irpf_percentage IN (20, 40, 60)),
    irpf_max_amount DECIMAL(10,2),
    irpf_max_base DECIMAL(10,2), -- Base máxima deducible
    
    -- Detalles IBI
    ibi_percentage INTEGER CHECK (ibi_percentage >= 0 AND ibi_percentage <= 100),
    ibi_duration_years INTEGER CHECK (ibi_duration_years >= 0 AND ibi_duration_years <= 10),
    
    -- Detalles ICIO
    icio_percentage INTEGER CHECK (icio_percentage >= 0 AND icio_percentage <= 100),
    
    -- Subvenciones directas
    direct_grant_amount DECIMAL(10,2),
    direct_grant_percentage INTEGER,
    direct_grant_max_amount DECIMAL(10,2),
    
    -- Requisitos
    min_power_kwp DECIMAL(6,2),
    max_power_kwp DECIMAL(6,2),
    requires_certificate BOOLEAN DEFAULT false,
    requires_pre_registration BOOLEAN DEFAULT false,
    
    -- Vigencia
    valid_from DATE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Información adicional
    description TEXT,
    official_url TEXT,
    application_deadline DATE,
    budget_available DECIMAL(12,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT grants_db_location_check CHECK (
        autonomous_community IS NOT NULL
    ),
    CONSTRAINT grants_db_dates_check CHECK (
        valid_from <= COALESCE(valid_until, valid_from + INTERVAL '10 years')
    )
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_grants_db_ca ON grants_db(autonomous_community);
CREATE INDEX IF NOT EXISTS idx_grants_db_type ON grants_db(grant_type);
CREATE INDEX IF NOT EXISTS idx_grants_db_active ON grants_db(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_grants_db_dates ON grants_db(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_grants_db_province ON grants_db(province);
CREATE INDEX IF NOT EXISTS idx_grants_db_municipality ON grants_db(municipality);

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_grants_db_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grants_db_timestamp
    BEFORE UPDATE ON grants_db
    FOR EACH ROW
    EXECUTE FUNCTION update_grants_db_timestamp();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE grants_db ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer las subvenciones (son datos públicos)
CREATE POLICY grants_db_read_all ON grants_db
    FOR SELECT
    USING (true);

-- Solo admins pueden insertar/actualizar
CREATE POLICY grants_db_admin_write ON grants_db
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- DATOS INICIALES - Comunidades Autónomas
-- ============================================

-- IRPF Nacional (Real Decreto 1131/2020)
INSERT INTO grants_db (
    autonomous_community,
    grant_type,
    irpf_percentage,
    irpf_max_amount,
    irpf_max_base,
    valid_from,
    description,
    official_url
) VALUES
('NACIONAL', 'IRPF', 20, 2490, 12450, '2021-01-01', 
 'Deducción IRPF 20% hasta 12.450€ de base (máx. 2.490€)', 
 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-17264'),
('NACIONAL', 'IRPF', 40, 9960, 24900, '2021-01-01', 
 'Deducción IRPF 40% hasta 24.900€ de base (máx. 9.960€)', 
 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-17264'),
('NACIONAL', 'IRPF', 60, 22410, 37350, '2021-01-01', 
 'Deducción IRPF 60% hasta 37.350€ de base (máx. 22.410€)', 
 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-17264');

-- Comunidad de Madrid - IBI
INSERT INTO grants_db (
    autonomous_community,
    province,
    grant_type,
    ibi_percentage,
    ibi_duration_years,
    valid_from,
    description
) VALUES
('Madrid', 'Madrid', 'IBI', 50, 3, '2023-01-01', 
 'Bonificación 50% IBI durante 3 años en municipios adheridos');

-- Cataluña - IBI
INSERT INTO grants_db (
    autonomous_community,
    province,
    grant_type,
    ibi_percentage,
    ibi_duration_years,
    valid_from,
    description
) VALUES
('Cataluña', 'Barcelona', 'IBI', 50, 5, '2023-01-01', 
 'Bonificación 50% IBI durante 5 años'),
('Cataluña', 'Barcelona', 'ICIO', 95, NULL, '2023-01-01', 
 'Bonificación 95% en ICIO para instalaciones solares');

-- Andalucía - Subvenciones directas
INSERT INTO grants_db (
    autonomous_community,
    grant_type,
    direct_grant_percentage,
    direct_grant_max_amount,
    min_power_kwp,
    max_power_kwp,
    valid_from,
    valid_until,
    description,
    requires_pre_registration
) VALUES
('Andalucía', 'SUBVENCION_DIRECTA', 40, 3000, 3.0, 10.0, 
 '2024-01-01', '2024-12-31',
 'Subvención 40% del coste hasta 3.000€ para instalaciones entre 3-10 kWp',
 true);

-- País Vasco - IBI
INSERT INTO grants_db (
    autonomous_community,
    province,
    grant_type,
    ibi_percentage,
    ibi_duration_years,
    valid_from,
    description
) VALUES
('País Vasco', 'Vizcaya', 'IBI', 50, 4, '2023-01-01', 
 'Bonificación 50% IBI durante 4 años');

-- Comunidad Valenciana - ICIO + IBI
INSERT INTO grants_db (
    autonomous_community,
    province,
    grant_type,
    icio_percentage,
    valid_from,
    description
) VALUES
('Comunidad Valenciana', 'Valencia', 'ICIO', 95, '2023-01-01', 
 'Bonificación 95% en ICIO');

INSERT INTO grants_db (
    autonomous_community,
    province,
    grant_type,
    ibi_percentage,
    ibi_duration_years,
    valid_from,
    description
) VALUES
('Comunidad Valenciana', 'Valencia', 'IBI', 50, 3, '2023-01-01', 
 'Bonificación 50% IBI durante 3 años');

-- ============================================
-- FUNCIONES HELPER
-- ============================================

-- Función para obtener subvenciones aplicables a un proyecto
CREATE OR REPLACE FUNCTION get_applicable_grants(
    p_autonomous_community VARCHAR(50),
    p_province VARCHAR(50) DEFAULT NULL,
    p_municipality VARCHAR(100) DEFAULT NULL,
    p_power_kwp DECIMAL(6,2) DEFAULT NULL,
    p_reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    grant_id UUID,
    grant_type VARCHAR(100),
    irpf_percentage INTEGER,
    irpf_max_amount DECIMAL(10,2),
    ibi_percentage INTEGER,
    ibi_duration_years INTEGER,
    icio_percentage INTEGER,
    direct_grant_amount DECIMAL(10,2),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.grant_type,
        g.irpf_percentage,
        g.irpf_max_amount,
        g.ibi_percentage,
        g.ibi_duration_years,
        g.icio_percentage,
        g.direct_grant_amount,
        g.description
    FROM grants_db g
    WHERE g.is_active = true
        AND g.valid_from <= p_reference_date
        AND (g.valid_until IS NULL OR g.valid_until >= p_reference_date)
        AND (
            g.autonomous_community = p_autonomous_community
            OR g.autonomous_community = 'NACIONAL'
        )
        AND (g.province IS NULL OR g.province = p_province)
        AND (g.municipality IS NULL OR g.municipality = p_municipality)
        AND (g.min_power_kwp IS NULL OR p_power_kwp IS NULL OR p_power_kwp >= g.min_power_kwp)
        AND (g.max_power_kwp IS NULL OR p_power_kwp IS NULL OR p_power_kwp <= g.max_power_kwp)
    ORDER BY 
        CASE 
            WHEN g.municipality IS NOT NULL THEN 1
            WHEN g.province IS NOT NULL THEN 2
            WHEN g.autonomous_community != 'NACIONAL' THEN 3
            ELSE 4
        END,
        g.grant_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE grants_db IS 'Base de datos centralizada de subvenciones solares por Comunidad Autónoma';
COMMENT ON COLUMN grants_db.grant_type IS 'Tipo de subvención: IRPF, IBI, ICIO, SUBVENCION_DIRECTA, etc.';
COMMENT ON COLUMN grants_db.irpf_percentage IS 'Porcentaje de deducción IRPF (20, 40 o 60%)';
COMMENT ON COLUMN grants_db.ibi_percentage IS 'Porcentaje de bonificación IBI (0-100%)';
COMMENT ON COLUMN grants_db.ibi_duration_years IS 'Duración de la bonificación IBI en años';
COMMENT ON COLUMN grants_db.icio_percentage IS 'Porcentaje de bonificación ICIO (0-100%)';
COMMENT ON FUNCTION get_applicable_grants IS 'Obtiene las subvenciones aplicables a un proyecto según ubicación y potencia';
