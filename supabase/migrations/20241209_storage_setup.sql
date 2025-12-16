-- Configuración de Storage para Documentos de Venta
-- Bucket: sale_documents

-- 1. Crear el bucket si no existe (normalmente se hace desde UI, pero intentamos por SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale_documents', 'sale_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Seguridad (RLS) para storage.objects

-- Permitir lectura a usuarios autenticados de la misma organización
-- Asumimos estructura: sale_documents/{organization_id}/{sale_id}/{filename}

CREATE POLICY "Usuarios pueden ver documentos de su organización"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sale_documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM users WHERE id = auth.uid()
  )
);

-- Permitir subida a usuarios autenticados en su organización
CREATE POLICY "Usuarios pueden subir documentos a su organización"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sale_documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM users WHERE id = auth.uid()
  )
);

-- Permitir actualización y borrado (opcional, para gestión)
CREATE POLICY "Usuarios pueden gestionar sus documentos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sale_documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM users WHERE id = auth.uid()
  )
);
