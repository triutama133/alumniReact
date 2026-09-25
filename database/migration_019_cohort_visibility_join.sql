-- ================================================================
-- MIGRATION 019: Community visibility, join key, and join requests
-- ================================================================
-- Purpose: Cohorts currently have no discovery mechanism — the only
--          way to end up in one is to be manually invited by an admin
--          via cohort-admin. This adds:
--            - visibility ('public' | 'private') so an admin can opt a
--              cohort into a public "Jelajahi Komunitas" discovery page.
--              Defaults to 'private' so no existing cohort suddenly
--              becomes publicly discoverable.
--            - join_mode ('auto' | 'approval') so an admin can choose
--              whether joining grants instant membership or files a
--              request they must approve. Defaults to 'approval' to
--              match today's admin-gated behavior.
--            - join_key, a per-cohort secret code used as the invite
--              mechanism for private cohorts (a direct link carries the
--              key; the cohort is never listed anywhere for non-holders).
--          cohort_join_requests mirrors the existing job_applications /
--          project_applications pattern (a separate pending-request
--          table) rather than adding a pending state to cohort_members,
--          so every existing query that reads cohort_members as "real
--          members" (role checks, member counts, the Navbar cohort
--          selector) keeps working unmodified.
-- Date: 2026-09-26
-- Risk Level: LOW (additive columns with safe defaults + one new table)
-- ================================================================

BEGIN;

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS join_mode VARCHAR(10) NOT NULL DEFAULT 'approval',
  ADD COLUMN IF NOT EXISTS join_key VARCHAR(64);

ALTER TABLE public.cohorts
  DROP CONSTRAINT IF EXISTS cohorts_visibility_check;
ALTER TABLE public.cohorts
  ADD CONSTRAINT cohorts_visibility_check CHECK (visibility IN ('public', 'private'));

ALTER TABLE public.cohorts
  DROP CONSTRAINT IF EXISTS cohorts_join_mode_check;
ALTER TABLE public.cohorts
  ADD CONSTRAINT cohorts_join_mode_check CHECK (join_mode IN ('auto', 'approval'));

-- Backfill a join_key for every existing cohort so private-mode + invite
-- links work immediately if an admin flips visibility without needing a
-- separate "generate key" step first.
UPDATE public.cohorts SET join_key = encode(gen_random_bytes(6), 'hex') WHERE join_key IS NULL;

CREATE TABLE IF NOT EXISTS public.cohort_join_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE,
  cohort_id BIGINT NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_cohort_join_requests_cohort_id ON public.cohort_join_requests(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_join_requests_user_id ON public.cohort_join_requests(user_id);

COMMIT;
