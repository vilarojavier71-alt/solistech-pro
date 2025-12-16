-- FIX: Ensure Storage Buckets exist and have correct RLS Policies
-- Solves "Error Upload Storage" / "row-level security violation"

-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts/duplicates
-- We must do this carefully per policy name

-- AVATARS POLICIES
DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatar User Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar User Delete" ON storage.objects;

-- COMPANY-LOGOS POLICIES
DROP POLICY IF EXISTS "Logo Public View" ON storage.objects;
DROP POLICY IF EXISTS "Logo Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Logo Sales Update" ON storage.objects;

-- 3. Create Robust Policies for 'avatars'
-- Everyone can view
CREATE POLICY "Avatar Public View" ON storage.objects
FOR SELECT USING ( bucket_id = 'avatars' );

-- Authenticated users can upload (INSERT)
CREATE POLICY "Avatar Auth Insert" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Users can UPDATE their own files (assuming path contains user_id or we just allow updates for simplicty to authenticated owner)
CREATE POLICY "Avatar User Update" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid() = owner
);

-- Users can DELETE their own files
CREATE POLICY "Avatar User Delete" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid() = owner
);

-- 4. Create Policies for 'company-logos'
CREATE POLICY "Logo Public View" ON storage.objects
FOR SELECT USING ( bucket_id = 'company-logos' );

CREATE POLICY "Logo Auth Insert" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Logo Sales Update" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated' -- Ideally restricted to 'admin' or 'sales'
);
