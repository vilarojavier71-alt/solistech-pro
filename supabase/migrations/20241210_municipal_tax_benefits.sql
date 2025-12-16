-- SISTEMA DE BONIFICACIONES MUNICIPALES IBI/ICIO
-- Base de datos de bonificaciones fiscales por municipio

CREATE TABLE IF NOT EXISTS municipal_tax_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ubicación
    municipality TEXT NOT NULL,
    province TEXT NOT NULL,
    autonomous_community TEXT NOT NULL,
    postal_code TEXT,
    
    -- Coordenadas para geocodificación
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Bonificación IBI (Impuesto sobre Bienes Inmuebles)
    ibi_percentage DECIMAL(5, 2), -- 50.00 = 50%
    ibi_duration_years INTEGER,   -- Años de bonificación
    ibi_conditions TEXT,           -- Requisitos específicos
    
    -- Bonificación ICIO (Impuesto sobre Construcciones, Instalaciones y Obras)
    icio_percentage DECIMAL(5, 2),
    icio_conditions TEXT,
    
    -- Metadatos
    source_url TEXT,               -- URL de la ordenanza fiscal
    last_verified DATE,            -- Última verificación de datos
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_mtb_municipality ON municipal_tax_benefits(municipality);
CREATE INDEX IF NOT EXISTS idx_mtb_province ON municipal_tax_benefits(province);
CREATE INDEX IF NOT EXISTS idx_mtb_community ON municipal_tax_benefits(autonomous_community);
CREATE INDEX IF NOT EXISTS idx_mtb_active ON municipal_tax_benefits(is_active);

-- Índice espacial para búsqueda por coordenadas (radio)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE INDEX IF NOT EXISTS idx_mtb_location ON municipal_tax_benefits 
USING GIST (ll_to_earth(latitude, longitude));

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_mtb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mtb_updated_at
    BEFORE UPDATE ON municipal_tax_benefits
    FOR EACH ROW
    EXECUTE FUNCTION update_mtb_updated_at();

-- RLS (Row Level Security)
ALTER TABLE municipal_tax_benefits ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer (datos públicos)
CREATE POLICY "Anyone can view municipal benefits"
    ON municipal_tax_benefits FOR SELECT
    USING (is_active = true);

-- Política: Solo admins pueden modificar
CREATE POLICY "Only admins can modify municipal benefits"
    ON municipal_tax_benefits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

COMMENT ON TABLE municipal_tax_benefits IS 'Bonificaciones fiscales municipales (IBI/ICIO) para instalaciones solares';
COMMENT ON COLUMN municipal_tax_benefits.ibi_percentage IS 'Porcentaje de bonificación del IBI (ej: 50.00 = 50%)';
COMMENT ON COLUMN municipal_tax_benefits.ibi_duration_years IS 'Años de duración de la bonificación IBI';
COMMENT ON COLUMN municipal_tax_benefits.icio_percentage IS 'Porcentaje de bonificación del ICIO (ej: 95.00 = 95%)';
