# Database Schema Analysis - Old vs Required

**Analysis Date:** 2026-06-13  
**Source:** schema_old.sql vs API route expectations

---

## ✅ Good News!

1. **All 9 conditional tables EXIST!** 
   - ✅ alumni_pekerja
   - ✅ alumni_bisnis
   - ✅ alumni_rumah_tangga
   - ✅ alumni_sosial
   - ✅ alumni_kreatif
   - ✅ alumni_mahasiswa
   - ✅ alumni_informal
   - ✅ alumni_agri
   - ✅ alumni_pendidik

2. **Critical fields exist:**
   - ✅ gabungan_data (for AI matching!)
   - ✅ aktivitas_status_durasi (bonus - JSONB for status tracking)

3. **Projects infrastructure exists:**
   - ✅ projects table
   - ✅ project_applications table (similar to project_members we need)

---

## ⚠️ Schema Gaps & Mismatches

### **Table: alumni_db**

#### **Fields that EXIST:**
| Field | Old Type | Required Type | Status |
|-------|----------|---------------|--------|
| id | bigint | UUID | ⚠️ TYPE MISMATCH |
| email | varchar | varchar | ✅ OK |
| nama_lengkap | varchar | varchar | ✅ OK |
| nama_panggilan | varchar | varchar | ✅ OK |
| tempat_lahir | varchar | - | ℹ️ EXTRA (not in code) |
| tahun_lahir | text | INTEGER | ⚠️ TYPE MISMATCH |
| kota_domisili | varchar | varchar(100) | ✅ OK |
| alamat_ktp | varchar | - | ℹ️ EXTRA (not in code) |
| nomor_handphone | bigint | varchar(20) | ⚠️ TYPE MISMATCH |
| angkatan | bigint | varchar/bigint | ✅ OK |
| jurusan_studi | varchar | varchar(255) | ✅ OK |
| tahun_kelulusan | bigint | INTEGER | ✅ OK |
| pendidikan_terakhir | varchar | varchar(50) | ✅ OK |
| instagram_link | varchar | varchar(255) | ✅ OK |
| linkedin_link | varchar | varchar(255) | ✅ OK |
| aktivitas | varchar | TEXT | ✅ OK |
| skill_gabungan | varchar | TEXT | ✅ OK |
| gabungan_data | varchar | TEXT | ✅ OK |
| nama_institusi_pendidikan_terakhir | text | varchar(255) | ✅ OK |
| aktivitas_status_durasi | jsonb | - | ℹ️ BONUS (new field) |

#### **Fields MISSING in Old Schema:**
- ❌ jenis_kelamin (varchar(20))
- ❌ bahasa_dikuasai (TEXT)
- ❌ sertifikasi (TEXT)
- ❌ portofolio_link (varchar(255))
- ❌ jenis_dukungan_dibutuhkan (TEXT)
- ❌ bidang_kontribusi_minat (TEXT)
- ❌ fakultas_jurusan (varchar) - Code expects this but old schema has jurusan_studi
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

#### **Critical Issue: ID Type Mismatch**

**Old Schema:**
```sql
id bigint GENERATED ALWAYS AS IDENTITY
```

**API Code Expects:**
```typescript
// app/api/complete-profile/route.ts
const userId = headersList.get('x-user-id'); // String (UUID format)
.upsert({ id: userId, ... })
```

**Impact:** 
- Middleware sets `x-user-id` from JWT (likely UUID from auth.users)
- Database has bigint ID
- FK references in conditional tables use bigint
- This is a **MAJOR MISMATCH**!

**Options:**
1. Change alumni_db.id from bigint → UUID (requires data migration)
2. Change code to handle bigint (easier but less standard)
3. Keep both (id as bigint PK, add user_uuid for auth reference)

---

### **Conditional Tables Analysis**

#### **alumni_pekerja**
**Existing Fields:**
- id, alumni_id, nama_instansi, posisi, pengalaman_proyek, akses_jejaring, pengalaman_bermitra, relevant_skills

**Missing Fields:**
- ❌ keahlian_pekerja (TEXT)
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Field Mismatch:**
- Has `relevant_skills` (not in code)
- Missing `keahlian_pekerja` (code expects this)

---

#### **alumni_bisnis**
**Existing Fields:**
- id, alumni_id, nama_usaha, skala_usaha, keahlian_wirausahaan, produk_layanan_utama, kendala_bisnis, target_pasar, relevant_skills

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Mostly complete (has all required fields)

---

#### **alumni_rumah_tangga**
**Existing Fields:**
- id, alumni_id, keahlian_irt, kegiatan_organisasi_irt, pengalaman_tim_irt, mencari_pekerjaan_kolaborasi_irt, relevant_skills

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

#### **alumni_sosial**
**Existing Fields:**
- id, alumni_id, nama_organisasi, isu_fokus, keahlian_sosial, pengalaman_proyek_sosial, pengalaman_bermitra_sosial

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

#### **alumni_kreatif**
**Existing Fields:**
- id, alumni_id, keahlian_kreatif, platform_digital_utama, jenis_konten, total_jangkauan, kisaran_rate_card, demografi_followers

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

#### **alumni_mahasiswa**
**Existing Fields:**
- id, alumni_id, keahlian_mahasiswa, kegiatan_organisasi_mahasiswa, pengalaman_tim_mahasiswa, mencari_pekerjaan_kolaborasi_mahasiswa, pengalaman_magang

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

#### **alumni_informal**
**Existing Fields:**
- id, alumni_id, keahlian_informal, pengalaman_tim_informal, pernah_rekrut_memimpin

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

#### **alumni_agri**
**Existing Fields:**
- id, alumni_id, keahlian_agri, komoditas_utama, tergabung_kelompok, skala_usaha_agri, nilai_tambah_diterapkan, kendala_dihadapi_agri

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

#### **alumni_pendidik**
**Existing Fields:**
- id, alumni_id, keahlian_pendidik, jenjang_pendidikan, mata_pelajaran, inovasi_pembelajaran, mengajar_bimbel

**Missing Fields:**
- ❌ updated_at (TIMESTAMP)
- ❌ created_at (TIMESTAMP)

**Status:** ✅ Complete

---

### **Missing Feature Tables**

#### **posts** (for Home Feed)
**Status:** ❌ Does not exist  
**Need to create:** YES

#### **project_members** (for collaboration tracking)
**Status:** ⚠️ Similar table exists as `project_applications`  
**Options:**
1. Rename `project_applications` → `project_members` (breaking change)
2. Keep both (applications = pending, members = accepted)
3. Extend `project_applications` to handle all statuses

#### **ai_recommendations** (for AI caching)
**Status:** ❌ Does not exist  
**Need to create:** YES

---

## 🔍 Critical Decision Points

### **1. ID Type Migration Strategy**

**Problem:** alumni_db.id is bigint but code expects UUID

**Option A: Migrate bigint → UUID** ⭐ RECOMMENDED
- Pros: Align with modern best practices, UUID is standard for distributed systems
- Cons: Complex migration, need to update all FK references
- Risk: HIGH - data migration required

**Option B: Keep bigint, Update Code**
- Pros: No database migration needed
- Cons: Code/schema mismatch persists
- Risk: LOW - just code changes

**Option C: Dual ID System**
- Pros: Backward compatible
- Cons: Added complexity, two ID columns
- Risk: MEDIUM

**Recommendation:** Option B for now (keep bigint, fix code) → Plan Option A for future major version

---

### **2. Handling Extra Fields**

**Fields in DB but not in code:**
- tempat_lahir
- alamat_ktp
- aktivitas_status_durasi (JSONB)
- relevant_skills (in conditional tables)

**Options:**
1. Keep them (backward compatibility)
2. Drop them (clean schema)
3. Integrate into code (use the data)

**Recommendation:** Keep them, add to code gradually (aktivitas_status_durasi looks useful!)

---

### **3. Missing Fields Strategy**

**Required by code but missing in DB:**
- jenis_kelamin
- bahasa_dikuasai
- sertifikasi
- portofolio_link
- jenis_dukungan_dibutuhkan
- bidang_kontribusi_minat
- fakultas_jurusan
- timestamps (created_at, updated_at)

**Migration Plan:**
1. ADD COLUMN for all missing fields (nullable at first)
2. Update forms to collect these fields
3. Soft prompt existing users to fill them
4. After 80% completion, consider making some NOT NULL

---

## 📋 Migration Complexity Assessment

### **Low Risk Changes (Safe to do immediately):**
- ✅ Add missing columns to alumni_db (nullable)
- ✅ Add timestamps to all conditional tables
- ✅ Create posts table
- ✅ Create ai_recommendations table
- ✅ Add keahlian_pekerja to alumni_pekerja

### **Medium Risk Changes (Need careful planning):**
- ⚠️ Rename/migrate nomor_handphone bigint → varchar
- ⚠️ Rename/migrate tahun_lahir text → integer
- ⚠️ Handle fakultas_jurusan vs jurusan_studi naming
- ⚠️ Decide on project_applications vs project_members

### **High Risk Changes (Defer to future):**
- 🔴 Migrate alumni_db.id bigint → UUID
- 🔴 Drop unused columns (tempat_lahir, alamat_ktp)

---

## ✅ Recommended Migration Path

### **Phase 1: Schema Extensions (Safe, Non-Breaking)**
1. Add missing columns to alumni_db (all nullable)
2. Add timestamps to all conditional tables
3. Add keahlian_pekerja to alumni_pekerja
4. Create posts table
5. Create ai_recommendations table
6. Create indexes for performance

### **Phase 2: Data Type Fixes (Careful)**
1. Create new columns with correct types:
   - nomor_handphone_new (varchar)
   - tahun_lahir_new (integer)
2. Migrate data:
   - Copy nomor_handphone → nomor_handphone_new (cast to text)
   - Copy tahun_lahir → tahun_lahir_new (cast to integer)
3. Deprecate old columns (keep for rollback)
4. After 1 month, drop old columns

### **Phase 3: Code Alignment**
1. Update API routes to handle bigint ID (not UUID)
2. Add fakultas_jurusan field (or map to jurusan_studi)
3. Update TypeScript types to match actual schema
4. Test end-to-end

### **Phase 4: User Re-Onboarding**
1. Deploy updated profile form with new fields
2. Calculate profile completeness
3. Soft prompt users to update
4. Monitor completion rates

---

## 🎯 Next Steps

1. ✅ Review this analysis
2. ⏭️ Create migration SQL (Phase 1 - safe changes)
3. ⏭️ Update API code to handle bigint ID
4. ⏭️ Update TypeScript types
5. ⏭️ Test on staging
6. ⏭️ Execute migration on production
7. ⏭️ Deploy code updates
8. ⏭️ Monitor for errors

---

**Ready to proceed with migration SQL scripts?**
