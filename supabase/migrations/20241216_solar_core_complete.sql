-- ============================================================================
-- MIGRACIÓN CONSOLIDADA: Solar Core + Portal Cliente
-- Fecha: 16 Diciembre 2024
-- Descripción: Campos de negocio solar, transacciones ACID, documentos pingpong
-- ============================================================================
BEGIN;
-- ============================================================================
-- 1. CAMPOS SOLAR CORE EN PROJECTS
-- ============================================================================
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS solar_phase VARCHAR(50) DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engineer_verdict JSONB,
    ADD COLUMN IF NOT EXISTS contract_url TEXT;
-- Comentarios descriptivos
COMMENT ON COLUMN projects.solar_phase IS 'Estado del proyecto: DRAFT, PHASE_0A, PHASE_0B, PHASE_1_DOCS, PHASE_2_REVIEW, APPROVED, CORRECTIONS, COMPLETED';
COMMENT ON COLUMN projects.payment_status IS 'Estado de pago: PENDING, PAID, REFUNDED';
COMMENT ON COLUMN projects.total_amount IS 'Monto total del proyecto en EUR (DECIMAL para precisión financiera)';
COMMENT ON COLUMN projects.engineer_verdict IS 'Veredicto de ingeniería: {verdict: OK|REJECT, reason: string, reviewed_by: string, reviewed_at: timestamp}';
-- ============================================================================
-- 2. TABLA DE TRANSACCIONES FINANCIERAS (ACID)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    processed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_transactions_project ON project_transactions (project_id, created_at DESC);
COMMENT ON TABLE project_transactions IS 'Registro de transacciones financieras con referencia única para evitar duplicados';
-- ============================================================================
-- 3. TABLA DE DOCUMENTOS (FLUJO PING-PONG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    -- DNI, FACTURA_LUZ, CONTRATO, CIE, OTRO
    status VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING, UPLOADED, REJECTED, APPROVED
    url TEXT,
    file_name VARCHAR(255),
    rejection_reason TEXT,
    -- Feedback del ingeniero
    uploaded_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_type ON project_documents (project_id, type);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_status ON project_documents (project_id, status);
COMMENT ON TABLE project_documents IS 'Documentos del proyecto con flujo de aprobación/rechazo';
COMMENT ON COLUMN project_documents.rejection_reason IS 'Motivo de rechazo para feedback al cliente';
-- ============================================================================
-- 4. PERMISOS RBAC SOLAR CORE
-- ============================================================================
INSERT INTO role_permissions (role, permission_slug)
VALUES -- Permisos Solar Core
    ('owner', 'solar:create-sale'),
    ('owner', 'solar:view-all'),
    ('owner', 'finance:reconcile'),
    ('owner', 'engineering:review'),
    ('admin', 'solar:create-sale'),
    ('admin', 'solar:view-all'),
    ('admin', 'finance:reconcile'),
    ('admin', 'engineering:review'),
    -- Comercial solo crea ventas
    ('comercial', 'solar:create-sale'),
    ('comercial', 'solar:view-own'),
    -- Tesorería solo concilia
    ('tesoreria', 'finance:reconcile'),
    ('tesoreria', 'solar:view-all'),
    -- Ingeniería solo revisa
    ('ingenieria', 'engineering:review'),
    ('ingenieria', 'solar:view-all'),
    -- Cliente portal
    ('cliente', 'client:view-own-project'),
    ('cliente', 'client:upload-documents'),
    ('cliente', 'client:view-documents') ON CONFLICT (role, permission_slug) DO NOTHING;
-- ============================================================================
-- 5. ÍNDICES DE PERFORMANCE
-- ============================================================================
-- Índice para consultas de portal cliente
CREATE INDEX IF NOT EXISTS idx_projects_client_portal ON projects (client_id, client_portal_enabled)
WHERE client_portal_enabled = true;
-- Índice para fase solar
CREATE INDEX IF NOT EXISTS idx_projects_solar_phase ON projects (organization_id, solar_phase);
-- ============================================================================
-- 6. TRIGGER PARA UPDATED_AT AUTOMÁTICO
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_project_documents_updated_at ON project_documents;
CREATE TRIGGER update_project_documents_updated_at BEFORE
UPDATE ON project_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
COMMIT;