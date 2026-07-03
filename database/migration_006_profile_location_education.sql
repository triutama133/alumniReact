-- ================================================================
-- MIGRATION 006: Structured Domicile and Education Histories
-- ================================================================
-- Purpose: Add structured location fields and normalized education history
-- Date: 2026-07-03
-- ================================================================

BEGIN;

ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS domisili_city_ref_id VARCHAR(32),
  ADD COLUMN IF NOT EXISTS domisili_provinsi VARCHAR(120),
  ADD COLUMN IF NOT EXISTS domisili_kota_kabupaten VARCHAR(160);

CREATE TABLE IF NOT EXISTS alumni_education_histories (
  id BIGSERIAL PRIMARY KEY,
  alumni_id BIGINT NOT NULL REFERENCES alumni_db(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  major_program VARCHAR(255) NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumni_education_histories_alumni_id
  ON alumni_education_histories(alumni_id);

CREATE INDEX IF NOT EXISTS idx_alumni_db_domisili_city_ref_id
  ON alumni_db(domisili_city_ref_id);

CREATE INDEX IF NOT EXISTS idx_alumni_db_domisili_provinsi
  ON alumni_db(domisili_provinsi);

CREATE INDEX IF NOT EXISTS idx_alumni_db_domisili_kota_kabupaten
  ON alumni_db(domisili_kota_kabupaten);

COMMIT;
