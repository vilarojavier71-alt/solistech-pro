-- ============================================================================
-- ZERO-TOUCH SUPPORT SYSTEM - DATABASE MIGRATION
-- ============================================================================
-- Designed for Semantic Search & Ticket Deflection

-- 1. ENABLE EXTENSIONS (For AI Semantic Search)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. ENUMS
DO $$
BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
    CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. HELP CATEGORIES (Modules)
CREATE TABLE IF NOT EXISTS help_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- Optional: Shared or Private Knowledge Base
    
    slug TEXT NOT NULL, -- 'billing', 'installation', 'app'
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name
    
    position INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(slug) 
);

-- 4. HELP ARTICLES (Knowledge Base)
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES help_categories(id) ON DELETE SET NULL,
    
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL, -- Markdown Body
    
    video_url TEXT, -- Loom/YouTube Embed
    
    status article_status DEFAULT 'draft',
    views_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- AI VECTOR SEARCH
    -- embedding vector(1536), -- Optional: Uncomment if OpenAI embeddings are ready
    
    tags TEXT[], -- ['invoice', 'error', 'login']
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(slug)
);

-- 5. HELP TICKETS (The Last Resort)
CREATE TABLE IF NOT EXISTS help_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    
    -- Deflection Metrics
    deflection_attempts INTEGER DEFAULT 0, -- How many articles were shown before creating?
    suggested_articles UUID[], -- IDs of articles shown
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_fts ON help_articles USING GIN (to_tsvector('spanish', title || ' ' || content)); -- Full Text Search
CREATE INDEX IF NOT EXISTS idx_tickets_user ON help_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON help_tickets(status);

-- 7. RLS POLICIES
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_tickets ENABLE ROW LEVEL SECURITY;

-- Public Read for Published Articles
CREATE POLICY "Public Read Articles" ON help_articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public Read Categories" ON help_categories
    FOR SELECT USING (is_public = true);

-- Authenticated Users can Manage specific tickets
CREATE POLICY "Users Manage Own Tickets" ON help_tickets
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins Manage All
CREATE POLICY "Admins Manage Knowledge Base" ON help_articles
    USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin'));
    
CREATE POLICY "Admins Manage Categories" ON help_categories
    USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin'));

-- SEED DATA (Initial Categories)
INSERT INTO help_categories (slug, name, description, icon, position) VALUES
('getting-started', 'Primeros Pasos', 'Guías básicas para nueva cuenta', 'Rocket', 0),
('billing', 'Facturación y Pagos', 'Dudas sobre facturas y métodos de pago', 'CreditCard', 1),
('technical', 'Soporte Técnico', 'Problemas con la instalación o la app', 'Wrench', 2)
ON CONFLICT (slug) DO NOTHING;
