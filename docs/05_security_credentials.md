# 05. Security & Credentials - System Protection & Environment Variables

Dokumen ini menjelaskan strategi keamanan aplikasi, autentikasi berbasis JWT, kebijakan keamanan database Supabase (Row Level Security), dan tata kelola kredensial lingkungan (.env).

---

## 🔒 Otentikasi & Sesi Pengguna (JWT Cookie)

Indonesia Talent Hub menggunakan sistem otentikasi kustom mandiri untuk melindungi data pengguna:
1. **Hashing Kustom Sisi Server (Tabel `user`):** Proses pendaftaran dan verifikasi kata sandi dikelola langsung pada tabel kustom `public.user`. Kata sandi di-hash menggunakan algoritma **Bcrypt** (`bcryptjs` dengan 10 salt rounds) langsung di dalam API Route Next.js sebelum disimpan ke database. Pendekatan ini membuat sistem otentikasi sepenuhnya independen dari modul bawaan Supabase Auth, sehingga memudahkan migrasi masa depan ke VPS atau server PostgreSQL standar apa pun tanpa adanya ketergantungan (vendor lock-in).
2. **HTTP-Only Cookies (Next.js Level):** 
   * Setelah login berhasil, backend Route Handler membuat JWT token yang berisi payload `user_id`, `email`, dan status profil (`profile_completed`, `must_change_password`).
   * Token disimpan dalam cookie bernama `auth_token` dengan konfigurasi **`HttpOnly`**, **`Secure`** (hanya terkirim lewat HTTPS), dan **`SameSite=Lax`**.
   * Ini memberikan perlindungan kuat terhadap serangan pencurian sesi seperti **Cross-Site Scripting (XSS)** karena JavaScript browser tidak dapat membaca isi cookie tersebut.

---

## 🛑 Kebijakan Keamanan Tingkat Aplikasi (Application-Level Security)

Karena platform dirancang untuk portabilitas tinggi (mudah dipindahkan ke VPS kustom), keamanan dan otorisasi data dipusatkan pada **Tingkat Aplikasi (Next.js API Routes)**, bukan bersandar pada RLS Supabase:

1. **Bypass RLS Menggunakan Service Role / Direct DB:** API Route Next.js terhubung ke Supabase menggunakan `SUPABASE_SERVICE_ROLE_KEY` atau koneksi PostgreSQL langsung via `DATABASE_URL` (port pooler 6543). Kedua metode ini melewati aturan RLS database.
2. **Validasi Otoritas di API Route:** Setiap kali data profil, proyek, atau postingan dimodifikasi, API Route Next.js akan membaca token JWT dari cookie pengguna, mendekripsinya, lalu membandingkan `user_id` dari JWT tersebut dengan ID pemilik data di database.
   * Contoh logic validasi proyek:
     ```typescript
     // Periksa apakah user yang meminta hapus adalah pemilik proyek
     if (project.owner_id !== loggedInUserId) {
       return NextResponse.json({ error: "Anda tidak memiliki akses." }, { status: 403 });
     }
     ```
3. **Keuntungan Portabilitas:** Model otorisasi tingkat aplikasi ini menjamin bahwa seluruh kode Next.js dapat langsung berjalan di atas VPS Docker/Linux mandiri dengan database PostgreSQL standar tanpa perlu menyusun ulang kebijakan kebijakan PostgreSQL RLS yang rumit.

---

## 🔑 Manajemen Kredensial Lingkungan (.env)

Seluruh kredensial sensitif disimpan di file `.env` di root direktori `/talenthub`. File ini **tidak boleh dimasukkan ke dalam Git (.gitignore)**.

Berikut variabel lingkungan yang wajib dikonfigurasi:

```ini
# Supabase Project Connection Details
# Digunakan oleh client browser untuk memuat API Supabase publik
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]

# Supabase Admin / Service Role Key
# SANGAT SENSITIF. Hanya digunakan di server (Route Handlers) untuk membypass aturan RLS
# jika diperlukan operasi admin (seperti pendaftaran user baru).
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# Secret Key untuk Tanda Tangan JWT Token Next.js
# Ganti dengan string acak yang panjang dan aman di sistem produksi
JWT_SECRET=[YOUR_JWT_SECRET]

# API Key untuk Keamanan Komunikasi Internal dengan Microservice Python (FastAPI)
# Wajib sama antara konfigurasi Next.js dan FastAPI
INTERNAL_API_KEY=[YOUR_INTERNAL_API_KEY]

# API Key Google Gemini untuk pemrosesan LLM di Microservice Python
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]

# Direct PostgreSQL Connection String
# Digunakan untuk menjalankan skrip migrasi database lokal dan koneksi cepat pooler
DATABASE_URL=postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```
