-- Migration: create_calculations_and_presentations_tables
-- Description: Create missing calculations and presentations tables for Solar Calculator
-- Run this on production database to fix: "The table public.calculations does not exist"
-- Date: 2025-12-23
-- Create calculations table if not exists
CREATE TABLE IF NOT EXISTS calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    name TEXT,
    system_size_kwp DECIMAL(10, 2),
    estimated_production_kwh DECIMAL(12, 2),
    estimated_savings DECIMAL(12, 2),
    location JSONB,
    components JSONB,
    pvgis_data JSONB,
    subsidy_irpf_type TEXT DEFAULT '40',
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    CONSTRAINT fk_calculations_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_calculations_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE
    SET NULL
);
-- Create indexes for calculations
CREATE INDEX IF NOT EXISTS idx_calculations_organization ON calculations(organization_id);
CREATE INDEX IF NOT EXISTS idx_calculations_project ON calculations(project_id);
-- Create presentations table if not exists
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID,
    project_id UUID,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    original_photo_url TEXT,
    simulated_photo_url TEXT,
    powerpoint_url TEXT,
    fiscal_deduction_type TEXT,
    calculation_data JSONB,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    CONSTRAINT fk_presentations_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_presentations_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE
    SET NULL,
        CONSTRAINT fk_presentations_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE
    SET NULL
);
-- Create index for presentations
CREATE INDEX IF NOT EXISTS idx_presentations_org_project ON presentations(organization_id, project_id);
-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('calculations', 'presentations');