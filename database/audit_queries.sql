-- ================================================================
-- INDONESIA TALENT HUB - DATABASE AUDIT QUERIES
-- ================================================================
-- Purpose: Audit existing database schema before migration
-- Date: 2026-06-13
-- Run these queries in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- ================================================================

-- 1.1 Check all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - user (auth table)
-- - alumni_db (main profile)
-- - projects
-- - alumni_pekerja (conditional)
-- - alumni_bisnis (conditional)
-- - alumni_rumah_tangga (conditional)
-- Missing tables (expected):
-- - alumni_sosial, alumni_kreatif, alumni_mahasiswa, alumni_informal, alumni_agri, alumni_pendidik
-- - posts, project_members, ai_recommendations

-- ================================================================
-- SECTION 2: ALUMNI_DB SCHEMA CHECK
-- ================================================================

-- 2.1 Check all columns in alumni_db table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'alumni_db'
ORDER BY ordinal_position;

-- Expected columns (16 new + existing):
-- ✅ Existing: id, nama_lengkap, nama_panggilan, angkatan, fakultas_jurusan, skill_gabungan, aktivitas, created_at
-- ❓ Check if exists: tahun_lahir, jenis_kelamin, kota_domisili, nomor_handphone, pendidikan_terakhir,
--                     nama_institusi_pendidikan_terakhir, jurusan_studi, tahun_kelulusan, bahasa_dikuasai,
--                     sertifikasi, instagram_link, linkedin_link, portofolio_link,
--                     jenis_dukungan_dibutuhkan, bidang_kontribusi_minat, gabungan_data, updated_at

-- ================================================================
-- SECTION 3: USER DATA ANALYSIS
-- ================================================================

-- 3.1 Count total users
SELECT COUNT(*) as total_users FROM alumni_db;

-- 3.2 Check data completeness (existing fields)
SELECT 
    COUNT(*) as total_users,
    COUNT(nama_lengkap) as has_nama_lengkap,
    COUNT(nama_panggilan) as has_nama_panggilan,
    COUNT(angkatan) as has_angkatan,
    COUNT(fakultas_jurusan) as has_fakultas_jurusan,
    COUNT(skill_gabungan) as has_skill_gabungan,
    COUNT(aktivitas) as has_aktivitas
FROM alumni_db;

-- 3.3 Check if new fields exist and are populated
-- Run this query only if columns exist (will error if not)
-- Uncomment after confirming columns exist from Section 2.1
/*
SELECT 
    COUNT(*) as total_users,
    COUNT(tahun_lahir) as has_tahun_lahir,
    COUNT(jenis_kelamin) as has_jenis_kelamin,
    COUNT(kota_domisili) as has_kota_domisili,
    COUNT(nomor_handphone) as has_nomor_handphone,
    COUNT(pendidikan_terakhir) as has_pendidikan_terakhir,
    COUNT(nama_institusi_pendidikan_terakhir) as has_nama_institusi,
    COUNT(jurusan_studi) as has_jurusan_studi,
    COUNT(tahun_kelulusan) as has_tahun_kelulusan,
    COUNT(bahasa_dikuasai) as has_bahasa_dikuasai,
    COUNT(sertifikasi) as has_sertifikasi,
    COUNT(instagram_link) as has_instagram_link,
    COUNT(linkedin_link) as has_linkedin_link,
    COUNT(portofolio_link) as has_portofolio_link,
    COUNT(jenis_dukungan_dibutuhkan) as has_jenis_dukungan,
    COUNT(bidang_kontribusi_minat) as has_bidang_kontribusi,
    COUNT(gabungan_data) as has_gabungan_data,
    COUNT(updated_at) as has_updated_at
FROM alumni_db;
*/

-- 3.4 Sample data from alumni_db (first 5 rows)
SELECT 
    id,
    nama_lengkap,
    nama_panggilan,
    angkatan,
    fakultas_jurusan,
    LEFT(skill_gabungan, 50) as skill_snippet,
    aktivitas,
    created_at
FROM alumni_db
LIMIT 5;

-- ================================================================
-- SECTION 4: CONDITIONAL TABLES CHECK
-- ================================================================

-- 4.1 Check alumni_pekerja table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'alumni_pekerja'
ORDER BY ordinal_position;

-- 4.2 Count records in alumni_pekerja
SELECT COUNT(*) as total_alumni_pekerja FROM alumni_pekerja;

-- 4.3 Check alumni_bisnis table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'alumni_bisnis'
ORDER BY ordinal_position;

-- 4.4 Count records in alumni_bisnis
SELECT COUNT(*) as total_alumni_bisnis FROM alumni_bisnis;

-- 4.5 Check alumni_rumah_tangga table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'alumni_rumah_tangga'
ORDER BY ordinal_position;

-- 4.6 Count records in alumni_rumah_tangga
SELECT COUNT(*) as total_alumni_rumah_tangga FROM alumni_rumah_tangga;

-- 4.7 Check if other conditional tables exist (should return empty if missing)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'alumni_sosial',
    'alumni_kreatif',
    'alumni_mahasiswa',
    'alumni_informal',
    'alumni_agri',
    'alumni_pendidik'
);

-- ================================================================
-- SECTION 5: PROJECTS TABLE CHECK
-- ================================================================

-- 5.1 Check projects table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 5.2 Count total projects
SELECT COUNT(*) as total_projects FROM projects;

-- 5.3 Sample projects (first 3)
SELECT 
    id,
    title,
    owner_id,
    created_at
FROM projects
LIMIT 3;

-- ================================================================
-- SECTION 6: FEATURE TABLES CHECK (posts, project_members, ai_recommendations)
-- ================================================================

-- 6.1 Check if posts table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
) as posts_table_exists;

-- 6.2 Check if project_members table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_members'
) as project_members_table_exists;

-- 6.3 Check if ai_recommendations table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_recommendations'
) as ai_recommendations_table_exists;

-- ================================================================
-- SECTION 7: INDEXES CHECK
-- ================================================================

-- 7.1 Check existing indexes on alumni_db
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'alumni_db'
ORDER BY indexname;

-- 7.2 Check indexes on conditional tables
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE 'alumni_%'
AND tablename != 'alumni_db'
ORDER BY tablename, indexname;

-- ================================================================
-- SECTION 8: FOREIGN KEY CONSTRAINTS CHECK
-- ================================================================

-- 8.1 Check foreign keys on conditional tables
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE 'alumni_%'
ORDER BY tc.table_name;

-- ================================================================
-- SECTION 9: DATA DISTRIBUTION ANALYSIS
-- ================================================================

-- 9.1 Distribution of aktivitas values (to understand user categories)
SELECT 
    aktivitas,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM alumni_db), 2) as percentage
FROM alumni_db
WHERE aktivitas IS NOT NULL
GROUP BY aktivitas
ORDER BY count DESC;

-- 9.2 Check aktivitas data type (single value vs comma-separated)
SELECT 
    id,
    nama_lengkap,
    aktivitas,
    CASE 
        WHEN aktivitas LIKE '%,%' THEN 'Multi-value (comma-separated)'
        ELSE 'Single value'
    END as aktivitas_format
FROM alumni_db
WHERE aktivitas IS NOT NULL
LIMIT 10;

-- ================================================================
-- SECTION 10: SUMMARY REPORT
-- ================================================================

-- 10.1 Comprehensive summary
SELECT 
    'Total Users' as metric,
    COUNT(*)::TEXT as value
FROM alumni_db
UNION ALL
SELECT 
    'Users with Complete Basic Profile' as metric,
    COUNT(*)::TEXT as value
FROM alumni_db
WHERE nama_lengkap IS NOT NULL
    AND nama_panggilan IS NOT NULL
    AND angkatan IS NOT NULL
    AND fakultas_jurusan IS NOT NULL
    AND skill_gabungan IS NOT NULL
    AND aktivitas IS NOT NULL
UNION ALL
SELECT 
    'Total Projects' as metric,
    COUNT(*)::TEXT as value
FROM projects
UNION ALL
SELECT 
    'Users in alumni_pekerja' as metric,
    COUNT(*)::TEXT as value
FROM alumni_pekerja
UNION ALL
SELECT 
    'Users in alumni_bisnis' as metric,
    COUNT(*)::TEXT as value
FROM alumni_bisnis
UNION ALL
SELECT 
    'Users in alumni_rumah_tangga' as metric,
    COUNT(*)::TEXT as value
FROM alumni_rumah_tangga;

-- ================================================================
-- END OF AUDIT QUERIES
-- ================================================================

-- INSTRUCTIONS:
-- 1. Copy these queries into Supabase SQL Editor
-- 2. Run each section sequentially
-- 3. Document the results in AUDIT_RESULTS.md
-- 4. Pay special attention to:
--    - Missing columns in alumni_db (Section 2)
--    - Missing conditional tables (Section 4.7)
--    - Missing feature tables (Section 6)
--    - Aktivitas data format (Section 9.2)
-- 5. Use results to inform migration strategy
