-- ============================================================================
-- CUSTOMER SUCCESS SUITE - MIGRATION (FIXED IDEMPOTENCY)
-- ============================================================================
-- Modules: FTUE (Onboarding) & Shield (Ticket Deflection)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. ONBOARDING PERSISTENCE
-- Adding columns to 'users' table (managed in auth/public sync) or 'profiles'
DO $$
BEGIN
    -- Check for 'has_completed_onboarding' in 'users'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_completed_onboarding') THEN
        ALTER TABLE public.users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false;
    END IF;
    
    -- Optional: Track specific step if user drops off (int)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_step') THEN
        ALTER TABLE public.users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
    END IF;
END $$;


-- 3. KNOWLEDGE BASE (The Shield)
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown
    video_url TEXT, -- Loom/Youtube
    tags TEXT[], -- For basic keyword search
    category TEXT DEFAULT 'general',
    
    -- Vector Search Ready
    -- embedding vector(1536),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIX: Ensure 'is_public' exists even if table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='help_articles' AND column_name='is_public') THEN
        ALTER TABLE public.help_articles ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='help_articles' AND column_name='views') THEN
        ALTER TABLE public.help_articles ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
END $$;


-- 4. SUPPORT TICKETS (When Shield Fails)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- open, resolved, closed
    priority TEXT DEFAULT 'normal',
    
    -- Metrics
    deflection_articles_shown UUID[], -- IDs of articles the user saw before submitting
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_fts ON help_articles USING GIN (to_tsvector('spanish', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);

-- 6. RLS POLICIES
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Public Read for Articles
DROP POLICY IF EXISTS "Articles Public Read" ON help_articles;
CREATE POLICY "Articles Public Read" ON help_articles
    FOR SELECT USING (is_public = true);

-- Users manipulate their own tickets
DROP POLICY IF EXISTS "Users Own Tickets" ON support_tickets;
CREATE POLICY "Users Own Tickets" ON support_tickets
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
