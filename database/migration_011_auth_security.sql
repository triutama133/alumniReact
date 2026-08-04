-- ================================================================
-- MIGRATION 011: Persistent Auth Security State
-- ================================================================
-- Purpose: Persist login/register lockout counters across restarts/deploys
-- Date: 2026-08-04
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.auth_security_state (
  scope VARCHAR(40) NOT NULL,
  attempt_key VARCHAR(128) NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  first_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lock_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scope, attempt_key)
);

CREATE INDEX IF NOT EXISTS idx_auth_security_state_lock_until
  ON public.auth_security_state(scope, lock_until);

CREATE TABLE IF NOT EXISTS public.auth_security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public."user"(id) ON DELETE SET NULL,
  scope VARCHAR(40) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  identifier_hash VARCHAR(128),
  ip_address VARCHAR(120),
  event_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_security_events_scope_created_at
  ON public.auth_security_events(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_security_events_identifier_hash
  ON public.auth_security_events(identifier_hash);

COMMIT;
