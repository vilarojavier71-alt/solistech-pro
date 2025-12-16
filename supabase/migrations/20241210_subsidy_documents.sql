-- TABLA DE DOCUMENTOS ADJUNTOS PARA EXPEDIENTES DE SUBVENCIONES

CREATE TABLE IF NOT EXISTS subsidy_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES subsidy_applications(id) ON DELETE CASCADE NOT NULL,
    
    -- Información del Documento
    document_type TEXT NOT NULL, 
    -- Tipos: 'dni', 'ibi', 'escrituras', 'certificado_energetico', 
    --        'proyecto_tecnico', 'factura', 'justificante_pago', 'other'
    
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Ruta en Supabase Storage: subsidies/{app_id}/{filename}
    file_size INTEGER, -- Tamaño en bytes
    mime_type TEXT,
    
    -- Metadatos
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    
    -- Para versionado (si se sube múltiples veces el mismo tipo)
    version INTEGER DEFAULT 1
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subsidy_docs_app ON subsidy_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_docs_type ON subsidy_documents(document_type);

-- Row Level Security
ALTER TABLE subsidy_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver documentos de expedientes de su organización
CREATE POLICY "Users can view org subsidy documents"
    ON subsidy_documents FOR SELECT
    USING (application_id IN (
        SELECT id FROM subsidy_applications 
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert org subsidy documents"
    ON subsidy_documents FOR INSERT
    WITH CHECK (application_id IN (
        SELECT id FROM subsidy_applications 
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete org subsidy documents"
    ON subsidy_documents FOR DELETE
    USING (application_id IN (
        SELECT id FROM subsidy_applications 
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- Trigger para actualizar checklist en subsidy_applications cuando se sube un doc
CREATE OR REPLACE FUNCTION update_required_docs_checklist()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar documento como subido en el array required_docs
    UPDATE subsidy_applications
    SET required_docs = (
        SELECT jsonb_agg(
            CASE 
                WHEN elem->>'type' = NEW.document_type 
                THEN jsonb_set(elem, '{uploaded}', 'true'::jsonb)
                ELSE elem
            END
        )
        FROM jsonb_array_elements(required_docs) AS elem
    )
    WHERE id = NEW.application_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_on_upload
    AFTER INSERT ON subsidy_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_required_docs_checklist();

COMMENT ON TABLE subsidy_documents IS 'Documentos adjuntos a expedientes de subvenciones (almacenados en Supabase Storage)';
