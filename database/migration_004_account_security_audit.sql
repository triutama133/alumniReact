-- ================================================================
-- MIGRATION 004: Account Security Audit Logs
-- ================================================================
-- Purpose: Persist account security-related changes and failed attempts
-- Date: 2026-07-03
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS account_security_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  event_metadata JSONB,
  ip_address VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_security_audit_logs_user_id_created_at
  ON account_security_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_security_audit_logs_event_type
  ON account_security_audit_logs(event_type);

COMMIT;
