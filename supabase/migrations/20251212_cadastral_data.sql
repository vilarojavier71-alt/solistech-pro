-- Add cadastral data columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS cadastral_reference TEXT,
ADD COLUMN IF NOT EXISTS cadastral_address TEXT,
ADD COLUMN IF NOT EXISTS cadastral_data JSONB DEFAULT '{}'::jsonb;
