-- SCRIPT PARA CAMBIAR ROL DE USUARIO A ADMIN
-- Ejecutar en Supabase SQL Editor

-- Opción 1: Cambiar por EMAIL (recomendado)
-- Reemplaza 'tu-email@ejemplo.com' con tu email real
UPDATE users 
SET role = 'admin'
WHERE email = 'tu-email@ejemplo.com';

-- Opción 2: Cambiar por ID de usuario
-- Si conoces tu user ID, úsalo aquí
-- UPDATE users 
-- SET role = 'admin'
-- WHERE id = 'tu-uuid-aqui';

-- Opción 3: Cambiar el PRIMER usuario de la organización a admin
-- (Útil si eres el único usuario)
UPDATE users 
SET role = 'admin'
WHERE id = (
    SELECT id FROM users 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Verificar el cambio
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM users
ORDER BY created_at;

-- NOTA: Después de ejecutar, cierra sesión y vuelve a iniciar sesión
-- para que los cambios se reflejen en la aplicación
