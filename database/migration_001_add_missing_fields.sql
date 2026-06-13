-- ================================================================
-- MIGRATION 001: Add Missing Fields to Existing Tables
-- ================================================================
-- Purpose: Add missing columns required by API code
-- Date: 2026-06-13
-- Risk Level: LOW (only ADD COLUMN, non-breaking)
-- Rollback: Column drops (if needed)
-- ================================================================

-- Run this in Supabase SQL Editor

BEGIN;

-- ================================================================
-- SECTION 1: Add Missing Columns to alumni_db
-- ================================================================

-- Add jenis_kelamin (gender)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);

-- Add bahasa_dikuasai (languages spoken)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS bahasa_dikuasai TEXT;

-- Add sertifikasi (certifications)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS sertifikasi TEXT;

-- Add portofolio_link (portfolio link)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS portofolio_link VARCHAR(255);

-- Add jenis_dukungan_dibutuhkan (support needed - comma-separated or JSONB)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS jenis_dukungan_dibutuhkan TEXT;

-- Add bidang_kontribusi_minat (contribution interest areas - comma-separated or JSONB)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS bidang_kontribusi_minat TEXT;

-- Add fakultas_jurusan (faculty/major - alternative to jurusan_studi for backward compatibility)
-- Note: We already have jurusan_studi, but code expects fakultas_jurusan
-- Option 1: Add new column and copy data
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS fakultas_jurusan VARCHAR(255);

-- Copy jurusan_studi to fakultas_jurusan for existing records
UPDATE alumni_db
SET fakultas_jurusan = jurusan_studi
WHERE fakultas_jurusan IS NULL AND jurusan_studi IS NOT NULL;

-- Add timestamps
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================================================
-- SECTION 2: Fix Data Type Mismatches (Create New Columns)
-- ================================================================

-- Note: We're creating new columns instead of altering existing ones for safety
-- Old columns will be deprecated but kept for rollback capability

-- 2.1 nomor_handphone: bigint → varchar(20)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS nomor_handphone_varchar VARCHAR(20);

-- Copy data from bigint to varchar
UPDATE alumni_db
SET nomor_handphone_varchar = nomor_handphone::TEXT
WHERE nomor_handphone_varchar IS NULL AND nomor_handphone IS NOT NULL;

-- 2.2 tahun_lahir: text → integer
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS tahun_lahir_int INTEGER;

-- Copy data from text to integer (with error handling)
UPDATE alumni_db
SET tahun_lahir_int = CASE
  WHEN tahun_lahir ~ '^[0-9]+$' THEN tahun_lahir::INTEGER
  ELSE NULL
END
WHERE tahun_lahir_int IS NULL AND tahun_lahir IS NOT NULL;

-- ================================================================
-- SECTION 3: Add Timestamps to All Conditional Tables
-- ================================================================

-- 3.1 alumni_pekerja
ALTER TABLE alumni_pekerja
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing keahlian_pekerja field
ALTER TABLE alumni_pekerja
  ADD COLUMN IF NOT EXISTS keahlian_pekerja TEXT;

-- 3.2 alumni_bisnis
ALTER TABLE alumni_bisnis
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.3 alumni_rumah_tangga
ALTER TABLE alumni_rumah_tangga
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.4 alumni_sosial
ALTER TABLE alumni_sosial
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.5 alumni_kreatif
ALTER TABLE alumni_kreatif
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.6 alumni_mahasiswa
ALTER TABLE alumni_mahasiswa
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.7 alumni_informal
ALTER TABLE alumni_informal
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.8 alumni_agri
ALTER TABLE alumni_agri
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3.9 alumni_pendidik
ALTER TABLE alumni_pendidik
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================================================
-- SECTION 4: Create Triggers for auto-update timestamps
-- ================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for alumni_db
DROP TRIGGER IF EXISTS set_updated_at_alumni_db ON alumni_db;
CREATE TRIGGER set_updated_at_alumni_db
  BEFORE UPDATE ON alumni_db
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for all conditional tables
DROP TRIGGER IF EXISTS set_updated_at_alumni_pekerja ON alumni_pekerja;
CREATE TRIGGER set_updated_at_alumni_pekerja
  BEFORE UPDATE ON alumni_pekerja
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_bisnis ON alumni_bisnis;
CREATE TRIGGER set_updated_at_alumni_bisnis
  BEFORE UPDATE ON alumni_bisnis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_rumah_tangga ON alumni_rumah_tangga;
CREATE TRIGGER set_updated_at_alumni_rumah_tangga
  BEFORE UPDATE ON alumni_rumah_tangga
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_sosial ON alumni_sosial;
CREATE TRIGGER set_updated_at_alumni_sosial
  BEFORE UPDATE ON alumni_sosial
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_kreatif ON alumni_kreatif;
CREATE TRIGGER set_updated_at_alumni_kreatif
  BEFORE UPDATE ON alumni_kreatif
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_mahasiswa ON alumni_mahasiswa;
CREATE TRIGGER set_updated_at_alumni_mahasiswa
  BEFORE UPDATE ON alumni_mahasiswa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_informal ON alumni_informal;
CREATE TRIGGER set_updated_at_alumni_informal
  BEFORE UPDATE ON alumni_informal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_agri ON alumni_agri;
CREATE TRIGGER set_updated_at_alumni_agri
  BEFORE UPDATE ON alumni_agri
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_alumni_pendidik ON alumni_pendidik;
CREATE TRIGGER set_updated_at_alumni_pendidik
  BEFORE UPDATE ON alumni_pendidik
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SECTION 5: Create Trigger for auto-update gabungan_data
-- ================================================================

-- Function to auto-update gabungan_data when profile changes
CREATE OR REPLACE FUNCTION update_gabungan_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gabungan_data := CONCAT_WS(' ',
    COALESCE(NEW.skill_gabungan, ''),
    COALESCE(NEW.aktivitas, ''),
    COALESCE(NEW.nama_lengkap, ''),
    COALESCE(NEW.fakultas_jurusan, ''),
    COALESCE(NEW.jurusan_studi, ''),
    COALESCE(NEW.angkatan::TEXT, ''),
    COALESCE(NEW.kota_domisili, ''),
    COALESCE(NEW.bahasa_dikuasai, ''),
    COALESCE(NEW.jenis_dukungan_dibutuhkan, ''),
    COALESCE(NEW.bidang_kontribusi_minat, ''),
    COALESCE(NEW.pendidikan_terakhir, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gabungan_data auto-update
DROP TRIGGER IF EXISTS set_gabungan_data ON alumni_db;
CREATE TRIGGER set_gabungan_data
  BEFORE INSERT OR UPDATE ON alumni_db
  FOR EACH ROW
  EXECUTE FUNCTION update_gabungan_data();

-- Backfill gabungan_data for existing users (one-time operation)
UPDATE alumni_db
SET gabungan_data = CONCAT_WS(' ',
  COALESCE(skill_gabungan, ''),
  COALESCE(aktivitas, ''),
  COALESCE(nama_lengkap, ''),
  COALESCE(fakultas_jurusan, ''),
  COALESCE(jurusan_studi, ''),
  COALESCE(angkatan::TEXT, ''),
  COALESCE(kota_domisili, ''),
  COALESCE(bahasa_dikuasai, ''),
  COALESCE(jenis_dukungan_dibutuhkan, ''),
  COALESCE(bidang_kontribusi_minat, ''),
  COALESCE(pendidikan_terakhir, '')
)
WHERE gabungan_data IS NULL OR gabungan_data = '';

-- ================================================================
-- SECTION 6: Add Indexes for Performance
-- ================================================================

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_alumni_db_nama_lengkap ON alumni_db(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_alumni_db_kota_domisili ON alumni_db(kota_domisili);
CREATE INDEX IF NOT EXISTS idx_alumni_db_aktivitas ON alumni_db(aktivitas);

-- Full-text search indexes (for Indonesian language)
CREATE INDEX IF NOT EXISTS idx_alumni_db_skill_gabungan_fts 
  ON alumni_db USING GIN (to_tsvector('indonesian', COALESCE(skill_gabungan, '')));

CREATE INDEX IF NOT EXISTS idx_alumni_db_gabungan_data_fts 
  ON alumni_db USING GIN (to_tsvector('indonesian', COALESCE(gabungan_data, '')));

-- Index on timestamps for sorting
CREATE INDEX IF NOT EXISTS idx_alumni_db_created_at ON alumni_db(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alumni_db_updated_at ON alumni_db(updated_at DESC);

COMMIT;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Run these after migration to verify success

-- 1. Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'alumni_db'
AND column_name IN (
  'jenis_kelamin', 'bahasa_dikuasai', 'sertifikasi', 'portofolio_link',
  'jenis_dukungan_dibutuhkan', 'bidang_kontribusi_minat', 'fakultas_jurusan',
  'created_at', 'updated_at', 'nomor_handphone_varchar', 'tahun_lahir_int'
);

-- 2. Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'set_%'
ORDER BY event_object_table;

-- 3. Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'alumni_db'
AND indexname LIKE 'idx_%';

-- 4. Verify gabungan_data populated
SELECT 
  COUNT(*) as total_users,
  COUNT(gabungan_data) as has_gabungan_data,
  ROUND(COUNT(gabungan_data) * 100.0 / COUNT(*), 2) as percentage_complete
FROM alumni_db;

-- ================================================================
-- END OF MIGRATION 001
-- ================================================================
