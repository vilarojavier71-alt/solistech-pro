-- ============================================
-- SCRIPT DE EMERGENCIA: DESBLOQUEO MOTORGAP
-- Ejecutar en Prisma Studio SQL o pgAdmin
-- ============================================
-- PASO 1: Verificar usuario actual
SELECT id,
    email,
    full_name,
    organization_id,
    role,
    is_test_admin
FROM users
WHERE email LIKE '%motorgap%'
    OR email LIKE '%vilaro%'
LIMIT 5;
-- PASO 2: Verificar organizaciones existentes
SELECT id,
    name,
    subscription_status,
    subscription_plan
FROM organizations
LIMIT 5;
-- PASO 3: Si NO hay organización, crear una
INSERT INTO organizations (
        id,
        name,
        slug,
        subscription_plan,
        subscription_status,
        max_employees,
        is_god_mode,
        subscription_ends_at,
        created_at,
        updated_at
    )
VALUES (
        gen_random_uuid(),
        'MotorGap Taller',
        'motorgap-taller-' || substr(md5(random()::text), 1, 6),
        'pro',
        'active',
        -1,
        true,
        '2099-12-31'::timestamp,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING
RETURNING id;
-- PASO 4: Vincular usuario a la organización (reemplaza los UUIDs)
-- Ejecutar DESPUÉS de obtener el ID de la organización del paso anterior
/*
 UPDATE users 
 SET 
 organization_id = 'PEGAR_UUID_ORGANIZACION_AQUI',
 role = 'admin',
 is_test_admin = true
 WHERE email = 'motorgapvilaro@gmail.com';
 */
-- PASO 5: Verificar el resultado
SELECT u.email,
    u.role,
    u.is_test_admin,
    o.name as org_name,
    o.subscription_status
FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email LIKE '%motorgap%'
    OR u.email LIKE '%vilaro%';