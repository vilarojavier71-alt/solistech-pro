-- ============================================================================
-- ENERGY SWITCHING MODULE
-- ============================================================================

-- 1. Market Tariffs (Base de datos de tarifas recomendadas)
CREATE TABLE market_tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    tariff_name TEXT NOT NULL,
    type TEXT CHECK (type IN ('fixed', 'indexed')),
    
    -- Precios Potencia (€/kW/año o día)
    p1_power_price DECIMAL(10, 6) NOT NULL,
    p2_power_price DECIMAL(10, 6) NOT NULL,
    
    -- Precios Energía (€/kWh)
    p1_energy_price DECIMAL(10, 6) NOT NULL,
    p2_energy_price DECIMAL(10, 6) NOT NULL,
    p3_energy_price DECIMAL(10, 6), -- Opcional
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Switching Requests (Peticiones de cambio)
CREATE TABLE switching_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Datos extraídos de facturas
    cups TEXT NOT NULL,
    current_holder_name TEXT,
    current_holder_dni TEXT,
    supply_address TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- Potencias actuales
    p1_contracted_power DECIMAL(10, 2),
    p2_contracted_power DECIMAL(10, 2),
    
    -- Estado del cambio
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    
    -- Tarifa seleccionada
    target_tariff_id UUID REFERENCES market_tariffs(id),
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE market_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE switching_requests ENABLE ROW LEVEL SECURITY;

-- Ver tarifas: Todos los usuarios autenticados
CREATE POLICY "Users can view active tariffs" 
    ON market_tariffs FOR SELECT 
    USING (active = true);

-- Requests: Solo miembros de la organización
CREATE POLICY "Users can view own org switching requests" 
    ON switching_requests FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert switching requests" 
    ON switching_requests FOR INSERT 
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org switching requests" 
    ON switching_requests FOR UPDATE 
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
