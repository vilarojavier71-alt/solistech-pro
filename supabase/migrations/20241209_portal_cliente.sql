-- Portal Cliente - Tablas principales
-- Migración para sistema de ventas y tracking de trámites

-- ============================================================================
-- TABLA: sales (Ventas y Trámites)
-- ============================================================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  
  -- Información del cliente
  customer_id UUID REFERENCES customers ON DELETE SET NULL,
  dni TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Datos de la venta
  sale_number TEXT UNIQUE NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL,
  material TEXT,
  
  -- Acceso al portal
  access_code TEXT UNIQUE NOT NULL, -- Código para login
  
  -- Estado de pago
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'rejected')),
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('transfer', 'card', 'cash', 'financing')),
  
  -- Estado de documentación
  documentation_status TEXT DEFAULT 'pending' CHECK (documentation_status IN ('pending', 'uploaded', 'approved', 'rejected')),
  drive_folder_url TEXT,
  documents_uploaded_at TIMESTAMP WITH TIME ZONE,
  documentation_notes TEXT,
  
  -- Estado de ingeniería
  engineering_status TEXT DEFAULT 'pending' CHECK (engineering_status IN ('pending', 'in_review', 'approved', 'rejected')),
  engineering_feedback TEXT,
  engineer_id UUID REFERENCES users ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Estado de tramitación
  process_status TEXT DEFAULT 'not_started' CHECK (process_status IN ('not_started', 'presented', 'in_progress', 'completed')),
  process_notes TEXT,
  
  -- Estado de instalación
  installation_status TEXT DEFAULT 'pending' CHECK (installation_status IN ('pending', 'scheduled', 'in_progress', 'completed')),
  installation_date DATE,
  
  -- Metadata
  created_by UUID REFERENCES users ON DELETE SET NULL,
  assigned_to UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  UNIQUE(organization_id, dni)
);

-- ============================================================================
-- TABLA: sale_documents (Documentos del trámite)
-- ============================================================================

CREATE TABLE sale_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales ON DELETE CASCADE,
  
  -- Información del documento
  document_type TEXT NOT NULL CHECK (document_type IN ('catastro', 'instalaciones', 'factura_electrica', 'dni', 'escrituras', 'other')),
  file_name TEXT NOT NULL,
  file_size INTEGER, -- bytes
  mime_type TEXT,
  
  -- Almacenamiento
  storage_url TEXT NOT NULL, -- Supabase Storage o Drive
  drive_url TEXT,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  validation_notes TEXT,
  validated_by UUID REFERENCES users ON DELETE SET NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  uploaded_by TEXT, -- 'client' or user_id
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: sale_status_history (Historial de cambios)
-- ============================================================================

CREATE TABLE sale_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales ON DELETE CASCADE,
  
  -- Cambio de estado
  status_type TEXT NOT NULL CHECK (status_type IN ('payment', 'documentation', 'engineering', 'process', 'installation')),
  old_status TEXT,
  new_status TEXT NOT NULL,
  
  -- Detalles
  notes TEXT,
  visible_to_client BOOLEAN DEFAULT true,
  
  -- Metadata
  changed_by UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: client_notifications (Notificaciones para clientes)
-- ============================================================================

CREATE TABLE client_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales ON DELETE CASCADE,
  
  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'action_required')),
  
  -- Acción (opcional)
  action_label TEXT, -- ej. "Subir Documentos"
  action_url TEXT,
  
  -- Estado
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Canales de envío
  sent_email BOOLEAN DEFAULT false,
  sent_sms BOOLEAN DEFAULT false,
  sent_push BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_sales_organization ON sales(organization_id);
CREATE INDEX idx_sales_dni ON sales(dni);
CREATE INDEX idx_sales_access_code ON sales(access_code);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_documentation_status ON sales(documentation_status);
CREATE INDEX idx_sales_engineering_status ON sales(engineering_status);

CREATE INDEX idx_sale_documents_sale ON sale_documents(sale_id);
CREATE INDEX idx_sale_documents_type ON sale_documents(document_type);
CREATE INDEX idx_sale_documents_status ON sale_documents(status);

CREATE INDEX idx_sale_status_history_sale ON sale_status_history(sale_id);
CREATE INDEX idx_sale_status_history_created ON sale_status_history(created_at DESC);

CREATE INDEX idx_client_notifications_sale ON client_notifications(sale_id);
CREATE INDEX idx_client_notifications_read ON client_notifications(read);
CREATE INDEX idx_client_notifications_created ON client_notifications(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at en sales
CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON sales
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Sales: Users can view their organization's sales
CREATE POLICY "Users can view organization sales"
  ON sales FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sales"
  ON sales FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization sales"
  ON sales FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Sale Documents: Users can view their organization's documents
CREATE POLICY "Users can view organization sale documents"
  ON sale_documents FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert sale documents"
  ON sale_documents FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Status History: Users can view their organization's history
CREATE POLICY "Users can view organization status history"
  ON sale_status_history FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert status history"
  ON sale_status_history FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Notifications: Users can view their organization's notifications
CREATE POLICY "Users can view organization notifications"
  ON client_notifications FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert notifications"
  ON client_notifications FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- FUNCIÓN: Generar código de acceso único
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generar código aleatorio de 6 caracteres (letras y números)
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Verificar si ya existe
    SELECT EXISTS(SELECT 1 FROM sales WHERE access_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Generar número de venta
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_sale_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  sale_count INTEGER;
  year_suffix TEXT;
BEGIN
  SELECT COUNT(*) INTO sale_count
  FROM sales
  WHERE organization_id = org_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  year_suffix := TO_CHAR(NOW(), 'YY');
  RETURN 'V-' || year_suffix || '-' || LPAD((sale_count + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
