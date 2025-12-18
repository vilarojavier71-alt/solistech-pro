-- MIGRATION: Schema Stabilization (2025-12-18)
-- Adds missing tables identified in QA Audit
-- Execute this in Production Database via SSH or SQL Client
BEGIN;
-- 1. Create payment_methods
CREATE TABLE IF NOT EXISTS "payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "payment_methods_organization_id_is_active_idx" ON "payment_methods"("organization_id", "is_active");
-- 2. Create calculations
CREATE TABLE IF NOT EXISTS "calculations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "project_id" UUID,
    "name" TEXT,
    "system_size_kwp" DECIMAL(10, 2),
    "estimated_production_kwh" DECIMAL(12, 2),
    "estimated_savings" DECIMAL(12, 2),
    "location" JSONB,
    "components" JSONB,
    "pvgis_data" JSONB,
    "subsidy_irpf_type" TEXT DEFAULT '40',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calculations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "calculations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calculations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE
    SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "calculations_organization_id_idx" ON "calculations"("organization_id");
CREATE INDEX IF NOT EXISTS "calculations_project_id_idx" ON "calculations"("project_id");
-- 3. Create presentations
CREATE TABLE IF NOT EXISTS "presentations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "customer_id" UUID,
    "project_id" UUID,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "original_photo_url" TEXT,
    "simulated_photo_url" TEXT,
    "powerpoint_url" TEXT,
    "fiscal_deduction_type" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presentations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "presentations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "presentations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE
    SET NULL ON UPDATE CASCADE,
        CONSTRAINT "presentations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE
    SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "presentations_organization_id_project_id_idx" ON "presentations"("organization_id", "project_id");
COMMIT;