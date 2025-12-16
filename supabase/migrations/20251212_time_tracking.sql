-- ============================================================================
-- TIME TRACKING MODULE
-- ============================================================================

-- 1. Enable PostGIS if not already enabled (for Geography type)
-- CREATE EXTENSION IF NOT EXISTS postgis; 
-- Note: In standard Supabase, this is usually enabled. If not, we fall back to simple lat/long columns.
-- We will use explicit lat/long columns for maximum compatibility and simplicity in this script,
-- but logic can use Geography if available.

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Time Data
    clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clock_out TIMESTAMPTZ,
    total_minutes INTEGER, -- Calculated on clock_out
    
    -- Location Data (Entrance)
    lat_in DECIMAL(10, 8),
    lng_in DECIMAL(11, 8),
    address_in TEXT,
    
    -- Location Data (Exit)
    lat_out DECIMAL(10, 8),
    lng_out DECIMAL(11, 8),
    address_out TEXT,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false, -- True if location matched project/zone
    verification_notes TEXT,
    
    -- State
    status TEXT CHECK (status IN ('active', 'completed', 'corrected')) DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL -- In case admin creates it
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(clock_in);

-- 3. RLS Policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time entries"
    ON time_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins/Managers can view organization time entries"
    ON time_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager', 'global_consultor')
            AND users.organization_id = (SELECT organization_id FROM users WHERE id = time_entries.user_id)
        )
    );

CREATE POLICY "Users can create their own time entries"
    ON time_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their active time entries (clock out)"
    ON time_entries FOR UPDATE
    USING (auth.uid() = user_id AND status = 'active');

-- 4. Trigger for Updated_at
DROP TRIGGER IF EXISTS time_entries_updated_at ON time_entries;
CREATE TRIGGER time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
