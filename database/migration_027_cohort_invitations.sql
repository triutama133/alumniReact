-- ================================================================
-- MIGRATION 027: Community invitations require acceptance, not auto-join
-- ================================================================
-- Purpose: today, a cohort admin adding someone via POST /api/cohorts/[id]/members
--          inserts them straight into cohort_members — the target user has no
--          say in it and is silently made a member. This adds a separate
--          cohort_invitations table for pending, not-yet-accepted invites,
--          instead of overloading cohort_members with a status flag.
--
--          Design reasoning: cohort_members is read in ~15 different places
--          across the app (every "is this user a member of this community"
--          security check, content-scoping query, and member-count/listing)
--          and is trusted everywhere to mean "is an active member" with no
--          extra filtering. Adding a status column to that same table would
--          require auditing and updating every one of those call sites to
--          filter status = 'active', and missing even one would silently let
--          an invited-but-not-yet-accepted user see or post into a community
--          before they've agreed to join it. A separate table keeps
--          cohort_members' existing meaning ("is a real member") completely
--          unchanged — zero risk to every query that already trusts it — and
--          an accept simply inserts into cohort_members like today's flow
--          already does, just gated behind the invited user's own action.
-- Date: 2026-09-26
-- Risk Level: LOW (new, additive table; no changes to existing tables)
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.cohort_invitations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cohort_id BIGINT NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  invited_user_id BIGINT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  invited_by BIGINT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, invited_user_id)
);
CREATE INDEX IF NOT EXISTS idx_cohort_invitations_invited_user ON public.cohort_invitations(invited_user_id);

COMMIT;
