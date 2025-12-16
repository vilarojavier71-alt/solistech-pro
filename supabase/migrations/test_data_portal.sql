-- Datos de prueba para Portal Cliente
-- Ejecuta esto en Supabase SQL Editor

-- Crear una venta de prueba
INSERT INTO sales (
  organization_id,
  dni,
  customer_name,
  customer_email,
  customer_phone,
  sale_number,
  sale_date,
  amount,
  material,
  access_code,
  payment_status,
  payment_date,
  documentation_status,
  engineering_status,
  process_status,
  installation_status
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid, -- Reemplaza con tu organization_id
  '12345678A',
  'Juan Pérez',
  'juan@ejemplo.com',
  '+34 600 000 000',
  'V-25-0001',
  CURRENT_DATE,
  15000.00,
  'Paneles 450W + Inversor 5kW',
  'TEST01', -- Código de acceso para login
  'confirmed',
  CURRENT_DATE,
  'pending',
  'pending',
  'not_started',
  'pending'
);

-- Crear una notificación de prueba
INSERT INTO client_notifications (
  sale_id,
  title,
  message,
  notification_type,
  action_label,
  action_url,
  read
) VALUES (
  (SELECT id FROM sales WHERE dni = '12345678A' LIMIT 1),
  '📄 Necesitamos tus documentos',
  'Por favor, sube los documentos requeridos para continuar con tu trámite. Necesitamos: Catastro, Certificado de Instalaciones y Factura Eléctrica.',
  'action_required',
  'Subir Documentos',
  '/portal/documents',
  false
);

-- NOTA: Reemplaza 'a0000000-0000-0000-0000-000000000001' con tu organization_id real
-- Puedes obtenerlo con: SELECT id FROM organizations LIMIT 1;
