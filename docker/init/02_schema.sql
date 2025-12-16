-- ============================================================================
-- SOLISTECH PRO - DOCKER STANDALONE SCHEMA
-- ============================================================================
-- This schema is designed for standalone PostgreSQL without Supabase Auth.
-- User authentication is handled by NextAuth.js instead.
-- ============================================================================

-- USERS (Standalone - No auth.users dependency)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- For local auth (bcrypt hash)
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'manager', 'employee')),
    department TEXT,
    organization_id UUID,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    tax_id TEXT,
    address JSONB,
    phone TEXT,
    email TEXT,
    subscription_status TEXT DEFAULT 'trial',
    subscription_plan TEXT DEFAULT 'pro',
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FK after both tables exist
ALTER TABLE public.users 
    ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    installation_type TEXT CHECK (installation_type IN ('residential', 'commercial', 'industrial')),
    status TEXT DEFAULT 'quote' CHECK (status IN ('quote', 'approved', 'installation', 'completed', 'cancelled')),
    system_size_kwp NUMERIC,
    estimated_production_kwh NUMERIC,
    estimated_savings NUMERIC,
    location JSONB,
    location_geo GEOGRAPHY(POINT, 4326), -- PostGIS
    cadastral_reference TEXT,
    cadastral_data JSONB,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- TIME ENTRIES
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_geo GEOGRAPHY(POINT, 4326),
    clock_out_geo GEOGRAPHY(POINT, 4326),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    invoice_number TEXT NOT NULL,
    sequential_number INTEGER,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
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
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, invoice_number)
);

-- INVOICE LINES
CREATE TABLE IF NOT EXISTS public.invoice_lines (
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

-- NEXTAUTH TABLES (For authentication)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_organization ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_location_geo ON public.projects USING GIST(location_geo);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_modtime ON public.users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_modtime ON public.customers;
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_modtime ON public.projects;
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_modtime ON public.invoices;
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Docker Standalone Schema Created Successfully';
END $$;
