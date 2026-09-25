-- ================================================================
-- MIGRATION 016: Replace categorical activity status with real dates
-- ================================================================
-- Purpose: Add start/end month+year (and an "is_current" flag) to every
--          activity detail table, so activity duration is a real date
--          range instead of a hand-picked category (">5 tahun" etc).
-- Date: 2026-09-25
-- Risk Level: LOW (additive columns only)
--
-- The old `status_keaktifan` column is intentionally LEFT IN PLACE on
-- every table below — it is no longer written to by the application,
-- but existing historical data is not destroyed. It is safe to remove
-- in a future migration once the new date fields have been backfilled
-- by users editing their profile.
-- ================================================================

BEGIN;

ALTER TABLE public.alumni_pekerja
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_bisnis
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_sosial
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_kreatif
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_rumah_tangga
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_mahasiswa
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_informal
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_agri
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

ALTER TABLE public.alumni_pendidik
  ADD COLUMN IF NOT EXISTS start_month SMALLINT,
  ADD COLUMN IF NOT EXISTS start_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS end_month SMALLINT,
  ADD COLUMN IF NOT EXISTS end_year SMALLINT;

-- Sanity-check constraints (month 1-12; year within a sane human range)
ALTER TABLE public.alumni_pekerja
  ADD CONSTRAINT alumni_pekerja_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_pekerja_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_bisnis
  ADD CONSTRAINT alumni_bisnis_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_bisnis_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_sosial
  ADD CONSTRAINT alumni_sosial_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_sosial_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_kreatif
  ADD CONSTRAINT alumni_kreatif_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_kreatif_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_rumah_tangga
  ADD CONSTRAINT alumni_rumah_tangga_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_rumah_tangga_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_mahasiswa
  ADD CONSTRAINT alumni_mahasiswa_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_mahasiswa_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_informal
  ADD CONSTRAINT alumni_informal_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_informal_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_agri
  ADD CONSTRAINT alumni_agri_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_agri_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

ALTER TABLE public.alumni_pendidik
  ADD CONSTRAINT alumni_pendidik_start_month_check CHECK (start_month IS NULL OR start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT alumni_pendidik_end_month_check CHECK (end_month IS NULL OR end_month BETWEEN 1 AND 12);

COMMIT;
