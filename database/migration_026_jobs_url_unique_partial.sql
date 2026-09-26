-- ================================================================
-- MIGRATION 026: Allow multiple user-submitted jobs with no external link
-- ================================================================
-- Purpose: jobs.job_url has a plain UNIQUE constraint (added to dedupe
--          scraped listings, which always have a real URL). User-submitted
--          postings created via POST /api/jobs default job_url to '' when
--          the author leaves the "Link Lamar" field blank (job_url is
--          NOT NULL, so '' stands in for "no link"). The plain UNIQUE
--          constraint means only ONE such no-link posting could ever exist
--          at a time — every second one fails with a duplicate-key error.
--          Found via a live smoke test of the job-posting flow while
--          verifying the new environment-tagging feature (job_cohorts).
--
--          Fix: replace the plain unique constraint with a partial unique
--          index that only enforces uniqueness on real (non-empty) URLs,
--          so scraped-listing dedup keeps working while any number of
--          no-link user postings can coexist.
-- Date: 2026-09-26
-- Risk Level: LOW (constraint swap only, no data changes)
-- ================================================================

BEGIN;

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_job_url_key;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_job_url_key
  ON public.jobs (job_url)
  WHERE job_url <> '';

COMMIT;
