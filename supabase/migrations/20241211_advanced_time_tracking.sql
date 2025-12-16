-- ============================================================================
-- Migration: Advanced Time Tracking with Geofencing (CORRECTED)
-- Author: @SQL_COORD
-- Version: 1.1.0
-- Date: 2024-12-11
-- 
-- Description:
-- Modifica la tabla time_entries EXISTENTE para soportar:
-- - Geolocalización mejorada (location_data JSONB)
-- - Sincronización offline (offline_created, sync_status)
-- - Cálculo automático de costes (hourly_rate, calculated_cost)
-- - Vinculación a proyectos (project_id)
-- 
-- IMPORTANTE: Esta migración se adapta a la estructura EXISTENTE de time_entries
-- que usa entry_type ('clock_in', 'clock_out', 'break_start', 'break_end')
-- ============================================================================

-- 1. Modificar tabla time_entries (añadir nuevas columnas)
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_data JSONB,
  ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS calculated_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cost_synced_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS offline_created BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';

-- 2. Comentarios en columnas
COMMENT ON COLUMN time_entries.project_id IS 'Proyecto asociado al fichaje';
COMMENT ON COLUMN time_entries.location_data IS 'Datos de geolocalización (lat, lon, accuracy, validation)';
COMMENT ON COLUMN time_entries.hourly_rate IS 'Coste por hora del trabajador en el momento del fichaje';
COMMENT ON COLUMN time_entries.calculated_cost IS 'Coste calculado automáticamente (horas * hourly_rate)';
COMMENT ON COLUMN time_entries.cost_synced_at IS 'Última sincronización de costes con el proyecto';
COMMENT ON COLUMN time_entries.offline_created IS 'Indica si el fichaje fue creado offline';
COMMENT ON COLUMN time_entries.sync_status IS 'Estado de sincronización: synced, pending, failed';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_time_entries_project 
  ON time_entries(project_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_location 
  ON time_entries USING GIN(location_data);

CREATE INDEX IF NOT EXISTS idx_time_entries_sync_status 
  ON time_entries(sync_status) 
  WHERE sync_status != 'synced';

CREATE INDEX IF NOT EXISTS idx_time_entries_cost_sync 
  ON time_entries(cost_synced_at) 
  WHERE cost_synced_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_entries_user_date 
  ON time_entries(user_id, date);

CREATE INDEX IF NOT EXISTS idx_time_entries_entry_type 
  ON time_entries(entry_type, date);

-- 4. Modificar tabla projects para costes laborales
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS labor_cost_total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_hours_total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geofence_center JSONB,
  ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 500;

-- 5. Comentarios en columnas de projects
COMMENT ON COLUMN projects.labor_cost_total IS 'Coste total de mano de obra acumulado';
COMMENT ON COLUMN projects.labor_hours_total IS 'Horas totales trabajadas acumuladas';
COMMENT ON COLUMN projects.geofence_center IS 'Centro del geofence {lat, lon}';
COMMENT ON COLUMN projects.geofence_radius IS 'Radio del geofence en metros (default: 500m)';

-- 6. Función para calcular horas trabajadas de un día
-- Calcula las horas entre clock_in y clock_out del mismo día
CREATE OR REPLACE FUNCTION calculate_daily_hours(
  p_user_id UUID,
  p_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  clock_in_time TIMESTAMP;
  clock_out_time TIMESTAMP;
  hours_worked DECIMAL(10,2);
BEGIN
  -- Obtener clock_in del día
  SELECT timestamp INTO clock_in_time
  FROM time_entries
  WHERE user_id = p_user_id
    AND date = p_date
    AND entry_type = 'clock_in'
  ORDER BY timestamp ASC
  LIMIT 1;

  -- Obtener clock_out del día
  SELECT timestamp INTO clock_out_time
  FROM time_entries
  WHERE user_id = p_user_id
    AND date = p_date
    AND entry_type = 'clock_out'
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Calcular horas si ambos existen
  IF clock_in_time IS NOT NULL AND clock_out_time IS NOT NULL THEN
    hours_worked := EXTRACT(EPOCH FROM (clock_out_time - clock_in_time)) / 3600;
    RETURN hours_worked;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para calcular coste de un día
CREATE OR REPLACE FUNCTION calculate_daily_cost(
  p_user_id UUID,
  p_date DATE,
  p_hourly_rate DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  hours_worked DECIMAL(10,2);
  cost DECIMAL(10,2);
BEGIN
  -- Calcular horas trabajadas
  hours_worked := calculate_daily_hours(p_user_id, p_date);
  
  -- Calcular coste
  cost := hours_worked * COALESCE(p_hourly_rate, 0);
  
  RETURN cost;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para sincronizar costes con proyectos
CREATE OR REPLACE FUNCTION sync_project_labor_costs(proj_id UUID)
RETURNS VOID AS $$
DECLARE
  total_cost DECIMAL(10,2);
  total_hours DECIMAL(10,2);
  entry_record RECORD;
BEGIN
  total_cost := 0;
  total_hours := 0;

  -- Iterar sobre todos los días con fichajes en este proyecto
  FOR entry_record IN
    SELECT DISTINCT user_id, date
    FROM time_entries
    WHERE project_id = proj_id
      AND entry_type IN ('clock_in', 'clock_out')
  LOOP
    -- Calcular horas del día
    total_hours := total_hours + calculate_daily_hours(entry_record.user_id, entry_record.date);
    
    -- Calcular coste del día (usando hourly_rate si existe)
    SELECT COALESCE(SUM(calculated_cost), 0) INTO total_cost
    FROM time_entries
    WHERE project_id = proj_id
      AND calculated_cost IS NOT NULL;
  END LOOP;

  -- Actualizar proyecto
  UPDATE projects
  SET 
    labor_cost_total = total_cost,
    labor_hours_total = total_hours
  WHERE id = proj_id;

  -- Marcar fichajes como sincronizados
  UPDATE time_entries
  SET cost_synced_at = NOW()
  WHERE project_id = proj_id
    AND cost_synced_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Vista para fichajes con validación de ubicación
CREATE OR REPLACE VIEW time_entries_with_location AS
SELECT 
  te.*,
  p.name as project_name,
  p.geofence_center,
  p.geofence_radius,
  CASE 
    WHEN te.location_data IS NULL THEN 'unknown'
    WHEN te.location_data->>'validation_status' = 'valid' THEN 'valid'
    WHEN te.location_data->>'validation_status' = 'suspicious' THEN 'suspicious'
    ELSE 'invalid'
  END as location_status,
  (te.location_data->>'distance')::DECIMAL as distance_to_project
FROM time_entries te
LEFT JOIN projects p ON te.project_id = p.id;

-- 10. Vista para resumen diario de fichajes
CREATE OR REPLACE VIEW daily_time_summary AS
SELECT 
  user_id,
  date,
  project_id,
  MIN(CASE WHEN entry_type = 'clock_in' THEN timestamp END) as first_clock_in,
  MAX(CASE WHEN entry_type = 'clock_out' THEN timestamp END) as last_clock_out,
  COUNT(CASE WHEN entry_type = 'clock_in' THEN 1 END) as clock_in_count,
  COUNT(CASE WHEN entry_type = 'clock_out' THEN 1 END) as clock_out_count,
  SUM(calculated_cost) as total_cost
FROM time_entries
GROUP BY user_id, date, project_id;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar columnas añadidas
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (
    VALUES 
      ('project_id'),
      ('location_data'),
      ('hourly_rate'),
      ('calculated_cost'),
      ('cost_synced_at'),
      ('offline_created'),
      ('sync_status')
  ) AS expected(column_name)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'time_entries' 
    AND column_name = expected.column_name
  );

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE '⚠️  Columnas faltantes en time_entries: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Todas las columnas de time_entries creadas correctamente';
  END IF;
END $$;

-- Verificar índices
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE tablename = 'time_entries'
  AND indexname LIKE 'idx_time_entries_%';

  RAISE NOTICE '✅ Índices creados en time_entries: %', index_count;
END $$;

-- Verificar funciones
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_daily_hours') THEN
    RAISE NOTICE '✅ Función calculate_daily_hours creada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_daily_cost') THEN
    RAISE NOTICE '✅ Función calculate_daily_cost creada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_project_labor_costs') THEN
    RAISE NOTICE '✅ Función sync_project_labor_costs creada';
  END IF;
END $$;

-- Verificar vistas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'time_entries_with_location') THEN
    RAISE NOTICE '✅ Vista time_entries_with_location creada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'daily_time_summary') THEN
    RAISE NOTICE '✅ Vista daily_time_summary creada';
  END IF;
END $$;

RAISE NOTICE '🎉 Migración completada exitosamente';
