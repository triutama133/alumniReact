-- ================================================================
-- MIGRATION 021: Split cohorts.join_key into find_key + join_key
-- ================================================================
-- Purpose: The single join_key from migration 019/020 was doing two
--          different jobs at once: letting someone locate/preview a
--          private cohort, AND being the actual gate that lets them
--          become a member. Per product decision, these are now two
--          independent secrets an admin can share and regenerate
--          separately:
--            - find_key (renamed from the old join_key): unlocks the
--              preview (name/description/member count) on the discovery
--              page's code search and on a direct /community/join/[id]
--              link. Knowing it does NOT grant membership.
--            - join_key (new column): the actual access gate. Even with
--              a direct invite link, the user must separately provide
--              this to complete joining.
-- Date: 2026-09-26
-- Risk Level: LOW (rename + one new column, no data loss — the old
--             join_key's value and its unique constraint carry over
--             unchanged as find_key)
-- ================================================================

BEGIN;

ALTER TABLE public.cohorts RENAME COLUMN join_key TO find_key;
ALTER TABLE public.cohorts RENAME CONSTRAINT cohorts_join_key_unique TO cohorts_find_key_unique;

ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS join_key VARCHAR(64);
UPDATE public.cohorts SET join_key = encode(gen_random_bytes(6), 'hex') WHERE join_key IS NULL;

ALTER TABLE public.cohorts
  DROP CONSTRAINT IF EXISTS cohorts_join_key_unique;
ALTER TABLE public.cohorts
  ADD CONSTRAINT cohorts_join_key_unique UNIQUE (join_key);

COMMIT;
