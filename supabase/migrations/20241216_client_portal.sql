-- ============================================================================
-- Migración: Portal Cliente - Campos de Seguimiento de Instalación
-- Fecha: 2024-12-16
-- Descripción: Agrega campos para tracking de fases de instalación solar
-- ============================================================================
-- 1. Agregar campos de seguimiento a la tabla projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS installation_phase INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS legalization_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS installation_date DATE,
    ADD COLUMN IF NOT EXISTS activation_date DATE,
    ADD COLUMN IF NOT EXISTS expected_completion DATE,
    ADD COLUMN IF NOT EXISTS client_portal_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS client_access_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assigned_technician_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS phase_notes TEXT;
-- 2. Crear índice para consultas de portal cliente
CREATE INDEX IF NOT EXISTS idx_projects_client_portal ON projects (client_id, client_portal_enabled)
WHERE client_portal_enabled = true;
-- 3. Crear tabla para historial de cambios de fase
CREATE TABLE IF NOT EXISTS project_phase_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_phase INTEGER,
    to_phase INTEGER NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_history_project ON project_phase_history (project_id, created_at DESC);
-- 4. Crear tabla de permisos por rol (si no existe)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_slug)
);
-- 5. Insertar permisos base para cada rol
INSERT INTO role_permissions (role, permission_slug)
VALUES -- Owner: acceso total
    ('owner', 'dashboard:view'),
    ('owner', 'calendar:view'),
    ('owner', 'calendar:manage'),
    ('owner', 'projects:view'),
    ('owner', 'projects:manage'),
    ('owner', 'crm:view'),
    ('owner', 'crm:manage'),
    ('owner', 'inventory:view'),
    ('owner', 'inventory:manage'),
    ('owner', 'calculator:use'),
    ('owner', 'solar-brain:use'),
    ('owner', 'import:use'),
    ('owner', 'time-tracking:view'),
    ('owner', 'time-tracking:manage'),
    ('owner', 'finance:view'),
    ('owner', 'finance:manage'),
    ('owner', 'settings:view'),
    ('owner', 'settings:manage'),
    ('owner', 'users:view'),
    ('owner', 'users:manage'),
    -- Admin: casi todo excepto settings críticos
    ('admin', 'dashboard:view'),
    ('admin', 'calendar:view'),
    ('admin', 'calendar:manage'),
    ('admin', 'projects:view'),
    ('admin', 'projects:manage'),
    ('admin', 'crm:view'),
    ('admin', 'crm:manage'),
    ('admin', 'inventory:view'),
    ('admin', 'inventory:manage'),
    ('admin', 'calculator:use'),
    ('admin', 'solar-brain:use'),
    ('admin', 'import:use'),
    ('admin', 'time-tracking:view'),
    ('admin', 'time-tracking:manage'),
    ('admin', 'finance:view'),
    ('admin', 'users:view'),
    ('admin', 'settings:view'),
    -- Employee: operativa básica
    ('employee', 'dashboard:view'),
    ('employee', 'calendar:view'),
    ('employee', 'projects:view'),
    ('employee', 'crm:view'),
    ('employee', 'calculator:use'),
    ('employee', 'time-tracking:view'),
    -- Cliente: solo su proyecto
    ('cliente', 'client:view-own-project'),
    ('cliente', 'client:view-documents'),
    ('cliente', 'client:download-invoice') ON CONFLICT (role, permission_slug) DO NOTHING;
-- 6. Comentarios descriptivos
COMMENT ON COLUMN projects.installation_phase IS 'Fase actual: 0=Pendiente, 1=Pago, 2=Diseño, 3=Permisos, 4=Material, 5=Instalación, 6=Legalización, 7=Activado';
COMMENT ON COLUMN projects.legalization_status IS 'Estado legalización: pending, in_progress, approved, rejected';
COMMENT ON COLUMN projects.client_portal_enabled IS 'Si true, el cliente puede ver su proyecto en el portal';
COMMENT ON COLUMN projects.client_access_token IS 'Token único para acceso sin login del cliente';