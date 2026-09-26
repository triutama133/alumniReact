-- ================================================================
-- MIGRATION 025: Multi-community tagging for posts, projects, and jobs
-- ================================================================
-- Purpose: posts and projects each had a single nullable cohort_id
--          (NULL = global, or exactly one community) — an author could
--          only ever publish to one place. jobs had no cohort concept
--          at all. This adds a join table per content type so an author
--          can tag content as visible in Global and/or any number of
--          communities they belong to, instead of exactly one-or-none.
--
--          "Global" is represented as simply having NO rows in the join
--          table (matching the existing cohort_id IS NULL convention),
--          not a separate flag — a content item with zero cohort tags
--          continues to mean "visible in the global feed", and one with
--          any tags is scoped to exactly those communities and no longer
--          shown in the global feed (same as today's cohort_id-based
--          behavior, just generalized from one value to a set).
--
--          Existing single-cohort data is backfilled into the new join
--          tables so nothing currently cohort-scoped becomes global by
--          accident. The old cohort_id columns are kept (not dropped)
--          for now, marked deprecated, to avoid a riskier destructive
--          change in the same migration — the application layer moves
--          to reading/writing the join tables exclusively.
-- Date: 2026-09-27
-- Risk Level: MEDIUM (new tables + data backfill across two existing
--             tables; no destructive changes, old columns untouched)
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.post_cohorts (
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  cohort_id BIGINT NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, cohort_id)
);
CREATE INDEX IF NOT EXISTS idx_post_cohorts_cohort_id ON public.post_cohorts(cohort_id);

CREATE TABLE IF NOT EXISTS public.project_cohorts (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cohort_id BIGINT NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, cohort_id)
);
CREATE INDEX IF NOT EXISTS idx_project_cohorts_cohort_id ON public.project_cohorts(cohort_id);

CREATE TABLE IF NOT EXISTS public.job_cohorts (
  job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  cohort_id BIGINT NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, cohort_id)
);
CREATE INDEX IF NOT EXISTS idx_job_cohorts_cohort_id ON public.job_cohorts(cohort_id);

-- Backfill existing single-cohort posts/projects into the new join tables.
-- jobs has no prior cohort_id column, so there is nothing to backfill for it.
INSERT INTO public.post_cohorts (post_id, cohort_id)
SELECT id, cohort_id FROM public.posts WHERE cohort_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.project_cohorts (project_id, cohort_id)
SELECT id, cohort_id FROM public.projects WHERE cohort_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN public.posts.cohort_id IS 'Deprecated by post_cohorts (migration 025) — a post may now be tagged to multiple communities. Left in place, unused going forward.';
COMMENT ON COLUMN public.projects.cohort_id IS 'Deprecated by project_cohorts (migration 025) — a project may now be tagged to multiple communities. Left in place, unused going forward.';

COMMIT;
