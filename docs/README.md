# Indonesia Talent Hub - Development Guides Index

Selamat datang di pusat panduan pengembangan **Indonesia Talent Hub v2**. Folder ini berisi dokumentasi terstruktur untuk membantu Anda membangun, mengembangkan, dan memelihara aplikasi ini dengan terarah.

---

## 🗺️ Daftar Panduan Pengembangan

Pilihlah dokumen di bawah ini sesuai dengan bagian yang sedang Anda kerjakan:

### 🏢 [01. Architecture & Folder Structure](./01_architecture.md)
* Menjelaskan struktur direktori Next.js App Router.
* Pola render data (Server vs Client Components).
* Aturan penulisan kode agar performa aplikasi tetap optimal.

### 🎨 [02. Style & UI/UX Guidelines](./02_style_ui_ux.md)
* Palet warna dasar (Light & Dark theme CSS variables).
* Tipografi (Inter & Outfit fonts).
* Komponen UX seperti visual Glassmorphism, Micro-animations, dan logika pengkondisian form onboarding.

### 🗄️ [03. Backend & Database Schema](./03_backend.md)
* Detail skema tabel relasional Supabase PostgreSQL.
* Struktur tabel riwayat pendidikan dan 9 tabel profesi bersyarat.
* Daftar lengkap REST & AI Route Handlers API Next.js.
* Cara menulis dan menjalankan migrasi database otomatis.

### 🚀 [04. Features & Functional Specifications](./04_features.md)
* Penjelasan alur kerja 6 halaman utama platform.
* Kebutuhan fungsional dan detail validasi tiap fitur (Landing Page, Feed, Search, Project Hub).

### 🔒 [05. Security & Credentials](./05_security_credentials.md)
* Penjelasan otentikasi JWT Cookie HttpOnly (Anti-XSS).
* Contoh konfigurasi Row Level Security (RLS) Supabase.
* Daftar variabel lingkungan wajib pada berkas `.env`.

### 🧠 [06. AI & Semantic Search](./06_ai_matching.md)
* Cara kerja LLM Semantic Search menggunakan Vector Embedding.
* Alur pencocokan proyek kolaborasi cerdas dan penulisan narasi AI.
* Mekanisme cache rekomendasi untuk menghemat kuota biaya API.

---

## 🧭 Rekomendasi Alur Pengembangan (Suggested Workflow)

Untuk memastikan pengembangan Anda selalu terarah, ikuti urutan berikut:
1. **Langkah 1:** Hubungkan basis data Supabase lokal/cloud dengan mengisi kredensial pada `.env` (Panduan 05).
2. **Langkah 2:** Pastikan seluruh tabel database sudah terbentuk dengan menjalankan migrasi (Panduan 03).
3. **Langkah 3:** Jalankan server development lokal (`npm run dev`) untuk melihat visualisasi antarmuka (Panduan 01).
4. **Langkah 4:** Mulai selaraskan halaman-halaman profil bersyarat di UI/UX sesuai dengan spesifikasi fitur (Panduan 02 & 04).
5. **Langkah 5:** Hubungkan API AI/LLM untuk mengaktifkan fitur pencarian semantik (Panduan 06).
