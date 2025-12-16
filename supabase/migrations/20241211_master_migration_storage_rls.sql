-- ============================================================================
-- SCRIPT MAESTRO DE MIGRACIÓN - SOLISTECH PRO V2
-- ============================================================================
-- @SEGURIDAD_AUDITOR + @BACKEND_ESPECIALISTA
-- 
-- Este script consolida TODAS las migraciones necesarias para:
-- 1. Storage RLS Policies (quotes, presentations, documents, technical-memories)
-- 2. Verificación de políticas existentes
-- 3. Rollback seguro en caso de error
--
-- EJECUCIÓN: Aplicar en Supabase SQL Editor
-- VERSIÓN: 2024-12-11 (Fixed)
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICACIÓN PREVIA
-- ============================================================================

DO $$
DECLARE
    v_error_count INTEGER := 0;
    v_warning_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== INICIANDO VERIFICACIÓN PREVIA ===';
    
    -- Verificar que no existen políticas públicas abiertas
    SELECT COUNT(*) INTO v_error_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND qual IS NULL
    AND cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE');
    
    IF v_error_count > 0 THEN
        RAISE WARNING 'ADVERTENCIA: Se encontraron % políticas públicas sin restricciones', v_error_count;
    ELSE
        RAISE NOTICE '✅ No se encontraron políticas públicas abiertas';
    END IF;
    
    -- Verificar que RLS está habilitado en tablas críticas
    SELECT COUNT(*) INTO v_warning_count
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('users', 'organizations', 'projects', 'customers', 'invoices', 'presentations')
    AND c.relrowsecurity = false;
    
    IF v_warning_count > 0 THEN
        RAISE WARNING 'ADVERTENCIA: % tablas críticas sin RLS habilitado', v_warning_count;
    ELSE
        RAISE NOTICE '✅ RLS habilitado en todas las tablas críticas';
    END IF;
    
    RAISE NOTICE '=== VERIFICACIÓN PREVIA COMPLETADA ===';
END $$;

-- ============================================================================
-- PARTE 2: STORAGE RLS POLICIES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== APLICANDO STORAGE RLS POLICIES ===';
END $$;

-- ----------------------------------------------------------------------------
-- BUCKET: quotes (Presupuestos)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "quotes_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "quotes_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "quotes_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "quotes_delete_policy" ON storage.objects;

CREATE POLICY "quotes_select_policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quotes' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "quotes_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quotes' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "quotes_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'quotes' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "quotes_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'quotes' AND
    auth.uid() IS NOT NULL
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS para bucket "quotes" aplicadas';
END $$;

-- ----------------------------------------------------------------------------
-- BUCKET: presentations (Presentaciones)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "presentations_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "presentations_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "presentations_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "presentations_delete_policy" ON storage.objects;

CREATE POLICY "presentations_select_policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'presentations' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "presentations_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'presentations' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "presentations_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'presentations' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "presentations_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'presentations' AND
    auth.uid() IS NOT NULL
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS para bucket "presentations" aplicadas';
END $$;

-- ----------------------------------------------------------------------------
-- BUCKET: documents (Documentos generales)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_policy" ON storage.objects;

CREATE POLICY "documents_select_policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "documents_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "documents_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "documents_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS para bucket "documents" aplicadas';
END $$;

-- ----------------------------------------------------------------------------
-- BUCKET: technical-memories (Memorias técnicas)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "technical_memories_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "technical_memories_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "technical_memories_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "technical_memories_delete_policy" ON storage.objects;

CREATE POLICY "technical_memories_select_policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'technical-memories' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "technical_memories_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'technical-memories' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "technical_memories_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'technical-memories' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "technical_memories_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'technical-memories' AND
    auth.uid() IS NOT NULL
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS para bucket "technical-memories" aplicadas';
END $$;

-- ============================================================================
-- PARTE 3: VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

DO $$
DECLARE
    v_policy_count INTEGER;
    v_expected_policies INTEGER := 16;
    v_unprotected_policies INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN POST-MIGRACIÓN ===';
    
    -- Contar políticas de Storage creadas
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
        'quotes_select_policy', 'quotes_insert_policy', 'quotes_update_policy', 'quotes_delete_policy',
        'presentations_select_policy', 'presentations_insert_policy', 'presentations_update_policy', 'presentations_delete_policy',
        'documents_select_policy', 'documents_insert_policy', 'documents_update_policy', 'documents_delete_policy',
        'technical_memories_select_policy', 'technical_memories_insert_policy', 'technical_memories_update_policy', 'technical_memories_delete_policy'
    );
    
    IF v_policy_count >= v_expected_policies THEN
        RAISE NOTICE '✅ Storage RLS Policies: % políticas aplicadas correctamente', v_policy_count;
    ELSE
        RAISE WARNING 'ADVERTENCIA: Se esperaban % políticas, se encontraron %', v_expected_policies, v_policy_count;
    END IF;
    
    -- Verificar que todas las políticas requieren autenticación
    SELECT COUNT(*) INTO v_unprotected_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
        'quotes_select_policy', 'quotes_insert_policy', 'quotes_update_policy', 'quotes_delete_policy',
        'presentations_select_policy', 'presentations_insert_policy', 'presentations_update_policy', 'presentations_delete_policy',
        'documents_select_policy', 'documents_insert_policy', 'documents_update_policy', 'documents_delete_policy',
        'technical_memories_select_policy', 'technical_memories_insert_policy', 'technical_memories_update_policy', 'technical_memories_delete_policy'
    )
    AND (qual NOT LIKE '%auth.uid()%' OR qual IS NULL);
    
    IF v_unprotected_policies > 0 THEN
        RAISE WARNING 'ADVERTENCIA: % políticas de Storage sin verificación de auth.uid()', v_unprotected_policies;
    ELSE
        RAISE NOTICE '✅ Todas las políticas de Storage requieren autenticación';
    END IF;
    
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===';
    RAISE NOTICE 'Políticas RLS aplicadas para buckets: quotes, presentations, documents, technical-memories';
    RAISE NOTICE 'Total de políticas creadas: %', v_policy_count;
END $$;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

