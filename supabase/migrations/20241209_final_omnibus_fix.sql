-- FINAL OMNIBUS FIX - "A PRUEBA DE BALAS"
-- Consolida todos los ajustes necesarios para Ventas, Agenda e Inventario
-- Es idempotente: se puede ejecutar 1000 veces y no dará error

-- 1. VENTAS (Sales)
-- Asegurar columnas críticas para el importador
ALTER TABLE sales ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Añadir access_code si no existe, o quitar la restricción NOT NULL si es problemática (aunque es mejor dar un default)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'access_code') THEN 
        ALTER TABLE sales ADD COLUMN access_code TEXT;
    END IF; 
END $$;

-- Intentar poner un default robusto (random string) para evitar errors de "null value"
ALTER TABLE sales ALTER COLUMN access_code SET DEFAULT substring(md5(random()::text) from 1 for 6);


-- 2. AGENDA (Appointments)
-- Asegurar metadatos para importación flexible
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. INVENTARIO (Components)
-- Asegurar columnas de tracking y multi-tenant
DO $$ 
BEGIN 
    -- Organization ID (Crítico)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'organization_id') THEN 
        ALTER TABLE components ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF; 
END $$;

ALTER TABLE components ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE components ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE components ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 5;
ALTER TABLE components ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0;

-- 4. POLÍTICAS DE SEGURIDAD (RLS) - INVENTARIO
-- Re-aplicar políticas para asegurar acceso por organización
DROP POLICY IF EXISTS "Users can view organization components" ON components;
DROP POLICY IF EXISTS "Anyone can view active components" ON components; -- Eliminar política antigua insegura si existe

CREATE POLICY "Users can view organization components"
  ON components FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert components" ON components;
CREATE POLICY "Users can insert components"
  ON components FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update organization components" ON components;
CREATE POLICY "Users can update organization components"
  ON components FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete organization components" ON components;
CREATE POLICY "Users can delete organization components"
  ON components FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- 5. CLIENTES (Customers) - OPCIONAL PERO RECOMENDADO
-- Asegurar que existan campos comunes de importación
ALTER TABLE customers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
