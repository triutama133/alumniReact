-- ================================================================
-- MIGRATION 005: Require Password Change Flag
-- ================================================================
-- Purpose: Force users with temporary/default password to change it
-- Date: 2026-07-03
-- ================================================================

BEGIN;

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_must_change_password
  ON "user"(must_change_password);

COMMIT;
