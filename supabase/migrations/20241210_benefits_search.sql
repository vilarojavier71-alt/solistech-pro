-- ============================================
-- BUSCADOR INTELIGENTE DE AYUDAS MUNICIPALES
-- Funciones SQL para búsqueda fuzzy y sugerencias
-- ============================================

-- Extensión para búsqueda de similitud de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice para búsqueda fuzzy en municipios
CREATE INDEX IF NOT EXISTS idx_mtb_municipality_trgm 
ON municipal_tax_benefits USING gin (municipality gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mtb_province_trgm 
ON municipal_tax_benefits USING gin (province gin_trgm_ops);

-- ============================================
-- FUNCIÓN: Búsqueda Fuzzy de Municipios
-- ============================================

CREATE OR REPLACE FUNCTION search_municipalities_fuzzy(
    search_term TEXT,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    municipality TEXT,
    province TEXT,
    autonomous_community TEXT,
    scope_level TEXT,
    similarity_score REAL,
    ibi_percentage DECIMAL(5,2),
    icio_percentage DECIMAL(5,2)
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        mtb.id,
        mtb.municipality,
        mtb.province,
        mtb.autonomous_community,
        mtb.scope_level,
        GREATEST(
            similarity(COALESCE(mtb.municipality, ''), search_term),
            similarity(COALESCE(mtb.province, ''), search_term)
        ) as similarity_score,
        mtb.ibi_percentage,
        mtb.icio_percentage
    FROM municipal_tax_benefits mtb
    WHERE mtb.is_active = true
    AND (
        mtb.municipality % search_term
        OR mtb.province % search_term
        OR LOWER(mtb.municipality) LIKE LOWER('%' || search_term || '%')
        OR LOWER(mtb.province) LIKE LOWER('%' || search_term || '%')
    )
    ORDER BY similarity_score DESC, mtb.scope_level DESC
    LIMIT max_results;
$$;

COMMENT ON FUNCTION search_municipalities_fuzzy IS 'Búsqueda fuzzy de municipios con similitud de texto (tolerante a errores de escritura)';

-- ============================================
-- FUNCIÓN: Autocompletado de Municipios
-- ============================================

CREATE OR REPLACE FUNCTION autocomplete_municipalities(
    search_term TEXT,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    label TEXT,
    value TEXT,
    province TEXT,
    autonomous_community TEXT,
    scope_level TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        CASE 
            WHEN mtb.municipality IS NOT NULL THEN mtb.municipality || ', ' || COALESCE(mtb.province, mtb.autonomous_community)
            WHEN mtb.comarca IS NOT NULL THEN 'Comarca: ' || mtb.comarca || ' (' || mtb.autonomous_community || ')'
            ELSE mtb.autonomous_community || ' (Regional)'
        END as label,
        COALESCE(mtb.municipality, mtb.comarca, mtb.autonomous_community) as value,
        mtb.province,
        mtb.autonomous_community,
        mtb.scope_level
    FROM municipal_tax_benefits mtb
    WHERE mtb.is_active = true
    AND (
        LOWER(COALESCE(mtb.municipality, '')) LIKE LOWER(search_term || '%')
        OR LOWER(COALESCE(mtb.comarca, '')) LIKE LOWER(search_term || '%')
        OR LOWER(mtb.province) LIKE LOWER(search_term || '%')
        OR LOWER(mtb.autonomous_community) LIKE LOWER(search_term || '%')
    )
    ORDER BY 
        CASE mtb.scope_level 
            WHEN 'municipality' THEN 1
            WHEN 'comarca' THEN 2
            WHEN 'region' THEN 3
        END,
        mtb.municipality
    LIMIT max_results;
$$;

COMMENT ON FUNCTION autocomplete_municipalities IS 'Autocompletado para buscador de municipios';

-- ============================================
-- FUNCIÓN: Municipios Cercanos
-- ============================================

CREATE OR REPLACE FUNCTION find_nearby_municipalities(
    reference_lat DECIMAL,
    reference_lng DECIMAL,
    radius_km INTEGER DEFAULT 50,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    municipality TEXT,
    province TEXT,
    autonomous_community TEXT,
    distance_km DECIMAL,
    ibi_percentage DECIMAL(5,2),
    icio_percentage DECIMAL(5,2)
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        mtb.id,
        mtb.municipality,
        mtb.province,
        mtb.autonomous_community,
        ROUND(
            (earth_distance(
                ll_to_earth(mtb.latitude, mtb.longitude),
                ll_to_earth(reference_lat, reference_lng)
            ) / 1000)::numeric,
            1
        ) as distance_km,
        mtb.ibi_percentage,
        mtb.icio_percentage
    FROM municipal_tax_benefits mtb
    WHERE mtb.is_active = true
    AND mtb.scope_level = 'municipality'
    AND earth_distance(
        ll_to_earth(mtb.latitude, mtb.longitude),
        ll_to_earth(reference_lat, reference_lng)
    ) <= (radius_km * 1000)
    ORDER BY distance_km ASC
    LIMIT max_results;
$$;

COMMENT ON FUNCTION find_nearby_municipalities IS 'Encuentra municipios cercanos con bonificaciones dentro de un radio';

-- ============================================
-- VISTA: Resumen de Ayudas por Comunidad
-- ============================================

CREATE OR REPLACE VIEW benefits_summary AS
SELECT 
    autonomous_community,
    scope_level,
    COUNT(*) as total_municipalities,
    ROUND(AVG(ibi_percentage), 2) as avg_ibi_percentage,
    ROUND(AVG(icio_percentage), 2) as avg_icio_percentage,
    MIN(ibi_percentage) as min_ibi,
    MAX(ibi_percentage) as max_ibi
FROM municipal_tax_benefits
WHERE is_active = true
GROUP BY autonomous_community, scope_level
ORDER BY autonomous_community, scope_level;

COMMENT ON VIEW benefits_summary IS 'Resumen estadístico de bonificaciones por comunidad autónoma';

-- Verificación
SELECT 'Buscador inteligente de ayudas municipales creado correctamente' AS status;

-- Probar búsqueda fuzzy
SELECT * FROM search_municipalities_fuzzy('zaragosa', 5); -- Con error de escritura
SELECT * FROM autocomplete_municipalities('zar', 5);
