-- 20251215_gmail_integration.sql

-- 1. Create Table for Encrypted Tokens
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,       -- Encrypted
    refresh_token TEXT NOT NULL,      -- Encrypted
    scope TEXT NOT NULL,
    email TEXT NOT NULL,
    expires_at BIGINT NOT NULL,       -- Timestamp in milliseconds
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Strict User Isolation)
-- Users can only view/manage their OWN tokens
CREATE POLICY "Users can manage their own gmail tokens" ON public.gmail_tokens
    FOR ALL USING (user_id = auth.uid());

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user ON public.gmail_tokens(user_id);
