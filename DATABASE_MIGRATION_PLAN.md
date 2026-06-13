# Indonesia Talent Hub - Database Migration Plan

**Tanggal:** 13 Juni 2026  
**Status:** Planning  
**Tujuan:** Migrate existing incomplete data → Complete blueprint-compliant schema

---

## 🎯 Migration Strategy Overview

### **Scenario:**
- ✅ Code sudah define complete schema (16 main fields + 9 conditional tables)
- ⚠️ Database mungkin incomplete/outdated
- ⚠️ Ada **existing users** dengan data lama
- ❌ FastAPI service offline (render.com)

### **Approach: Non-Destructive Migration**
1. **Audit existing schema** → Identify gaps
2. **Add missing columns/tables** → ALTER TABLE (backward compatible)
3. **Backfill defaults** → NULL for optional, prompt for required
4. **User re-onboarding** → Notify users to update profile
5. **Gradual rollout** → Phase existing users to new schema

---

## 📊 Current vs Required Schema

### **Table: `alumni_db` (Main Profile Table)**

#### **Fields Currently in Code (Required):**

| Field | Type | Status | Migration Action |
|-------|------|--------|------------------|
| `id` | UUID | ✅ Exists | None |
| `nama_lengkap` | VARCHAR | ✅ Exists | None |
| `nama_panggilan` | VARCHAR | ✅ Exists | None |
| `angkatan` | VARCHAR | ✅ Exists | None |
| `fakultas_jurusan` | VARCHAR | ✅ Exists | None |
| `skill_gabungan` | TEXT | ✅ Exists | None |
| `tahun_lahir` | INTEGER | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `jenis_kelamin` | VARCHAR(20) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `kota_domisili` | VARCHAR(100) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `nomor_handphone` | VARCHAR(20) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `pendidikan_terakhir` | VARCHAR(50) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `nama_institusi_pendidikan_terakhir` | VARCHAR(255) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `jurusan_studi` | VARCHAR(255) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `tahun_kelulusan` | INTEGER | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `bahasa_dikuasai` | TEXT | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `sertifikasi` | TEXT | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `instagram_link` | VARCHAR(255) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `linkedin_link` | VARCHAR(255) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `portofolio_link` | VARCHAR(255) | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `aktivitas` | TEXT | ✅ Exists (wrong type?) | MODIFY to TEXT if VARCHAR |
| `jenis_dukungan_dibutuhkan` | TEXT | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `bidang_kontribusi_minat` | TEXT | ❓ Check | ADD COLUMN IF NOT EXISTS |
| `gabungan_data` | TEXT | ❓ Check (for AI) | ADD COLUMN IF NOT EXISTS |
| `created_at` | TIMESTAMP | ✅ Exists | None |
| `updated_at` | TIMESTAMP | ❓ Check | ADD COLUMN IF NOT EXISTS |

#### **Fields Potentially in OLD Schema (May Need Removal):**
- Legacy fields that are no longer used? (TBD - need audit)

---

### **Conditional Tables (9 Tables)**

#### **Table: `alumni_pekerja` (Professionals/Employees)**

**Status:** ✅ Likely exists but may be incomplete

| Field | Type | Migration Action |
|-------|------|------------------|
| `id` | SERIAL PRIMARY KEY | Should exist |
| `alumni_id` | UUID FK → alumni_db(id) | Should exist |
| `keahlian_pekerja` | TEXT | ADD IF NOT EXISTS |
| `nama_instansi` | VARCHAR(255) | ADD IF NOT EXISTS |
| `posisi` | VARCHAR(255) | ADD IF NOT EXISTS |
| `pengalaman_proyek` | TEXT | ADD IF NOT EXISTS |
| `akses_jejaring` | BOOLEAN | ADD IF NOT EXISTS |
| `pengalaman_bermitra` | BOOLEAN | ADD IF NOT EXISTS |
| `created_at` | TIMESTAMP | ADD IF NOT EXISTS |
| `updated_at` | TIMESTAMP | ADD IF NOT EXISTS |

---

#### **Table: `alumni_bisnis` (Entrepreneurs/Business Owners)**

**Status:** ✅ Likely exists but may be incomplete

| Field | Type | Migration Action |
|-------|------|------------------|
| `id` | SERIAL PRIMARY KEY | Should exist |
| `alumni_id` | UUID FK → alumni_db(id) | Should exist |
| `keahlian_wirausahaan` | TEXT | ADD IF NOT EXISTS |
| `produk_layanan_utama` | TEXT | ADD IF NOT EXISTS |
| `nama_usaha` | VARCHAR(255) | ADD IF NOT EXISTS |
| `skala_usaha` | VARCHAR(100) | ADD IF NOT EXISTS |
| `kendala_bisnis` | TEXT | ADD IF NOT EXISTS |
| `target_pasar` | VARCHAR(50) | ADD IF NOT EXISTS |
| `created_at` | TIMESTAMP | ADD IF NOT EXISTS |
| `updated_at` | TIMESTAMP | ADD IF NOT EXISTS |

---

#### **Table: `alumni_sosial` (Social Workers/NGO)**

**Status:** ❌ LIKELY MISSING (need to create)

```sql
CREATE TABLE IF NOT EXISTS alumni_sosial (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_sosial TEXT NOT NULL,
  pengalaman_proyek_sosial TEXT NOT NULL,
  isu_fokus TEXT NOT NULL,
  nama_organisasi VARCHAR(255) NOT NULL,
  pengalaman_bermitra_sosial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumni_id)
);

CREATE INDEX idx_alumni_sosial_alumni_id ON alumni_sosial(alumni_id);
```

---

#### **Table: `alumni_kreatif` (Content Creators)**

**Status:** ❌ LIKELY MISSING (need to create)

```sql
CREATE TABLE IF NOT EXISTS alumni_kreatif (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_kreatif TEXT NOT NULL,
  platform_digital_utama TEXT NOT NULL,
  jenis_konten TEXT NOT NULL,
  total_jangkauan VARCHAR(100) NOT NULL,
  kisaran_rate_card VARCHAR(100) NOT NULL,
  demografi_followers TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumni_id)
);

CREATE INDEX idx_alumni_kreatif_alumni_id ON alumni_kreatif(alumni_id);
```

---

#### **Table: `alumni_rumah_tangga` (Homemakers/Stay-at-Home)**

**Status:** ✅ Likely exists but may be incomplete

| Field | Type | Migration Action |
|-------|------|------------------|
| `id` | SERIAL PRIMARY KEY | Should exist |
| `alumni_id` | UUID FK → alumni_db(id) | Should exist |
| `keahlian_irt` | TEXT | ADD IF NOT EXISTS |
| `kegiatan_organisasi_irt` | TEXT | ADD IF NOT EXISTS |
| `pengalaman_tim_irt` | BOOLEAN | ADD IF NOT EXISTS |
| `mencari_pekerjaan_kolaborasi_irt` | BOOLEAN | ADD IF NOT EXISTS |
| `created_at` | TIMESTAMP | ADD IF NOT EXISTS |
| `updated_at` | TIMESTAMP | ADD IF NOT EXISTS |

---

#### **Table: `alumni_mahasiswa` (Students/Fresh Graduates)**

**Status:** ❌ LIKELY MISSING (need to create)

```sql
CREATE TABLE IF NOT EXISTS alumni_mahasiswa (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_mahasiswa TEXT NOT NULL,
  kegiatan_organisasi_mahasiswa TEXT NOT NULL,
  pengalaman_tim_mahasiswa BOOLEAN DEFAULT FALSE,
  mencari_pekerjaan_kolaborasi_mahasiswa BOOLEAN DEFAULT FALSE,
  pengalaman_magang TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumni_id)
);

CREATE INDEX idx_alumni_mahasiswa_alumni_id ON alumni_mahasiswa(alumni_id);
```

---

#### **Table: `alumni_informal` (Freelancers/Daily Workers)**

**Status:** ❌ LIKELY MISSING (need to create)

```sql
CREATE TABLE IF NOT EXISTS alumni_informal (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_informal TEXT NOT NULL,
  pengalaman_tim_informal BOOLEAN DEFAULT FALSE,
  pernah_rekrut_memimpin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumni_id)
);

CREATE INDEX idx_alumni_informal_alumni_id ON alumni_informal(alumni_id);
```

---

#### **Table: `alumni_agri` (Farmers/Fishermen/Ranchers)**

**Status:** ❌ LIKELY MISSING (need to create)

```sql
CREATE TABLE IF NOT EXISTS alumni_agri (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_agri TEXT NOT NULL,
  komoditas_utama TEXT NOT NULL,
  tergabung_kelompok BOOLEAN DEFAULT FALSE,
  skala_usaha_agri VARCHAR(100) NOT NULL,
  nilai_tambah_diterapkan TEXT NOT NULL,
  kendala_dihadapi_agri TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumni_id)
);

CREATE INDEX idx_alumni_agri_alumni_id ON alumni_agri(alumni_id);
```

---

#### **Table: `alumni_pendidik` (Teachers/Educators)**

**Status:** ❌ LIKELY MISSING (need to create)

```sql
CREATE TABLE IF NOT EXISTS alumni_pendidik (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_pendidik TEXT NOT NULL,
  jenjang_pendidikan VARCHAR(100) NOT NULL,
  mata_pelajaran TEXT NOT NULL,
  inovasi_pembelajaran TEXT NOT NULL,
  mengajar_bimbel BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumni_id)
);

CREATE INDEX idx_alumni_pendidik_alumni_id ON alumni_pendidik(alumni_id);
```

---

### **New Tables for Features**

#### **Table: `posts` (Home Feed Posts)**

**Status:** ❌ DOES NOT EXIST (need to create)

```sql
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  media_url VARCHAR(500),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

---

#### **Table: `project_members` (Collaboration Tracking)**

**Status:** ❌ DOES NOT EXIST (need to create)

```sql
CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL, -- 'owner', 'collaborator', 'applicant', 'invited'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, alumni_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_alumni ON project_members(alumni_id);
CREATE INDEX idx_project_members_status ON project_members(status);
```

---

#### **Table: `ai_recommendations` (Cache AI Results)**

**Status:** ❌ DOES NOT EXIST (need to create)

```sql
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('collaboration', 'project_match', 'talent_search')),
  input_prompt TEXT NOT NULL,
  output_result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- for cache invalidation (e.g., created_at + 1 hour)
  CONSTRAINT ai_rec_expires_check CHECK (expires_at > created_at)
);

CREATE INDEX idx_ai_rec_user ON ai_recommendations(user_id);
CREATE INDEX idx_ai_rec_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_rec_expires ON ai_recommendations(expires_at);
CREATE INDEX idx_ai_rec_created ON ai_recommendations(created_at DESC);
```

---

## 🔄 Migration Execution Plan

### **Phase 0: Audit Current Database (Pre-Migration)**

**Goal:** Understand exactly what exists in production database

**Actions:**
1. Connect to Supabase dashboard
2. Run audit queries to check:
   ```sql
   -- Check alumni_db columns
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'alumni_db'
   ORDER BY ordinal_position;
   
   -- Check which conditional tables exist
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'alumni_%';
   
   -- Count existing users
   SELECT COUNT(*) as total_users FROM alumni_db;
   
   -- Check data completeness
   SELECT 
     COUNT(*) as total,
     COUNT(tahun_lahir) as has_tahun_lahir,
     COUNT(jenis_kelamin) as has_jenis_kelamin,
     COUNT(kota_domisili) as has_kota_domisili,
     COUNT(nomor_handphone) as has_nomor_handphone
   FROM alumni_db;
   ```

3. Document findings → Create `MIGRATION_AUDIT_RESULTS.md`

**Timeline:** 1 hour

---

### **Phase 1: Schema Migration (Add Missing Columns/Tables)**

**Goal:** Make database schema match code expectations

**Actions:**

#### **1.1 Update `alumni_db` Table**

```sql
-- Add missing columns (IF NOT EXISTS pattern for safety)
ALTER TABLE alumni_db
  ADD COLUMN IF NOT EXISTS tahun_lahir INTEGER,
  ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20),
  ADD COLUMN IF NOT EXISTS kota_domisili VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nomor_handphone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pendidikan_terakhir VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nama_institusi_pendidikan_terakhir VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jurusan_studi VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tahun_kelulusan INTEGER,
  ADD COLUMN IF NOT EXISTS bahasa_dikuasai TEXT,
  ADD COLUMN IF NOT EXISTS sertifikasi TEXT,
  ADD COLUMN IF NOT EXISTS instagram_link VARCHAR(255),
  ADD COLUMN IF NOT EXISTS linkedin_link VARCHAR(255),
  ADD COLUMN IF NOT EXISTS portofolio_link VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jenis_dukungan_dibutuhkan TEXT,
  ADD COLUMN IF NOT EXISTS bidang_kontribusi_minat TEXT,
  ADD COLUMN IF NOT EXISTS gabungan_data TEXT, -- For AI keyword matching
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Modify aktivitas to TEXT if it's currently VARCHAR (to support comma-separated multi-select)
-- Note: This is PostgreSQL-specific syntax
ALTER TABLE alumni_db 
  ALTER COLUMN aktivitas TYPE TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_alumni_db_nama_lengkap ON alumni_db(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_alumni_db_kota_domisili ON alumni_db(kota_domisili);
CREATE INDEX IF NOT EXISTS idx_alumni_db_aktivitas ON alumni_db USING GIN (to_tsvector('indonesian', aktivitas));
CREATE INDEX IF NOT EXISTS idx_alumni_db_skill_gabungan ON alumni_db USING GIN (to_tsvector('indonesian', skill_gabungan));
CREATE INDEX IF NOT EXISTS idx_alumni_db_gabungan_data ON alumni_db USING GIN (to_tsvector('indonesian', gabungan_data));
```

#### **1.2 Update Existing Conditional Tables**

```sql
-- Update alumni_pekerja (if exists, add missing columns)
ALTER TABLE alumni_pekerja
  ADD COLUMN IF NOT EXISTS keahlian_pekerja TEXT,
  ADD COLUMN IF NOT EXISTS nama_instansi VARCHAR(255),
  ADD COLUMN IF NOT EXISTS posisi VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pengalaman_proyek TEXT,
  ADD COLUMN IF NOT EXISTS akses_jejaring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pengalaman_bermitra BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update alumni_bisnis
ALTER TABLE alumni_bisnis
  ADD COLUMN IF NOT EXISTS keahlian_wirausahaan TEXT,
  ADD COLUMN IF NOT EXISTS produk_layanan_utama TEXT,
  ADD COLUMN IF NOT EXISTS nama_usaha VARCHAR(255),
  ADD COLUMN IF NOT EXISTS skala_usaha VARCHAR(100),
  ADD COLUMN IF NOT EXISTS kendala_bisnis TEXT,
  ADD COLUMN IF NOT EXISTS target_pasar VARCHAR(50),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update alumni_rumah_tangga
ALTER TABLE alumni_rumah_tangga
  ADD COLUMN IF NOT EXISTS keahlian_irt TEXT,
  ADD COLUMN IF NOT EXISTS kegiatan_organisasi_irt TEXT,
  ADD COLUMN IF NOT EXISTS pengalaman_tim_irt BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mencari_pekerjaan_kolaborasi_irt BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

#### **1.3 Create Missing Conditional Tables**

Run the CREATE TABLE statements from above for:
- `alumni_sosial`
- `alumni_kreatif`
- `alumni_mahasiswa`
- `alumni_informal`
- `alumni_agri`
- `alumni_pendidik`

#### **1.4 Create New Feature Tables**

Run the CREATE TABLE statements from above for:
- `posts`
- `project_members`
- `ai_recommendations`

**Timeline:** 2-3 hours (including testing)

---

### **Phase 2: Data Backfill & Transformation**

**Goal:** Populate `gabungan_data` for existing users (for AI matching)

**Actions:**

```sql
-- Generate gabungan_data from existing fields
-- This enables AI keyword matching for existing users
UPDATE alumni_db
SET gabungan_data = CONCAT_WS(' ',
  COALESCE(skill_gabungan, ''),
  COALESCE(aktivitas, ''),
  COALESCE(nama_lengkap, ''),
  COALESCE(fakultas_jurusan, ''),
  COALESCE(angkatan::TEXT, '')
)
WHERE gabungan_data IS NULL OR gabungan_data = '';

-- Create trigger to auto-update gabungan_data on profile changes
CREATE OR REPLACE FUNCTION update_gabungan_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gabungan_data := CONCAT_WS(' ',
    COALESCE(NEW.skill_gabungan, ''),
    COALESCE(NEW.aktivitas, ''),
    COALESCE(NEW.nama_lengkap, ''),
    COALESCE(NEW.fakultas_jurusan, ''),
    COALESCE(NEW.angkatan::TEXT, ''),
    COALESCE(NEW.kota_domisili, ''),
    COALESCE(NEW.bahasa_dikuasai, ''),
    COALESCE(NEW.jenis_dukungan_dibutuhkan, ''),
    COALESCE(NEW.bidang_kontribusi_minat, '')
  );
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gabungan_data
  BEFORE INSERT OR UPDATE ON alumni_db
  FOR EACH ROW
  EXECUTE FUNCTION update_gabungan_data();
```

**Timeline:** 1 hour

---

### **Phase 3: User Re-Onboarding Strategy**

**Goal:** Get existing users to complete their profiles

**Approach A: Soft Prompt (Recommended for MVP)**

1. **Add "Profile Completeness" Badge**
   - Calculate % complete based on filled fields
   - Show badge on profile page: "45% Complete"
   - CTA: "Complete your profile to unlock AI recommendations"

2. **Banner Notification**
   - On login, show banner if profile < 80% complete
   - "We've added new features! Please update your profile to get personalized collaboration recommendations."
   - Dismissible but persists on next login

3. **Progressive Updates**
   - Don't force all at once
   - Each time user visits profile, show 1-2 missing important fields
   - Example: "Add your phone number to let collaborators reach you"

**Approach B: Hard Requirement (for Production)**

1. **Profile Completion Gate**
   - If profile < 70% complete → Redirect to /complete-profile on login
   - Block access to certain features (AI search, project creation) until complete
   - Show clear progress: "3 of 24 questions answered"

2. **Email Campaign**
   - Send email to all users: "We've upgraded Talent Hub! Complete your profile to access new AI-powered features"
   - Include direct link to profile completion page

**Migration Timeline:**
- Week 1: Soft prompt (banner + badge)
- Week 2-3: Track completion rates
- Week 4+: Consider hard requirement if adoption is low

---

### **Phase 4: Database Cleanup (Optional, Post-Migration)**

**Goal:** Remove legacy/unused columns if any

**Actions:**
1. Audit for unused columns
2. Mark for deprecation (add comment)
3. After 1 month, drop if confirmed unused

```sql
-- Example (only after confirming column is unused)
-- ALTER TABLE alumni_db DROP COLUMN IF EXISTS legacy_field_name;
```

**Timeline:** 1 week (monitoring period)

---

## 🚨 Migration Risks & Mitigation

### **Risk 1: Breaking Existing Features**
**Impact:** Users can't access their profiles  
**Mitigation:**
- Use `IF NOT EXISTS` for all schema changes
- Test on staging database first
- Backup production database before migration
- Run migration during low-traffic hours

### **Risk 2: Data Loss**
**Impact:** User data gets corrupted/deleted  
**Mitigation:**
- NEVER use DROP or DELETE in migration
- Only ADD columns (backward compatible)
- Backup database before migration
- Use transactions (ROLLBACK on error)

### **Risk 3: Low User Adoption of Re-Onboarding**
**Impact:** Users don't update profiles, AI features underutilized  
**Mitigation:**
- Gamification: "Level up your profile!"
- Show benefits clearly: "Users with complete profiles get 3x more collaboration requests"
- Incentives: Featured profiles for 100% completion
- Email campaign + in-app notifications

### **Risk 4: Performance Degradation**
**Impact:** Queries slow down with more columns/indexes  
**Mitigation:**
- Add indexes strategically (only on frequently queried fields)
- Monitor query performance after migration
- Use EXPLAIN ANALYZE to optimize slow queries

---

## 📋 Migration Checklist

### **Pre-Migration**
- [ ] Backup production database (full snapshot)
- [ ] Test migration on staging/local database
- [ ] Review all SQL scripts for syntax errors
- [ ] Document rollback plan
- [ ] Schedule maintenance window (off-peak hours)
- [ ] Notify users about maintenance (if downtime expected)

### **Migration Execution**
- [ ] Run Phase 0: Audit queries → Document results
- [ ] Run Phase 1.1: Update alumni_db (ADD COLUMN)
- [ ] Verify: Query alumni_db columns → confirm new columns exist
- [ ] Run Phase 1.2: Update existing conditional tables
- [ ] Verify: Query conditional tables → confirm updates
- [ ] Run Phase 1.3: Create missing conditional tables
- [ ] Verify: Query information_schema → confirm 9 conditional tables exist
- [ ] Run Phase 1.4: Create feature tables (posts, project_members, ai_recommendations)
- [ ] Verify: Query new tables → confirm creation
- [ ] Run Phase 2: Backfill gabungan_data
- [ ] Verify: SELECT COUNT(*) FROM alumni_db WHERE gabungan_data IS NOT NULL
- [ ] Create trigger for auto-update gabungan_data
- [ ] Test trigger: Update a profile → check gabungan_data updates

### **Post-Migration**
- [ ] Test complete profile flow (frontend → API → database)
- [ ] Test get profile API (ensure JOINs work with new tables)
- [ ] Monitor error logs for 24 hours
- [ ] Check database performance metrics
- [ ] Deploy Phase 3: User re-onboarding UI changes
- [ ] Send email campaign (if applicable)
- [ ] Monitor profile completion rates
- [ ] Collect user feedback

---

## 🔧 AI Service Re-Deployment Plan

### **Current State:**
- FastAPI service exists in `Alumni AI/alumni_ai/`
- Previously deployed on render.com (now offline)
- Uses Gemini API (credentials in `.env`)

### **Re-Deployment Options:**

#### **Option 1: Render.com (Original)**
**Pros:** Familiar, easy setup  
**Cons:** Cost, need to re-configure  
**Steps:**
1. Login to render.com
2. Create new Web Service
3. Connect GitHub repo (or manual deploy)
4. Set env vars (GEMINI_API_KEY, SUPABASE_DB_URL, INTERNAL_API_KEY)
5. Deploy

#### **Option 2: Vercel (Recommended for Next.js Integration)**
**Pros:** Same platform as frontend, easy integration, generous free tier  
**Cons:** Serverless (cold starts)  
**Steps:**
1. Move AI logic to Next.js API routes (TypeScript)
2. Call Gemini API directly from Next.js
3. No separate service needed
4. Better DX (single codebase)

#### **Option 3: Railway / Fly.io**
**Pros:** Cheaper than Render, better performance  
**Cons:** Learning curve  

#### **Option 4: Self-Host (Docker + Cloud VM)**
**Pros:** Full control, cheapest long-term  
**Cons:** DevOps overhead  

### **Recommendation: Option 2 (Migrate to Next.js)**

**Why:**
1. Reduce infrastructure complexity (1 deploy vs 2)
2. TypeScript everywhere (better DX)
3. No CORS issues
4. Easier to maintain
5. Vercel free tier sufficient for MVP

**Migration Plan:**
```typescript
// app/api/ai/collaboration-recommendation/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { nama_lengkap, language } = await req.json();
  
  // 1. Fetch profile from Supabase (same logic as FastAPI)
  // 2. Build prompt
  // 3. Call Gemini API
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
      })
    }
  );
  
  const data = await geminiResponse.json();
  return NextResponse.json({ rekomendasi: data.candidates[0].content.parts[0].text });
}
```

**Timeline:** 2-3 days to migrate FastAPI → Next.js API routes

---

## 📅 Overall Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 0: Audit** | 1 hour | Access to Supabase |
| **Phase 1: Schema Migration** | 3 hours | Audit complete |
| **Phase 2: Data Backfill** | 1 hour | Schema migration done |
| **Phase 3: Re-Onboarding UI** | 2 days | Schema ready |
| **Phase 4: AI Service Migration** | 2-3 days | Can run in parallel |
| **Testing & Monitoring** | 1 week | All phases complete |
| **TOTAL** | ~1.5 weeks | - |

---

## ✅ Success Metrics

1. **Schema Migration Success:**
   - [ ] All 16 new columns added to `alumni_db`
   - [ ] All 9 conditional tables exist
   - [ ] All 3 new feature tables created
   - [ ] No data loss (existing user count unchanged)

2. **User Re-Onboarding:**
   - [ ] >70% users update profile within 2 weeks
   - [ ] >50% profiles >80% complete within 1 month

3. **AI Service:**
   - [ ] AI endpoints respond <3s avg
   - [ ] 95% uptime
   - [ ] Gemini API costs <$50/month initially

4. **No Regressions:**
   - [ ] Existing login/register flow works
   - [ ] Existing project listing works
   - [ ] No increase in error rates

---

## 🎯 Next Immediate Steps

1. **Run Database Audit** (Phase 0)
   - Connect to Supabase dashboard
   - Run audit SQL queries
   - Document current schema state

2. **Review & Approve Migration Plan**
   - Confirm approach makes sense
   - Identify any concerns
   - Adjust timeline if needed

3. **Execute Migration** (Phase 1-2)
   - Run SQL scripts in Supabase
   - Verify each step
   - Monitor for errors

4. **Start Development** (Phase 3-4)
   - Build re-onboarding UI
   - Migrate AI service (or re-deploy)
   - Test end-to-end

**Ready to proceed?** 🚀
