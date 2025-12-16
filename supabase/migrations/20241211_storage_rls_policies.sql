-- ============================================================================
-- STORAGE RLS POLICIES FIX
-- @SEGURIDAD_AUDITOR - Añadir políticas RLS para buckets de Storage
-- ============================================================================

-- Política para bucket 'quotes' (Presupuestos)
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

-- Política para bucket 'presentations' (Presentaciones)
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

-- Política para bucket 'documents' (Documentos generales)
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
