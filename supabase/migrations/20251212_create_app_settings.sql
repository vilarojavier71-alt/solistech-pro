-- Create app_settings table to store global configurations
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name text UNIQUE NOT NULL,
    setting_value text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc' :: text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc' :: text, now()) NOT NULL
);

-- Insert placeholder for google_maps_api_key
INSERT INTO public.app_settings (setting_name, setting_value)
VALUES ('google_maps_api_key', '')
ON CONFLICT (setting_name) DO NOTHING;

-- Enable RLS (Optional but recommended, though valid for admins)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write for authenticated users (simplified for this context)
CREATE POLICY "Allow all access for authenticated users" ON public.app_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
