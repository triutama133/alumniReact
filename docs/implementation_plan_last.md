# Rencana Implementasi Lengkap: Indonesia Talent Hub v2 — Full MVP Roadmap

> **Untuk:** Tim Backend (Next.js API Routes + FastAPI) & Tim Frontend (React/Next.js)  
> **Tujuan:** Panduan teknis menyeluruh yang mencakup pengujian fitur, perbaikan eksisting, fitur baru, dan hardening keamanan siber aplikasi.

---

## ✅ Status Perbaikan Cepat (Selesai)
- [x] Ganti label "Total Alumni" → "Total Talent" di [HomeFeedClient.tsx#L484](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/feed/HomeFeedClient.tsx#L484)

## 🚨 Perbaikan Kritis Segera (Hasil Audit AI Endpoint)
- [x] Tambah `GEMINI_API_KEY` ke `.env.local` Next.js — CV Suggest saat ini **selalu gagal 500**
- [x] Buat endpoint `POST /learning_path` di FastAPI `main.py` — belum ada sama sekali
- [x] Perbaiki URL hardcode `http://localhost:8000/learning_path` di `learning-path/route.ts` → pakai env var
- [x] Pastikan tabel `user_checklists` sudah ada di database Supabase (migration `database/migration_010_user_checklists.sql` sudah disiapkan)

**Catatan implementasi (2026-08-04):**
- Endpoint AI FastAPI sudah memakai dispatcher multi-provider (`gemini`/`deepseek`) dengan fallback otomatis.
- Endpoint `cv-suggest` Next.js sudah memakai fallback provider yang sama.
- Migration file `database/migration_010_user_checklists.sql` sudah dibuat, namun eksekusi SQL ke Supabase masih perlu dilakukan manual.

---

## 🧠 Bagian A: Integrasi Multi-Provider AI (Gemini & DeepSeek — Fleksibel & Failover)

### Konsep
Backend harus bisa beralih antara **Google Gemini** dan **DeepSeek** tanpa mengubah kode. Cukup dengan mengubah satu variabel di `.env`. Jika provider utama gagal (token habis / error `429`), sistem secara otomatis beralih ke provider cadangan.

### A1. Variabel Lingkungan (`.env`)
```ini
# Provider utama: 'gemini' atau 'deepseek'
LLM_PROVIDER=gemini

GEMINI_API_KEY=REDACTED
GEMINI_MODEL=gemini-1.5-flash

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
```

### A2. Implementasi Backend FastAPI — Abstraksi `call_llm_service` ([main.py](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni%20AI/alumni_ai/main.py))

Tambahkan fungsi terpusat berikut **di atas** semua endpoint (`/rekomendasi`, `/wawasan`, `/karir`, `/proyek_rekomendasi`). Setiap endpoint cukup memanggil `await call_llm_service(prompt)` dan hapus blok pemanggilan Gemini yang ada sekarang.

```python
import logging

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

async def call_gemini(prompt: str, temperature: float = 0.7) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature, "maxOutputTokens": 2500}
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        res = await client.post(url, headers={"Content-Type": "application/json"}, json=body)
        res.raise_for_status()
        return res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

async def call_deepseek(prompt: str, temperature: float = 0.7) -> str:
    url = "https://api.deepseek.com/chat/completions"
    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 2000
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        res = await client.post(url, headers={"Content-Type": "application/json", "Authorization": f"Bearer {DEEPSEEK_API_KEY}"}, json=body)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()

async def call_llm_service(prompt: str, temperature: float = 0.7) -> str:
    """
    Dispatcher LLM dengan failover otomatis.
    Mencoba provider utama (LLM_PROVIDER), jika gagal → coba provider cadangan.
    """
    providers = {
        "gemini": call_gemini,
        "deepseek": call_deepseek
    }
    primary = LLM_PROVIDER
    secondary = "deepseek" if primary == "gemini" else "gemini"

    try:
        logging.info(f"[LLM] Memanggil provider utama: {primary}")
        return await providers[primary](prompt, temperature)
    except Exception as e1:
        logging.warning(f"[LLM] Provider utama {primary} gagal: {e1}. Beralih ke {secondary}...")
        try:
            return await providers[secondary](prompt, temperature)
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Semua provider LLM gagal. [{primary}: {e1}] [{secondary}: {e2}]")
```

**Catatan untuk tim backend:** Setelah fungsi ini ditambahkan, ganti semua blok `async with httpx.AsyncClient...` di dalam endpoint `/rekomendasi`, `/wawasan`, `/karir`, `/proyek_rekomendasi` menjadi satu baris:
```python
content = await call_llm_service(prompt)
```

### A3. Implementasi Next.js — Route Handler cv-suggest ([route.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/ai/cv-suggest/route.ts))
Terapkan pola yang sama dengan dua fungsi helper `callGemini` dan `callDeepseek`, dan fallback saat provider utama error.

**Status:** ✅ Sudah diimplementasi.

---

## 🔐 Bagian B: Keamanan Siber (Cyber Security Hardening)

> [!CAUTION]
> Saat ini aplikasi **belum memiliki** rate limiting, CSP header, atau proteksi input injection. Ini adalah risiko kritis yang wajib diselesaikan sebelum produksi.

### B1. Rate Limiting & Brute Force Protection
**Target:** Mencegah serangan brute force pada `/api/login`, `/api/register`, dan endpoint AI.

**Implementasi di [middleware.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/middleware.ts):**

Gunakan library `@upstash/ratelimit` + Redis (gratis tier Upstash) atau implementasi sederhana in-memory:
```typescript
// Tambahkan di atas middleware(), sebelum logika auth
const IP_RATE_LIMIT_MAP = new Map<string, {count: number; resetAt: number}>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 menit
const RATE_LIMITS: Record<string, number> = {
  '/api/login': 5,      // maks 5 percobaan/menit
  '/api/register': 3,   // maks 3 register/menit
  '/api/ai': 10,        // maks 10 panggilan AI/menit
};

function checkRateLimit(ip: string, path: string): boolean {
  const limit = Object.entries(RATE_LIMITS).find(([key]) => path.startsWith(key))?.[1];
  if (!limit) return true; // tidak ada batasan untuk path ini
  
  const now = Date.now();
  const key = `${ip}:${path}`;
  const record = IP_RATE_LIMIT_MAP.get(key);
  
  if (!record || now > record.resetAt) {
    IP_RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}
```

Tambahkan pengecekan sebelum proses autentikasi di middleware:
```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
if (!checkRateLimit(ip, currentPath)) {
  return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 });
}
```

**Status:** ✅ Sudah diimplementasi di middleware, ditambah hardening di level endpoint login/register (per IP + per kombinasi IP/email).

### B2. HTTP Security Headers (CSP & HSTS)
**Target:** Mencegah XSS, clickjacking, dan serangan injeksi konten.

**Tambahkan di [middleware.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/middleware.ts)** pada blok `NextResponse.next()` sebelum `return response`:
```typescript
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
response.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: *.supabase.co",
    "connect-src 'self' *.supabase.co *.supabase.in generativelanguage.googleapis.com api.deepseek.com localhost:8000",
    "media-src 'self' d8j0ntlcm91z4.cloudfront.net blob:",
    "frame-ancestors 'none'",
  ].join('; ')
);
```

**Status:** ✅ Sudah diimplementasi. CSP diperbarui untuk mendukung Cloudflare Turnstile.

### B3. Input Sanitization & SQL Injection Prevention ✅ **SUDAH DIIMPLEMENTASI**
**Target:** Mencegah injeksi data berbahaya dari form input pengguna.

**Untuk Tim Backend (Next.js Route Handlers):**
- Selalu gunakan parameterisasi query dari Supabase SDK (sudah dilakukan) — **jangan** pernah interpolasi langsung string ke query SQL.
- Tambahkan sanitasi HTML untuk field konten postingan dan deskripsi proyek. Install library `sanitize-html`:
  **Status:** ✅ `sanitize-html` + `@types/sanitize-html` diinstall. Helper `lib/sanitize.ts` dibuat & diterapkan di `POST /api/posts`, komentar, dan pesan chat.
  ```bash
  npm install sanitize-html @types/sanitize-html
  ```
  Gunakan di API route sebelum menyimpan ke database:
  ```typescript
  import sanitizeHtml from 'sanitize-html';
  const cleanContent = sanitizeHtml(rawContent, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br'],
    allowedAttributes: { 'a': ['href'] }
  });
  ```

**Untuk Tim Frontend (Form Inputs):**
- Gunakan validasi Zod (sudah ada di `/api/cohorts`) secara konsisten di **semua** route handler, termasuk `/api/complete-profile`, `/api/posts`, dan `/api/projects`.
- Jangan pernah merender konten `dangerouslySetInnerHTML` tanpa sanitasi.

### B4. Proteksi Endpoint AI dari Prompt Injection
**Target:** Mencegah pengguna jahat memanipulasi prompt AI untuk mengekspos data sensitif.

**Di FastAPI ([main.py](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni%20AI/alumni_ai/main.py))**, tambahkan fungsi sanitasi input sebelum membangun prompt:
```python
import re

def sanitize_ai_input(text: str, max_length: int = 500) -> str:
    """Membersihkan input pengguna sebelum disertakan ke dalam prompt LLM."""
    if not text:
        return ""
    # Hapus karakter kontrol dan potensi injeksi prompt
    text = re.sub(r'[\x00-\x1f\x7f]', '', text)
    text = text.replace('SYSTEM:', '').replace('IGNORE PREVIOUS', '').replace('---', '')
    return text[:max_length].strip()
```

  **Status:** ✅ Sudah diimplementasi pada FastAPI.

  ### B7. Proteksi Captcha Login/Register (Cloudflare Turnstile)
  **Target:** Mengurangi bot signup/login dan credential stuffing.

  - [x] Verifikasi Turnstile server-side di `POST /api/login`
  - [x] Verifikasi Turnstile server-side di `POST /api/register`
  - [x] Widget Turnstile ditambahkan ke halaman login/register
  - [x] Route publik `GET /api/security/turnstile` untuk distribusi `siteKey`

  **Catatan:** Untuk email service tahap berikutnya, provider diganti dari Resend ke Brevo sesuai keputusan terbaru.

  ### B8. Advanced Auth Lockout & Security Telemetry
  **Target:** Proteksi tetap aktif lintas restart/deploy dan menyediakan jejak audit insiden auth.

  - [x] Login/register menulis event keamanan ke tabel `auth_security_events` (graceful fallback jika tabel belum ada).
  - [x] Login/register memakai lockout state persisten di tabel `auth_security_state` (di samping proteksi in-memory).
  - [x] Migration SQL disiapkan: `database/migration_011_auth_security.sql`.
  - [x] Apply migration `migration_011_auth_security.sql` ke Supabase production/staging.

### B5. Proteksi CSRF
**Status saat ini:** Cookie menggunakan `SameSite=Lax` yang memberikan proteksi CSRF dasar. Tidak diperlukan token CSRF terpisah selama atribut ini dipertahankan.

**Verifikasi:** Pastikan cookie `auth_token` di [login/route.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/login/route.ts#L104) selalu menyertakan `sameSite: 'lax'` dan `secure: true` di lingkungan produksi.

### B6. Secret & Environment Variable Audit
**Checklist untuk Tim Backend:**
- [ ] `JWT_SECRET` minimal 32 karakter acak (gunakan `openssl rand -base64 32`)
- [ ] `INTERNAL_API_KEY` minimal 32 karakter acak
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **tidak pernah** dikirim ke sisi client (tidak ada prefix `NEXT_PUBLIC_`)
- [ ] File `.env.local` ada di `.gitignore` dan tidak pernah di-commit ke repository
- [ ] Rotate semua key di produksi setiap 90 hari

---

## 🔑 Bagian C: Fitur Baru — Lupa Password (Forgot Password Flow)

### C1. Gambaran Alur
1. Pengguna klik "Lupa Password" → memasukkan email di form.
2. Server generate token reset unik (UUID v4) dengan masa berlaku 15 menit, simpan ke database.
3. Server kirim email berisi link reset ke pengguna.
4. Pengguna klik link → masukkan password baru → server validasi token dan perbarui password.

### C2. Perubahan Database
**Tabel baru `password_reset_tokens`:**
```sql
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_reset_tokens_token ON public.password_reset_tokens(token);
```

**Status:** ✅ Migration disiapkan di `database/migration_012_password_reset.sql`.
**Action:** Jalankan migration 012 di Supabase SQL Editor.

### C3. API Endpoints Baru

**`POST /api/forgot-password`** — Memicu pengiriman email reset:
```typescript
// Validasi email → cek di tabel 'user' → generate UUID token →
// insert ke password_reset_tokens dengan expires_at = NOW() + 15 menit →
// kirim email via Resend (atau Nodemailer) dengan link:
// https://[domain]/reset-password?token=[token]
// PENTING: Selalu return 200 OK meski email tidak ditemukan (cegah user enumeration)
```

**Status:** ✅ Sudah diimplementasi di `app/api/forgot-password/route.ts`.

**`POST /api/reset-password`** — Memproses password baru:
```typescript
// Terima { token, newPassword } →
// Cari token di tabel password_reset_tokens (belum digunakan & belum kadaluarsa) →
// Bcrypt hash password baru → update user.password_hash →
// Tandai token sebagai digunakan (used_at = NOW()) →
// Return 200 OK
```

**Status:** ✅ Sudah diimplementasi di `app/api/reset-password/route.ts`.

### C4. Halaman Frontend Baru

**[NEW] `app/(auth)/forgot-password/page.tsx`:** Form satu field (email) + tombol kirim. Tampilkan pesan sukses generik: *"Jika email terdaftar, tautan reset telah dikirimkan."*

**[NEW] `app/(auth)/reset-password/page.tsx`:** Form dua field (password baru + konfirmasi) dengan validasi kekuatan password. Baca `?token=` dari URL dan kirim ke endpoint reset.

**Status:** ✅ Keduanya sudah dibuat dan terhubung ke API.

### C5. Layanan Pengiriman Email
Install dan konfigurasi **Brevo**:
```bash
# Tidak perlu SDK tambahan; gunakan HTTP API Brevo v3 langsung via fetch
```
Tambahkan ke `.env`:
```ini
BREVO_API_KEY=your_brevo_api_key
FROM_EMAIL=noreply@indonesiatalenthub.id
APP_URL=https://your-domain.example
```

**Status:** ✅ Helper email Brevo dibuat di `lib/email.ts` dan dipakai oleh endpoint forgot password.

### C6. Hardening Lanjutan Forgot/Reset (Security)
- [x] Tambah rate-limit khusus `POST /api/forgot-password` dan `POST /api/reset-password` di middleware.
- [x] Tambah lockout persisten + in-memory khusus scope `forgot_password` dan `reset_password` pada route handler.
- [x] Invalidasi semua sesi aktif setelah password reset melalui `auth_session_versions` + claim `auth_version` di JWT.
- [x] Increment session version juga saat password diubah dari account settings.
- [x] Migration SQL disiapkan: `database/migration_013_auth_session_versions.sql`.
- [ ] Apply migration `migration_013_auth_session_versions.sql` ke Supabase production/staging.

---

## 🏠 Bagian D: Peningkatan Home Feed — Lebih Hidup & Insightful

### D1. Widget Statistik Real (bukan data statis) ✅ **SUDAH DIIMPLEMENTASI**
**Masalah saat ini:** Widget "Sinergi Jejaring" di sidebar menampilkan angka statis hardcoded ("115 Terhubung", "63.5% Dominasi").
**Status:** ✅ `GET /api/stats/network` dibuat (total_talent, distribusi_aktivitas, total_proyek_aktif, top_talents) dengan cache 5 menit. `HomeFeedClient.tsx` sudah memakai data real + menampilkan 3 Talenta Terpopuler.

**[NEW] API Endpoint `GET /api/stats/network`** — Mengambil statistik jejaring secara dinamis:
```typescript
// Query ke alumni_db:
// - COUNT(*) → total_talent
// - GROUP BY aktivitas → distribusi_aktivitas (objek { pekerja: 45, bisnis: 23, ... })
// - COUNT proyek aktif → total_proyek_aktif
// Cache response selama 5 menit menggunakan header Cache-Control atau in-memory cache
```

**Frontend:** Update [HomeFeedClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/feed/HomeFeedClient.tsx) untuk fetch data dari `/api/stats/network` saat mount (`useEffect`) dan render dengan animasi counter angka.

### D2. Widget Wawasan AI Personal (Berbasis Data Real)
**Masalah saat ini:** Wawasan AI di beranda sudah ada, namun perlu diperkaya secara visual.

**Peningkatan:**
- Tambahkan **Progress Ring** di atas tombol "Dapatkan Wawasan AI" yang menunjukkan persentase kesiapan profil pengguna (berapa % field profil terisi).
- Tampilkan **3 rekomendasi proyek kolaborasi terpopuler** berdasarkan kecocokan skill, sebagai *teaser* sebelum pengguna mengklik analisis penuh.

### D3. Feed Aktivitas Komunitas Real-time ✅ **SUDAH DIIMPLEMENTASI**
**Peningkatan komponen postingan feed:**
- Tambahkan skeleton loading yang animatif saat memuat kiriman baru.
- Tambahkan badge **"Baru"** pada postingan yang diunggah dalam 2 jam terakhir.
- Tambahkan **tombol Suka (👍) dan Komentar (💬)** pada setiap postingan.
**Status:** ✅ API `POST /api/posts/[id]/like` + `GET/POST /api/posts/[id]/comments` dibuat. UI like persisten (bukan simulasi), komentar kolapsibel, badge "Baru" diterapkan. Tabel `post_likes` & `post_comments` dibuat di migration 014.
  - **[NEW] API `POST /api/posts/[id]/like`**: Toggle like pada postingan.
  - **[NEW] API `GET & POST /api/posts/[id]/comments`**: Membaca dan menambahkan komentar.
  - **Tabel database `post_likes`**: `(post_id, user_id, created_at)` — unik per pasangan.
  - **Tabel database `post_comments`**: `(id, post_id, user_id, content, created_at)`.

### D4. Sidebar Rekomendasi Talenta Dinamis
**Peningkatan:**
- Ganti placeholder sidebar dengan daftar **"3 Talenta Terpopuler Minggu Ini"** berdasarkan jumlah proyek dan view profil.
- **[NEW] API `GET /api/stats/top-talents`**: Mengambil 3 profil talenta aktif teratas.

---

## 💼 Bagian E: Manajemen Pelamar Proyek (Project Applicant Review)

### E1. API Endpoints Baru ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ `GET /api/projects/[id]/applications` (validasi ownership + JOIN alumni_db) dan `POST /api/projects/applications/review` (accept/reject + notifikasi ke pelamar) sudah dibuat.
**`GET /api/projects/[id]/applications`** *(Backend harus memvalidasi bahwa requestor adalah owner)*:
```typescript
// 1. Baca x-user-id dari header JWT
// 2. Fetch project dari DB → pastikan project.owner_id === userId
// 3. Fetch semua project_applications untuk project ini dengan JOIN ke alumni_db
//    (ambil: id, status, role, user_id, nama_lengkap, domisili_kota_kabupaten, skill_gabungan)
// 4. Return array aplikasi
```

**`POST /api/projects/applications/review`**:
```typescript
// Body: { applicationId: number, action: 'accept' | 'reject' }
// 1. Validasi ownership proyek
// 2. Update project_applications SET status = (action === 'accept' ? 'accepted' : 'rejected')
// 3. Jika accepted → INSERT ke notifications tabel untuk pelamar (lihat Bagian F)
```

### E2. Perubahan Frontend ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Tab **"Kelola Pelamar"** ditambahkan (hanya owner) dengan kartu pelamar + tombol Terima/Tolak + konfirmasi.
**[MODIFY] [ProjectDetailClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/projects/ProjectDetailClient.tsx):**
- Tampilkan tab baru **"Kelola Pelamar"** hanya ketika `isOwner === true`.
- Setiap kartu pelamar menampilkan: nama, aktivitas, kota, skill, dan status lamaran.
- Dua tombol: **Terima** (hijau emerald) dan **Tolak** (merah rose), dengan konfirmasi dialog sebelum eksekusi.

---

## 🔔 Bagian F: Sistem Notifikasi In-App

### F1. Database (DDL) ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Tabel `notifications` dibuat di `database/migration_014_community_features.sql` (sesuai DDL).
```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  -- tipe valid: 'post_like' | 'post_comment' | 'project_apply' | 'project_status' | 'cohort_invite'
  related_id BIGINT DEFAULT NULL, -- ID post/project yang relevan
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
```

### F2. API Endpoints ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ `GET /api/notifications`, `POST /api/notifications/read`, `POST /api/notifications/read-all` semua sudah dibuat.
- **`GET /api/notifications`**: Ambil 20 notifikasi terbaru milik user. Sertakan total `unread_count`.
- **`POST /api/notifications/read`**: Body `{ notificationId: number }`. Tandai `is_read = true`.
- **`POST /api/notifications/read-all`**: Tandai semua notifikasi user sebagai sudah dibaca.

### F3. Komponen Frontend ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Bell notifikasi di Navbar dengan badge unread, dropdown daftar notifikasi + relative time, tombol "Tandai semua dibaca", dan navigasi per tipe.
**[MODIFY] [Navbar.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/layout/Navbar.tsx):**
- Tambahkan tombol `🔔` di sebelah avatar pengguna.
- Badge merah dengan angka `unread_count` (hilang saat angka = 0).
- Klik tombol → dropdown daftar notifikasi dengan timestamp relatif ("2 menit lalu").
- Klik notifikasi → navigasi ke halaman terkait + tandai sebagai dibaca.

---

## ☁️ Bagian G: Integrasi Media (Supabase Storage)

### G1. Konfigurasi Bucket Supabase
Di Supabase Dashboard → Storage, buat:
- Bucket **`feed-media`** (publik) — untuk gambar/video postingan.
- Bucket **`user-documents`** (privat) — untuk PDF CV dan portfolio.

### G2. Perubahan Frontend
**[MODIFY] Composer Postingan di [HomeFeedClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/feed/HomeFeedClient.tsx):**
```typescript
// Tambahkan input file + preview gambar
// Saat submit, upload file terlebih dahulu:
const { data } = await supabase.storage
  .from('feed-media')
  .upload(`${userId}/${Date.now()}_${file.name}`, file);
// Simpan URL publik ke kolom media_url di tabel posts_feed
```

---

## 📊 Bagian H: Dasbor Analitik Cohort Admin ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Halaman `/cohort-admin/analytics` dibuat dengan total alumni, distribusi aktivitas, top domisili, top keahlian, grafik angkatan, dan insight otomatis dari `/api/analytics`.

**[NEW] `app/(main)/cohort-admin/analytics/page.tsx`:**
- **Distribusi aktivitas** anggota (diagram pai/bar menggunakan `recharts`).
- **Tabel domisili** — kota mana yang paling banyak anggotanya.
- **Tren proyek** — jumlah proyek dibuat vs selesai per bulan.
- **Ekspor CSV** — download daftar profil anggota cohort.

---

## 💬 Bagian J: In-App Chat Antar Pengguna (Supabase Realtime)

### Arsitektur & Mengapa Bisa di Vercel

> **Pertanyaan:** Apakah chat real-time bisa di-deploy di Vercel?
> **Jawaban: YA** — karena kita menggunakan **Supabase Realtime** sebagai WebSocket layer.
> Vercel serverless tidak mendukung WebSocket persisten, namun Supabase menyediakan infrastruktur Realtime terpisah yang dapat disubscribe oleh browser secara langsung menggunakan Supabase JS client. Next.js di Vercel hanya bertugas sebagai API dan SSR — koneksi WebSocket-nya ditangani sepenuhnya oleh Supabase.

```
┌─────────────────────────────────────┐
│         Browser Pengguna A          │
│  supabase.channel('room:123')       │──── WebSocket ──▶  Supabase Realtime
│  .on('broadcast', handler)          │◀─── WebSocket ───  (server terpisah)
└─────────────────────────────────────┘                            │
                                                                   │
┌─────────────────────────────────────┐              INSERT ke tabel
│         Browser Pengguna B          │            public.messages
│  supabase.channel('room:123')       │──── WebSocket ──▶  Supabase Realtime
│  .send({ type: 'broadcast', ... })  │◀─── WebSocket ───  (broadcast ke semua subscriber)
└─────────────────────────────────────┘
         │
         │ REST POST /api/messages (menyimpan ke DB)
         ▼
    Vercel Serverless (Next.js API Route)
         │
         ▼
    Supabase PostgreSQL (tabel messages)
```

### J1. Database — DDL Tabel Chat ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Tabel `conversations`, `conversation_participants`, `messages` + Realtime dibuat di `database/migration_014_community_features.sql`.
```sql
-- Migration: migration_013_chat.sql

-- Tabel percakapan (1-on-1 atau group)
CREATE TABLE IF NOT EXISTS public.conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' | 'group'
  name VARCHAR(255) DEFAULT NULL,             -- hanya untuk group
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peserta percakapan
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Pesan
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES public.user(id),
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'text', -- 'text' | 'image' | 'file'
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_participants_user ON public.conversation_participants(user_id);

-- Aktifkan Supabase Realtime pada tabel messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### J2. API Endpoints (Next.js Route Handlers) ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ `GET/POST /api/conversations` + `GET/POST /api/conversations/[id]/messages` sudah dibuat dengan validasi kepesertaan, sanitasi, last_read_at, unread_count, dan notifikasi.

**`GET /api/conversations`** — Ambil daftar percakapan aktif milik user:
```typescript
// JOIN conversation_participants → conversations
// Untuk setiap percakapan, ambil pesan terakhir + jumlah pesan belum dibaca
// (messages WHERE created_at > last_read_at AND sender_id != userId)
// Return: [{ id, type, name, participants[], lastMessage, unreadCount }]
```

**`POST /api/conversations`** — Mulai percakapan baru:
```typescript
// Body: { targetUserId: number }
// 1. Cek apakah percakapan direct antara userId dan targetUserId sudah ada
// 2. Jika belum: INSERT conversations (type='direct') → INSERT 2 baris conversation_participants
// 3. Return: { conversationId }
```

**`GET /api/conversations/[id]/messages`** — Ambil riwayat pesan (dengan pagination):
```typescript
// Query params: ?before=<message_id>&limit=50
// Validasi: user harus peserta percakapan ini
// Update last_read_at untuk user ini
// Return: pesan terurut dari terlama ke terbaru
```

**`POST /api/conversations/[id]/messages`** — Kirim pesan baru:
```typescript
// Body: { content: string, contentType?: 'text' | 'image' }
// 1. Sanitasi konten (hapus HTML berbahaya)
// 2. INSERT ke tabel messages
// 3. Supabase Realtime otomatis mem-broadcast INSERT ini ke semua subscriber channel
// Return: { messageId, createdAt }
```

### J3. Implementasi Frontend Real-time ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Halaman `/messages` + `components/chat/ChatWindow.tsx` dibuat. Sidebar percakapan, bubble chat, unread badge, subscribe Supabase Realtime (pesan muncul real-time tanpa refresh).

**[NEW] `app/(main)/messages/page.tsx`** — Halaman chat utama:
- Sidebar kiri: daftar percakapan + indikator pesan belum dibaca (badge angka merah)
- Area kanan: thread pesan aktif dengan bubble chat
- Input pesan + tombol kirim di bagian bawah

**[NEW] `components/chat/ChatWindow.tsx`** — Komponen inti chat dengan Supabase Realtime:
```typescript
'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

export function ChatWindow({ conversationId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const supabase = createClient(...);

  useEffect(() => {
    // 1. Load riwayat pesan via REST
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(setMessages);

    // 2. Subscribe ke Supabase Realtime untuk pesan baru
    const channel = supabase
      .channel(`room:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      })
      .subscribe();

    return () => supabase.removeChannel(channel); // cleanup
  }, [conversationId]);

  const sendMessage = async (content) => {
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    // Pesan akan muncul via Realtime subscription, tidak perlu setState manual
  };

  // ... render bubble chat
}
```

### J4. Integrasi dengan Fitur Platform
- Tambahkan tombol **"💬 Kirim Pesan"** di halaman profil pengguna dan kartu hasil pencarian talenta.
- Tambahkan notifikasi ke tabel `notifications` saat ada pesan baru yang belum dibaca.
- Tambahkan indikator `⚫` (online) / `⭕` (offline) menggunakan Supabase Presence.

### J5. Pertimbangan Keamanan Chat
- **Validasi kepesertaan:** Setiap API endpoint chat harus memverifikasi bahwa `userId` adalah peserta dari `conversationId` yang diminta.
- **Sanitasi pesan:** Terapkan `sanitize-html` (lihat Bagian B3) pada konten pesan sebelum disimpan ke database.
- **Rate limiting:** Batasi pengiriman pesan di `/api/conversations/[id]/messages` maksimal 30 pesan/menit per user.

---

## 📧 Bagian K: Integrasi Email Transaksional

### K1. Apakah Email Bisa di-deploy di Vercel?

> **Pertanyaan:** Apakah layanan mailing perlu server terpisah?
> **Jawaban: TIDAK** — asalkan menggunakan **Email API** (bukan SMTP/mail server lokal).

| Pendekatan | Bisa di Vercel? | Keterangan |
|-----------|----------------|------------|
| Postfix / Sendmail (self-hosted SMTP) | ❌ Tidak | Butuh server terpisah (VPS) |
| Nodemailer + SMTP Gmail/Outlook | ⚠️ Bisa tapi riskan | Timeout di serverless, tidak disarankan untuk produksi |
| **Resend API** | ✅ **Ya, direkomendasikan** | Serverless-native, gratis 3.000 email/bulan |
| SendGrid API | ✅ Ya | Gratis 100 email/hari, cocok untuk volume tinggi |
| AWS SES | ✅ Ya | Sangat murah ($0.10 per 1000 email), butuh domain terverifikasi |

**Rekomendasi untuk proyek ini: [Resend](https://resend.com)** — paling mudah diintegrasikan dengan Next.js, mendukung template HTML, dan kuota gratis cukup untuk tahap awal.

### K2. Setup Resend

**Install library:**
```bash
npm install resend
```

**Tambahkan ke `.env.local`:**
```ini
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx   # Dari https://resend.com/api-keys
FROM_EMAIL=noreply@dev.hubtalent.id
APP_URL=http://localhost:3000  # Ganti ke https://dev.hubtalent.id saat deploy ke Vercel
```

> [!IMPORTANT]
> Domain pengirim (`@indonesiatalenthub.id`) harus diverifikasi di dashboard Resend dengan menambahkan DNS record (SPF, DKIM). Tanpa ini, email akan masuk folder spam.

### K3. Buat Email Helper Terpusat

**[NEW] `lib/email.ts`** — Fungsi utilitas pengiriman email:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? 'noreply@indonesiatalenthub.id';
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

/** Email reset password */
export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset Password - Indonesia Talent Hub',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#4F46E5">Reset Password Anda</h2>
        <p>Klik tombol di bawah untuk membuat password baru. Link ini berlaku selama <strong>15 menit</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6B7280;font-size:12px;margin-top:24px">
          Jika Anda tidak meminta reset password, abaikan email ini.<br/>
          Link akan otomatis kadaluarsa dalam 15 menit.<br/><br/>
          &mdash; Tim Indonesia Talent Hub (<a href="https://dev.hubtalent.id">dev.hubtalent.id</a>)
        </p>
      </div>
    `
  });
}

/** Email notifikasi lamaran proyek diterima */
export async function sendApplicationAcceptedEmail(to: string, projectTitle: string, applicantName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Lamaran Anda Diterima — ${projectTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#10B981">🎉 Selamat, ${applicantName}!</h2>
        <p>Lamaran Anda untuk bergabung dalam proyek <strong>"${projectTitle}"</strong> telah <strong>diterima</strong>.</p>
        <a href="${APP_URL}/projects" style="display:inline-block;background:#10B981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
          Lihat Proyek Saya
        </a>
      </div>
    `
  });
}

/** Email notifikasi pesan baru (digest harian, bukan per pesan) */
export async function sendUnreadMessageDigest(to: string, senderName: string, previewText: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Pesan baru dari ${senderName} - Indonesia Talent Hub`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#4F46E5">📨 Pesan Baru</h2>
        <p><strong>${senderName}</strong> mengirimkan pesan kepada Anda:</p>
        <blockquote style="border-left:4px solid #4F46E5;padding-left:16px;color:#374151">${previewText}</blockquote>
        <a href="${APP_URL}/messages" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
          Balas Pesan
        </a>
      </div>
    `
  });
}
```

### K4. Trigger Email dari API Routes

| Aksi Pengguna | Email Dikirim ke | Fungsi Helper |
|--------------|-----------------|---------------|
| Klik "Lupa Password" | Pemohon reset | `sendPasswordResetEmail()` |
| Lamaran proyek diterima | Pelamar | `sendApplicationAcceptedEmail()` |
| Diundang ke cohort | Pengguna yang diundang | *(buat fungsi baru)* |
| Pesan chat belum dibaca >1 jam | Penerima pesan | `sendUnreadMessageDigest()` |

> [!NOTE]
> Email untuk notifikasi pesan chat tidak dikirim real-time per pesan — tapi sebagai **digest** (ringkasan) jika pengguna tidak membuka platform >1 jam. Ini mencegah spam notifikasi email.

### K5. Langkah Verifikasi DNS Domain `dev.hubtalent.id` di Resend

> [!IMPORTANT]
> Langkah ini **wajib** dilakukan sebelum email bisa dikirim dari `noreply@dev.hubtalent.id`. Tanpa verifikasi DNS, Resend akan menolak pengiriman.

**Langkah-langkah:**
1. Login ke [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Masukkan domain: `dev.hubtalent.id`
3. Resend akan memberikan beberapa DNS record yang harus ditambahkan di registrar domain kamu (Niagahoster, Cloudflare, dll):

```
# Record yang perlu ditambahkan ke DNS zone dev.hubtalent.id:

# SPF — izinkan Resend mengirim email atas nama domain kamu
Type : TXT
Name : @   (atau dev.hubtalent.id)
Value: v=spf1 include:_spf.resend.com ~all

# DKIM — tanda tangan kriptografis agar email tidak dianggap spam
Type : CNAME
Name : resend._domainkey
Value: [nilai dari dashboard Resend — berbeda tiap akun]

# DMARC — kebijakan proteksi domain (opsional tapi disarankan)
Type : TXT
Name : _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@dev.hubtalent.id
```

4. Klik **Verify** di dashboard Resend — propagasi DNS biasanya 5–30 menit
5. Setelah status menjadi ✅ **Verified**, email dari `noreply@dev.hubtalent.id` siap dikirim

**Tip:** Gunakan [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx) untuk memverifikasi bahwa record SPF sudah aktif sebelum melakukan pengujian.

---

## 🧪 Bagian I: QA Testing Checklist (Per Fitur)

> Gunakan checklist ini untuk verifikasi manual maupun script otomatis sebelum merge ke `main`.

### I1. Autentikasi & Sesi
- [ ] Register dengan email baru → profil kosong → redirect ke `/complete-profile`
- [ ] Login email/password benar → redirect ke `/`
- [ ] Login password salah 5x berturut-turut → mendapat response `429 Too Many Requests`
- [ ] Token JWT kadaluarsa → akses halaman → redirect ke `/landing` dengan bersih
- [ ] Lupa password → email dikirim → link reset berfungsi → password baru berhasil disimpan
- [ ] Link reset yang sudah dipakai → tidak bisa dipakai ulang (return error)
- [ ] Link reset kadaluarsa (>15 menit) → return error "Link telah kadaluarsa"

### I2. Manajemen Profil
- [ ] Simpan profil dengan semua field wajib → berhasil tersimpan di `alumni_db`
- [ ] Upload foto profil → tersimpan di Supabase Storage → URL muncul di halaman profil
- [ ] Edit dan simpan ulang profil → perubahan tercermin tanpa refresh paksa

### I3. Hub Proyek
- [ ] Buat proyek baru → muncul di halaman `/projects`
- [ ] Lamar proyek (bukan milik sendiri) → status "Menunggu Tinjauan"
- [ ] Pemilik melihat tab "Kelola Pelamar" → terima lamaran → pelamar mendapat notifikasi
- [ ] Pemilik tolak lamaran → status berubah → pelamar mendapat notifikasi

### I4. Feed Beranda
- [ ] Buat postingan teks → muncul di feed
- [ ] Buat postingan dengan gambar → gambar tampil di kartu postingan
- [ ] Klik Suka → angka bertambah → klik lagi → angka berkurang (toggle)
- [ ] Tambahkan komentar → muncul di bawah postingan

### I5. Fitur AI
- [ ] Dengan `LLM_PROVIDER=gemini`: Wawasan AI, Rekomendasi Kolaborasi, dan Rekomendasi Karir menghasilkan teks valid
- [ ] Dengan `LLM_PROVIDER=deepseek`: Ketiga fitur AI di atas tetap menghasilkan teks valid
- [ ] Simulasi Gemini gagal (key asalan) saat `LLM_PROVIDER=gemini` → sistem fallback ke DeepSeek → tetap menghasilkan respons
- [ ] CV Creator: tulis deskripsi kasar → klik "Optimalkan AI" → mendapat bullet point profesional

### I6. Keamanan Siber
- [ ] Coba login 6x berturut-turut → dapat `429` pada percobaan ke-6
- [ ] Kirim HTML `<script>alert(1)</script>` di form postingan → tidak dieksekusi oleh browser
- [ ] Cek response header di browser DevTools → pastikan `X-Frame-Options`, `X-Content-Type-Options`, dan `Content-Security-Policy` hadir
- [ ] Akses `/api/super-admin` tanpa token → mendapat `401`
- [ ] Akses proyek orang lain untuk review pelamar → mendapat `403`

### I7. In-App Chat
- [ ] Klik "Kirim Pesan" di profil pengguna lain → percakapan baru terbuat
- [ ] Kirim pesan → muncul di layar penerima **tanpa refresh halaman** (real-time via Supabase)
- [ ] Buka dua tab browser (akun berbeda), kirim pesan di Tab A → muncul di Tab B dalam <1 detik
- [ ] Pesan lama tersimpan dan muncul saat membuka kembali percakapan
- [ ] Percakapan dengan peserta yang tidak valid → mendapat `403`
- [ ] Kirim pesan berisi script XSS → tidak dieksekusi, tersimpan sebagai teks biasa

### I8. Email Transaksional
- [ ] Klik "Lupa Password" → email diterima dalam <1 menit di inbox (bukan spam)
- [ ] Klik link reset → redirect ke halaman reset password yang valid
- [ ] Lamaran proyek diterima → pelamar mendapat email konfirmasi
- [ ] Email menggunakan domain pengirim yang terverifikasi (bukan Supabase default)
- [ ] Email HTML tampil rapi di Gmail, Outlook, dan Mail (Apple)

---

## 📁 Ringkasan File yang Dimodifikasi/Dibuat

| Status | File | Keterangan |
|--------|------|-----------|
| **[MODIFY]** | [middleware.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/middleware.ts) | Rate limiting + HTTP Security Headers |
| **[MODIFY]** | [main.py](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni%20AI/alumni_ai/main.py) | Abstraksi `call_llm_service` Gemini + DeepSeek |
| **[MODIFY]** | [HomeFeedClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/feed/HomeFeedClient.tsx) | Widget statistik real, like, komentar, upload media |
| **[MODIFY]** | [ProjectDetailClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/projects/ProjectDetailClient.tsx) | Tab "Kelola Pelamar" untuk project owner |
| **[MODIFY]** | [Navbar.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/layout/Navbar.tsx) | Lonceng notifikasi + dropdown |
| **[MODIFY]** | [route.ts (cv-suggest)](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/ai/cv-suggest/route.ts) | Multi-provider LLM + fallback |
| **[NEW]** | `app/(auth)/forgot-password/page.tsx` | Halaman form lupa password |
| **[NEW]** | `app/(auth)/reset-password/page.tsx` | Halaman form atur password baru |
| **[NEW]** | `app/api/forgot-password/route.ts` | API generate & kirim token reset |
| **[NEW]** | `app/api/reset-password/route.ts` | API validasi token & update password |
| **[NEW]** | `app/api/stats/network/route.ts` | API statistik jejaring real-time |
| **[NEW]** | `app/api/posts/[id]/like/route.ts` | API toggle suka postingan |
| **[NEW]** | `app/api/posts/[id]/comments/route.ts` | API komentar postingan |
| **[NEW]** | `app/api/notifications/route.ts` | API notifikasi in-app |
| **[NEW]** | `app/api/projects/[id]/applications/route.ts` | API daftar pelamar proyek |
| **[NEW]** | `app/api/projects/applications/review/route.ts` | API terima/tolak pelamar |
| **[NEW]** | `app/(main)/cohort-admin/analytics/page.tsx` | Dasbor analitik cohort |
| **[NEW]** | `database/migration_010_notifications.sql` | DDL tabel notifikasi |
| **[NEW]** | `database/migration_011_post_interactions.sql` | DDL tabel likes & comments |
| **[NEW]** | `database/migration_012_password_reset.sql` | DDL tabel token reset password |
| **[NEW]** | `database/migration_013_chat.sql` | DDL tabel conversations, participants, messages + Realtime |
| **[NEW]** | `lib/email.ts` | Helper terpusat pengiriman email via Resend |
| **[NEW]** | `app/(main)/messages/page.tsx` | Halaman daftar percakapan + chat window |
| **[NEW]** | `components/chat/ChatWindow.tsx` | Komponen real-time chat (Supabase Realtime) |
| **[NEW]** | `app/api/conversations/route.ts` | API daftar + buat percakapan baru |
| **[NEW]** | `app/api/conversations/[id]/messages/route.ts` | API riwayat pesan + kirim pesan baru |
| **[NEW]** | `app/api/forgot-password/route.ts` | API generate token + kirim email reset |
| **[NEW]** | `app/api/reset-password/route.ts` | API validasi token + update password |
| **[NEW]** | `app/(landing)/page.tsx` | Landing page publik HubTalent (redesign) |
| **[NEW]** | `components/landing/HeroSection.tsx` | Hero section dengan CTA utama |
| **[NEW]** | `components/landing/FeaturePillars.tsx` | Tiga pilar fitur utama |
| **[NEW]** | `components/landing/HowItWorks.tsx` | Alur kerja 3 langkah |
| **[NEW]** | `components/landing/FooterCTA.tsx` | Bottom banner CTA |

---

## 🌐 Bagian L: Redesign Landing Page Publik (HubTalent.id)

> **Sumber:** [docs/improvefrontend.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/docs/improvefrontend.md)  
> **Konteks:** Dokumen ini berisi draft copywriting dan struktur konten untuk landing page publik yang menghadap ke pengunjung baru (belum login). Landing page ini berfungsi sebagai pintu masuk utama ke platform.

---

### L1. Struktur Halaman & Komponen

Landing page publik terdiri dari 5 seksi berurutan:

```
┌─────────────────────────────────────────────────────┐
│  L1.1  Navbar                                        │
├─────────────────────────────────────────────────────┤
│  L1.2  Hero Section                                  │
├─────────────────────────────────────────────────────┤
│  L1.3  3 Feature Pillars                             │
├─────────────────────────────────────────────────────┤
│  L1.4  How It Works (3 Steps)                        │
├─────────────────────────────────────────────────────┤
│  L1.5  Footer CTA Banner                             │
└─────────────────────────────────────────────────────┘
```

---

### L1.1 Navbar

**File:** `components/landing/LandingNavbar.tsx`

| Elemen | Konten | Catatan |
|--------|--------|---------|
| Logo | **HubTalent** | Pastikan konsisten dengan branding — font bold, warna indigo/violet |
| Menu 1 | `Kolaborasi Projek` | Anchor ke seksi pilar 1 atau route `/projects` |
| Menu 2 | `AI Career Prep` | Anchor ke seksi pilar 2 atau route `/ai-career` |
| Menu 3 | `Lowongan Kerja` | Route `/jobs` (fitur mendatang — bisa sementara disabled/coming soon) |
| Menu 4 | `Cari Talenta` | Route `/search` |
| CTA | `Masuk` / `Daftar` | Button login & register, posisi kanan navbar |

**Behaviour:** Navbar menjadi sticky + background semi-transparan (glassmorphism) saat user scroll ke bawah.

---

### L1.2 Hero Section

**File:** `components/landing/HeroSection.tsx`

**Headline:**
> # Where Ideas Meet Talent & Opportunity.

**Sub-headline:**
> Ubah ide jadi proyek nyata dan raih karir impianmu. **HubTalent** menghubungkanmu dengan partner kolaborasi, mempersiapkan wawancara kerja bersama AI, dan membuka akses ke ribuan lowongan terpilih—semua di satu tempat.

| Elemen | Detail Implementasi |
|--------|---------------------|
| **Primary CTA** | Tombol `Mulai Kolaborasi — Gratis` → route `/register` |
| **Secondary CTA** | Tombol outline `Eksplorasi Lowongan` → route `/jobs` atau `/projects` |
| **Visual** | Ilustrasi/gambar hero — gunakan `generate_image` tool untuk membuat aset, atau animasi Lottie ringan |
| **Animasi** | Teks headline muncul dengan animasi fade-in + slide-up menggunakan Framer Motion (sudah ada di project) |
| **Statistik Kecil** | Di bawah CTA: `1.200+ Talenta` · `350+ Proyek Aktif` · `98% Puas` (angka bisa dinamis dari API) |

---

### L1.3 Section Fitur Utama — The 3 Pillars ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ Komponen `components/landing/FeaturePillars.tsx` dibuat dengan 3 kartu pilar + badge "Segera Hadir" untuk Job Aggregator.

**File:** `components/landing/FeaturePillars.tsx`

Tiga kartu fitur dengan layout grid (1 kolom di mobile, 3 kolom di desktop):

#### Pilar 1 — Matchmaking Projek & Talenta
> 🚀 **Jangan Biarkan Ide Kerenmu Berhenti di Catatan.**
> Cari *co-founder*, *developer*, atau *designer* yang punya visi sama. Mulai proyek dari nol atau gabung ke tim yang sedang bergerak.

- 🤝 **Matchmaking Presisi** — Temukan rekan tim berdasarkan keahlian teknis dan minat proyek
- 💡 **Pitching Ide** — Publikasikan ide startup/projekmu dan tarik talenta terbaik untuk bergabung
- 🛠️ **Showcase Portfolio** — Pamerkan proyek yang sedang berjalan untuk menarik kolaborator baru

#### Pilar 2 — AI Career Preparation
> 🤖 **Asah Kesiapan Kerja Bersama Personal AI Career Coach.**
> Jangan masuk ruang wawancara tanpa persiapan. Manfaatkan simulasi cerdas berbasis AI untuk menguji kesiapan teknis dan *soft skill*-mu.

- 🎙️ **Simulasi Interview Interaktif** — Latihan menjawab pertanyaan HR & teknis spesifik sesuai posisi target
- 📄 **CV & ATS Optimization** — Evaluasi dan poles resume agar lolos pemindaian sistem seleksi kerja
- 🗺️ **Career Roadmap** — Dapatkan panduan belajar dan analisis *skill gap* pribadi secara instan

#### Pilar 3 — Smart Job Aggregator
> 💼 **Ribuan Peluang Karir Terkurasi dalam Satu Pintu.**
> Tidak perlu membuka puluhan tab portal kerja. Kami mengumpulkan dan mengkurasi lowongan dari berbagai platform ternama secara terpusat.

- ⚡ **Update Real-time** — Informasi lowongan kerja terpercaya yang selalu diperbarui
- 🎯 **Filter Spesifik** — Filter cepat berdasarkan peran, tingkat pengalaman, hingga opsi *remote work*

> [!NOTE]
> **Pilar 3 (Job Aggregator)** adalah fitur mendatang yang belum diimplementasi. Tampilkan dengan badge **"Segera Hadir"** dan CTA "Daftarkan email untuk notifikasi" agar tetap terasa nyata dan membangun ekspektasi.

---

### L1.4 Section Alur Kerja — How It Works ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ `components/landing/HowItWorks.tsx` dibuat dengan 3 langkah + nomor dekoratif + connector.

**File:** `components/landing/HowItWorks.tsx`

**Judul Seksi:** 💡 3 Langkah Mudah Memulai di HubTalent

| Langkah | Nama | Deskripsi |
|---------|------|-----------|
| **01** | Connect & Pitch | Buat profil, pamerkan keahlianmu, atau publikasikan ide proyek yang ingin kamu bangun. |
| **02** | Prepare with AI | Simulasi wawancara dan optimalkan CV kamu dengan asisten AI pribadi. |
| **03** | Launch & Get Hired | Eksekusi proyek bersama tim barumu atau melamar ke lowongan impian. |

**Implementasi visual:**
- Tiga kotak dengan nomor besar di latar belakang (01, 02, 03) sebagai dekorasi
- Garis konektor horizontal di antara langkah (desktop) / vertikal (mobile)
- Ikon berbeda untuk tiap langkah (bisa dari `lucide-react` yang sudah ada)

---

### L1.5 Footer CTA Banner ✅ **SUDAH DIIMPLEMENTASI**
**Status:** ✅ `components/landing/FooterCTA.tsx` dibuat dengan CTA "Buat Akun Sekarang — 100% Gratis".

**File:** `components/landing/FooterCTA.tsx`

**Headline:**
> ### Siap Eksekusi Ide dan Lompati Karirmu?

**Sub-headline:**
> Gabung dengan komunitas talenta, kreator, dan profesional muda yang saling mendukung di **HubTalent**.

| Elemen | Detail |
|--------|--------|
| **CTA Button** | `Buat Akun Sekarang — 100% Gratis` → route `/register` |
| **Visual** | Background gradient indigo-violet dengan efek noise texture atau grid pattern |

---

### L2. Halaman & Route

**[MODIFY] atau [NEW] `app/(landing)/page.tsx`** — Rakit semua komponen di atas menjadi satu halaman:

```tsx
// app/(landing)/page.tsx
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturePillars from '@/components/landing/FeaturePillars';
import HowItWorks from '@/components/landing/HowItWorks';
import FooterCTA from '@/components/landing/FooterCTA';

export const metadata = {
  title: 'HubTalent — Where Ideas Meet Talent & Opportunity',
  description: 'Platform kolaborasi proyek, AI Career Coach, dan agregator lowongan kerja untuk talenta muda Indonesia.',
};

export default function LandingPage() {
  return (
    <main>
      <LandingNavbar />
      <HeroSection />
      <FeaturePillars />
      <HowItWorks />
      <FooterCTA />
    </main>
  );
}
```

> [!IMPORTANT]
> Cek apakah halaman landing saat ini (`app/(landing)/page.tsx` atau `app/page.tsx`) sudah ada. Jika ada, lakukan modifikasi bertahap — jangan hapus konten yang sudah berfungsi tanpa backup terlebih dahulu.

---

### L3. Panduan Desain Visual

| Aspek | Arahan |
|-------|--------|
| **Warna primer** | Indigo/violet (`#4F46E5`, `#7C3AED`) — konsisten dengan warna brand yang sudah ada |
| **Tipografi** | Geist Sans (sudah terpasang di layout.tsx) untuk body; font display lebih besar (5xl–7xl) untuk headline |
| **Animasi** | Framer Motion sudah tersedia — pakai `motion.div` dengan `initial={{ opacity: 0, y: 30 }}` + `animate={{ opacity: 1, y: 0 }}` |
| **Glassmorphism** | `backdrop-blur-md bg-white/10 border border-white/20` — untuk navbar sticky dan kartu fitur di dark background |
| **Responsif** | Mobile-first: grid 1 kolom → 3 kolom (md breakpoint) untuk section pilar |
| **Dark mode** | Gunakan latar gelap (`bg-gray-950` atau `bg-slate-900`) sebagai base — lebih premium dan modern |

---

### L4. QA Checklist Landing Page

- [ ] Navbar sticky + efek glassmorphism aktif saat scroll
- [ ] Semua link nav berfungsi (tanpa broken link)
- [ ] Tombol "Mulai Kolaborasi" → redirect ke `/register`
- [ ] Tombol "Eksplorasi Lowongan" → redirect ke halaman yang relevan
- [ ] 3 kartu pilar tampil dalam 1 baris di desktop dan stack di mobile
- [ ] Pilar 3 (Job Aggregator) menampilkan badge "Segera Hadir"
- [ ] Animasi hero section muncul dengan mulus (tidak janky)
- [ ] Meta title & description sudah spesifik dan bukan placeholder
- [ ] Halaman bisa diakses oleh pengguna yang **belum login** (tidak ter-redirect ke login)
- [ ] Page load time < 2 detik (cek di Lighthouse)

---

## 🔧 Bagian M: Perbaikan Kritis — Audit Sinkronisasi AI Endpoint

> **Sumber:** Hasil audit live test FastAPI vs Next.js (4 Agustus 2026)  
> **Lihat detail:** [ai_endpoint_map.md](file:///Users/triutama/.gemini/antigravity-ide/brain/82a48601-c724-4cac-b2cf-30b42b31bd5b/ai_endpoint_map.md)

### Peta Status Endpoint (Ringkasan)

| Fitur | Next.js Route | Memanggil | Status |
|-------|---------------|-----------|--------|
| Wawasan Beranda | `/api/collaboration-recommendation` (source=home) | Hitung lokal Next.js | ✅ OK |
| Rekomendasi Kolaborasi | `/api/collaboration-recommendation` (source=profile) | FastAPI `/rekomendasi` | ✅ OK |
| Rekomendasi Karir | `/api/collaboration-recommendation` (source=karir) | FastAPI `/karir` | ✅ OK |
| Pencarian Talenta | `/api/ai/talent-search` | FastAPI `/proyek_rekomendasi` | ✅ OK |
| Rekomendasi Proyek | `/api/ai/project-recommendation` | FastAPI `/rekomendasi` | ✅ OK |
| **CV Suggest** | `/api/ai/cv-suggest` | ⚠️ **Gemini langsung** | ⚠️ Key hilang |
| **Learning Path** | `/api/learning-path` | FastAPI `/learning_path` | ❌ **Belum ada** |

---

### M1. Perbaikan CV Suggest — Tambah GEMINI_API_KEY ke Next.js

**Masalah:** [`app/api/ai/cv-suggest/route.ts`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/ai/cv-suggest/route.ts) memanggil Gemini API langsung dan membutuhkan `GEMINI_API_KEY` di sisi Next.js, tapi variabel ini **belum ada** di `.env.local`.

**Akibat saat ini:** Fitur "Optimalkan AI" di CV Creator **selalu return error 500** (`Server misconfigured: missing GEMINI_API_KEY`).

**Perbaikan — Tambahkan ke [`.env.local`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/.env.local):**
```ini
# Tambahkan baris ini (key sama dengan yang ada di Alumni AI/.env)
GEMINI_API_KEY=REDACTED
```

> [!NOTE]
> **Ke depannya (opsional):** Pertimbangkan memindahkan `cv-suggest` agar memanggil FastAPI `/cv_suggest` untuk menjaga konsistensi arsitektur. Dengan demikian API key hanya perlu disimpan di satu tempat (FastAPI `.env`).

---

### M2. Perbaikan Learning Path — Buat Endpoint di FastAPI

**Masalah:** [`app/api/learning-path/route.ts`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/learning-path/route.ts) memanggil `http://localhost:8000/learning_path` tapi endpoint ini **belum ada** di `main.py`. Selain itu URL di-hardcode ke `localhost` yang rusak di production Vercel.

**Perbaikan A — Buat endpoint `/learning_path` di [main.py](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni%20AI/alumni_ai/main.py):**

Tambahkan model Pydantic dan endpoint berikut di bagian `--- MODEL DATA ---` dan `--- ENDPOINTS API ---` di `main.py`:

```python
# Tambahkan di bagian MODEL DATA (setelah class ProyekInput)
class LearningPathInput(BaseModel):
    user_id: int
    target_role: str

# Tambahkan di bagian ENDPOINTS API (setelah endpoint /proyek_rekomendasi)
@app.post("/learning_path", dependencies=[Security(get_api_key)])
async def learning_path(input: LearningPathInput):
    try:
        if not input.target_role.strip():
            raise HTTPException(status_code=400, detail="Target role tidak boleh kosong.")

        # Ambil profil alumni untuk konteks personal
        data = await ambil_profil_alumni(user_id=input.user_id)

        prompt = f"""Anda adalah Career Coach AI untuk alumni Indonesia.
Buat learning roadmap yang personal dan terstruktur untuk:

Nama: {data.get('nama_lengkap', 'Pengguna')}
Keahlian Saat Ini: {data.get('skill_gabungan', 'belum diisi')}
Target Peran: {input.target_role}

Buat dalam format Markdown dengan:
1. Ringkasan gap antara skill saat ini dan target peran
2. Fase belajar (3-4 fase) dengan durasi estimasi masing-masing
3. Resource belajar spesifik per fase (kursus online, buku, platform)
4. Checklist tugas konkret yang bisa ditandai selesai (5-8 item, format: [ ] Nama tugas)
5. Tips karir spesifik untuk konteks Indonesia

Gunakan Bahasa Indonesia. Jadikan checklist detail dan dapat langsung dieksekusi."""

        headers = {"Content-Type": "application/json"}
        gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 3000}
        }
        async with httpx.AsyncClient(timeout=90.0) as client:
            res = await client.post(gemini_api_url, headers=headers, json=body)
            res.raise_for_status()
            content = res.json()["candidates"][0]["content"]["parts"][0]["text"]
            return {"learning_path": content.strip()}

    except HTTPException as e:
        raise e
    except Exception as e:
        error_traceback = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}\n\nTraceback:\n{error_traceback}")
```

**Perbaikan B — Update URL di [learning-path/route.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/learning-path/route.ts) line 30:**

```typescript
// SEBELUM (hardcoded — rusak di Vercel production)
const fastApiUrl = 'http://localhost:8000/learning_path';

// SESUDAH (gunakan env var)
const fastApiUrl = `${process.env.FASTAPI_URL || 'http://localhost:8000'}/learning_path`;
```

**Tambahkan ke [`.env.local`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/.env.local):**
```ini
FASTAPI_URL=https://alumni-restapi.onrender.com
```

---

### M3. Pastikan Tabel `user_checklists` Ada di Database

[`app/api/learning-path/checklist/route.ts`](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/learning-path/checklist/route.ts) menyimpan progres checklist ke tabel `user_checklists`. Jalankan DDL berikut di Supabase SQL Editor jika tabel belum ada:

```sql
-- migration_014_user_checklists.sql
CREATE TABLE IF NOT EXISTS public.user_checklists (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  target_role VARCHAR(255) NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, target_role)
);
CREATE INDEX idx_user_checklists_user ON public.user_checklists(user_id);
```

---

### M4. QA Checklist Perbaikan Ini

- [ ] Tambah `GEMINI_API_KEY` ke `.env.local` → pergi ke halaman Jobs → CV Creator → klik "Optimalkan AI" → dapat saran bullet point (bukan error 500)
- [ ] Jalankan FastAPI dengan endpoint `/learning_path` baru → `curl -X POST http://localhost:8000/learning_path ...` → dapat JSON `{"learning_path": "..."}`
- [ ] Pergi ke halaman Jobs → tab "Learning Path" → masukkan target peran → klik "Buat Roadmap" → dapat roadmap markdown
- [ ] Centang beberapa item checklist di Learning Path → refresh halaman → centang tetap tersimpan (tersinkron ke `user_checklists`)
- [ ] Deploy ke Vercel → pastikan Learning Path masih berfungsi (bukan `localhost` lagi)

---

## 📁 Ringkasan Semua File (Update Final)

| Status | File | Keterangan |
|--------|------|-----------|
| **[MODIFY]** | [middleware.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/middleware.ts) | Rate limiting + HTTP Security Headers |
| **[MODIFY]** | [main.py](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni%20AI/alumni_ai/main.py) | Multi-provider AI + endpoint `/learning_path` baru |
| **[MODIFY]** | [HomeFeedClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/feed/HomeFeedClient.tsx) | Widget statistik real, like, komentar, upload media |
| **[MODIFY]** | [ProjectDetailClient.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/projects/ProjectDetailClient.tsx) | Tab "Kelola Pelamar" untuk project owner |
| **[MODIFY]** | [Navbar.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/components/layout/Navbar.tsx) | Lonceng notifikasi + dropdown |
| **[MODIFY]** | [learning-path/route.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/learning-path/route.ts) | Ganti URL hardcode → env var `FASTAPI_URL` |
| **[MODIFY]** | [cv-suggest/route.ts](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/api/ai/cv-suggest/route.ts) | Tambah `GEMINI_API_KEY` ke `.env.local` |
| **[MODIFY]** | [.env.local](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/.env.local) | Tambah `GEMINI_API_KEY`, `FASTAPI_URL`, `RESEND_API_KEY` |
| **[NEW]** | `app/(auth)/forgot-password/page.tsx` | Halaman form lupa password |
| **[NEW]** | `app/(auth)/reset-password/page.tsx` | Halaman form atur password baru |
| **[NEW]** | `app/api/forgot-password/route.ts` | API generate token + kirim email reset |
| **[NEW]** | `app/api/reset-password/route.ts` | API validasi token + update password |
| **[NEW]** | `app/api/stats/network/route.ts` | API statistik jejaring real-time |
| **[NEW]** | `app/api/posts/[id]/like/route.ts` | API toggle suka postingan |
| **[NEW]** | `app/api/posts/[id]/comments/route.ts` | API komentar postingan |
| **[NEW]** | `app/api/notifications/route.ts` | API notifikasi in-app |
| **[NEW]** | `app/api/projects/[id]/applications/route.ts` | API daftar pelamar proyek |
| **[NEW]** | `app/api/projects/applications/review/route.ts` | API terima/tolak pelamar |
| **[NEW]** | `app/(main)/cohort-admin/analytics/page.tsx` | Dasbor analitik cohort |
| **[NEW]** | `app/(main)/messages/page.tsx` | Halaman daftar percakapan + chat window |
| **[NEW]** | `app/(landing)/page.tsx` | Landing page publik HubTalent (redesign) |
| **[NEW]** | `components/chat/ChatWindow.tsx` | Komponen real-time chat (Supabase Realtime) |
| **[NEW]** | `components/landing/HeroSection.tsx` | Hero section dengan CTA utama |
| **[NEW]** | `components/landing/FeaturePillars.tsx` | Tiga pilar fitur utama |
| **[NEW]** | `components/landing/HowItWorks.tsx` | Alur kerja 3 langkah |
| **[NEW]** | `components/landing/FooterCTA.tsx` | Bottom banner CTA |
| **[NEW]** | `lib/email.ts` | Helper terpusat pengiriman email via Resend |
| **[NEW]** | `database/migration_010_notifications.sql` | DDL tabel notifikasi |
| **[NEW]** | `database/migration_011_post_interactions.sql` | DDL tabel likes & comments |
| **[NEW]** | `database/migration_012_password_reset.sql` | DDL tabel token reset password |
| **[NEW]** | `database/migration_013_chat.sql` | DDL tabel conversations, participants, messages + Realtime |
| **[NEW]** | `database/migration_014_user_checklists.sql` | DDL tabel user_checklists untuk Learning Path |

---

## 🎨 Bagian N: Rebranding — "Indonesia Talent Hub" → "HubTalent"

### Latar Belakang

Nama brand resmi diubah dari **"Indonesia Talent Hub"** menjadi **"HubTalent"** untuk tampilan yang lebih ringkas, mudah diingat, dan konsisten dengan domain `dev.hubtalent.id`.

### N1. File UI/Frontend yang Harus Diubah

Semua teks yang terlihat langsung oleh pengguna (judul halaman, card, deskripsi).

#### [MODIFY] [app/layout.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/layout.tsx)
```typescript
// SEBELUM
title: 'Indonesia Talent Hub',

// SESUDAH
title: 'HubTalent',
```
> Juga update `description` meta tag menjadi sesuatu seperti:
> `"HubTalent — Platform kolaborasi dan pengembangan karir berbasis AI untuk talenta Indonesia"`

#### [MODIFY] [app/(auth)/login/page.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/(auth)/login/page.tsx) — baris 88
```tsx
// SEBELUM
<CardTitle className="text-2xl">Indonesia Talent Hub</CardTitle>

// SESUDAH
<CardTitle className="text-2xl">HubTalent</CardTitle>
```

#### [MODIFY] [app/(auth)/register/page.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/(auth)/register/page.tsx) — baris 66
```tsx
// SEBELUM
<CardDescription>Buat akun Anda untuk mengakses Indonesia Talent Hub.</CardDescription>

// SESUDAH
<CardDescription>Buat akun Anda untuk mengakses HubTalent.</CardDescription>
```

#### [MODIFY] [app/landing/page.tsx](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/app/landing/page.tsx) — baris 25
```tsx
// SEBELUM
<span className="text-sm font-semibold text-white sm:text-base">Indonesia Talent Hub</span>

// SESUDAH
<span className="text-sm font-semibold text-white sm:text-base">HubTalent</span>
```

---

### N2. File Dokumentasi yang Harus Diubah

Dokumen internal — tidak mempengaruhi tampilan user, tapi penting untuk konsistensi tim.

| File | Baris | Perubahan |
|------|-------|-----------|
| [BLUEPRINT_TEXT.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/BLUEPRINT_TEXT.md) | 2, 4 | `INDONESIA TALENT HUB` → `HUBTALENT` |
| [DATABASE_MIGRATION_PLAN.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/DATABASE_MIGRATION_PLAN.md) | 1 | Heading utama |
| [docs/README.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/docs/README.md) | 1, 3 | Heading + deskripsi |
| [docs/01_architecture.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/docs/01_architecture.md) | 3 | Deskripsi dokumen |
| [docs/02_style_ui_ux.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/docs/02_style_ui_ux.md) | 3, 9 | Heading + deskripsi |
| [docs/04_features.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/docs/04_features.md) | 3 | Deskripsi dokumen |
| [docs/05_security_credentials.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/docs/05_security_credentials.md) | 9 | Konteks otentikasi |
| [BLUEPRINT_ANALYSIS.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/BLUEPRINT_ANALYSIS.md) | 1, 10 | Heading + deskripsi |
| [DEVELOPMENT_PLAN.md](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/DEVELOPMENT_PLAN.md) | 1, 10 | Heading + deskripsi |

---

### N3. FastAPI — Update Pesan Root Endpoint

#### [MODIFY] [main.py](file:///Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2/Alumni%20AI/alumni_ai/main.py) — baris 39

```python
# SEBELUM
return {"message": "Alumni AI backend is running!"}

# SESUDAH
return {"message": "HubTalent AI Engine is running!"}
```

---

### N4. Panduan Konsistensi Brand

Gunakan aturan berikut untuk semua konten baru:

| Konteks | Penulisan yang Benar |
|---------|---------------------|
| Nama brand utama | **HubTalent** (huruf H dan T kapital, satu kata) |
| Di dalam kalimat | "platform **HubTalent**" |
| Di judul/heading | **HubTalent** |
| Di URL / slug | `hubtalent` (semua lowercase) |
| Di nama file/folder | `hubtalent` atau `hub-talent` |
| Tagline resmi | *"Where Ideas Meet Talent & Opportunity"* |
| Yang JANGAN digunakan | ~~Hub Talent~~, ~~hub talent~~, ~~Indonesia Talent Hub~~ |

---

### N5. QA Checklist Rebranding

- [ ] Buka `/login` → card title menampilkan **HubTalent**
- [ ] Buka `/register` → deskripsi menyebut **HubTalent**
- [ ] Buka tab browser → title tab menampilkan **HubTalent**
- [ ] Buka landing page → navbar logo menampilkan **HubTalent**
- [ ] `curl http://localhost:8000/` → response menampilkan `"HubTalent AI Engine is running!"`
- [ ] Tidak ada lagi teks "Indonesia Talent Hub" yang terlihat oleh pengguna (cek dengan `grep -r "Indonesia Talent Hub" app/ components/` → harus 0 hasil)
