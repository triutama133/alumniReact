-- ================================================================
-- MIGRATION 024: Drop stale CHECK constraint on ai_recommendations.context_type
-- ================================================================
-- Purpose: Migration 022 renamed ai_recommendations.recommendation_type to
--          context_type but missed a CHECK constraint left over from the
--          table's original, abandoned design, which only allowed
--          ('collaboration', 'project_match', 'talent_search',
--          'project_discovery'). Every save with context_type
--          'project_scout', 'job_scout', or 'job_match' — i.e. every
--          feature built on this table except the original collaboration
--          card — was silently failing with a constraint violation.
--          Dropped rather than updated to a new fixed list, since
--          context_type is an evolving free-text categorization (like
--          notifications.type, which has no such constraint), not a
--          value set that should require a migration every time a new
--          AI feature is added.
-- Date: 2026-09-27
-- Risk Level: LOW (only relaxes a constraint; cannot break existing data)
-- ================================================================

BEGIN;

ALTER TABLE public.ai_recommendations DROP CONSTRAINT IF EXISTS ai_rec_type_check;

COMMIT;
