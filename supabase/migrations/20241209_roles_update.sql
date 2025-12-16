-- Actualización de Roles y Permisos
-- Fecha: 2024-12-09

-- 1. Actualizar Check Constraint de Roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'admin', 'user', 'pica', 'commercial', 'engineer', 'installer'));

-- NOTA: 'user' se mantendrá como legacy o fallback, pero migraremos a los roles específicos.

-- 2. Policies para Installer (Instalador)
-- Solo puede ver proyectos donde esté asignado
-- NO puede ver Quotes ni Sales (Precios)

-- Projects: Select asignados
CREATE POLICY "Installers view assigned projects"
ON projects FOR SELECT
USING (
  auth.role() = 'authenticated' AND 
  (
    (SELECT role FROM users WHERE id = auth.uid()) = 'installer' AND assigned_to = auth.uid()
  )
);

-- 3. Policies para Engineer (Ingeniero)
-- Puede ver proyectos asignados y modificar estado técnico
CREATE POLICY "Engineers view assigned projects"
ON projects FOR SELECT
USING (
  auth.role() = 'authenticated' AND 
  (
    (SELECT role FROM users WHERE id = auth.uid()) = 'engineer' AND assigned_to = auth.uid()
  ) OR
  (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'commercial') -- Managers ven todo
);

CREATE POLICY "Engineers update assigned projects"
ON projects FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'engineer' AND assigned_to = auth.uid()
);


-- 4. Policies para Pica (Captador) & Comercial
-- Pica ve sus Leads, Quotes y Appointments.
-- Commercial ve todo lo de su organizacion (similar a Admin en operativa, pero quizas restringido en Settings).

-- Quotes: Pica puede crear y ver SUS quotes o las de su organizacion (depende de cuan estricto sea el "sus").
-- Asumimos que Pica ve TOODAS las de la org para colaborar, o solo las suyas. 
-- El user pidió "que le sirva para captar", así que acceso de lectura/escritura general a quotes de la org suele ser lo standard en pymes pequeñas.
-- Si hay restricción, se añadiría "created_by = auth.uid()".

-- Por ahora, como 'owner/admin/user' ya tienen policies genericas "view organization quotes", 
-- necesitamos asegurar que 'pica', 'commercial', etc. tambien entren en esas policies.
-- Las policies actuales usan: 
-- organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
-- Esto YA CUBRE a los nuevos roles siempre que tengan organization_id seteado.

-- LO QUE NECESITAMOS RESTRINGIR es el acceso a PRECIOS para el Instalador.
-- Como RLS aplica a nivel de fila (todo o nada), si el instalador necesita ver el proyecto pero no el precio...
-- En `projects` no hay precios, están en `quotes` o `sales`.
-- Así que simplemente NO damos permiso de SELECT en `quotes` ni `sales` a `installer`.

-- ELIMINAR access general a Quotes/Sales para Installers si la policy actual es muy permisiva.
-- Las policies actuales son: "Users can view organization quotes".
-- Necesitamos modificar esa policy para EXCLUIR installers.

DROP POLICY IF EXISTS "Users can view organization quotes" ON quotes;

CREATE POLICY "Non-installers can view organization quotes"
ON quotes FOR SELECT
USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) NOT IN ('installer')
);

-- Idem para Sales
DROP POLICY IF EXISTS "Users can view organization sales" ON sales;

CREATE POLICY "Non-installers can view organization sales"
ON sales FOR SELECT
USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) NOT IN ('installer')
);
