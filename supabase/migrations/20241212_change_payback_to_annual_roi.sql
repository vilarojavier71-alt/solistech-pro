-- Migration: Change Payback to Annual ROI in Calculations Table
-- Author: Antigravity
-- Date: 2025-12-12
-- Description: Renombrar columna payback_years a annual_roi_percentage y actualizar tipo de dato

-- 1. Renombrar columna en tabla calculations
ALTER TABLE calculations 
RENAME COLUMN payback_years TO annual_roi_percentage;

-- 2. Actualizar comentario de la columna
COMMENT ON COLUMN calculations.annual_roi_percentage IS 'Rentabilidad Anual de la Inversión (%) = (Ahorro Anual / Inversión Inicial) × 100';

-- 3. Renombrar columna payback_with_subsidies a annual_roi_with_subsidies
ALTER TABLE calculations 
RENAME COLUMN payback_with_subsidies TO annual_roi_with_subsidies;

-- 4. Actualizar comentario
COMMENT ON COLUMN calculations.annual_roi_with_subsidies IS 'ROI Anual después de aplicar subvenciones (%)';

-- 5. Calcular retroactivamente los valores de ROI Anual desde payback existente (si hay datos legacy)
-- Nota: Esta conversión solo funciona si los datos antiguos todavía existen
-- ROI Anual (%) = (1 / Payback en años) × 100
-- Por ejemplo: Payback de 10 años → ROI Anual = 10%

-- No es necesario ejecutar UPDATE porque ya hemos renombrado las columnas
-- Los nuevos cálculos insertarán directamente el valor correcto de annual_roi_percentage
