-- SISTEMA DE TRAMITACIÓN DE SUBVENCIONES
-- Tabla principal para gestionar expedientes de solicitud de ayudas

CREATE TABLE IF NOT EXISTS subsidy_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    -- Información de la Solicitud
    application_number TEXT UNIQUE NOT NULL, -- Ej: "SUB-2024-001"
    region TEXT NOT NULL, -- 'Comunidad Valenciana', 'Madrid', etc.
    subsidy_type TEXT NOT NULL, -- 'direct_grant', 'irpf_deduction', 'ibi_bonus'
    estimated_amount NUMERIC(10,2), -- Cantidad estimada a recibir
    
    -- Estados del Proceso (Kanban)
    status TEXT NOT NULL DEFAULT 'collecting_docs',
    -- Valores posibles: 
    -- 'collecting_docs' = Recopilando documentos
    -- 'ready_to_submit' = Listo para presentar
    -- 'submitted' = Presentado en organismo
    -- 'pending_review' = En revisión (requerimientos)
    -- 'approved' = Aprobado
    -- 'rejected' = Rechazado
    -- 'paid' = Pagado
    
    -- Fechas Importantes
    submission_deadline DATE, -- Fecha límite de convocatoria
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    -- Documentos Requeridos (Checklist JSON)
    required_docs JSONB DEFAULT '[]'::jsonb,
    -- Ejemplo: [
    --   {"type": "dni", "name": "DNI/CIF", "uploaded": false},
    --   {"type": "ibi", "name": "Recibo IBI", "uploaded": false},
    --   {"type": "escrituras", "name": "Escrituras", "uploaded": false}
    -- ]
    
    -- Gestión y Notas
    notes TEXT,
    assigned_to UUID REFERENCES users(id), -- Usuario responsable del expediente
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_org ON subsidy_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_customer ON subsidy_applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_status ON subsidy_applications(status);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_deadline ON subsidy_applications(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_assigned ON subsidy_applications(assigned_to);

-- Función para auto-generar número de expediente
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YY');
    
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(application_number FROM 'SUB-(\d+)-') AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM subsidy_applications
    WHERE organization_id = NEW.organization_id
    AND application_number LIKE 'SUB-%';
    
    NEW.application_number := 'SUB-' || LPAD(next_number::TEXT, 4, '0') || '-' || year_suffix;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_application_number
    BEFORE INSERT ON subsidy_applications
    FOR EACH ROW
    WHEN (NEW.application_number IS NULL)
    EXECUTE FUNCTION generate_application_number();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_subsidy_app_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subsidy_app_updated_at
    BEFORE UPDATE ON subsidy_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_subsidy_app_updated_at();

-- Row Level Security (RLS)
ALTER TABLE subsidy_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo ven expedientes de su organización
CREATE POLICY "Users can view org applications"
    ON subsidy_applications FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert org applications"
    ON subsidy_applications FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update org applications"
    ON subsidy_applications FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete org applications"
    ON subsidy_applications FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Comentarios para documentación
COMMENT ON TABLE subsidy_applications IS 'Expedientes de tramitación de subvenciones fotovoltaicas';
COMMENT ON COLUMN subsidy_applications.status IS 'Estados del Kanban: collecting_docs, ready_to_submit, submitted, pending_review, approved, rejected, paid';
COMMENT ON COLUMN subsidy_applications.required_docs IS 'Array JSON con checklist de documentos requeridos y su estado de carga';
