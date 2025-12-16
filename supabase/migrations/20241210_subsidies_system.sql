-- SISTEMA DE SUBVENCIONES Y AYUDAS REGIONALES
-- Almacena información sobre ayudas estatales, autonómicas y municipales para fotovoltaica

CREATE TABLE IF NOT EXISTS subsidies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL, -- 'Comunidad Valenciana', 'Madrid', 'Cataluña', etc.
    subsidy_type TEXT NOT NULL, -- 'direct_grant', 'irpf_deduction', 'ibi_bonus', 'icio_bonus'
    percentage NUMERIC(5,2) NOT NULL, -- 40.00 para 40%
    max_amount NUMERIC(10,2), -- Tope máximo en euros (opcional)
    conditions JSONB DEFAULT '{}'::jsonb, -- Criterios de elegibilidad
    valid_from DATE NOT NULL,
    valid_until DATE, -- NULL = indefinido
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_subsidies_region ON subsidies(region);
CREATE INDEX IF NOT EXISTS idx_subsidies_active ON subsidies(is_active);
CREATE INDEX IF NOT EXISTS idx_subsidies_type ON subsidies(subsidy_type);

-- Datos iniciales: Comunidad Valenciana
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until) VALUES
('Comunidad Valenciana', 'direct_grant', 40.00, 3000.00, 'Ayuda Next Generation EU - Hasta 40% del presupuesto con tope de 3.000€', '2024-01-01', '2026-02-27'),
('Comunidad Valenciana', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40% por reducción de consumo energético ≥30%', '2024-01-01', '2026-12-31'),
('Comunidad Valenciana', 'irpf_deduction', 60.00, 15000.00, 'Deducción IRPF del 60% para mejoras integrales de envolvente', '2024-01-01', '2026-12-31'),
('Comunidad Valenciana', 'ibi_bonus', 50.00, NULL, 'Bonificación IBI del 50% durante hasta 10 años (Valencia capital)', '2024-01-01', NULL);

-- Datos iniciales: Madrid
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until) VALUES
('Madrid', 'direct_grant', 30.00, NULL, 'Subvención directa fondos autonómicos (30% de la inversión)', '2024-01-01', '2025-12-31'),
('Madrid', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF del 40% por reducción de consumo energético', '2024-01-01', '2026-12-31'),
('Madrid', 'ibi_bonus', 25.00, NULL, 'Bonificación IBI variable según municipio (promedio 25%)', '2024-01-01', NULL);

-- Datos iniciales: Cataluña
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until) VALUES
('Cataluña', 'direct_grant', 40.00, NULL, 'Fondos NextGen con línea específica para baterías (40%)', '2025-01-01', '2026-12-31'),
('Cataluña', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF en tramo autonómico', '2024-01-01', '2026-12-31'),
('Cataluña', 'ibi_bonus', 30.00, NULL, 'Bonificación IBI promedio (varía por municipio)', '2024-01-01', NULL);

-- Datos iniciales: Andalucía
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until) VALUES
('Andalucía', 'direct_grant', 35.00, NULL, 'Subvención autonómica para autoconsumo (35%)', '2024-01-01', '2025-12-31'),
('Andalucía', 'irpf_deduction', 40.00, 7500.00, 'Deducción IRPF estatal', '2024-01-01', '2026-12-31'),
('Andalucía', 'ibi_bonus', 20.00, NULL, 'Bonificación IBI variable (10-50% según municipio)', '2024-01-01', NULL);

-- Datos iniciales: Islas Baleares
INSERT INTO subsidies (region, subsidy_type, percentage, max_amount, description, valid_from, valid_until) VALUES
('Islas Baleares', 'direct_grant', 40.00, NULL, 'Fondos europeos Next Generation (40%)', '2024-01-01', '2025-12-31'),
('Islas Baleares', 'irpf_deduction', 60.00, NULL, 'Deducción del 60% para instalaciones ambiciosas (tramo autonómico)', '2024-01-01', '2025-12-31');

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_subsidies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subsidies_updated_at
    BEFORE UPDATE ON subsidies
    FOR EACH ROW
    EXECUTE FUNCTION update_subsidies_updated_at();

COMMENT ON TABLE subsidies IS 'Almacena ayudas y subvenciones regionales para instalaciones fotovoltaicas';
COMMENT ON COLUMN subsidies.subsidy_type IS 'Tipos: direct_grant (subvención directa), irpf_deduction (deducción IRPF), ibi_bonus (bonificación IBI), icio_bonus (bonificación ICIO)';
COMMENT ON COLUMN subsidies.conditions IS 'Criterios JSON para elegibilidad (ej: {"vulnerable": true, "municipality_size": "< 5000"})';
