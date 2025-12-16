-- ==============================================================================
-- SOLUCIÓN ERROR: infinite recursion detected in policy for relation "users"
-- ==============================================================================

-- 1. Crear función segura para leer la ID de organización sin causar bucles
-- SECURITY DEFINER: Ejecuta como superusuario, saltándose las políticas RLS.
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT organization_id FROM users WHERE id = auth.uid());
END;
$$;

-- 2. Corregir politica en tabla 'users' (La causante del error)
DROP POLICY IF EXISTS "Users can view organization members" ON users;
CREATE POLICY "Users can view organization members"
ON users FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- 3. Corregir política en 'customers'
DROP POLICY IF EXISTS "Users can view organization customers" ON customers;
CREATE POLICY "Users can view organization customers"
ON customers FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- 4. Corregir política en 'projects'
DROP POLICY IF EXISTS "Users can view organization projects" ON projects;
CREATE POLICY "Users can view organization projects"
ON projects FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- 5. Corregir política en 'leads'
DROP POLICY IF EXISTS "Users can view organization leads" ON leads;
CREATE POLICY "Users can view organization leads"
ON leads FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- 6. Corregir política en 'quotes'
DROP POLICY IF EXISTS "Users can view organization quotes" ON quotes;
CREATE POLICY "Users can view organization quotes"
ON quotes FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- 7. Corregir política en 'suppliers'
DROP POLICY IF EXISTS "Users view own org suppliers" ON suppliers;
CREATE POLICY "Users view own org suppliers"
ON suppliers FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- 8. Corregir política en 'stock_movements'
DROP POLICY IF EXISTS "Users view own org stock" ON stock_movements;
CREATE POLICY "Users view own org stock"
ON stock_movements FOR SELECT
USING (
  organization_id = get_my_org_id()
);
