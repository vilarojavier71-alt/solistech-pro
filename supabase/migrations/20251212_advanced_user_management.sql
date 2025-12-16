-- ============================================================================
-- MIGRACIÓN: ADVANCED USER MANAGEMENT (CORPORATE)
-- FECHA: 2025-12-12
-- DESCRIPCIÓN: Añade soporte para certificaciones, zonas de trabajo y perfil extendido.
-- ============================================================================

-- 1. TABLA: WORK ZONES (Zonas de Trabajo)
CREATE TABLE IF NOT EXISTS work_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6', -- Para mapas/calendarios
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para work_zones
ALTER TABLE work_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver zonas de mi organizacion" ON work_zones
    FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Gestionar zonas (Admins)" ON work_zones
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner')
    );

-- 2. TABLA: USER CERTIFICATIONS (Compliance)
CREATE TABLE IF NOT EXISTS user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'PRL', 'ALTURA', 'ELECTRICIDAD_BAJA', 'CONDUCIR'
    name TEXT NOT NULL, -- Nombre descriptivo 'Curso 60h'
    issue_date DATE,
    expiry_date DATE NOT NULL,
    document_url TEXT, -- Path en Storage Bucket 'certifications'
    status TEXT DEFAULT 'valid', -- 'valid', 'expired', 'pending_review'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para user_certifications
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver certificaciones de mi org (Managers/Admins)" ON user_certifications
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()) AND
        ((auth.uid() = user_id) OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager', 'owner'))
    );

CREATE POLICY "Subir mis certificaciones" ON user_certifications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Editar mis certificaciones (o Admins)" ON user_certifications
    FOR UPDATE USING (
        auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner')
    );

-- 3. ACTUALIZACIÓN DE PERFILES (Datos Corporativos)
-- Nota: Usamos la tabla 'users' existente o 'profiles' si existe separada. 
-- En SolisTech Pro usamos 'users' como perfil principal extendido.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB, -- { "name": "Maria", "phone": "+34..." }
ADD COLUMN IF NOT EXISTS work_zone_id UUID REFERENCES work_zones(id),
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS is_temporary_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_users_work_zone ON users(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON user_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certifications_user ON user_certifications(user_id);

-- Trigger para actualizar status de certificaciones (Opcional, se puede hacer por Cron o App)
-- Por ahora lo dejaremos para lógica de aplicación para no sobrecargar DB.
