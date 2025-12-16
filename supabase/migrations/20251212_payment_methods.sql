-- Drop table if exists to ensure clean slate for Gold Standard (assuming dev mode)
-- If production, we would use ALTER TABLE, but for this task "Migration Complete" implies the full definition.
-- We will use CREATE TABLE IF NOT EXISTS but with the full new schema.

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    instructions TEXT, -- Payment instructions (IBAN, Phone #, etc)
    details JSONB DEFAULT '{}'::jsonb, -- Reserved for extra metadata
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns if they missed the initial create (idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_methods' AND column_name='instructions') THEN
        ALTER TABLE public.payment_methods ADD COLUMN instructions TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_methods' AND column_name='is_default') THEN
        ALTER TABLE public.payment_methods ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view payment methods of their organization" ON public.payment_methods;
CREATE POLICY "Users can view payment methods of their organization"
    ON public.payment_methods FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert payment methods for their organization" ON public.payment_methods;
CREATE POLICY "Users can insert payment methods for their organization"
    ON public.payment_methods FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update payment methods of their organization" ON public.payment_methods;
CREATE POLICY "Users can update payment methods of their organization"
    ON public.payment_methods FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Trigger to seed default payment methods for new organizations
CREATE OR REPLACE FUNCTION public.handle_new_organization_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.payment_methods (organization_id, name, instructions, is_default)
    VALUES 
        (NEW.id, 'Transferencia Bancaria', 'IBAN: ES21 0000 0000 0000 0000 0000\nBeneficiario: ' || NEW.name, true),
        (NEW.id, 'Efectivo / Contado', NULL, false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to make it idempotent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_org_created_add_payment_methods') THEN
        CREATE TRIGGER on_org_created_add_payment_methods
        AFTER INSERT ON public.organizations
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_organization_payment_methods();
    END IF;
END
$$;

-- Add payment_method_id to invoices if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_method_id') THEN
        ALTER TABLE public.invoices ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;
    END IF;
END $$;
