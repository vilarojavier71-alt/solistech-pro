-- Función SQL para buscar bonificaciones por proximidad
-- Encuentra el municipio más cercano con bonificaciones dentro de un radio

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
    ) <= (radius_km * 1000) -- Convertir km a metros
    ORDER BY earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(search_lat, search_lng)
    )
    LIMIT 1;
$$;

COMMENT ON FUNCTION find_nearby_benefits IS 'Encuentra el municipio más cercano con bonificaciones fiscales dentro de un radio especificado';
