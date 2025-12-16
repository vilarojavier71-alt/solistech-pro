-- ============================================
-- SISTEMA DE FICHAJES (CONTROL HORARIO)
-- Conforme a RD-ley 8/2019 (Ley de Registro Horario)
-- ============================================

-- Tabla de fichajes (entradas/salidas individuales)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de fichaje
    entry_type TEXT NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
    
    -- Fecha y hora
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha del fichaje (para agrupación)
    
    -- Ubicación (geolocalización)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name TEXT, -- Nombre del lugar (ej: "Oficina Central", "Casa", "Cliente X")
    
    -- Dispositivo
    device_type TEXT, -- 'mobile', 'web', 'tablet'
    ip_address TEXT,
    user_agent TEXT,
    
    -- Notas opcionales
    notes TEXT,
    
    -- Validación (para correcciones manuales)
    is_manual BOOLEAN DEFAULT false, -- Si fue creado manualmente por admin
    validated BOOLEAN DEFAULT true,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de jornadas laborales (resumen diario por empleado)
CREATE TABLE IF NOT EXISTS work_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    date DATE NOT NULL,
    
    -- Horas trabajadas
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    
    -- Descansos
    total_break_minutes INTEGER DEFAULT 0,
    
    -- Totales calculados (en horas decimales)
    total_hours DECIMAL(5,2) DEFAULT 0, -- Horas totales (entrada a salida)
    worked_hours DECIMAL(5,2) DEFAULT 0, -- Horas netas (total - descansos)
    
    -- Horas extra
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    expected_hours DECIMAL(5,2) DEFAULT 8.0, -- Jornada esperada
    
    -- Estado
    status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'validated', 'absent')),
    
    -- Firma digital del trabajador (para cumplimiento legal)
    worker_signature TEXT, -- Base64 de la firma
    signed_at TIMESTAMP,
    
    -- Notas
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: una jornada por usuario por día
    UNIQUE(user_id, date)
);

-- Tabla de configuración de horarios por organización
CREATE TABLE IF NOT EXISTS time_tracking_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) UNIQUE NOT NULL,
    
    -- Horario laboral estándar
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '18:00:00',
    expected_daily_hours DECIMAL(5,2) DEFAULT 8.0,
    
    -- Descansos
    lunch_break_minutes INTEGER DEFAULT 60,
    
    -- Geolocalización
    require_geolocation BOOLEAN DEFAULT false,
    allowed_locations JSONB, -- Array de ubicaciones permitidas con radio
    
    -- Tolerancia
    late_tolerance_minutes INTEGER DEFAULT 15, -- Tolerancia para llegar tarde
    
    -- Recordatorios
    remind_clock_out BOOLEAN DEFAULT true,
    remind_after_hours INTEGER DEFAULT 9, -- Recordar fichar salida después de X horas
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_org_date ON time_entries(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_type ON time_entries(entry_type);

CREATE INDEX IF NOT EXISTS idx_work_days_user_date ON work_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_work_days_org_date ON work_days(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_work_days_status ON work_days(status);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_work_days_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS work_days_updated_at ON work_days;
CREATE TRIGGER work_days_updated_at
    BEFORE UPDATE ON work_days
    FOR EACH ROW
    EXECUTE FUNCTION update_work_days_updated_at();

-- Función para calcular horas trabajadas de una jornada
CREATE OR REPLACE FUNCTION calculate_work_day_hours(work_day_id UUID)
RETURNS void AS $$
DECLARE
    wd RECORD;
    total_minutes INTEGER;
    break_minutes INTEGER;
    worked_minutes INTEGER;
BEGIN
    -- Obtener jornada
    SELECT * INTO wd FROM work_days WHERE id = work_day_id;
    
    IF wd.clock_in_time IS NULL OR wd.clock_out_time IS NULL THEN
        RETURN;
    END IF;
    
    -- Calcular minutos totales
    total_minutes := EXTRACT(EPOCH FROM (wd.clock_out_time - wd.clock_in_time)) / 60;
    
    -- Obtener minutos de descanso
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
            COALESCE(
                (SELECT timestamp FROM time_entries 
                 WHERE user_id = wd.user_id 
                 AND date = wd.date 
                 AND entry_type = 'break_end' 
                 AND timestamp > te.timestamp 
                 ORDER BY timestamp LIMIT 1),
                NOW()
            ) - te.timestamp
        )) / 60
    ), 0) INTO break_minutes
    FROM time_entries te
    WHERE te.user_id = wd.user_id
    AND te.date = wd.date
    AND te.entry_type = 'break_start';
    
    worked_minutes := total_minutes - break_minutes;
    
    -- Actualizar jornada
    UPDATE work_days
    SET 
        total_hours = ROUND((total_minutes / 60.0)::numeric, 2),
        total_break_minutes = break_minutes,
        worked_hours = ROUND((worked_minutes / 60.0)::numeric, 2),
        overtime_hours = ROUND(((worked_minutes / 60.0) - expected_hours)::numeric, 2),
        status = 'complete'
    WHERE id = work_day_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular horas al insertar fichaje
CREATE OR REPLACE FUNCTION recalculate_on_time_entry()
RETURNS TRIGGER AS $$
DECLARE
    wd_id UUID;
BEGIN
    -- Buscar jornada del día
    SELECT id INTO wd_id
    FROM work_days
    WHERE user_id = NEW.user_id
    AND date = NEW.date;
    
    -- Si no existe, crearla
    IF wd_id IS NULL THEN
        INSERT INTO work_days (organization_id, user_id, date)
        VALUES (NEW.organization_id, NEW.user_id, NEW.date)
        RETURNING id INTO wd_id;
    END IF;
    
    -- Actualizar entrada/salida según tipo
    IF NEW.entry_type = 'clock_in' THEN
        UPDATE work_days
        SET clock_in_time = NEW.timestamp
        WHERE id = wd_id;
    ELSIF NEW.entry_type = 'clock_out' THEN
        UPDATE work_days
        SET clock_out_time = NEW.timestamp
        WHERE id = wd_id;
        
        -- Calcular horas
        PERFORM calculate_work_day_hours(wd_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_hours ON time_entries;
CREATE TRIGGER recalculate_hours
    AFTER INSERT ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_on_time_entry();

-- RLS (Row Level Security)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para time_entries
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
CREATE POLICY "Users can view own time entries"
    ON time_entries FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
CREATE POLICY "Users can insert own time entries"
    ON time_entries FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all time entries" ON time_entries;
CREATE POLICY "Admins can view all time entries"
    ON time_entries FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Políticas RLS para work_days
DROP POLICY IF EXISTS "Users can view own work days" ON work_days;
CREATE POLICY "Users can view own work days"
    ON work_days FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all work days" ON work_days;
CREATE POLICY "Admins can view all work days"
    ON work_days FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "System can manage work days" ON work_days;
CREATE POLICY "System can manage work days"
    ON work_days FOR ALL
    USING (true);

-- Políticas para time_tracking_settings
DROP POLICY IF EXISTS "Users can view org settings" ON time_tracking_settings;
CREATE POLICY "Users can view org settings"
    ON time_tracking_settings FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage settings" ON time_tracking_settings;
CREATE POLICY "Admins can manage settings"
    ON time_tracking_settings FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Verificación
SELECT 'Sistema de fichajes creado correctamente' AS status;
