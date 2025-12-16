-- Drop documents table and cascade dependencies (policies, etc.)
DROP TABLE IF EXISTS public.documents CASCADE;

-- If we had a specific storage bucket deletion, it's usually done via API or UI, 
-- but we can't easily drop buckets via SQL in standard Supabase setups without extensions.
-- We will assume the bucket remains or is cleaned up manually if needed.
