-- SolisTech PRO - Initial Database Schema
-- Multitenancy Architecture with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE MULTITENANCY TABLES
-- ============================================================================

-- Organizations (Tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  tax_id TEXT,
  address JSONB,
  phone TEXT,
  email TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  subscription_plan TEXT DEFAULT 'pro' CHECK (subscription_plan IN ('pro')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CRM SOLAR TABLES
-- ============================================================================

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT CHECK (source IN ('web', 'referral', 'cold_call', 'social_media', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  estimated_value DECIMAL(10, 2),
  notes TEXT,
  lost_reason TEXT,
  created_by UUID REFERENCES users ON DELETE SET NULL,
  assigned_to UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address JSONB,
  tax_id TEXT,
  converted_from_lead UUID REFERENCES leads ON DELETE SET NULL,
  created_by UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'quote' CHECK (status IN ('quote', 'approved', 'installation', 'completed', 'cancelled')),
  installation_type TEXT CHECK (installation_type IN ('residential', 'commercial', 'industrial')),
  location JSONB, -- {lat, lng, address, city, postal_code}
  system_size_kwp DECIMAL(8, 2),
  estimated_production_kwh DECIMAL(10, 2),
  estimated_savings DECIMAL(10, 2),
  notes TEXT,
  created_by UUID REFERENCES users ON DELETE SET NULL,
  assigned_to UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SOLAR CALCULATOR & QUOTES
-- ============================================================================

-- Calculations
CREATE TABLE calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  annual_consumption_kwh DECIMAL(10, 2) NOT NULL,
  location JSONB NOT NULL, -- {lat, lng, address}
  roof_orientation TEXT CHECK (roof_orientation IN ('south', 'southeast', 'southwest', 'east', 'west', 'north', 'flat')),
  roof_tilt INTEGER CHECK (roof_tilt >= 0 AND roof_tilt <= 90),
  system_size_kwp DECIMAL(8, 2),
  estimated_production_kwh DECIMAL(10, 2),
  roi_percentage DECIMAL(5, 2),
  payback_years DECIMAL(4, 1),
  components JSONB, -- array of selected components
  pvgis_data JSONB, -- raw data from PVGis API
  created_by UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  line_items JSONB NOT NULL, -- [{description, quantity, unit_price, total}]
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 21.00,
  tax_amount DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,
  valid_until DATE,
  notes TEXT,
  terms_and_conditions TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, quote_number)
);

-- ============================================================================
-- COMPONENT CATALOG
-- ============================================================================

-- Components (Solar panels, inverters, batteries, etc.)
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('panel', 'inverter', 'battery', 'mounting', 'optimizer', 'other')),
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  specs JSONB, -- {power_wp, efficiency, warranty_years, dimensions, weight, etc.}
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_leads_organization ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_calculations_organization ON calculations(organization_id);
CREATE INDEX idx_calculations_project ON calculations(project_id);
CREATE INDEX idx_quotes_organization ON quotes(organization_id);
CREATE INDEX idx_quotes_project ON quotes(project_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_components_type ON components(type);
CREATE INDEX idx_components_active ON components(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Users: Can view users in their organization
CREATE POLICY "Users can view organization members"
  ON users FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Leads: Organization-scoped
CREATE POLICY "Users can view organization leads"
  ON leads FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update organization leads"
  ON leads FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete organization leads"
  ON leads FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Customers: Organization-scoped
CREATE POLICY "Users can view organization customers"
  ON customers FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert customers"
  ON customers FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update organization customers"
  ON customers FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete organization customers"
  ON customers FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Projects: Organization-scoped
CREATE POLICY "Users can view organization projects"
  ON projects FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update organization projects"
  ON projects FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete organization projects"
  ON projects FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Calculations: Organization-scoped
CREATE POLICY "Users can view organization calculations"
  ON calculations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert calculations"
  ON calculations FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update organization calculations"
  ON calculations FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete organization calculations"
  ON calculations FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Quotes: Organization-scoped
CREATE POLICY "Users can view organization quotes"
  ON quotes FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update organization quotes"
  ON quotes FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete organization quotes"
  ON quotes FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Components: Public read, admin write
CREATE POLICY "Anyone can view active components"
  ON components FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculations_updated_at BEFORE UPDATE ON calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  quote_count INTEGER;
  year_suffix TEXT;
BEGIN
  SELECT COUNT(*) INTO quote_count
  FROM quotes
  WHERE organization_id = org_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  year_suffix := TO_CHAR(NOW(), 'YY');
  RETURN 'Q-' || year_suffix || '-' || LPAD((quote_count + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
