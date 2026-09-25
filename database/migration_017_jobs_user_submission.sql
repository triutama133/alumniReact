-- ================================================================
-- MIGRATION 017: Allow users to submit their own job postings
-- ================================================================
-- Purpose: The Jobs portal previously only showed database-sourced
--          listings. This adds an owner column and a `source` marker
--          so the jobs feed can show two sources side by side:
--          'database' (existing, admin/aggregator-sourced rows) and
--          'user' (posted by a member, toggleable active/inactive by
--          its owner, mirroring the projects.is_public pattern).
-- Date: 2026-09-25
-- Risk Level: LOW (additive columns only)
-- ================================================================

BEGIN;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS owner_id BIGINT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'database',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_source_check,
  ADD CONSTRAINT jobs_source_check CHECK (source IN ('database', 'user'));

CREATE INDEX IF NOT EXISTS idx_jobs_owner_id ON public.jobs(owner_id);

COMMIT;
