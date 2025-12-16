-- ==========================================================================
-- CONFIGURACIÓN DE SUP ABASE STORAGE PARA AVATARES Y LOGOS
-- ==========================================================================

-- 1. Crear bucket para perfiles de usuarios (avatares)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear bucket para organizaciones (logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('organizations', 'organizations', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage para 'profiles' (avatares)
-- Permitir lectura pública
CREATE POLICY "Public Access to Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Permitir que usuarios autenticados suban sus propios avatares
CREATE POLICY "Users can upload their avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuarios actualicen su propio avatar
CREATE POLICY "Users can update their avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuarios eliminen su propio avatar
CREATE POLICY "Users can delete their avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Políticas de Storage para 'organizations' (logos)
-- Permitir lectura pública
CREATE POLICY "Public Access to Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organizations');

-- Permitir que usuarios autenticados de la organización suban logo
CREATE POLICY "Organization members can upload logo"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'organizations' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- Permitir que admins actualicen el logo
CREATE POLICY "Organization admins can update logo"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'organizations' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- Permitir que admins eliminen el logo
CREATE POLICY "Organization admins can delete logo"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'organizations' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);
