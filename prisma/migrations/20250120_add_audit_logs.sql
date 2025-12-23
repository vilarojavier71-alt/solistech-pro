-- ============================================================================
-- MIGRATION: Audit Logs Table (ISO 27001 A.8.15 Compliance)
-- ============================================================================
-- Crea tabla inmutable para logs de auditoría
-- Fecha: 2025-01-20
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para consultas rápidas
    CONSTRAINT audit_logs_event_type_check CHECK (event_type ~ '^[a-z]+\.[a-z]+(\.[a-z]+)?$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_timestamp ON audit_logs(organization_id, timestamp DESC) WHERE organization_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON TABLE audit_logs IS 'Logs de auditoría inmutables para cumplimiento ISO 27001 A.8.15';
COMMENT ON COLUMN audit_logs.event_type IS 'Tipo de evento (formato: resource.action)';
COMMENT ON COLUMN audit_logs.metadata IS 'Metadatos adicionales del evento (JSON)';
COMMENT ON COLUMN audit_logs.timestamp IS 'Timestamp del evento (inmutable)';

-- Política de retención (opcional - implementar con job de limpieza)
-- Los logs deben retenerse por mínimo 1 año para cumplimiento

