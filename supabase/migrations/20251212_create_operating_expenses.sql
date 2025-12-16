-- Create operating_expenses table
CREATE TABLE IF NOT EXISTS public.operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Office', 'Equipment', 'Marketing', 'Software', 'Personnel', 'Vehicles', 'Other')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc' :: text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON public.operating_expenses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.operating_expenses
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete access for owners" ON public.operating_expenses
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_operating_expenses_date ON public.operating_expenses(date);
