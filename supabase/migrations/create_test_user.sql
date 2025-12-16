-- SOLUCIÓN ALTERNATIVA: Crear usuario de prueba directamente
-- Esto evita problemas con el flujo de registro

-- IMPORTANTE: Este SQL crea un usuario de prueba directamente en Supabase
-- Después de ejecutar esto, podrás hacer login con:
-- Email: test@solistech.com
-- Password: test123456

-- Paso 1: Crear organización de prueba
INSERT INTO organizations (id, name, slug, subscription_status, trial_ends_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'SolisTech Demo',
  'solistech-demo',
  'trial',
  NOW() + INTERVAL '14 days'
)
ON CONFLICT (id) DO NOTHING;

-- Paso 2: El usuario se creará desde Supabase Auth Dashboard
-- Ve a Authentication → Users → Add User
-- Email: test@solistech.com
-- Password: test123456
-- Auto Confirm User: SÍ (muy importante)

-- Paso 3: Después de crear el usuario en Auth, copia su UUID y ejecútalo aquí:
-- REEMPLAZA 'USER_UUID_AQUI' con el UUID real del usuario que creaste

-- INSERT INTO users (id, organization_id, role, full_name, email)
-- VALUES (
--   'USER_UUID_AQUI'::uuid,
--   'a0000000-0000-0000-0000-000000000001'::uuid,
--   'owner',
--   'Test User',
--   'test@solistech.com'
-- );

-- INSTRUCCIONES:
-- 1. Ejecuta solo el INSERT de organizations (arriba)
-- 2. Ve a Supabase → Authentication → Users → Add User
-- 3. Crea usuario con email test@solistech.com, password test123456
-- 4. Marca "Auto Confirm User"
-- 5. Copia el UUID del usuario creado
-- 6. Descomenta el INSERT de users y reemplaza USER_UUID_AQUI
-- 7. Ejecuta el INSERT de users
-- 8. Haz login en http://localhost:3000/auth/login
