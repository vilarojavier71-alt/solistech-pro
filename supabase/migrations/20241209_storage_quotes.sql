-- Storage para Presupuestos PDF
-- Fecha: 2024-12-09

-- 1. Crear Bucket (si no existe, Supabase lo maneja via API o dashboard, pero intentamos script por si acaso users run migrations manually)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies
-- Permitir lectura pública (para emails) o restringida (mejor pública con token, pero bucket público es más fácil para MVP)
CREATE POLICY "Public Access Quotes"
ON storage.objects FOR SELECT
USING ( bucket_id = 'quotes' );

-- Permitir subida a usuarios autenticados
CREATE POLICY "Auth Users Upload Quotes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quotes' 
  AND auth.role() = 'authenticated'
);

-- Permitir update/delete (opcional)
CREATE POLICY "Auth Users Update Quotes"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'quotes' AND auth.uid() = owner );
