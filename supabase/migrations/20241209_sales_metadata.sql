-- Add metadata column to sales for flexible CSV import
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.sales.metadata IS 'Flexible storage for extra CSV columns imported from external systems';
