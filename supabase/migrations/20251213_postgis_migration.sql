-- ============================================================================
-- SOLISTECH PRO - POSTGIS MIGRATION
-- ============================================================================
-- Description: Enables PostGIS extension and adds GEOGRAPHY columns
--              for optimized geospatial queries.
-- Date: 2025-12-13
-- ============================================================================

-- 1. ENABLE POSTGIS EXTENSION
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. ADD GEOGRAPHY COLUMN TO PROJECTS
-- This allows spatial queries like ST_DWithin, ST_Distance
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location_geo GEOGRAPHY(POINT, 4326);

-- Migrate existing JSONB location data to the new GEOGRAPHY column
UPDATE projects 
SET location_geo = ST_SetSRID(
    ST_MakePoint(
        (location->>'lng')::float, 
        (location->>'lat')::float
    ), 
    4326
)::geography 
WHERE location IS NOT NULL 
  AND location->>'lat' IS NOT NULL 
  AND location->>'lng' IS NOT NULL
  AND location_geo IS NULL;

-- Create spatial index for fast proximity queries
CREATE INDEX IF NOT EXISTS idx_projects_location_geo ON projects USING GIST(location_geo);

-- 3. ADD GEOGRAPHY COLUMNS TO TIME_ENTRIES
-- For precise clock-in/out location tracking
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS clock_in_geo GEOGRAPHY(POINT, 4326);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS clock_out_geo GEOGRAPHY(POINT, 4326);

-- Migrate existing lat/lng numeric columns
UPDATE time_entries 
SET clock_in_geo = ST_SetSRID(ST_MakePoint(lng_in::float, lat_in::float), 4326)::geography 
WHERE lat_in IS NOT NULL AND lng_in IS NOT NULL AND clock_in_geo IS NULL;

UPDATE time_entries 
SET clock_out_geo = ST_SetSRID(ST_MakePoint(lng_out::float, lat_out::float), 4326)::geography 
WHERE lat_out IS NOT NULL AND lng_out IS NOT NULL AND clock_out_geo IS NULL;

-- Spatial indexes for time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in_geo ON time_entries USING GIST(clock_in_geo);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_out_geo ON time_entries USING GIST(clock_out_geo);

-- 4. HELPER FUNCTION: Find projects within radius
CREATE OR REPLACE FUNCTION projects_within_radius(
    p_lat float, 
    p_lng float, 
    p_radius_meters float
)
RETURNS SETOF projects AS $$
    SELECT * FROM projects
    WHERE ST_DWithin(
        location_geo,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 5. HELPER FUNCTION: Get distance between two projects
CREATE OR REPLACE FUNCTION project_distance_meters(
    project_id_a UUID,
    project_id_b UUID
)
RETURNS float AS $$
DECLARE
    distance float;
BEGIN
    SELECT ST_Distance(a.location_geo, b.location_geo) INTO distance
    FROM projects a, projects b
    WHERE a.id = project_id_a AND b.id = project_id_b;
    RETURN distance;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Verification
SELECT 
    '✅ PostGIS Migration Completed' as status,
    (SELECT COUNT(*) FROM projects WHERE location_geo IS NOT NULL) as projects_with_geo,
    (SELECT COUNT(*) FROM time_entries WHERE clock_in_geo IS NOT NULL) as time_entries_with_geo;
