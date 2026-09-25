-- ================================================================
-- MIGRATION 018: In-app applications for community-posted jobs
-- ================================================================
-- Purpose: There was previously no way to apply to a job posting that
--          has no external job_url (i.e. a community-posted job where
--          the poster just wants to be contacted directly). This adds
--          a job_applications table mirroring project_applications,
--          so a user can apply in-app and the job's owner can review
--          (accept/reject) applicants, exactly like project
--          collaboration applications already work.
-- Date: 2026-09-26
-- Risk Level: LOW (new table only)
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.job_applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);

COMMIT;
