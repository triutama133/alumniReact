# Smart Job Aggregator — Development Plan

**Status:** Draft v1.0  
**Tanggal:** 5 Agustus 2026

---

## Overview

Smart Job Aggregator adalah pilar ke-3 HubTalent yang mengkurasi lowongan kerja dari berbagai platform eksternal (LinkedIn, Jobstreet, Glints, Kalibrr, dll) ke dalam satu pintu akses. Saat ini sistem lowongan (`/api/jobs`) masih mengandalkan input manual ke database — tujuan jangka panjang adalah otomatisasi penuh.

---

## Arsitektur Target

```
┌───────────────────────────────────────────────────┐
│                   SCHEDULER                        │
│  (Cron Job / Vercel Cron / GitHub Actions)        │
│  Setiap 6-12 jam scrape/API fetch dari sources    │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│              INGESTION PIPELINE                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ LinkedIn │ │ Jobstreet│ │  Glints  │ ...      │
│  │ Scraper  │ │ Scraper  │ │ Scraper  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       └─────────────┼────────────┘                │
│                     ▼                             │
│           ┌─────────────────┐                    │
│           │  DEDUPLICATOR   │                    │
│           │  (judul + co)   │                    │
│           └────────┬────────┘                    │
│                     ▼                             │
│           ┌─────────────────┐                    │
│           │  AI ENRICHER    │                    │
│           │  (kategorisasi) │                    │
│           └────────┬────────┘                    │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│              DATABASE (Supabase)                   │
│  Tabel: jobs (existing) + aggregated_jobs (new)   │
│  Kolom baru: source_platform, source_url,          │
│  remote_option, salary_range, posted_at            │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│              API LAYER                             │
│  /api/jobs (existing) → enhanced dengan filter    │
│  /api/jobs/aggregate → trigger manual fetch       │
│  /api/jobs/stats → statistik agregasi             │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│              FRONTEND                              │
│  app/(main)/jobs → enhanced view                  │
│  app/(public)/preview/jobs → preview publik       │
│  + filter: platform, remote, salary range         │
│  + badge: source platform icon                    │
│  + AI Job Match (personalized)                    │
└───────────────────────────────────────────────────┘
```

---

## Fase Pengembangan

### Fase 1: Database Enhancement (1-2 hari)

**Tujuan:** Perluas skema `jobs` table agar siap menampung data agregasi dari berbagai sumber.

**Migration SQL:**
```sql
-- migration_015_job_aggregator.sql

-- Tambah kolom source tracking
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_platform TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Tambah kolom enriched metadata
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remote_option TEXT 
  CHECK (remote_option IN ('onsite', 'hybrid', 'remote', NULL));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'IDR';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Index untuk deduplikasi
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_dedup 
  ON jobs (source_platform, source_id) 
  WHERE source_platform IS NOT NULL AND source_id IS NOT NULL;

-- Index untuk filter
CREATE INDEX IF NOT EXISTS idx_jobs_remote_option ON jobs (remote_option) WHERE remote_option IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs (posted_at DESC);
```

**File:** `app/api/jobs/route.ts` — tambahkan query params: `remote`, `platform`, `salary_min`, `salary_max`, `sort_by`

**File:** `lib/types.ts` — update `Job` interface dengan kolom baru

---

### Fase 2: Manual Ingestion (Admin Panel) (3-5 hari)

**Tujuan:** Admin bisa menambahkan lowongan dari platform eksternal secara manual via UI sebelum otomatisasi scraper siap.

**Komponen baru:**

| File | Fungsi |
|------|--------|
| `app/(main)/super-admin/jobs/add/page.tsx` | Form tambah lowongan dengan source platform dropdown |
| `components/jobs/JobForm.tsx` | Reusable form komponen |
| `app/api/jobs/route.ts` | Tambahkan method `POST` (jika belum ada) |
| `app/api/jobs/[id]/route.ts` | `PUT` dan `DELETE` untuk edit/hapus |

**Form fields:**
- Job title, company, description, job URL, category
- Source platform (dropdown: LinkedIn, Jobstreet, Glints, Kalibrr, Manual)
- Remote option (onsite/hybrid/remote)
- Salary range (optional)
- Location
- Skills (multi-select chip)

---

### Fase 3: External Platform Scrapers (7-14 hari)

**Tujuan:** Otomatisasi pengambilan data lowongan dari platform partner.

**Teknologi stack:**
- **Python** (BeautifulSoup4 + Playwright/httpx) untuk scraping
- **Puppeteer** (Node.js) alternatif untuk platform dengan heavy JS rendering
- **Deploy:** Vercel Cron Jobs / GitHub Actions scheduled workflow

**Pendekatan per platform:**

| Platform | Metode | Kompleksitas | Keterangan |
|----------|--------|-------------|------------|
| **LinkedIn** | Puppeteer (headful) | 🔴 Tinggi | Anti-bot ketat, perlu session cookie, rate limit rendah |
| **Jobstreet** | Puppeteer | 🟡 Medium | Bisa scrape listing page, proxy rotation disarankan |
| **Glints** | Playwright | 🟡 Medium | Infinite scroll listing, perlu intercept XHR |
| **Kalibrr** | Playwright | 🟡 Medium | Struktur relatif stabil |
| **KitaLulus** | Playwright | 🟡 Medium | Fokus lokal Indonesia |
| **Indeed** | Puppeteer | 🟡 Medium | Bisa scrape search results |
| **Karir.com** | Playwright | 🟢 Low | Struktur sederhana |

**File scraper:**
```
scrapers/
├── requirements.txt
├── main.py                    ← orchestrator, dipanggil cron
├── config.py                  ← platform URLs, settings
├── platforms/
│   ├── linkedin.py
│   ├── jobstreet.py
│   ├── glints.py
│   ├── kalibrr.py
│   └── karir.py
├── deduplicator.py            ← fuzzy matching judul + company
├── enricher.py                ← AI kategorisasi (opsional)
└── supabase_client.py         ← upsert ke database
```

**Deduplikasi logic:**
```python
# Fuzzy match berdasarkan (judul, company, platform)
# Threshold: 85% similarity → dianggap duplikat
# Priority: update existing jika ada perubahan
from difflib import SequenceMatcher

def is_duplicate(job_a, job_b):
    title_sim = SequenceMatcher(None, 
        job_a['title'].lower(), job_b['title'].lower()).ratio()
    company_sim = SequenceMatcher(None, 
        job_a['company'].lower(), job_b['company'].lower()).ratio()
    return title_sim > 0.85 and company_sim > 0.85
```

**Rate Limiting & Etika:**
- Delay 2-5 detik antar request
- Rotate User-Agent header
- Proxy rotation (jika diperlukan)
- Hormati `robots.txt` — prioritaskan halaman listing publik
- Jangan scrape halaman yang butuh login penuh

---

### Fase 4: Frontend Enhancement (5-7 hari)

**Tujuan:** Tampilan lowongan yang lebih kaya dan informatif.

**Enhancement `app/(main)/jobs/page.tsx`:**

| Fitur | Deskripsi |
|-------|-----------|
| **Platform badge** | Ikon kecil sumber lowongan (LinkedIn, Jobstreet icon) di card |
| **Filter multi-platform** | Checkbox filter per platform |
| **Remote filter** | Toggle: Onsite / Hybrid / Remote / All |
| **Salary range slider** | Slider range dengan input manual |
| **Sorting** | Sort by: terbaru, salary (highest first), relevance |
| **Infinite scroll** | Load more saat scroll ke bawah (ganti paginasi manual) |
| **Detail expand/collapse** | Inline expand untuk detail lowongan tanpa navigasi |

**Enhancement `app/(public)/preview/jobs/page.tsx`:**
- Sama dengan di atas, tapi CTA "Lamar" mengarah ke `/register` jika belum login
- Tampilkan jumlah lowongan per platform (stat counter)

---

### Fase 5: AI Job Matching (7-10 hari)

**Tujuan:** Rekomendasi lowongan yang dipersonalisasi berdasarkan profil pengguna.

**Logic matching:**
```
User Profile → Skills + Experience + Preferred Category
                       │
                       ▼
           ┌───────────────────────┐
           │  Vector Embedding     │
           │  (OpenAI / DeepSeek)  │
           └───────────┬───────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Cosine Similarity    │
           │  vs semua lowongan    │
           └───────────┬───────────┘
                       │
                       ▼
              Top 10 Rekomendasi
```

**File baru:**
| File | Fungsi |
|------|--------|
| `app/api/jobs/recommendations/route.ts` | API endpoint rekomendasi |
| `components/jobs/JobRecommendations.tsx` | Widget rekomendasi di dashboard |
| `lib/jobMatching.ts` | Logic matching & embedding |

**Output frontend:**
- Widget "Rekomendasi Untukmu" di dashboard user
- Card dengan match percentage badge (e.g., "92% Match")
- Highlight skills yang cocok vs yang perlu dikembangkan
- Button "Lamar Sekarang" → redirect ke job URL eksternal

---

### Fase 6: Analytics & Monitoring (3-5 hari)

**Tujuan:** Dashboard monitoring untuk admin melihat performa agregasi.

**File baru:**
| File | Fungsi |
|------|--------|
| `app/api/jobs/stats/route.ts` | API statistik |
| `app/(main)/super-admin/jobs/stats/page.tsx` | Dashboard admin |

**Metrik yang ditampilkan:**
- Total lowongan per platform
- Lowongan baru hari ini / minggu ini
- Top kategori lowongan
- Top companies hiring
- Success rate scraper (error count, success ratio)
- Timeline chart lowongan masuk per hari

---

## Timeline Keseluruhan

| Fase | Durasi | Prioritas | Target |
|------|--------|-----------|--------|
| **Fase 1:** Database Enhancement | 1-2 hari | 🔴 High | Week 1 |
| **Fase 2:** Manual Ingestion Admin | 3-5 hari | 🔴 High | Week 1-2 |
| **Fase 3:** External Scrapers | 7-14 hari | 🟡 Medium | Week 2-4 |
| **Fase 4:** Frontend Enhancement | 5-7 hari | 🛑 Depend Fase 1-2 | Week 2-3 |
| **Fase 5:** AI Job Matching | 7-10 hari | 🟢 Low | Week 4-6 |
| **Fase 6:** Analytics & Monitoring | 3-5 hari | 🟢 Low | Week 5-6 |

---

## Quick Start (Fase 1 — Bisa Dimulai Sekarang)

### Step 1: Migration
```bash
# Buat file migration
touch database/migration_015_job_aggregator.sql
# Copy SQL dari Fase 1 di atas
# Jalankan via Supabase SQL Editor
```

### Step 2: Update API
Edit `app/api/jobs/route.ts` — tambahkan query param filter:
- `?remote=hybrid` — filter remote option
- `?platform=LinkedIn` — filter source platform
- `?salary_min=5000000&salary_max=15000000` — salary range
- `?sort_by=newest|salary|relevance`

### Step 3: Update Type
Edit `lib/types.ts` — tambahkan field baru ke `Job` interface.

### Step 4: Build & Test
```bash
npm run build
npm run dev
# Test: curl http://localhost:3000/api/jobs?remote=remote&platform=LinkedIn
```

---

## Catatan Penting

1. **Legal:** Scraping data dari platform eksternal harus comply dengan Terms of Service masing-masing. Prioritaskan platform yang memperbolehkan atau memiliki public API resmi.
2. **Data Accuracy:** Data dari scraper perlu divalidasi. Jangan tampilkan ke user sebelum melalui review admin (Fase 2: Manual Ingestion).
3. **Fallback:** Selalu ada opsi input manual untuk admin jika scraper bermasalah.
4. **Cost:** Scraping butuh compute resources (browser instance). Pertimbangkan biaya Vercel Function execution time atau gunakan GitHub Actions (free tier).
5. **Respect robots.txt:** Setiap scraper harus cek `robots.txt` sebelum mulai dan obey crawl-delay.