-- EXTENSIÓN DE TABLA CALCULATIONS PARA INTELIGENCIA FINANCIERA
-- Añade campos para ingeniería, subvenciones y ROI mejorado

-- ============================================================================
-- CAMPOS DE INGENIERÍA
-- ============================================================================

ALTER TABLE calculations ADD COLUMN IF NOT EXISTS
    roof_area_available DECIMAL(8, 2), -- m² disponibles en tejado
    roof_area_required DECIMAL(8, 2),  -- m² requeridos para la instalación
    engineering_viable BOOLEAN DEFAULT true,
    engineering_notes TEXT;

-- ============================================================================
-- CAMPOS FINANCIEROS (INTEGRACIÓN CON SUBSIDIES)
-- ============================================================================

ALTER TABLE calculations ADD COLUMN IF NOT EXISTS
    -- Región y subvenciones
    subsidy_region TEXT, -- Comunidad Autónoma
    subsidy_municipality TEXT, -- Municipio específico
    
    -- IRPF (Deducción fiscal)
    subsidy_irpf_type TEXT CHECK (subsidy_irpf_type IN ('20', '40', '60')),
    subsidy_irpf_percentage DECIMAL(5, 2),
    subsidy_irpf_amount DECIMAL(10, 2),
    subsidy_irpf_max_amount DECIMAL(10, 2),
    
    -- IBI (Impuesto sobre Bienes Inmuebles)
    subsidy_ibi_percentage DECIMAL(5, 2),
    subsidy_ibi_duration_years INTEGER,
    subsidy_ibi_annual DECIMAL(10, 2),
    subsidy_ibi_total DECIMAL(10, 2),
    
    -- ICIO (Impuesto sobre Construcciones)
    subsidy_icio_percentage DECIMAL(5, 2),
    subsidy_icio_amount DECIMAL(10, 2),
    
    -- Totales
    total_subsidies DECIMAL(10, 2), -- Suma de todas las ayudas
    net_cost DECIMAL(10, 2), -- Coste después de subvenciones
    
    -- ROI mejorado
    roi_with_subsidies DECIMAL(5, 2), -- ROI a 25 años con subvenciones
    payback_with_subsidies DECIMAL(4, 1); -- Años de amortización con subvenciones

-- ============================================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_calculations_viable ON calculations(engineering_viable);
CREATE INDEX IF NOT EXISTS idx_calculations_region ON calculations(subsidy_region);
CREATE INDEX IF NOT EXISTS idx_calculations_municipality ON calculations(subsidy_municipality);
CREATE INDEX IF NOT EXISTS idx_calculations_irpf_type ON calculations(subsidy_irpf_type);

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON COLUMN calculations.roof_area_available IS 'Área disponible en el tejado (m²)';
COMMENT ON COLUMN calculations.roof_area_required IS 'Área requerida para la instalación con margen de seguridad (m²)';
COMMENT ON COLUMN calculations.engineering_viable IS 'Indica si la instalación es técnicamente viable';

COMMENT ON COLUMN calculations.subsidy_irpf_type IS 'Tipo de deducción IRPF: 20% (eficiencia), 40% (consumo -30%), 60% (rehabilitación integral)';
COMMENT ON COLUMN calculations.subsidy_irpf_amount IS 'Cantidad deducible en IRPF (€)';
COMMENT ON COLUMN calculations.subsidy_ibi_annual IS 'Ahorro anual en IBI (€/año)';
COMMENT ON COLUMN calculations.subsidy_ibi_total IS 'Ahorro total en IBI durante todos los años de bonificación (€)';
COMMENT ON COLUMN calculations.subsidy_icio_amount IS 'Ahorro en ICIO (€, pago único)';
COMMENT ON COLUMN calculations.total_subsidies IS 'Suma total de todas las ayudas: IRPF + IBI + ICIO (€)';
COMMENT ON COLUMN calculations.net_cost IS 'Coste neto final después de aplicar todas las subvenciones (€)';
COMMENT ON COLUMN calculations.roi_with_subsidies IS 'ROI a 25 años considerando subvenciones (%)';
COMMENT ON COLUMN calculations.payback_with_subsidies IS 'Años de amortización considerando subvenciones';
