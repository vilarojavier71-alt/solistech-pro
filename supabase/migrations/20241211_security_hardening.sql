-- ============================================================================
-- SECURITY HARDENING - Multi-Table RLS Implementation
-- Fecha: 2025-12-11
-- Protocolo: DEFCON 1 - Emergency Security Patch
-- ============================================================================
-- OBJETIVO: Blindar leads, projects, sales, invoices, time_entries
-- PATRÓN: Basado en customers_security_complete.sql (PROBADO ✅)
-- ============================================================================

-- ============================================================================
-- TABLA 1: LEADS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view leads from their organization" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update own org leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own org leads" ON leads;

-- POLÍTICA 1: SELECT
CREATE POLICY "Users can view leads from their organization"
ON leads FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- POLÍTICA 2: INSERT
CREATE POLICY "Users can insert leads"
ON leads FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- POLÍTICA 3: UPDATE
CREATE POLICY "Users can update own org leads"
ON leads FOR UPDATE
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
CREATE POLICY "Users can delete own org leads"
ON leads FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_leads_org_created 
ON leads(organization_id, created_at DESC);

-- ============================================================================
-- TABLA 2: PROJECTS
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects from their organization" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update own org projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own org projects" ON projects;

CREATE POLICY "Users can view projects from their organization"
ON projects FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert projects"
ON projects FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own org projects"
ON projects FOR UPDATE
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

CREATE POLICY "Users can delete own org projects"
ON projects FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_projects_org_created 
ON projects(organization_id, created_at DESC);

-- ============================================================================
-- TABLA 3: SALES
-- ============================================================================

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sales from their organization" ON sales;
DROP POLICY IF EXISTS "Users can insert sales" ON sales;
DROP POLICY IF EXISTS "Users can update own org sales" ON sales;
DROP POLICY IF EXISTS "Users can delete own org sales" ON sales;

CREATE POLICY "Users can view sales from their organization"
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

CREATE POLICY "Users can update own org sales"
ON sales FOR UPDATE
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

CREATE POLICY "Users can delete own org sales"
ON sales FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_sales_org_created 
ON sales(organization_id, created_at DESC);

-- ============================================================================
-- TABLA 4: INVOICES
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invoices from their organization" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own org invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own org invoices" ON invoices;

CREATE POLICY "Users can view invoices from their organization"
ON invoices FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert invoices"
ON invoices FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own org invoices"
ON invoices FOR UPDATE
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

CREATE POLICY "Users can delete own org invoices"
ON invoices FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_invoices_org_created 
ON invoices(organization_id, created_at DESC);

-- ============================================================================
-- TABLA 5: TIME_ENTRIES
-- ============================================================================

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view time_entries from their organization" ON time_entries;
DROP POLICY IF EXISTS "Users can insert time_entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own org time_entries" ON time_entries;
DROP POLICY IF EXISTS "Users can delete own org time_entries" ON time_entries;

CREATE POLICY "Users can view time_entries from their organization"
ON time_entries FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert time_entries"
ON time_entries FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own org time_entries"
ON time_entries FOR UPDATE
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

CREATE POLICY "Users can delete own org time_entries"
ON time_entries FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_time_entries_org_user 
ON time_entries(organization_id, user_id, created_at DESC);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
DO $$
DECLARE
  tables_with_rls INTEGER;
  total_policies INTEGER;
BEGIN
  -- Contar tablas con RLS habilitado
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_class
  WHERE relname IN ('leads', 'projects', 'sales', 'invoices', 'time_entries', 'customers')
  AND relrowsecurity = true;
  
  -- Contar políticas totales
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE tablename IN ('leads', 'projects', 'sales', 'invoices', 'time_entries', 'customers');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DE SEGURIDAD MULTI-TENANT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tablas con RLS: % de 6', tables_with_rls;
  RAISE NOTICE 'Políticas Totales: % (esperado: 24)', total_policies;
  RAISE NOTICE '========================================';
  
  IF tables_with_rls = 6 AND total_policies >= 24 THEN
    RAISE NOTICE '✅ SEGURIDAD HARDENING COMPLETADO';
    RAISE NOTICE 'Estado: PRODUCTION READY';
  ELSE
    RAISE WARNING '⚠️ VERIFICACIÓN INCOMPLETA';
    RAISE WARNING 'Tablas RLS: % (esperado: 6)', tables_with_rls;
    RAISE WARNING 'Políticas: % (esperado: 24)', total_policies;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
