-- ================================================================
-- MIGRATION 023: Allow up to 5 saved Learning Paths per user
-- ================================================================
-- Purpose: user_learning_paths was keyed by user_id ALONE as its primary
--          key, so generating a Learning Path for a second target role
--          silently overwrote the first. Switch to a surrogate id PK
--          with a UNIQUE(user_id, target_role) constraint so a user can
--          have several saved paths (one per role) at once — the app
--          layer enforces the cap of 5 by evicting the oldest when a
--          6th distinct role is saved. user_checklists already keys by
--          (user_id, target_role), so per-role checklist progress needs
--          no change here.
-- Date: 2026-09-27
-- Risk Level: LOW (table has 1 row today)
-- ================================================================

BEGIN;

ALTER TABLE public.user_learning_paths ADD COLUMN IF NOT EXISTS id BIGINT GENERATED ALWAYS AS IDENTITY;
ALTER TABLE public.user_learning_paths ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.user_learning_paths DROP CONSTRAINT IF EXISTS user_learning_paths_pkey;
ALTER TABLE public.user_learning_paths ADD CONSTRAINT user_learning_paths_pkey PRIMARY KEY (id);

ALTER TABLE public.user_learning_paths DROP CONSTRAINT IF EXISTS user_learning_paths_user_role_unique;
ALTER TABLE public.user_learning_paths ADD CONSTRAINT user_learning_paths_user_role_unique UNIQUE (user_id, target_role);

COMMIT;
