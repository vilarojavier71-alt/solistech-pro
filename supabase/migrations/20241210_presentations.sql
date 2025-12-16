-- SISTEMA DE PRESENTACIONES POWERPOINT
-- Almacena presentaciones generadas para clientes

CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Datos de la presentación
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'sent', 'error')),
    
    -- Configuración
    template TEXT DEFAULT 'ebro-solar',
    fiscal_deduction_type TEXT CHECK (fiscal_deduction_type IN ('20', '40', '60')),
    
    -- Imágenes
    original_photo_url TEXT, -- Foto original del tejado subida por el usuario
    simulated_photo_url TEXT, -- Foto con placas simuladas (generada por IA)
    
    -- Archivo generado
    pptx_file_url TEXT, -- URL del PowerPoint generado en Supabase Storage
    pptx_file_size INTEGER, -- Tamaño en bytes
    
    -- Metadatos
    generation_error TEXT, -- Mensaje de error si falla la generación
    generated_at TIMESTAMP,
    sent_at TIMESTAMP,
    sent_to_email TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_presentations_org ON presentations(organization_id);
CREATE INDEX IF NOT EXISTS idx_presentations_customer ON presentations(customer_id);
CREATE INDEX IF NOT EXISTS idx_presentations_project ON presentations(project_id);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER presentations_updated_at
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_presentations_updated_at();

-- RLS
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo ven presentaciones de su organización
CREATE POLICY "Users can view org presentations"
    ON presentations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert org presentations"
    ON presentations FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update org presentations"
    ON presentations FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete org presentations"
    ON presentations FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

COMMENT ON TABLE presentations IS 'Presentaciones PowerPoint generadas para clientes con IA';
COMMENT ON COLUMN presentations.status IS 'Estados: draft, generating, generated, sent, error';
COMMENT ON COLUMN presentations.fiscal_deduction_type IS 'Tipo de deducción fiscal IRPF: 20%, 40%, 60%';
