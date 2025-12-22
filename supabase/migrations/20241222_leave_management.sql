-- ============================================================================
-- MIGRATION: Leave Management System
-- Date: 2025-12-22
-- Description: Tables for vacation and leave balance tracking
-- ============================================================================
-- Employee leave balances (saldos de días por año)
CREATE TABLE IF NOT EXISTS employee_leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INT NOT NULL,
    -- Vacaciones reglamentarias
    vacation_days_total DECIMAL(5, 2) DEFAULT 22,
    vacation_days_used DECIMAL(5, 2) DEFAULT 0,
    vacation_days_pending DECIMAL(5, 2) DEFAULT 0,
    -- Días de libre disposición
    personal_days_total DECIMAL(5, 2) DEFAULT 3,
    personal_days_used DECIMAL(5, 2) DEFAULT 0,
    -- Días remunerados adicionales
    paid_days_total DECIMAL(5, 2) DEFAULT 0,
    paid_days_used DECIMAL(5, 2) DEFAULT 0,
    -- Metadatos
    hire_date DATE,
    contract_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, year)
);
CREATE INDEX IF NOT EXISTS idx_leave_balances_org_year ON employee_leave_balances(organization_id, year);
-- Leave requests (solicitudes de ausencia)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Tipo de ausencia
    leave_type VARCHAR(50) NOT NULL,
    -- vacation, personal, paid, sick, unpaid, other
    -- Período
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5, 2) NOT NULL,
    -- Estado
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, approved, rejected, cancelled
    reason TEXT,
    rejection_reason TEXT,
    -- Aprobación
    approved_by UUID REFERENCES users(id) ON DELETE
    SET NULL,
        approved_at TIMESTAMPTZ,
        -- Auditoría
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_org ON leave_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_leave_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_leave_balances_updated ON employee_leave_balances;
CREATE TRIGGER tr_leave_balances_updated BEFORE
UPDATE ON employee_leave_balances FOR EACH ROW EXECUTE FUNCTION update_leave_updated_at();
DROP TRIGGER IF EXISTS tr_leave_requests_updated ON leave_requests;
CREATE TRIGGER tr_leave_requests_updated BEFORE
UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_leave_updated_at();
-- Comentarios
COMMENT ON TABLE employee_leave_balances IS 'Saldos anuales de días de vacaciones y permisos por empleado';
COMMENT ON TABLE leave_requests IS 'Solicitudes de ausencia con workflow de aprobación';
COMMENT ON COLUMN employee_leave_balances.vacation_days_total IS 'Días de vacaciones según convenio (default 22 días laborables)';
COMMENT ON COLUMN employee_leave_balances.personal_days_total IS 'Días de asuntos propios (default 3 días)';
COMMENT ON COLUMN leave_requests.days_requested IS 'Puede incluir decimales para medias jornadas (0.5)';