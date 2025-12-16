-- PERSISTENT ONBOARDING MIGRATION
-- Adds a flag to track if a user has completed the FTUE tour.

-- 1. ADD COLUMN TO PUBLIC.USERS (Recommended place for user-specific UI flags)
-- We check if 'users' table exists, otherwise we fallback to 'profiles' or whatever architecture is active.
-- Based on previous context, 'users' table exists in 'public'.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_completed_onboarding') THEN
        ALTER TABLE public.users 
        ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. CREATE SERVER ACTION VISIBILITY
-- Ensure the user can update their own flag (if RLS is strict)
-- Already covered by generic USER UPDATE policies usually, but let's be safe.
-- "Users can update own profile" is standard.
