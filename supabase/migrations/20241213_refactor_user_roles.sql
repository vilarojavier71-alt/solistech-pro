-- Migration: Refactor User Roles to Business Roles
-- Author: Antigravity
-- Date: 2024-12-13
-- Description: Mapear roles técnicos (installer, sales) a roles de negocio (ingeniero, comercial, captador_visitas)

-- PASO 1: Mapear roles existentes a nuevos roles
-- installer → ingeniero (personal técnico/instalación)
UPDATE users SET role = 'ingeniero' WHERE role = 'installer';

-- sales → comercial (ventas general)
UPDATE users SET role = 'comercial' WHERE role = 'sales';

-- user → mantener como está (se usará para otros casos)
-- captador_visitas será un nuevo rol para generación de leads

-- PASO 2: Modificar el CHECK constraint para incluir nuevos roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'admin', 'user', 'ingeniero', 'comercial', 'captador_visitas'));

-- PASO 3: Actualizar comentario de la columna
COMMENT ON COLUMN users.role IS 'Rol del usuario:
- owner: Propietario de la organización (máximos permisos)
- admin: Administrador con permisos completos
- user: Usuario estándar (empleado genérico)
- ingeniero: Personal de ingeniería/instalación (acceso a proyectos técnicos y fichajes)
- comercial: Personal de ventas (acceso a CRM, calculadora y clientes)
- captador_visitas: Captador de leads (acceso limitado a generación de visitas y leads)';

-- PASO 4: Actualizar políticas RLS si es necesario (la política actual usa role IN (...) así que no requiere cambios)
-- Las políticas existentes seguirán funcionando ya que verifican por organization_id principalmente

-- PASO 5: Actualizar índice (ya existe idx_users_role)

-- PASO 6: Logs para verificación
DO $$
BEGIN
  RAISE NOTICE 'Roles migrados exitosamente:';
  RAISE NOTICE 'installer → ingeniero';
  RAISE NOTICE 'sales → comercial';
  RAISE NOTICE 'Nuevos roles disponibles: owner, admin, user, ingeniero, comercial, captador_visitas';
END $$;
