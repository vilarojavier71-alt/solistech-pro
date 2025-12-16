-- Add metadata column to appointments for flexible CSV import
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.appointments.metadata IS 'Flexible storage for extra CSV columns (N8N data, drive links, timestamps, etc)';
