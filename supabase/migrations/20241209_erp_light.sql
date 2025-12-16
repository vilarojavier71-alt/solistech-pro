-- ERP Light Migration: Stock, Suppliers, Installations
-- Date: 2024-12-09

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    tax_id TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org suppliers" ON suppliers
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins/Commercials can manage suppliers" ON suppliers
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'commercial', 'engineer')
    );

-- 2. Enhance Components Table
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- 3. Stock Movements Table
CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment');

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    component_id UUID NOT NULL REFERENCES components(id),
    type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL, -- Positive for IN, Negative for OUT usually, but we can store absolute and use type
    cost_at_time NUMERIC(10,2), -- Snapshot of cost when moved
    project_id UUID REFERENCES projects(id), -- If allocated to a project
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Stock Movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock movements" ON stock_movements
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth users can create stock movements" ON stock_movements
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- 4. Projects Installation Dates
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS installation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS installation_end_date TIMESTAMPTZ;

-- Update RLS for installers to allow updating projects (dates/status)
-- Previously we only allowed SELECT for installers on assigned projects.
-- We should allow UPDATE on specific fields if needed, but usually Admin assigns dates.
-- Let's ensure Installers can VIEW these new fields (implied by SELECT *).
