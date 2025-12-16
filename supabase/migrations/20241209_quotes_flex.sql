-- Flexibilización de tabla Quotes para presupuestos rápidos
-- Fecha: 2024-12-09

-- 1. Hacer project_id opcional
ALTER TABLE quotes
ALTER COLUMN project_id DROP NOT NULL;

-- 2. Añadir claves foráneas opcionales para vincular a otros recursos
ALTER TABLE quotes
ADD COLUMN lead_id UUID REFERENCES leads ON DELETE SET NULL,
ADD COLUMN customer_id UUID REFERENCES customers ON DELETE SET NULL,
ADD COLUMN sale_id UUID REFERENCES sales ON DELETE SET NULL;


-- 3. Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_sale ON quotes(sale_id);

-- 4. Asegurar que al menos uno de los vínculos exista (Validación lógica, opcional enforcement en DB)
-- CONSTRAINT check_quote_link CHECK (project_id IS NOT NULL OR lead_id IS NOT NULL OR customer_id IS NOT NULL OR sale_id IS NOT NULL)

-- 5. Añadir campos extra para el PDF visual
ALTER TABLE quotes
ADD COLUMN show_total_taxes BOOLEAN DEFAULT true,
ADD COLUMN expiration_days INTEGER DEFAULT 15,
ADD COLUMN payment_terms_text TEXT DEFAULT '50% a la firma, 50% al finalizar.';
