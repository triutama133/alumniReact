# Indonesia Talent Hub - Development Plan

**Tanggal:** 13 Juni 2026  
**Status Project:** Partially Developed - Perlu Development Lanjutan

---

## 📋 Executive Summary

Project Indonesia Talent Hub adalah platform untuk menghubungkan alumni universitas (fokus IPB) dalam mencari talenta dan kolaborasi berbasis profil yang lengkap. Platform ini terinspirasi LinkedIn dengan fitur unggulan: AI-powered matching untuk project dan talent recommendation.

**Current Progress:** ~40% complete
- ✅ Authentication system (login/register)
- ✅ Basic profile system
- ✅ Projects CRUD
- ✅ Talent search
- ⚠️ Profile form sangat basic (tidak sesuai requirement PDF)
- ❌ Landing page
- ❌ Home feed/posting functionality
- ❌ Edit profile
- ❌ Conditional profile forms
- ❌ AI collaboration recommendation (partial - ada API tapi belum fully integrated)

---

## 🎯 Comparison: Current vs Required

### **1. Pages & Routes**

| Page | PDF Requirement | Current Status | Gap |
|------|----------------|----------------|-----|
| Landing Page | ✅ Required | ❌ Missing | Need to create |
| Login/Register | ✅ Required | ✅ Complete | - |
| Complete Profile | ✅ Required (25 Q + conditional) | ⚠️ Basic only (6 fields) | **Major gap** |
| Home/Beranda | ✅ Feed + posting | ✅ Basic feed | Missing posting feature |
| Search Talent | ✅ Required | ✅ Present | Need enhancement |
| Search Project | ✅ Required | ✅ Present (via /projects) | Need separate tab |
| Profile View | ✅ Required | ✅ Present | Need enhancement |
| Edit Profile | ✅ Required | ❌ Missing | Need to create |
| Header/Navbar | ✅ LinkedIn-style | ✅ Present | Need polish |

### **2. Profile Form Fields**

**Current Fields (6):**
- nama_lengkap
- nama_panggilan
- angkatan
- fakultas_jurusan
- aktivitas (single choice)
- skill_gabungan

**Required Fields (PDF - 25 questions + conditional):**

#### BAB I: Profil Utama (Q1-Q25)
1. ✅ Email (handled by auth)
2. ✅ Nama lengkap
3. ✅ Nama panggilan
4. ❌ Tahun lahir
5. ❌ Jenis kelamin
6. ❌ Kota/kabupaten domisili
7. ❌ Nomor handphone (format 62xxx)
8. ❌ Pendidikan terakhir (dropdown)
9. ❌ Nama institusi pendidikan terakhir
10. ❌ Jurusan/program studi
11. ❌ Tahun kelulusan
12. ⚠️ Keahlian (ada, tapi perlu structured format)
13. ❌ Bahasa yang dikuasai
14. ❌ Sertifikasi
15. ❌ Link Instagram (optional)
16. ❌ Link LinkedIn (optional)
17. ⚠️ Aktivitas/pekerjaan - **CRITICAL GAP**
    - Current: single choice
    - Required: **multi-select checkbox** dengan status keaktifan
18. ❌ Pelatihan yang diikuti (paragraf)
19. ❌ Jenis dukungan yang dibutuhkan (multi-select)
20. ❌ Bidang kontribusi/minat (multi-select)
21. ❌ Peran dalam kolaborasi (multi-select)
22. ❌ Link portofolio
23. Missing number in PDF
24. ❌ Pengalaman proyek/komunitas sosial
25. ❌ Ketersediaan waktu kolaborasi

#### BAB II: Conditional Follow-up Questions
**Current:** Hanya 3 aktivitas dengan follow-up sederhana
**Required:** 9 aktivitas dengan pertanyaan detail:

1. **Profesional Institusi** ✅ (partial - need more fields)
2. **Entrepreneur/Wirausaha** ✅ (partial - need more fields)
3. **Pekerja Sosial/NGO** ❌ (missing table & fields)
4. **Content Creator** ❌ (missing table & fields)
5. **Ibu Rumah Tangga** ✅ (exists but incomplete)
6. **Mahasiswa/Fresh Graduate** ❌ (missing table & fields)
7. **Pekerja Informal/Freelance** ❌ (missing table & fields)
8. **Petani/Nelayan/Peternak** ❌ (missing table & fields)
9. **Guru/Pendidik** ❌ (missing table & fields)

### **3. Database Schema**

**Existing Tables:**
- `user` (authentication)
- `alumni_db` (main profile - incomplete)
- `alumni_pekerja` (basic fields)
- `alumni_bisnis` (basic fields)
- `alumni_rumah_tangga` (basic fields)
- `projects`

**Missing Tables:**
- `alumni_sosial` (NGO workers)
- `alumni_kreatif` (content creators)
- `alumni_mahasiswa` (students/fresh grad)
- `alumni_informal` (freelancers)
- `alumni_agri` (farmers/fishermen)
- `alumni_pendidik` (educators)

**Fields to Add to `alumni_db`:**
```sql
-- Missing from current schema
tahun_lahir INTEGER
jenis_kelamin VARCHAR
kota_domisili VARCHAR
nomor_handphone VARCHAR
pendidikan_terakhir VARCHAR
nama_institusi_pendidikan_terakhir VARCHAR
jurusan_studi VARCHAR
tahun_kelulusan INTEGER
bahasa_dikuasai TEXT
sertifikasi TEXT
instagram_link VARCHAR
linkedin_link VARCHAR
pelatihan_diikuti TEXT
jenis_dukungan_dibutuhkan TEXT  -- comma-separated or JSON
bidang_kontribusi_minat TEXT    -- comma-separated or JSON
peran_kolaborasi_minat TEXT     -- comma-separated or JSON
portofolio_link VARCHAR
pengalaman_proyek_sosial TEXT
ketersediaan_waktu VARCHAR
```

---

## 🚀 Development Roadmap

### **PHASE 1: Database & Backend Foundation** (Priority: HIGH)
**Estimated Time:** 3-4 days

#### 1.1 Database Migration
- [ ] Update `alumni_db` schema (add 15+ missing fields)
- [ ] Create 6 missing conditional tables:
  - [ ] `alumni_sosial`
  - [ ] `alumni_kreatif`
  - [ ] `alumni_mahasiswa`
  - [ ] `alumni_informal`
  - [ ] `alumni_agri`
  - [ ] `alumni_pendidik`
- [ ] Update existing conditional tables (add missing fields per PDF)
- [ ] Add indexes for search optimization

**SQL Script Example:**
```sql
-- Update alumni_db
ALTER TABLE alumni_db
  ADD COLUMN tahun_lahir INTEGER,
  ADD COLUMN jenis_kelamin VARCHAR(20),
  ADD COLUMN kota_domisili VARCHAR(100),
  ADD COLUMN nomor_handphone VARCHAR(20),
  -- ... (all missing fields)
  MODIFY COLUMN aktivitas TEXT; -- Change to support comma-separated values

-- Create alumni_sosial
CREATE TABLE alumni_sosial (
  id SERIAL PRIMARY KEY,
  alumni_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
  keahlian_sosial TEXT,
  pengalaman_proyek_sosial TEXT,
  isu_fokus TEXT,
  nama_organisasi VARCHAR(255),
  pengalaman_bermitra_sosial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repeat for other 5 tables...
```

#### 1.2 Update Type Definitions
- [ ] Update `lib/types.ts` with new fields
- [ ] Create comprehensive type for all 9 aktivitas
- [ ] Add type for multi-select fields (arrays)

#### 1.3 API Routes Enhancement
- [ ] Update `/api/complete-profile` to handle 25 main fields + conditionals
- [ ] Update `/api/get-profile` to return all new fields
- [ ] Add validation for conditional logic (aktivitas multi-select)
- [ ] Add `/api/update-profile` for edit functionality

---

### **PHASE 2: Complete Profile Form Rebuild** (Priority: HIGH)
**Estimated Time:** 5-6 days

#### 2.1 Form Architecture
- [ ] Design multi-step form UI (3-4 steps):
  1. **Step 1:** Profil Dasar (Q1-Q11)
  2. **Step 2:** Keahlian & Kontak (Q12-Q16)
  3. **Step 3:** Aktivitas & Minat (Q17-Q25)
  4. **Step 4:** Conditional Questions (based on Q17 selections)

- [ ] Implement form state management (React Hook Form + Zod)
- [ ] Add progress indicator
- [ ] Add form validation per step

#### 2.2 Question Components
Create reusable components for each question type:
- [ ] Text input (short & long)
- [ ] Number input
- [ ] Dropdown/Select (single choice)
- [ ] Checkbox group (multi-select)
- [ ] Radio group
- [ ] Textarea (paragraph)
- [ ] URL input (with validation)
- [ ] Phone input (with format validation 62xxx)

#### 2.3 Conditional Logic Implementation
- [ ] Implement dynamic form rendering based on Q17 (aktivitas selection)
- [ ] Add status keaktifan sub-question for each aktivitas
- [ ] Hide conditional sections if aktivitas >5 years ago
- [ ] Ensure only relevant conditional tables are populated

#### 2.4 Form Submission
- [ ] Implement multi-table insert logic
- [ ] Handle transaction for data consistency
- [ ] Add error handling & rollback
- [ ] Show success message & redirect

**Example Structure:**
```tsx
// app/(auth)/complete-profile/page.tsx (rebuild)
const AKTIVITAS_OPTIONS = [
  { value: 'profesional', label: 'Profesional Institusi' },
  { value: 'entrepreneur', label: 'Entrepreneur/Wirausaha' },
  { value: 'sosial', label: 'Pekerja Sosial/NGO' },
  { value: 'kreatif', label: 'Content Creator' },
  { value: 'irt', label: 'Ibu Rumah Tangga' },
  { value: 'mahasiswa', label: 'Mahasiswa/Fresh Graduate' },
  { value: 'informal', label: 'Pekerja Informal/Freelance' },
  { value: 'agri', label: 'Petani/Nelayan/Peternak' },
  { value: 'pendidik', label: 'Guru/Pendidik' },
];

// Conditional rendering
{selectedAktivitas.includes('sosial') && statusAktif('sosial') && (
  <AktivitasSosialForm />
)}
```

---

### **PHASE 3: Landing Page & Navigation** (Priority: MEDIUM)
**Estimated Time:** 2-3 days

#### 3.1 Landing Page
- [ ] Create `/app/page.tsx` (root landing)
- [ ] Design hero section with value proposition
- [ ] Add feature highlights
- [ ] Add CTA buttons (Login/Register)
- [ ] Add statistics (optional: total users, projects, etc.)
- [ ] Make it responsive

#### 3.2 Navigation Update
- [ ] Update middleware to allow public access to landing
- [ ] Redirect authenticated users from landing to `/home`
- [ ] Add proper navigation in header
- [ ] Implement active route highlighting

---

### **PHASE 4: Profile View & Edit** (Priority: MEDIUM)
**Estimated Time:** 3-4 days

#### 4.1 Enhanced Profile View
- [ ] Display all 25 main fields
- [ ] Display conditional fields based on aktivitas
- [ ] Add tabbed interface for better organization:
  - Tab: Profil Umum
  - Tab: Keahlian & Pengalaman
  - Tab: Aktivitas Profesional (dynamic based on selected aktivitas)
- [ ] Add visual elements (badges for skills, icons, etc.)
- [ ] Show "incomplete profile" warning if fields missing

#### 4.2 Edit Profile Page
- [ ] Create `/app/(main)/profile/edit/[userId]/page.tsx`
- [ ] Reuse complete-profile form components
- [ ] Pre-populate with existing data
- [ ] Allow partial updates (not force all fields)
- [ ] Add "Save" & "Cancel" buttons
- [ ] Implement optimistic UI updates

#### 4.3 Settings Page (Optional but Recommended)
- [ ] Create `/app/(main)/settings/page.tsx`
- [ ] Allow password change
- [ ] Allow email update
- [ ] Privacy settings (who can see profile, etc.)

---

### **PHASE 5: Home Feed & Social Features** (Priority: MEDIUM)
**Estimated Time:** 4-5 days

#### 5.1 Posts System
- [ ] Create `posts` table in database:
  ```sql
  CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES alumni_db(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] Create API routes:
  - [ ] `POST /api/posts` (create post)
  - [ ] `GET /api/posts` (fetch feed)
  - [ ] `DELETE /api/posts/[id]` (delete own post)
  - [ ] `PUT /api/posts/[id]` (edit own post)

#### 5.2 Feed UI
- [ ] Update `/app/(main)/page.tsx` (Home)
- [ ] Add post composer (textarea + submit)
- [ ] Display feed (reverse chronological)
- [ ] Add post cards with:
  - User avatar & name
  - Timestamp
  - Content
  - Edit/Delete for own posts
- [ ] Implement infinite scroll or pagination

#### 5.3 Engagement Features (Optional for MVP)
- [ ] Like/reaction system
- [ ] Comment system
- [ ] Share functionality

---

### **PHASE 6: Search Enhancement** (Priority: LOW-MEDIUM)
**Estimated Time:** 2-3 days

#### 6.1 Talent Search Enhancement
- [ ] Add advanced filters:
  - Aktivitas (multi-select)
  - Skills (multi-select with autocomplete)
  - Location (kota_domisili)
  - Availability (ketersediaan_waktu)
- [ ] Improve search result cards (show more info)
- [ ] Add sort options (relevance, newest, etc.)

#### 6.2 Project Search
- [ ] Create separate `/app/(main)/projects/search/page.tsx` or tab
- [ ] Add filters:
  - Status (open, closed, in-progress)
  - Required skills
  - Project owner
- [ ] Implement project cards in search results

---

### **PHASE 7: AI Features Integration** (Priority: MEDIUM)
**Estimated Time:** 3-4 days

#### 7.1 Collaboration Recommendation
- [ ] Fix existing `/api/collaboration-recommendation`
- [ ] Ensure it uses complete profile data (25 fields)
- [ ] Improve prompt engineering for better recommendations
- [ ] Add loading states and error handling
- [ ] Cache recommendations (optional)

#### 7.2 Project-Talent Matching
- [ ] Create `/api/project-match` endpoint
- [ ] Input: project description + required skills
- [ ] Output: ranked list of matching alumni
- [ ] Integrate with project creation flow
- [ ] Add "Find Talent for This Project" button on project detail

#### 7.3 Talent Discovery
- [ ] Create `/api/talent-discovery` endpoint
- [ ] Suggest similar profiles
- [ ] Suggest potential collaborators based on complementary skills

---

### **PHASE 8: Polish & Production Ready** (Priority: LOW)
**Estimated Time:** 3-4 days

#### 8.1 UI/UX Refinement
- [ ] Consistent design system (colors, typography, spacing)
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add empty states
- [ ] Mobile responsiveness check on all pages

#### 8.2 Performance Optimization
- [ ] Implement proper caching strategies
- [ ] Optimize images (Next.js Image component)
- [ ] Code splitting
- [ ] Database query optimization (add indexes)
- [ ] Implement pagination on all lists

#### 8.3 Testing & QA
- [ ] Unit tests for critical API routes
- [ ] Integration tests for auth flow
- [ ] E2E tests for complete profile flow
- [ ] Manual testing on multiple devices/browsers
- [ ] Fix all ESLint warnings (cleanup from earlier fixes)

#### 8.4 Documentation
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Setup/installation guide
- [ ] User manual (optional)

#### 8.5 Deployment Preparation
- [ ] Environment variables setup guide
- [ ] Database migration scripts
- [ ] CI/CD pipeline (optional)
- [ ] Monitoring & logging setup

---

## 📊 Effort Estimation Summary

| Phase | Priority | Estimated Days | Complexity |
|-------|----------|----------------|------------|
| Phase 1: Database & Backend | HIGH | 3-4 | Medium |
| Phase 2: Complete Profile Form | HIGH | 5-6 | High |
| Phase 3: Landing Page | MEDIUM | 2-3 | Low |
| Phase 4: Profile View & Edit | MEDIUM | 3-4 | Medium |
| Phase 5: Home Feed | MEDIUM | 4-5 | Medium |
| Phase 6: Search Enhancement | LOW-MEDIUM | 2-3 | Low |
| Phase 7: AI Features | MEDIUM | 3-4 | Medium-High |
| Phase 8: Polish & Production | LOW | 3-4 | Medium |
| **TOTAL** | - | **25-33 days** | - |

**Realistic Timeline:** 6-8 minggu (dengan 1 developer full-time)

---

## 🎯 Recommended Development Sequence

### **Sprint 1 (Week 1-2): Foundation**
Focus: Database & Core Profile System
- Phase 1: Database Migration
- Phase 2: Complete Profile Form (partial)

**Deliverable:** Functional profile collection matching PDF requirement

### **Sprint 2 (Week 3-4): User Experience**
Focus: Navigation & Profile Management
- Phase 2: Complete Profile Form (finish)
- Phase 3: Landing Page
- Phase 4: Profile View & Edit

**Deliverable:** Complete user profile journey (register → profile → view → edit)

### **Sprint 3 (Week 5-6): Social & Discovery**
Focus: Community Features
- Phase 5: Home Feed
- Phase 6: Search Enhancement

**Deliverable:** LinkedIn-like experience with feed and search

### **Sprint 4 (Week 7-8): Intelligence & Polish**
Focus: AI Features & Production Ready
- Phase 7: AI Features
- Phase 8: Polish & Production

**Deliverable:** Production-ready application with AI matching

---

## ⚠️ Critical Decisions Needed

1. **Multi-select Aktivitas Storage:**
   - Option A: Comma-separated string in `alumni_db.aktivitas`
   - Option B: JSON array in PostgreSQL
   - Option C: Separate junction table `alumni_aktivitas`
   - **Recommendation:** Option B (JSON array) - easiest to query and maintain

2. **Status Keaktifan Tracking:**
   - Should we store historical aktivitas or only current?
   - **Recommendation:** Store timestamp for each aktivitas entry

3. **Profile Completeness:**
   - Force users to complete ALL 25 questions?
   - Or allow partial profiles?
   - **Recommendation:** Require core fields (Q1-Q17), make others optional but encourage completion

4. **AI Service Architecture:**
   - Keep FastAPI backend separate? (current)
   - Or integrate LLM directly in Next.js API routes?
   - **Recommendation:** Keep separate for scalability

5. **File Upload for Sertifikasi/Portofolio:**
   - Do we need file upload feature?
   - Or just links?
   - **Recommendation:** Start with links only (Q14, Q22), add upload in future

---

## 📝 Next Immediate Steps

If you want to start development NOW, here's what to do:

1. **Create database migration script** for Phase 1.1
2. **Update `lib/types.ts`** with comprehensive AlumniProfileType
3. **Create new Zod schema** for complete profile form (25 fields)
4. **Sketch out multi-step form UI** wireframe/mockup
5. **Test database changes** in development environment

Would you like me to:
- Generate the database migration SQL?
- Create the updated TypeScript types?
- Build the multi-step form component structure?
- Or start with a specific phase?

---

## 🔗 References

- PDF Document: "Project Talent Hub - Panduan Instrumen Pertanyaan"
- Current Codebase: `/Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2`
- Supabase Documentation: https://supabase.com/docs
- Next.js 15 Documentation: https://nextjs.org/docs
