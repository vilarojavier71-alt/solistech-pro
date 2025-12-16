-- Mejora de tabla sales para soporte de ERP/Automatización
-- Fecha: 2024-12-09

-- 1. Campos para Control de Pagos Fraccionados
ALTER TABLE sales
ADD COLUMN payment_20_status TEXT DEFAULT 'pending' CHECK (payment_20_status IN ('pending', 'requested', 'received')),
ADD COLUMN payment_20_date DATE,
ADD COLUMN payment_60_status TEXT DEFAULT 'pending' CHECK (payment_60_status IN ('pending', 'requested', 'received')),
ADD COLUMN payment_60_date DATE,
ADD COLUMN payment_final_status TEXT DEFAULT 'pending' CHECK (payment_final_status IN ('pending', 'requested', 'received')),
ADD COLUMN payment_final_date DATE;

-- 2. Integración con Drive / Archivos
ALTER TABLE sales
ADD COLUMN drive_folder_id TEXT, -- ID interno de Google Drive
ADD COLUMN drive_web_link TEXT; -- URL para abrir carpeta

-- 3. Rentabilidad y Presupuestos
ALTER TABLE sales
ADD COLUMN cost_amount DECIMAL(10, 2), -- Coste para nosotros
ADD COLUMN margin_amount DECIMAL(10, 2), -- Beneficio bruto
ADD COLUMN margin_percent DECIMAL(5, 2), -- % Margen
ADD COLUMN taxes_amount DECIMAL(10, 2),  -- IVA
ADD COLUMN total_with_taxes DECIMAL(10, 2); -- Total con IVA

-- 4. Actualizar trigger para calcular márgenes automáticamente (Opcional, mejor en App level por ahora)

-- Comentarios para documentación
COMMENT ON COLUMN sales.payment_20_status IS 'Estado del pago inicial del 20% al firmar';
COMMENT ON COLUMN sales.payment_60_status IS 'Estado del pago del 60% al recibir material';
COMMENT ON COLUMN sales.payment_final_status IS 'Estado del pago final tras legalización';
