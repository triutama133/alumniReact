-- ================================================================
-- MIGRATION 013: Auth Session Versioning
-- ================================================================
-- Purpose: Invalidate all active sessions after credential changes
-- Date: 2026-08-04
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.auth_session_versions (
  user_id BIGINT PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_session_versions_updated_at
  ON public.auth_session_versions(updated_at DESC);

COMMIT;
