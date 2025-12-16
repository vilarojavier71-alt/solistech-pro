-- SISTEMA DE CONFIGURACIÓN DE ORGANIZACIÓN
-- Almacena configuración de API keys para generación de imágenes con IA

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) UNIQUE NOT NULL,
    
    -- API Keys para generación de imágenes con IA
    ai_provider TEXT CHECK (ai_provider IN ('replicate', 'openai', 'stability')),
    ai_api_key_encrypted TEXT, -- Encriptada con AES-256
    ai_api_key_valid BOOLEAN DEFAULT false,
    ai_api_key_last_validated TIMESTAMP,
    
    -- Configuración de presentaciones
    presentation_template TEXT DEFAULT 'ebro-solar',
    default_fiscal_deduction TEXT DEFAULT '40' CHECK (default_fiscal_deduction IN ('20', '40', '60')),
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por organización
CREATE INDEX IF NOT EXISTS idx_org_settings_org ON organization_settings(organization_id);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_org_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_org_settings_updated_at();

-- RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo ven la configuración de su organización
CREATE POLICY "Users can view own org settings"
    ON organization_settings FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert own org settings"
    ON organization_settings FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own org settings"
    ON organization_settings FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

COMMENT ON TABLE organization_settings IS 'Configuración de organización: API keys de IA, preferencias de presentaciones';
COMMENT ON COLUMN organization_settings.ai_provider IS 'Proveedor de IA: replicate (recomendado), openai, stability';
COMMENT ON COLUMN organization_settings.ai_api_key_encrypted IS 'API key encriptada con AES-256 para seguridad';
