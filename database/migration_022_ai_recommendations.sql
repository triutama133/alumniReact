-- ================================================================
-- MIGRATION 022: Saved AI recommendations
-- ================================================================
-- Purpose: AI-generated recommendations (collaboration partners, project
--          talent scouting, job-fit matching) previously vanished the
--          moment the page was left — no way to review a past result
--          without re-running the analysis. This adds a shared
--          save/reload mechanism so any AI-recommendation feature can
--          save its latest snapshot per user + context and reload it
--          later, following the same "one row per context, upserted"
--          pattern the existing user_learning_paths table already uses.
--
--          An `ai_recommendations` table already existed from an earlier,
--          abandoned design (recommendation_type/input_prompt/
--          output_result/expires_at) but has zero rows and is referenced
--          by no current code path, so it's adapted in place rather than
--          left alongside a second, confusingly similar table.
--
--          context_id is NOT NULL (using '_self' as a sentinel for
--          user-scoped contexts like collaboration recommendations)
--          specifically so the UNIQUE constraint below actually enforces
--          "one saved row per user+context" — a NULL context_id would
--          not collide with another NULL under standard SQL semantics.
-- Date: 2026-09-27
-- Risk Level: LOW (table has 0 rows; no code references its old shape)
-- ================================================================

BEGIN;

ALTER TABLE public.ai_recommendations RENAME COLUMN recommendation_type TO context_type;
ALTER TABLE public.ai_recommendations RENAME COLUMN output_result TO candidates;

ALTER TABLE public.ai_recommendations
  ADD COLUMN IF NOT EXISTS context_id TEXT NOT NULL DEFAULT '_self',
  ADD COLUMN IF NOT EXISTS recommendation_text TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.ai_recommendations DROP COLUMN IF EXISTS input_prompt;
ALTER TABLE public.ai_recommendations DROP COLUMN IF EXISTS expires_at;

ALTER TABLE public.ai_recommendations
  DROP CONSTRAINT IF EXISTS ai_recommendations_user_context_unique;
ALTER TABLE public.ai_recommendations
  ADD CONSTRAINT ai_recommendations_user_context_unique UNIQUE (user_id, context_type, context_id);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_context ON public.ai_recommendations(user_id, context_type);

COMMIT;
