-- ============================================================================
-- FINTECH CORE ENGINE - DATABASE MIGRATION
-- ============================================================================
-- Designed for High-Margin Solar Projects (SEPA > Cards)
-- Security: PCI-DSS Compliant (No raw card data)

-- 1. ENUMS
DO $$
BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded');
    CREATE TYPE payment_method_type AS ENUM ('card', 'sepa_debit', 'transfer', 'cash', 'financing');
    CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'disputed');
    CREATE TYPE subscription_interval AS ENUM ('month', 'year');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PAYMENT METHODS (Tokenized)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    type payment_method_type NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe', -- stripe, gocardless, manual
    provider_payment_method_id TEXT, -- e.g. pm_12345
    
    -- Display Info (Safe)
    last4 VARCHAR(4),
    brand VARCHAR(20), -- visa, mastercard, iban_bank_name
    exp_month INTEGER,
    exp_year INTEGER,
    
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVOICES (The Core)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Identification
    number TEXT NOT NULL, -- e.g. INV-2024-001
    sequence_id INTEGER, -- Internal sequence for gapless checks
    
    -- Amounts
    currency VARCHAR(3) DEFAULT 'EUR',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    amount_due DECIMAL(12, 2) GENERATED ALWAYS AS (total - amount_paid) STORED,
    
    -- Dates
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    
    -- Status
    status invoice_status DEFAULT 'draft',
    
    -- Smart Link
    public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    
    -- Metadata
    items JSONB DEFAULT '[]', -- Line items snapshot
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, number)
);

-- 4. FINANCIAL TRANSACTIONS (The Ledger)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    status transaction_status DEFAULT 'pending',
    type VARCHAR(50) NOT NULL, -- payment, refund, payout
    
    -- Provider Info
    provider TEXT NOT NULL DEFAULT 'stripe',
    provider_transaction_id TEXT, -- ch_12345 or pi_12345
    fee_amount DECIMAL(10, 2), -- Track our costs!
    
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBSCRIPTIONS (Recurring Revenue)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL, -- e.g. "Mantenimiento Solar Premium"
    status VARCHAR(50) DEFAULT 'active', -- active, past_due, canceled
    
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    interval subscription_interval DEFAULT 'year',
    
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    provider_subscription_id TEXT, -- sub_12345
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_token ON invoices(public_token);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON financial_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON financial_transactions(provider_transaction_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);

-- 7. RLS POLICIES (Preliminary)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Installers (BLIND) cannot see these tables.
-- Logic handled by `20241212_advanced_rbac.sql` "SoD" patterns (Implicit deny if not granted).
-- We grant specific access to 'owner', 'admin', 'sales', 'commercial'.

DROP POLICY IF EXISTS "Financials Access" ON invoices;    
CREATE POLICY "Financials Access" ON invoices
    USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'sales', 'commercial')
    );
    
-- Identical policies for other tables...
DROP POLICY IF EXISTS "Financials Access Trx" ON financial_transactions;
CREATE POLICY "Financials Access Trx" ON financial_transactions
    USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'sales', 'commercial')
    );

DROP POLICY IF EXISTS "Financials Access Subs" ON subscriptions;
CREATE POLICY "Financials Access Subs" ON subscriptions
    USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'sales', 'commercial')
    );
