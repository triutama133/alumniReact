-- ================================================================
-- MIGRATION 004: Persist Per-Entry Activity Status
-- ================================================================
-- Purpose: Add status_keaktifan column to all activity detail tables
-- Date: 2026-07-03
-- Risk Level: LOW (additive columns + backfill)
-- ================================================================

BEGIN;

-- Drop legacy unique constraints on alumni_id (single-row model)
-- so each activity category can store multiple detail rows per alumni.
ALTER TABLE public.alumni_pekerja
  DROP CONSTRAINT IF EXISTS alumni_pekerja_alumni_id_key;

ALTER TABLE public.alumni_bisnis
  DROP CONSTRAINT IF EXISTS alumni_bisnis_alumni_id_key;

ALTER TABLE public.alumni_sosial
  DROP CONSTRAINT IF EXISTS alumni_sosial_alumni_id_key;

ALTER TABLE public.alumni_kreatif
  DROP CONSTRAINT IF EXISTS alumni_kreatif_alumni_id_key;

ALTER TABLE public.alumni_rumah_tangga
  DROP CONSTRAINT IF EXISTS alumni_rumah_tangga_alumni_id_key;

ALTER TABLE public.alumni_mahasiswa
  DROP CONSTRAINT IF EXISTS alumni_mahasiswa_alumni_id_key;

ALTER TABLE public.alumni_informal
  DROP CONSTRAINT IF EXISTS alumni_informal_alumni_id_key;

ALTER TABLE public.alumni_agri
  DROP CONSTRAINT IF EXISTS alumni_agri_alumni_id_key;

ALTER TABLE public.alumni_pendidik
  DROP CONSTRAINT IF EXISTS alumni_pendidik_alumni_id_key;

ALTER TABLE public.alumni_pekerja
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_bisnis
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_sosial
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_kreatif
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_rumah_tangga
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_mahasiswa
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_informal
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_agri
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

ALTER TABLE public.alumni_pendidik
  ADD COLUMN IF NOT EXISTS status_keaktifan VARCHAR(30);

-- Backfill default status for legacy rows
UPDATE public.alumni_pekerja SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_bisnis SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_sosial SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_kreatif SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_rumah_tangga SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_mahasiswa SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_informal SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_agri SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');
UPDATE public.alumni_pendidik SET status_keaktifan = COALESCE(status_keaktifan, 'Aktif saat ini');

-- Enforce allowed values
ALTER TABLE public.alumni_pekerja
  DROP CONSTRAINT IF EXISTS alumni_pekerja_status_keaktifan_check,
  ADD CONSTRAINT alumni_pekerja_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_bisnis
  DROP CONSTRAINT IF EXISTS alumni_bisnis_status_keaktifan_check,
  ADD CONSTRAINT alumni_bisnis_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_sosial
  DROP CONSTRAINT IF EXISTS alumni_sosial_status_keaktifan_check,
  ADD CONSTRAINT alumni_sosial_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_kreatif
  DROP CONSTRAINT IF EXISTS alumni_kreatif_status_keaktifan_check,
  ADD CONSTRAINT alumni_kreatif_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_rumah_tangga
  DROP CONSTRAINT IF EXISTS alumni_rumah_tangga_status_keaktifan_check,
  ADD CONSTRAINT alumni_rumah_tangga_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_mahasiswa
  DROP CONSTRAINT IF EXISTS alumni_mahasiswa_status_keaktifan_check,
  ADD CONSTRAINT alumni_mahasiswa_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_informal
  DROP CONSTRAINT IF EXISTS alumni_informal_status_keaktifan_check,
  ADD CONSTRAINT alumni_informal_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_agri
  DROP CONSTRAINT IF EXISTS alumni_agri_status_keaktifan_check,
  ADD CONSTRAINT alumni_agri_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

ALTER TABLE public.alumni_pendidik
  DROP CONSTRAINT IF EXISTS alumni_pendidik_status_keaktifan_check,
  ADD CONSTRAINT alumni_pendidik_status_keaktifan_check
  CHECK (status_keaktifan IN ('Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'));

COMMIT;
