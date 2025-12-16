-- ============================================================================
-- SOLISTECH PRO - GREENFIELD RESET
-- Elimina todos los datos de usuario manteniendo estructura y datos maestros
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================================
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de usuario.
-- Asegúrate de tener un backup antes de ejecutar.
-- PASO 1: Deshabilitar temporalmente triggers y constraints
SET session_replication_role = 'replica';
-- PASO 2: Truncar tablas de datos de USUARIO (en orden de dependencias)
-- Nivel 4: Tablas de detalle más profundo
TRUNCATE TABLE IF EXISTS invoice_lines CASCADE;
TRUNCATE TABLE IF EXISTS invoice_payments CASCADE;
TRUNCATE TABLE IF EXISTS sale_documents CASCADE;
TRUNCATE TABLE IF EXISTS sale_status_history CASCADE;
TRUNCATE TABLE IF EXISTS client_notifications CASCADE;
TRUNCATE TABLE IF EXISTS support_tickets CASCADE;
TRUNCATE TABLE IF EXISTS help_tickets CASCADE;
TRUNCATE TABLE IF EXISTS subsidy_documents CASCADE;
-- Nivel 3: Tablas de transacciones principales
TRUNCATE TABLE IF EXISTS invoices CASCADE;
TRUNCATE TABLE IF EXISTS time_entries CASCADE;
TRUNCATE TABLE IF EXISTS work_days CASCADE;
TRUNCATE TABLE IF EXISTS presentations CASCADE;
TRUNCATE TABLE IF EXISTS calculations CASCADE;
TRUNCATE TABLE IF EXISTS quotes CASCADE;
TRUNCATE TABLE IF EXISTS sales CASCADE;
TRUNCATE TABLE IF EXISTS stock_movements CASCADE;
TRUNCATE TABLE IF EXISTS subsidy_applications CASCADE;
TRUNCATE TABLE IF EXISTS switching_requests CASCADE;
TRUNCATE TABLE IF EXISTS financial_transactions CASCADE;
TRUNCATE TABLE IF EXISTS subscriptions CASCADE;
TRUNCATE TABLE IF EXISTS user_benefit_reports CASCADE;
TRUNCATE TABLE IF EXISTS ai_benefit_searches CASCADE;
TRUNCATE TABLE IF EXISTS appointments CASCADE;
-- Nivel 2: Tablas de entidades principales
TRUNCATE TABLE IF EXISTS projects CASCADE;
TRUNCATE TABLE IF EXISTS customers CASCADE;
TRUNCATE TABLE IF EXISTS leads CASCADE;
TRUNCATE TABLE IF EXISTS suppliers CASCADE;
TRUNCATE TABLE IF EXISTS components CASCADE;
-- Nivel 1: Tablas de configuración por organización
TRUNCATE TABLE IF EXISTS organization_settings CASCADE;
TRUNCATE TABLE IF EXISTS invoice_settings CASCADE;
TRUNCATE TABLE IF EXISTS time_tracking_settings CASCADE;
TRUNCATE TABLE IF EXISTS user_roles CASCADE;
-- Nivel 0: Tablas de usuarios y organizaciones
TRUNCATE TABLE IF EXISTS users CASCADE;
TRUNCATE TABLE IF EXISTS organizations CASCADE;
-- PASO 3: Limpiar también datos de referencia que se regenerarán
TRUNCATE TABLE IF EXISTS municipal_tax_benefits CASCADE;
TRUNCATE TABLE IF EXISTS subsidies CASCADE;
-- PASO 4: Restaurar triggers y constraints
SET session_replication_role = 'origin';
-- PASO 5: Verificar estado
SELECT '✅ Greenfield Reset Completado' AS status;
-- Mostrar conteo de tablas principales (deberían estar en 0)
SELECT 'users' AS tabla,
    COUNT(*) AS registros
FROM users
UNION ALL
SELECT 'organizations',
    COUNT(*)
FROM organizations
UNION ALL
SELECT 'customers',
    COUNT(*)
FROM customers
UNION ALL
SELECT 'projects',
    COUNT(*)
FROM projects
UNION ALL
SELECT 'invoices',
    COUNT(*)
FROM invoices
UNION ALL
SELECT 'time_entries',
    COUNT(*)
FROM time_entries;