# Implementation Plan: Landing, Preview Pages & UI/UX Overhaul

**Pendekatan:**
- Halaman preview dibuat **terpisah** — tidak modifikasi sama sekali flow login/dashboard yang sudah ada
- Semua tombol di landing harus fungsional, setiap CTA preview mengarah ke `/register` atau `/login`
- Social media links di footer: **skip untuk sekarang**
- Logo asli HubTalent digunakan, dikonversi ke putih solid via CSS filter

---

## Aturan Desain Global (Anti-AI-Slop)

> [!IMPORTANT]
> Ini aturan wajib, bukan preferensi. Berlaku di SEMUA file yang dimodifikasi.

### Yang Dilarang

| Pola | Kenapa Salah |
|------|-------------|
| Gradient `from-violet-*` / `from-purple-*` / `to-purple-*` di background | Khas AI-generated SaaS template |
| Gradient `from-indigo-900 to-purple-950` di card apapun | Tidak ada di brand HubTalent |
| Background CTA section berwarna ungu solid (`rgba(79,70,229,...)`) | Terlihat seperti clone Vercel/Supabase |
| Emoji di judul section, label, atau bullet feature list | Tidak profesional di platform karir |
| `shadow-xl` + `shadow-2xl` bertumpuk di elemen yang sama | UI terasa plastik dan berat |
| `indigo-*` sebagai warna primary global | Brand logo HubTalent adalah biru-teal, bukan indigo |
| Teks placeholder/dummy yang tidak bermakna | Setiap teks harus real copy |

### Yang Diizinkan

| Elemen | Panduan |
|--------|---------|
| `blue-600` (#2563eb) | Primary action — tombol utama saja |
| Teal dari logo (`#3B9EBF`) | Aksen brand, untuk icon dan highlight |
| `slate-900 / slate-800` | Teks heading, dark card |
| `slate-500 / slate-400` | Body text, caption, placeholder |
| `border-slate-200` (light) / `border-slate-800` (dark) | Card, input, separator |
| `bg-white` (light) / `bg-slate-950` (dark) | Base — tidak ada gradient antar section |
| `rounded-xl` atau `rounded-2xl` | Konsisten di seluruh app |

---

## Bagian 1: Landing Page — Perbaikan

### 1A. Logo — Ganti Globe Icon dengan Logo Asli

**File:** [`app/landing/page.tsx`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/landing/page.tsx)

Logo sudah tersedia di:
- `public/logo.png` — logo lengkap (icon + wordmark "HubTalent"), background putih
- `public/logo_icon.png` — icon saja

**Implementasi di navbar:**
```tsx
// SEBELUM — icon dummy
<Globe className="h-5 w-5 text-white" />
<span className="text-sm font-semibold text-white">HubTalent</span>

// SESUDAH — logo asli, diputihkan via CSS
<Image
  src="/logo.png"
  alt="HubTalent"
  width={130}
  height={36}
  className="h-8 w-auto brightness-0 invert"
/>
```

`brightness-0 invert` mengubah logo PNG berlatar putih menjadi **putih solid elegan** di atas background gelap video. Tidak perlu file terpisah, cukup CSS filter.

> [!WARNING]
> **Case sensitivity:** Ada dua file di `/public`: `logo.png` (lowercase) dan `Logo.png` (capital L). Pilih salah satu — rekomendasi pakai `/logo.png` (lowercase) karena Next.js di Vercel (Linux) case-sensitive. File satunya bisa dihapus.

---

### 1B. FeaturePillars — Hapus AI-Slop, Tombol Fungsional

**File:** [`components/landing/FeaturePillars.tsx`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/landing/FeaturePillars.tsx)

**Yang dihapus:**
- Semua emoji di `tagline` dan `points` (`🚀`, `🤝`, `💡`, `🛠️`, `🤖`, `🎙️`, `📄`, `🗺️`, `💼`, `⚡`, `🎯`)
- Gradient per-card (`from-indigo-500/20`, `from-violet-500/20`, `from-emerald-500/20`)
- `iconBg` warna violet/emerald

**Tombol CTA per pilar — diubah ke preview pages:**

| Pilar | CTA Lama | CTA Baru | Target |
|-------|----------|----------|--------|
| Matchmaking Projek | "Mulai Kolaborasi" → `/projects` | "Lihat Proyek Aktif" → `/preview/projects` | Preview publik |
| AI Career Prep | "Coba AI Coach" → `/jobs?tab=learning-path` | "Lihat Fitur Karir" → `/preview/jobs` | Preview publik |
| Smart Job Aggregator | "Daftarkan Email" → `/register` | "Lihat Lowongan" → `/preview/jobs` | Preview publik |

**Desain card baru (tetap di atas video background):**
- Background: `bg-white/8 backdrop-blur-sm`
- Border: `border-white/15`
- Icon background: `bg-white/10`, icon warna putih
- Tidak ada `from-*/to-*` apapun
- Teks tetap putih, teks secondary `text-white/65`

---

### 1C. FooterCTA — Hapus Ungu

**File:** [`components/landing/FooterCTA.tsx`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/landing/FooterCTA.tsx)

```tsx
// SEBELUM — gradient ungu solid
style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.85) 0%, rgba(124,58,237,0.75) 50%, rgba(67,56,202,0.85) 100%)' }}

// SESUDAH — dark netral, konsisten dengan video background
className="bg-slate-950/80 border border-white/10 backdrop-blur-sm rounded-3xl"
```

Tombol "Buat Akun" dan copy tetap sama. Hanya background yang diubah.

---

### 1D. HowItWorks — Hapus Emoji dari Judul

**File:** [`components/landing/HowItWorks.tsx`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/landing/HowItWorks.tsx)

```tsx
// SEBELUM
<h2>💡 3 Langkah Mudah Memulai di HubTalent</h2>

// SESUDAH
<h2>3 Langkah Mudah Memulai di HubTalent</h2>
```

---

### 1E. Footer Social Media — Skip

Link Instagram/Twitter/Globe di `app/landing/page.tsx` baris 92-94 biarkan sementara — akan diisi saat akun social media siap.

---

## Bagian 2: Halaman Preview Publik (BARU)

> [!IMPORTANT]
> **Tidak ada modifikasi apapun** pada `middleware.ts`, `app/(main)/projects`, `app/(main)/jobs`, atau halaman yang memerlukan auth. Preview adalah halaman sepenuhnya baru.

### 2A. Struktur Route Group

```
app/
├── (public)/                     ← route group baru (tanpa layout tambahan)
│   ├── preview/
│   │   ├── projects/
│   │   │   └── page.tsx          ← /preview/projects
│   │   └── jobs/
│   │       └── page.tsx          ← /preview/jobs
```

**Tambahkan satu baris di `middleware.ts`:**
```typescript
const publicPaths = [
  // ... paths yang sudah ada ...
  '/preview',   // ← tambahkan ini
];
```

---

### 2B. `/preview/projects` — Preview Hub Proyek

**Data:**
- Fetch via **Server Component** menggunakan `getAdminClient()` dari `@/lib/adminClient` (bukan anon key — service role aman di server component)
- Filter: `is_public = true` dan `cohort_id IS NULL` (proyek publik global)
- Limit: 12 proyek terbaru
- Kolom `is_public` sudah ada (ditambah di `migration_009_project_cv_updates.py`)

> [!WARNING]
> **Belum ada endpoint `GET /api/projects`.** Saat ini hanya ada `POST`. Jangan buat API route baru — **fetch langsung dari Server Component** dengan `getAdminClient()`. Tidak ada data credential yang bocor ke client.
>
> **Reuse komponen `ProjectCard`:** Gunakan `components/projects/ProjectCard.tsx` yang sudah ada dengan props yang sesuai, jangan duplikasi kode card. Cukup bikin wrapper sederhana yang meng-override onClick dan CTA.

**Layout halaman:**
```
┌─────────────────────────────────────────┐
│  Navbar (logo + tombol Login / Daftar)  │
├─────────────────────────────────────────┤
│  Banner: "Bergabung untuk melamar dan   │
│  memulai kolaborasi"  [Daftar Gratis →] │
├─────────────────────────────────────────┤
│  Grid Proyek (read-only)                │
│  - Card: title, deskripsi, skill, owner │
│  - Tombol "Lamar" → /register           │
│  - Max 12 card, tanpa pagination        │
├─────────────────────────────────────────┤
│  Section CTA bawah                      │
│  "Punya ide proyek? Daftar dan mulai"   │
│  [Buat Akun →]  [Masuk →]              │
└─────────────────────────────────────────┘
```

**Desain:**
- Background: `bg-slate-50 dark:bg-slate-950`
- Card proyek: `bg-white dark:bg-slate-900`, border `border-slate-200 dark:border-slate-800`
- Tidak ada gradient, tidak ada indigo
- Tombol "Lamar Proyek" di setiap card: outlined, klik → redirect `/register?from=preview-projects`

---

### 2C. `/preview/jobs` — Preview Portal Karir

**Dua section:**

#### Section 1: Lowongan Pekerjaan (Fully Visible)
- Fetch dari `/api/jobs` (tidak butuh auth — sudah diverifikasi, pakai service role)
- **Hanya tampilkan yang `is_active = true`** — filter di frontend atau tambahkan query param `?active=true` ke API. Saat ini `/api/jobs` tidak memfilter status lowongan.
- Tampilkan card dengan: title, perusahaan, platform badge, kategori
- Expand detail: deskripsi, job desk, requirements
- Tombol "Lamar" → link eksternal (`job.job_url`) — ini **boleh tanpa login** karena link ke platform luar
- Search & filter sederhana (tanpa pagination penuh — tampilkan 8 lowongan)

#### Section 2: Fitur AI (Locked Preview)
Dua card terkunci dengan blur effect:

**Card Learning Path AI:**
```
┌─────────────────────────────────┐
│  [blur] Roadmap Frontend Dev    │  ← content blurred
│  [blur] Fase 1: HTML/CSS...     │
│  [blur] Fase 2: React...        │
│ ─────────────────────────────── │
│  🔒 Login untuk akses fitur ini │
│  [Daftar Gratis]  [Masuk]      │
└─────────────────────────────────┘
```

**Card CV Creator AI:**
```
┌─────────────────────────────────┐
│  [blur] CV bullet suggestions   │
│  [blur] • Memimpin tim 5 orang  │
│  [blur] • Mengurangi bug 30%    │
│ ─────────────────────────────── │
│  🔒 Login untuk akses fitur ini │
│  [Daftar Gratis]  [Masuk]      │
└─────────────────────────────────┘
```

**Layout halaman:**
```
┌─────────────────────────────────────────┐
│  Navbar (logo + Login / Daftar)         │
├─────────────────────────────────────────┤
│  Banner: "Login untuk akses Learning    │
│  Path & CV Creator AI"  [Daftar →]     │
├─────────────────────────────────────────┤
│  Tab: Lowongan | Fitur AI               │
├─────────────────────────────────────────┤
│  [Tab Lowongan] Grid lowongan (8 card)  │
│  OR                                     │
│  [Tab Fitur AI] 2 locked cards          │
├─────────────────────────────────────────┤
│  CTA bawah: [Daftar Gratis] [Masuk]    │
└─────────────────────────────────────────┘
```

---

### 2D. Komponen Shared: `PreviewNavbar`

Kedua halaman preview menggunakan navbar yang sama:

```tsx
// components/preview/PreviewNavbar.tsx
export function PreviewNavbar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        <Link href="/landing">
          <Image src="/logo.png" alt="HubTalent" width={120} height={34} className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Masuk</Link>
          <Link href="/register" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

---

## Bagian 3: Home Feed — Bersihkan AI-Slop

**File:** [`components/feed/HomeFeedClient.tsx`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/feed/HomeFeedClient.tsx)

### Penggantian Warna (Global Replace)

```diff
# Tombol primary action
- bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40
+ bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/40

# Border accent  
- border-indigo-500/20
+ border-slate-200 dark:border-slate-700

# Gradient card AI Wawasan (L569)
- bg-gradient-to-r from-slate-900/90 to-indigo-950/80
+ bg-slate-900

# Gradient card Cohort (L1168)
- bg-gradient-to-br from-indigo-900/50 to-purple-950/40
+ bg-slate-900/60

# Modal glow effect (L1184)
- shadow-[0_0_50px_rgba(99,102,241,0.15)]
+ shadow-lg

# Text link hover
- hover:text-indigo-650 dark:hover:text-indigo-300
+ hover:text-blue-600 dark:hover:text-blue-400

# Badge active/liked state
- text-indigo-600 dark:text-indigo-400
+ text-blue-600 dark:text-blue-400
```

### Hapus & Ganti Tambahan

| Lokasi | Yang Dihapus / Diganti |
|--------|-------------|
| L705 | Emoji `🚀` dari label "Proyek Aktif" |
| L1184 | `shadow-[0_0_50px_rgba(99,102,241,0.15)]` glow violet |
| Card Cohort (L641-689) | `liquid-glass-border border-indigo-500/20` → `border-slate-200 dark:border-slate-700` |
| Badge aktivitas (L777-778) | `bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20` → `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700` |
| AI Widget border (L867) | Border `border-indigo-500/20` → `border-slate-200 dark:border-slate-700` |
| Tombol "Undang" (L681-684) | `bg-indigo-600 hover:bg-indigo-500` → `bg-blue-600 hover:bg-blue-500` |
| Tombol "Bagikan" (L741-747) | `bg-indigo-600 hover:bg-indigo-500` → `bg-blue-600 hover:bg-blue-500` |
| Tombol komentar (L938-943) | `bg-indigo-600 hover:bg-indigo-500` → `bg-blue-600 hover:bg-blue-500` |
| Komposer Textarea focus | `focus:border-indigo-500` → `focus:border-blue-500` |

> [!NOTE]
> **Navbar.tsx juga punya `indigo-*`** — akan dibersihkan di iterasi terpisah agar tidak membengkak. Prioritas: HomeFeedClient dulu.

---

## Bagian 4: Urutan Eksekusi

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Ganti Globe icon → Logo asli (putih via filter) | `app/landing/page.tsx` | Pending |
| 2 | Perbaiki FooterCTA (hapus ungu → slate-950) | `components/landing/FooterCTA.tsx` | Pending |
| 3 | Bersihkan FeaturePillars (hapus emoji, gradient, update href ke /preview) | `components/landing/FeaturePillars.tsx` | Pending |
| 4 | Hapus emoji di HowItWorks | `components/landing/HowItWorks.tsx` | Pending |
| 5 | Tambah `/preview` ke `publicPaths` | `middleware.ts` | Pending |
| 6 | Buat `PreviewNavbar` component | `components/preview/PreviewNavbar.tsx` | Pending |
| 7 | Buat halaman `/preview/projects` | `app/(public)/preview/projects/page.tsx` | Pending |
| 8 | Buat halaman `/preview/jobs` | `app/(public)/preview/jobs/page.tsx` | Pending |
| 9 | Ganti indigo → blue di HomeFeedClient | `components/feed/HomeFeedClient.tsx` | Pending |
| 10 | Hapus gradient card, glow, & border indigo di HomeFeedClient | `components/feed/HomeFeedClient.tsx` | Pending |
| 11 | Hapus file `public/Logo.png` (capital L) — seragamkan ke `logo.png` | `public/Logo.png` | Pending |

> **Catatan:** Setelah implementasi, jalankan `npm run build` untuk verifikasi tidak ada error. Semua enhancement sudah termasuk di task #2, #7, #8, #9, #10, #11 di atas.

---

## Catatan Teknis

| Pertanyaan | Jawaban |
|------------|---------|
| Kolom `is_public` di tabel `projects` | Ada (ditambah migration_009). Default `false`. Proyek publik: `is_public = true`. |
| `/api/jobs` butuh auth? | Tidak. Menggunakan service role key di server, tidak cek user header. Bisa dipakai dari halaman preview. |
| Logo filter di dark background | `brightness-0 invert` → mengubah logo menjadi putih solid. Elegant. |
| Social media footer | Skip — isi nanti saat akun siap. |
| `(public)` route group | Tidak butuh `layout.tsx` sendiri — inherits dari root layout. Hanya memastikan route tidak tercover middleware. |
