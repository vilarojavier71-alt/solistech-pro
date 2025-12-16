-- Create Appointments table for Calendar/Agenda
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Optional link to customer
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- The Commercial
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- The Canvasser (Pica) or Admin
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  address TEXT, -- Visit location
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view appointments of their organization" 
ON public.appointments FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert appointments for their organization" 
ON public.appointments FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update appointments of their organization" 
ON public.appointments FOR UPDATE 
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);
