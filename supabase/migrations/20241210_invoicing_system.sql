-- ============================================
-- SISTEMA DE FACTURACIÓN ELECTRÓNICA CON VERIFACTU
-- Conforme a normativa AEAT para facturación electrónica
-- ============================================

-- Tabla principal de facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    
    -- Numeración
    invoice_number TEXT NOT NULL, -- Formato: 2024/001
    series TEXT DEFAULT 'A', -- Serie de facturación (A, B, C...)
    sequential_number INTEGER NOT NULL, -- Número secuencial dentro de la serie
    
    -- Cliente
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_nif TEXT NOT NULL,
    customer_address TEXT,
    customer_city TEXT,
    customer_postal_code TEXT,
    customer_email TEXT,
    
    -- Fechas
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Importes
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 21.00, -- IVA (21%, 10%, 4%, 0%)
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Descuentos globales
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Verifactu (Firma Electrónica)
    verifactu_hash TEXT, -- Hash SHA-256 de esta factura
    verifactu_previous_hash TEXT, -- Hash de la factura anterior (cadena)
    verifactu_signature TEXT, -- Firma electrónica del software
    verifactu_qr_code TEXT, -- Código QR en base64
    verifactu_qr_url TEXT, -- URL del QR para verificación
    verifactu_sent_at TIMESTAMP, -- Cuándo se envió a AEAT
    verifactu_status TEXT DEFAULT 'pending' CHECK (verifactu_status IN ('pending', 'sent', 'accepted', 'rejected', 'error')),
    verifactu_response TEXT, -- Respuesta de AEAT
    
    -- Estado de la factura
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'cancelled', 'overdue')),
    
    -- Estado de pago
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Archivos generados
    pdf_url TEXT,
    xml_url TEXT, -- XML para envío a AEAT
    
    -- Notas
    notes TEXT,
    internal_notes TEXT, -- Notas privadas (no aparecen en PDF)
    
    -- Proyecto relacionado (opcional)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: número de factura único por organización
    UNIQUE(organization_id, invoice_number)
);

-- Tabla de líneas de factura
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    
    -- Orden de la línea
    line_order INTEGER NOT NULL DEFAULT 1,
    
    -- Descripción del producto/servicio
    description TEXT NOT NULL,
    
    -- Cantidades y precios
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    
    -- Descuento por línea
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Impuestos
    tax_rate DECIMAL(5,2) DEFAULT 21.00,
    tax_amount DECIMAL(10,2) NOT NULL,
    
    -- Totales
    subtotal DECIMAL(10,2) NOT NULL, -- quantity * unit_price - discount
    total DECIMAL(10,2) NOT NULL, -- subtotal + tax
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de pagos de facturas
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    
    -- Fecha y monto
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Método de pago
    payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'card', 'cash', 'check', 'other')),
    reference TEXT, -- Número de transferencia, últimos 4 dígitos tarjeta, etc.
    
    -- Notas
    notes TEXT,
    
    -- Usuario que registró el pago
    recorded_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de configuración de facturación por organización
CREATE TABLE IF NOT EXISTS invoice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) UNIQUE NOT NULL,
    
    -- Numeración
    current_series TEXT DEFAULT 'A',
    next_number INTEGER DEFAULT 1,
    number_format TEXT DEFAULT 'YYYY/NNN', -- Formato del número (YYYY/NNN, A-YYYY-NNN, etc.)
    
    -- Verifactu
    verifactu_enabled BOOLEAN DEFAULT false,
    verifactu_mode TEXT DEFAULT 'deferred' CHECK (verifactu_mode IN ('realtime', 'deferred')),
    verifactu_certificate TEXT, -- Certificado digital para firma
    verifactu_software_id TEXT, -- ID del software registrado en AEAT
    
    -- Datos fiscales de la empresa
    company_name TEXT NOT NULL,
    company_nif TEXT NOT NULL,
    company_address TEXT,
    company_city TEXT,
    company_postal_code TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    
    -- Configuración de IVA
    default_tax_rate DECIMAL(5,2) DEFAULT 21.00,
    
    -- Términos y condiciones
    payment_terms_days INTEGER DEFAULT 30,
    payment_terms_text TEXT DEFAULT 'Pago a 30 días desde la fecha de emisión',
    
    -- Pie de factura
    footer_text TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoices_updated_at();

-- Función para calcular totales de factura
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS void AS $$
DECLARE
    line_subtotal DECIMAL(10,2);
    line_tax DECIMAL(10,2);
    line_total DECIMAL(10,2);
BEGIN
    -- Calcular totales de las líneas
    SELECT 
        COALESCE(SUM(subtotal), 0),
        COALESCE(SUM(tax_amount), 0),
        COALESCE(SUM(total), 0)
    INTO line_subtotal, line_tax, line_total
    FROM invoice_lines
    WHERE invoice_id = invoice_uuid;
    
    -- Actualizar factura
    UPDATE invoices
    SET 
        subtotal = line_subtotal,
        tax_amount = line_tax,
        total = line_total
    WHERE id = invoice_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales al modificar líneas
CREATE OR REPLACE FUNCTION recalculate_invoice_on_line_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_invoice_totals(OLD.invoice_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_invoice_totals(NEW.invoice_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_lines_change ON invoice_lines;
CREATE TRIGGER invoice_lines_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_lines
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_invoice_on_line_change();

-- Función para actualizar estado de pago
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total DECIMAL(10,2);
    total_paid DECIMAL(10,2);
BEGIN
    -- Obtener total de la factura
    SELECT total INTO invoice_total
    FROM invoices
    WHERE id = NEW.invoice_id;
    
    -- Calcular total pagado
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM invoice_payments
    WHERE invoice_id = NEW.invoice_id;
    
    -- Actualizar estado de pago
    UPDATE invoices
    SET 
        paid_amount = total_paid,
        payment_status = CASE
            WHEN total_paid >= invoice_total THEN 'paid'
            WHEN total_paid > 0 THEN 'partial'
            ELSE 'pending'
        END,
        status = CASE
            WHEN total_paid >= invoice_total THEN 'paid'
            ELSE status
        END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_status ON invoice_payments;
CREATE TRIGGER update_payment_status
    AFTER INSERT ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

-- RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para invoices
DROP POLICY IF EXISTS "Users can view org invoices" ON invoices;
CREATE POLICY "Users can view org invoices"
    ON invoices FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert org invoices" ON invoices;
CREATE POLICY "Users can insert org invoices"
    ON invoices FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update org invoices" ON invoices;
CREATE POLICY "Users can update org invoices"
    ON invoices FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete org invoices" ON invoices;
CREATE POLICY "Users can delete org invoices"
    ON invoices FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Políticas similares para invoice_lines
DROP POLICY IF EXISTS "Users can manage invoice lines" ON invoice_lines;
CREATE POLICY "Users can manage invoice lines"
    ON invoice_lines FOR ALL
    USING (invoice_id IN (
        SELECT id FROM invoices WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- Políticas para invoice_payments
DROP POLICY IF EXISTS "Users can manage invoice payments" ON invoice_payments;
CREATE POLICY "Users can manage invoice payments"
    ON invoice_payments FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Políticas para invoice_settings
DROP POLICY IF EXISTS "Users can view org invoice settings" ON invoice_settings;
CREATE POLICY "Users can view org invoice settings"
    ON invoice_settings FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update org invoice settings" ON invoice_settings;
CREATE POLICY "Users can update org invoice settings"
    ON invoice_settings FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Verificación
SELECT 'Sistema de facturación con Verifactu creado correctamente' AS status;
