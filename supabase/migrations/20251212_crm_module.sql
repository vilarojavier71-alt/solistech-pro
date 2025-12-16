-- ============================================================================
-- SOLISTECH PRO - CRM MODULE MIGRATION
-- ============================================================================
-- Description: Adds tables for Contacts, Opportunities, and Activities.
-- Date: 2025-12-12
-- ============================================================================

-- 1. CONTACTS (Multiple contacts per customer)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT, -- e.g., 'CEO', 'Technical Director', 'Homeowner'
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(customer_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org contacts" ON contacts;
CREATE POLICY "Users can view org contacts" ON contacts FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert org contacts" ON contacts;
CREATE POLICY "Users can insert org contacts" ON contacts FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update org contacts" ON contacts;
CREATE POLICY "Users can update org contacts" ON contacts FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete org contacts" ON contacts;
CREATE POLICY "Users can delete org contacts" ON contacts FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));


-- 2. OPPORTUNITIES (Sales Pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g., "Solar Installation - 5kW"
    stage TEXT NOT NULL DEFAULT 'prospecting', -- prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    amount DECIMAL(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    probability INTEGER DEFAULT 0, -- 0-100%
    expected_close_date DATE,
    source TEXT, -- web, referral, etc.
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    priority TEXT DEFAULT 'medium', -- low, medium, high
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_organization ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned ON opportunities(assigned_to);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org opportunities" ON opportunities;
CREATE POLICY "Users can view org opportunities" ON opportunities FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert org opportunities" ON opportunities;
CREATE POLICY "Users can insert org opportunities" ON opportunities FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update org opportunities" ON opportunities;
CREATE POLICY "Users can update org opportunities" ON opportunities FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete org opportunities" ON opportunities;
CREATE POLICY "Users can delete org opportunities" ON opportunities FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));


-- 3. ACTIVITIES (Interaction Logging)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who performed/assigned the activity
    type TEXT NOT NULL, -- call, email, meeting, note, task
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, cancelled
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_organization ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org activities" ON activities;
CREATE POLICY "Users can view org activities" ON activities FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert org activities" ON activities;
CREATE POLICY "Users can insert org activities" ON activities FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update org activities" ON activities;
CREATE POLICY "Users can update org activities" ON activities FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete org activities" ON activities;
CREATE POLICY "Users can delete org activities" ON activities FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));


-- TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to Auto-Create Sales Record when Opportunity is Won
CREATE OR REPLACE FUNCTION promote_opportunity_to_sale()
RETURNS TRIGGER AS $$
DECLARE
    new_sale_number TEXT;
BEGIN
    -- Check if stage changed to 'closed_won' and wasn't before
    IF NEW.stage = 'closed_won' AND OLD.stage != 'closed_won' THEN
        -- Generate Sale Number
        SELECT generate_sale_number(NEW.organization_id) INTO new_sale_number;

        -- Insert into sales table (using existing sales table structure)
        -- Note: We map basic fields. The user will need to fill in technical details later.
        INSERT INTO sales (
            organization_id,
            customer_id,
            dni,
            customer_name,
            customer_email,
            customer_phone,
            sale_number,
            amount,
            access_code,
            created_by,
            created_at
        )
        SELECT
            NEW.organization_id,
            NEW.customer_id,
            c.tax_id AS dni, -- Assuming tax_id is DNI
            c.name AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            new_sale_number,
            NEW.amount,
            generate_access_code(), -- Using existing helper function
            NEW.created_by,
            NOW()
        FROM customers c
        WHERE c.id = NEW.customer_id;
        
        -- Could also log this as an activity
        INSERT INTO activities (
            organization_id,
            opportunity_id,
            customer_id,
            user_id,
            type,
            subject,
            description,
            status,
            completed_at
        ) VALUES (
            NEW.organization_id,
            NEW.id,
            NEW.customer_id,
            NEW.assigned_to,
            'system',
            'Opportunity Won',
            'Opportunity automatically promoted to Sale #' || new_sale_number,
            'completed',
            NOW()
        );

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger to Opportunities
DROP TRIGGER IF EXISTS trigger_promote_opportunity ON opportunities;
CREATE TRIGGER trigger_promote_opportunity
    AFTER UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION promote_opportunity_to_sale();

-- Final Verification
SELECT '✅ CRM Migration Completed' as status;
