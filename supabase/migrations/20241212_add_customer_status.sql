-- Migration: Add status column to customers table for Lead/Customer distinction
-- Author: Antigravity
-- Date: 2025-12-12
-- Description: Agregar columna status para distinguir entre Leads y Clientes convertidos

-- 1. Agregar columna status si no existe
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'customer' CHECK (status IN ('lead', 'customer'));

-- 2. Actualizar registros existentes (todos son clientes por defecto)
UPDATE customers 
SET status = 'customer' 
WHERE status IS NULL;

-- 3. Crear índice para mejorar queries de filtrado
CREATE INDEX IF NOT EXISTS idx_customers_status 
ON customers(status);

-- 4. Agregar comentario a la columna
COMMENT ON COLUMN customers.status IS 'Estado del contacto: lead (oportunidad) o customer (cliente convertido)';
