-- ================================================================
-- MIGRATION 020: Unique constraint on cohorts.join_key
-- ================================================================
-- Purpose: The "Jelajahi Komunitas" discovery page now lets a user look
--          up a private cohort by typing its join_key alone (not just via
--          a full /community/join/[id]?key=... link), so a lookup does
--          `WHERE join_key = $1` with no cohort id involved. join_key is
--          a random 12-hex-char value (48 bits of entropy) so a
--          collision is already practically impossible, but a unique
--          constraint makes that guarantee explicit instead of assumed.
-- Date: 2026-09-26
-- Risk Level: LOW (adding a unique index; no pre-existing duplicates
--             expected given how join_key values are generated)
-- ================================================================

BEGIN;

ALTER TABLE public.cohorts
  DROP CONSTRAINT IF EXISTS cohorts_join_key_unique;
ALTER TABLE public.cohorts
  ADD CONSTRAINT cohorts_join_key_unique UNIQUE (join_key);

COMMIT;
