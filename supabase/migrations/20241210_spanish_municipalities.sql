-- ============================================
-- DATASET COMPLETO DE MUNICIPIOS ESPAÑOLES
-- Base de datos del INE (Instituto Nacional de Estadística)
-- ============================================

-- Tabla de municipios españoles (8.131 municipios)
CREATE TABLE IF NOT EXISTS spanish_municipalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Código INE
    ine_code TEXT UNIQUE NOT NULL,
    
    -- Ubicación
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    autonomous_community TEXT NOT NULL,
    
    -- Datos demográficos
    population INTEGER,
    postal_codes TEXT[], -- Array de códigos postales
    
    -- Coordenadas (centro del municipio)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_spanish_mun_name ON spanish_municipalities(name);
CREATE INDEX IF NOT EXISTS idx_spanish_mun_province ON spanish_municipalities(province);
CREATE INDEX IF NOT EXISTS idx_spanish_mun_community ON spanish_municipalities(autonomous_community);
CREATE INDEX IF NOT EXISTS idx_spanish_mun_name_trgm ON spanish_municipalities USING gin (name gin_trgm_ops);

-- ============================================
-- TABLA DE BÚSQUEDAS CON IA (CACHÉ)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_benefit_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Municipio buscado
    municipality_id UUID REFERENCES spanish_municipalities(id),
    municipality_name TEXT NOT NULL,
    province TEXT NOT NULL,
    autonomous_community TEXT NOT NULL,
    
    -- Resultado de la búsqueda con IA
    ibi_percentage DECIMAL(5,2),
    ibi_duration_years INTEGER,
    ibi_conditions TEXT,
    icio_percentage DECIMAL(5,2),
    icio_conditions TEXT,
    
    -- Metadatos de la búsqueda
    source_url TEXT,
    ordinance_text TEXT, -- Texto completo de la ordenanza (primeros 10k caracteres)
    ai_model TEXT DEFAULT 'gpt-4-turbo',
    confidence_score DECIMAL(3,2), -- 0.0 - 1.0
    
    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'searching', 'found', 'not_found', 'error')),
    error_message TEXT,
    search_duration_seconds INTEGER,
    
    -- Verificación manual
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- Costes
    ai_cost_usd DECIMAL(6,4), -- Coste de la búsqueda con IA
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_searches_municipality ON ai_benefit_searches(municipality_name, province);
CREATE INDEX IF NOT EXISTS idx_ai_searches_status ON ai_benefit_searches(status);
CREATE INDEX IF NOT EXISTS idx_ai_searches_verified ON ai_benefit_searches(verified);

-- ============================================
-- FUNCIÓN: Autocompletado Universal de Municipios
-- ============================================

CREATE OR REPLACE FUNCTION autocomplete_all_municipalities(
    search_term TEXT,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    label TEXT,
    value TEXT,
    province TEXT,
    autonomous_community TEXT,
    population INTEGER,
    has_benefits BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        sm.name || ', ' || sm.province as label,
        sm.name as value,
        sm.province,
        sm.autonomous_community,
        sm.population,
        EXISTS(
            SELECT 1 FROM municipal_tax_benefits mtb 
            WHERE LOWER(mtb.municipality) = LOWER(sm.name) 
            AND mtb.is_active = true
        ) as has_benefits
    FROM spanish_municipalities sm
    WHERE 
        LOWER(sm.name) LIKE LOWER(search_term || '%')
        OR LOWER(sm.province) LIKE LOWER(search_term || '%')
    ORDER BY 
        -- Priorizar municipios con bonificaciones conocidas
        has_benefits DESC,
        -- Luego por población (más grandes primero)
        sm.population DESC NULLS LAST,
        -- Finalmente por nombre
        sm.name
    LIMIT max_results;
$$;

COMMENT ON FUNCTION autocomplete_all_municipalities IS 'Autocompletado de todos los municipios de España con indicador de bonificaciones disponibles';

-- ============================================
-- DATOS INICIALES: Principales Municipios
-- ============================================

-- Insertar los 50 municipios más grandes de España
-- (El dataset completo de 8.131 se cargará desde un archivo JSON)

INSERT INTO spanish_municipalities (ine_code, name, province, autonomous_community, population, latitude, longitude) VALUES
    ('28079', 'Madrid', 'Madrid', 'Comunidad de Madrid', 3223334, 40.4168, -3.7038),
    ('08019', 'Barcelona', 'Barcelona', 'Cataluña', 1620343, 41.3851, 2.1734),
    ('46250', 'Valencia', 'Valencia', 'Comunidad Valenciana', 791413, 39.4699, -0.3763),
    ('41091', 'Sevilla', 'Sevilla', 'Andalucía', 688711, 37.3891, -5.9845),
    ('50297', 'Zaragoza', 'Zaragoza', 'Aragón', 674997, 41.6488, -0.8891),
    ('29067', 'Málaga', 'Málaga', 'Andalucía', 574654, 36.7213, -4.4214),
    ('07040', 'Palma', 'Islas Baleares', 'Islas Baleares', 416065, 39.5696, 2.6502),
    ('35016', 'Las Palmas de Gran Canaria', 'Las Palmas', 'Canarias', 379925, 28.1248, -15.4300),
    ('48020', 'Bilbao', 'Vizcaya', 'País Vasco', 345821, 43.2630, -2.9350),
    ('03014', 'Alicante', 'Alicante', 'Comunidad Valenciana', 334757, 38.3452, -0.4810),
    ('30030', 'Murcia', 'Murcia', 'Región de Murcia', 453258, 37.9922, -1.1307),
    ('11012', 'Cádiz', 'Cádiz', 'Andalucía', 116027, 36.5297, -6.2920),
    ('20069', 'San Sebastián', 'Guipúzcoa', 'País Vasco', 186665, 43.3183, -1.9812),
    ('33044', 'Oviedo', 'Asturias', 'Principado de Asturias', 220020, 43.3614, -5.8494),
    ('15030', 'A Coruña', 'A Coruña', 'Galicia', 245711, 43.3623, -8.4115),
    ('45168', 'Toledo', 'Toledo', 'Castilla-La Mancha', 85449, 39.8628, -4.0273),
    ('02003', 'Albacete', 'Albacete', 'Castilla-La Mancha', 173329, 38.9943, -1.8585),
    ('26089', 'Logroño', 'La Rioja', 'La Rioja', 151113, 42.4627, -2.4450),
    ('31201', 'Pamplona', 'Navarra', 'Navarra', 201653, 42.8125, -1.6458),
    ('22125', 'Huesca', 'Huesca', 'Aragón', 52443, 42.1401, -0.4080),
    ('44216', 'Teruel', 'Teruel', 'Aragón', 35675, 40.3456, -1.1065)
ON CONFLICT (ine_code) DO NOTHING;

-- Verificación
SELECT 'Dataset de municipios españoles creado correctamente' AS status;

SELECT 
    autonomous_community,
    COUNT(*) as total_municipios,
    SUM(population) as poblacion_total
FROM spanish_municipalities
GROUP BY autonomous_community
ORDER BY total_municipios DESC;
