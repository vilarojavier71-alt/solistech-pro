-- ============================================================================
-- CUSTOMERS TABLE - RLS SECURITY (MINIMAL - ADAPTED TO SCHEMA)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view customers from their organization" ON customers;
DROP POLICY IF EXISTS "Usuarios pueden ver clientes de su organización" ON customers;
DROP POLICY IF EXISTS "Users can view organization customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update organization customers" ON customers;
DROP POLICY IF EXISTS "Users can update own org customers" ON customers;
DROP POLICY IF EXISTS "Users can delete organization customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own org customers" ON customers;

-- POLÍTICA 1: SELECT
CREATE POLICY "Users can view customers from their organization"
ON customers FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- POLÍTICA 2: INSERT
CREATE POLICY "Users can insert customers"
ON customers FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- POLÍTICA 3: UPDATE
CREATE POLICY "Users can update own org customers"
ON customers FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- POLÍTICA 4: DELETE
CREATE POLICY "Users can delete own org customers"
ON customers FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Limpiar duplicados NULL
WITH duplicates AS (
  SELECT 
    id, 
    ROW_NUMBER() OVER (
      PARTITION BY email, organization_id 
      ORDER BY created_at DESC NULLS LAST
    ) as row_num
  FROM customers
  WHERE email IS NULL
)
DELETE FROM customers
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Índice único: email por organización
DROP INDEX IF EXISTS unique_email_per_org;
CREATE UNIQUE INDEX unique_email_per_org 
ON customers (email, organization_id) 
WHERE email IS NOT NULL AND email != '';

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_customers_org_email 
ON customers(organization_id, email) 
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_org_created 
ON customers(organization_id, created_at DESC);

-- Verificación
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class WHERE relname = 'customers';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies WHERE tablename = 'customers';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS: %', CASE WHEN rls_enabled THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Políticas: %', policy_count;
  RAISE NOTICE '========================================';
  
  IF rls_enabled AND policy_count >= 4 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA';
  END IF;
END $$;
