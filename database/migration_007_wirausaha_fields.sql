-- Migration: Add missing fields to alumni_bisnis to comply with Blueprint PDF
-- Date: 2026-07-26

ALTER TABLE public.alumni_bisnis
  ADD COLUMN IF NOT EXISTS kolaborasi_terbuka TEXT,
  ADD COLUMN IF NOT EXISTS keahlian_dibagikan TEXT;
