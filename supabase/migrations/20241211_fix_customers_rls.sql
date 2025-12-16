-- ============================================
-- FIX: RLS Policy for Customers SELECT
-- ============================================

-- Asegurar que RLS está habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe (para evitar duplicados)
DROP POLICY IF EXISTS "Users can view customers from their organization" ON customers;
DROP POLICY IF EXISTS "Usuarios pueden ver clientes de su organización" ON customers;

-- Crear política de lectura para clientes
CREATE POLICY "Users can view customers from their organization"
ON customers FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Verificación
SELECT 'RLS policy for customers SELECT created successfully' AS status;
