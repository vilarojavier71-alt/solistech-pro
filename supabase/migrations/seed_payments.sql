-- Ensure table exists (Rescue Mode)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    instructions TEXT, 
    details JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RECOVERY: Seed defaults for ALL organizations
-- 1. Transferencia Bancaria
INSERT INTO public.payment_methods (organization_id, name, instructions, is_default)
SELECT id, 'Transferencia Bancaria', 'IBAN: ES21 0000 0000 0000 0000 0000\nBeneficiario: ' || name, true
FROM public.organizations
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods WHERE organization_id = organizations.id AND name = 'Transferencia Bancaria'
);

-- 2. Efectivo / Contado
INSERT INTO public.payment_methods (organization_id, name, instructions, is_default)
SELECT id, 'Efectivo / Contado', NULL, false
FROM public.organizations
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods WHERE organization_id = organizations.id AND name = 'Efectivo / Contado'
);

-- 3. Financiado
INSERT INTO public.payment_methods (organization_id, name, instructions, is_default)
SELECT id, 'Financiado', 'Consulte condiciones de financiación.', false
FROM public.organizations
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods WHERE organization_id = organizations.id AND name = 'Financiado'
);

-- Update Trigger for future organizations to include "Financiado"
CREATE OR REPLACE FUNCTION public.handle_new_organization_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.payment_methods (organization_id, name, instructions, is_default)
    VALUES 
        (NEW.id, 'Transferencia Bancaria', 'IBAN: ES21 0000 0000 0000 0000 0000\nBeneficiario: ' || NEW.name, true),
        (NEW.id, 'Efectivo / Contado', NULL, false),
        (NEW.id, 'Financiado', 'Consulte condiciones de financiación.', false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_org_created_add_payment_methods ON public.organizations;
CREATE TRIGGER on_org_created_add_payment_methods
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_organization_payment_methods();
