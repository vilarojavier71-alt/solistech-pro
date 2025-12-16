-- MASTER ALL-IN-ONE MIGRATION SCRIPT
-- SOLISTECH PRO CORE SCHEMA
-- !WARNING! THIS SCRIPT WILL WIPE ALL DATA IN THE SPECIFIED TABLES.
-- Execute in Supabase SQL Editor.

-- 1. CLEANUP (Destruction)
DROP TABLE IF EXISTS public.invoice_lines CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.time_entries CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
-- Users table in public is usually a profile table linked to auth.users. 
-- We drop it to ensure clean slate, but be careful if you have manual data there.
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. TABLE CREATION

-- USERS (Profiles)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID DEFAULT gen_random_uuid(), -- For now self-gen, later linked to orgs table
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'manager', 'employee')),
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CUSTOMERS
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.users(organization_id), -- Simplified tenancy linkage
    -- In a real multi-tenant app, organizations would be a separate table. 
    -- Here assuming users.organization_id is the grouper.
    created_by UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    nif TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    country TEXT,
    notes TEXT,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROJECTS
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID, -- Link loosely or strictly depending on multi-tenancy design
    client_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    installation_type TEXT CHECK (installation_type IN ('residential', 'commercial', 'industrial')),
    status TEXT DEFAULT 'quote' CHECK (status IN ('quote', 'approved', 'installation', 'completed', 'cancelled')),
    system_size_kwp NUMERIC,
    estimated_production_kwh NUMERIC,
    estimated_savings NUMERIC,
    location JSONB, -- { address, city, postal_code }
    cadastral_reference TEXT,
    cadastral_data JSONB,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TIME ENTRIES
CREATE TABLE public.time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    lat_in NUMERIC,
    lng_in NUMERIC,
    address_in TEXT,
    lat_out NUMERIC,
    lng_out NUMERIC,
    address_out TEXT,
    total_minutes INTEGER,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INVOICES
CREATE TABLE public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    invoice_number TEXT NOT NULL,
    sequential_number INTEGER,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- Snapshot data to prevent changes if customer details change later
    customer_name TEXT,
    customer_nif TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_postal_code TEXT,
    customer_email TEXT,

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    internal_notes TEXT,
    
    -- Verifactu Fields
    verifactu_hash TEXT,
    verifactu_previous_hash TEXT,
    verifactu_signature TEXT,
    verifactu_qr_code TEXT,
    verifactu_qr_url TEXT,
    
    payment_method_id UUID,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(organization_id, invoice_number)
);

CREATE TABLE public.invoice_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    line_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 21,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL
);

-- 3. RLS POLICIES

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

-- USERS Policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  exists (select 1 from public.users where id = auth.uid() and role IN ('owner', 'admin'))
);
-- Allow service role full access implicitly, needed for auth hooks.
-- For update:
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- CUSTOMERS Policies
CREATE POLICY "Users view org customers" ON public.customers FOR SELECT USING (
  exists (select 1 from public.users where id = auth.uid() and organization_id = public.customers.organization_id)
);
CREATE POLICY "Employees can insert customers" ON public.customers FOR INSERT WITH CHECK (
  exists (select 1 from public.users where id = auth.uid() and organization_id = public.customers.organization_id)
);
CREATE POLICY "Admins update customers" ON public.customers FOR UPDATE USING (
  exists (select 1 from public.users where id = auth.uid() and role IN ('owner', 'admin'))
);

-- PROJECTS Policies
CREATE POLICY "Users view projects" ON public.projects FOR SELECT USING (true); -- Simplified for visibility
CREATE POLICY "Users create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- TIME ENTRIES Policies
CREATE POLICY "View own entries" ON public.time_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all time entries" ON public.time_entries FOR SELECT USING (
    exists (select 1 from public.users where id = auth.uid() and role IN ('owner', 'admin'))
);
CREATE POLICY "Create own entries" ON public.time_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own active entries" ON public.time_entries FOR UPDATE USING (user_id = auth.uid());

-- INVOICES Policies
CREATE POLICY "View invoices" ON public.invoices FOR SELECT USING (true); -- Simplify for dev
CREATE POLICY "Create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "View invoice lines" ON public.invoice_lines FOR SELECT USING (true);

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
