-- Migration: Add Employee Roles to Users Table
-- Author: Antigravity
-- Date: 2024-12-13
-- Description: Ampliar roles de usuario para incluir empleados específicos (instaladores, ventas)

-- 1. Modificar el CHECK constraint para incluir nuevos roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'admin', 'user', 'installer', 'sales'));

-- 2. Actualizar comentario de la columna
COMMENT ON COLUMN users.role IS 'Rol del usuario:
- owner: Propietario de la organización (máximos permisos)
- admin: Administrador con permisos completos
- user: Usuario estándar (empleado genérico)
- installer: Instalador (acceso a fichajes y proyectos asignados)
- sales: Ventas (acceso a CRM, calculadora y clientes)';

-- 3. Política RLS para creación de usuarios (solo admin/owner pueden crear)
CREATE POLICY "Only admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- 4. Índice para mejorar queries por rol
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
