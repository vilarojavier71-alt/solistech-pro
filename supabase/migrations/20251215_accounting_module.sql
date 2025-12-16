-- 20251215_accounting_module.sql

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_id UUID REFERENCES public.accounting_accounts(id),
    is_group BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, code)
);

CREATE TABLE IF NOT EXISTS public.accounting_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    reference TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'void')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.accounting_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_id UUID NOT NULL REFERENCES public.accounting_journals(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
    debit DECIMAL(20, 2) DEFAULT 0,
    credit DECIMAL(20, 2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create Basic RLS Policies (Organization Isolation)
-- Accounts
CREATE POLICY "Users can view accounts of their organization" ON public.accounting_accounts
    FOR SELECT USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage accounts of their organization" ON public.accounting_accounts
    FOR ALL USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Journals
CREATE POLICY "Users can view journals of their organization" ON public.accounting_journals
    FOR SELECT USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage journals of their organization" ON public.accounting_journals
    FOR ALL USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Transactions
-- Since transactions don't have organization_id directly, we check via journal_id
CREATE POLICY "Users can view transactions of their organization" ON public.accounting_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.accounting_journals j
            WHERE j.id = accounting_transactions.journal_id
            AND j.organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can manage transactions of their organization" ON public.accounting_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.accounting_journals j
            WHERE j.id = accounting_transactions.journal_id
            AND j.organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
        )
    );

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_org_type ON public.accounting_accounts(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_accounting_journals_org_date ON public.accounting_journals(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_journal ON public.accounting_transactions(journal_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_account ON public.accounting_transactions(account_id);
