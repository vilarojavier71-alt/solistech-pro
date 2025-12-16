-- ============================================================================
-- SOLISTECH PRO - DOCKER INITIALIZATION SCRIPT
-- ============================================================================
-- This script runs automatically when the PostgreSQL container starts
-- for the first time. It sets up all required extensions.
-- ============================================================================

-- Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Text search and fuzzy matching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Performance monitoring (optional)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Log success
DO $$
BEGIN
    RAISE NOTICE '✅ SolisTech Pro Extensions Initialized Successfully';
END $$;
