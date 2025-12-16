-- Add latitude and longitude columns to projects table if they don't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_projects_lat_lon ON public.projects(latitude, longitude);
