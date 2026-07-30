# 01. Architecture - Next.js App Router & Folder Structure

Dokumen ini menjelaskan struktur arsitektur, organisasi folder, dan alur data aplikasi **Indonesia Talent Hub v2** berbasis Next.js 15 App Router.

---

## 📂 Struktur Folder Proyek

Aplikasi dirancang menggunakan arsitektur **Next.js App Router (React Server Components / RSC)**. Berikut adalah peta struktur direktori utama:

```text
talenthub/
├── app/                        # Direktori Rute Aplikasi (App Router)
│   ├── (auth)/                 # Group Route untuk Otentikasi
│   │   ├── login/              # Halaman Login (/login)
│   │   ├── register/           # Halaman Pendaftaran (/register)
│   │   └── complete-profile/   # Halaman Onboarding Profil (/complete-profile)
│   ├── (main)/                 # Group Route untuk Fitur Utama (Header Aktif)
│   │   ├── page.tsx            # Beranda / Feed Utama (/)
│   │   ├── profile/            # Halaman Profil User (/profile/[userId])
│   │   ├── projects/           # Hub Kolaborasi Proyek (/projects)
│   │   └── search/             # Halaman AI Semantic Search (/search)
│   ├── api/                    # Route Handlers (REST & AI API)
│   │   ├── auth/               # Endpoint Otentikasi (login, register, logout)
│   │   ├── projects/           # Manajemen Proyek & Aplikasi
│   │   └── reference/          # Rujukan Wilayah/Kota Indonesia
│   ├── layout.tsx              # Layout Utama Root Aplikasi
│   ├── middleware.ts           # Interceptor Sesi & Proteksi Rute (JWT Cookie)
│   └── globals.css             # Import CSS Global & Design System Tailwind
├── components/                 # Komponen React Reusable
│   ├── ui/                     # UI Primitif Shadcn (Button, Card, Input, dsb.)
│   └── shared/                 # Komponen Custom (Navbar, Sidebar, Card Proyek)
├── database/                   # Migrasi SQL & Runner Python Supabase
├── lib/                        # Utilitas & Klien Bersama
│   ├── auth.ts                 # Enkripsi & Dekripsi JWT (jose)
│   ├── db.ts                   # Koneksi Direct PostgreSQL (pooler)
│   ├── profileForm.ts          # Zod Validation Schema & Payload Normalization
│   └── supabase.ts             # Inisialisasi Supabase JS Client
├── public/                     # Aset Gambar, Logo, & Font Statis
├── package.json                # Dependencies & Script Build Node.js
└── tsconfig.json               # Konfigurasi Aturan Main TypeScript
```

---

## 🔗 Alur Kerja Data & State Management

Aplikasi ini menggabungkan kekuatan **React Server Components (RSC)** untuk rendering data yang cepat dan aman di sisi server, serta **Client Components** untuk form interaktif.

### 1. Rendering Sisi Server (RSC)
Setiap halaman utama seperti `/profile/[userId]` dan `/projects/[id]` dimuat menggunakan RSC secara default. Ini memungkinkan:
* Data diambil langsung dari Supabase di sisi server tanpa mengekspos API Key ke browser.
* SEO yang optimal karena HTML dirender secara utuh dari server.
* Waktu pemuatan awal (*first-load*) yang sangat cepat.

### 2. Form & Interaksi Sisi Klien (React Hook Form + Zod)
Form besar seperti `/complete-profile` dan `/profile/edit/[userId]` dirender sebagai **Client Components** (`'use client'`).
* **Validation Engine:** Menggunakan **Zod** untuk memvalidasi input di tingkat browser sebelum dikirim ke backend.
* **State Management:** Form state dikelola sepenuhnya oleh `react-hook-form` agar performa input tetap lancar tanpa *re-render* keseluruhan halaman.

### 3. Otentikasi Berbasis Middleware (Token JWT)
Semua proteksi rute ditangani oleh [middleware.ts](file:///home/lightman/Documents/Project/talenthub/middleware.ts):
* Middleware membaca HTTP-only cookie `auth_token`.
* Memverifikasi JWT menggunakan library `jose` untuk memproses payload pengguna secara aman.
* Menerapkan pengalihan otomatis (*redirect*) jika pengguna belum login atau profilnya belum lengkap.

---

## 🛠️ Aturan Pengembangan Kode (Development Rules)

Untuk menjaga kualitas arsitektur aplikasi tetap bersih, patuhi pedoman berikut:

1. **Gunakan Server Components sebagai Default:** Hanya tambahkan tag `'use client'` di baris pertama file jika halaman tersebut memerlukan interaksi pengguna langsung (seperti klik button, state internal, form, atau hook useEffect).
2. **Kapsulasi Query Database:** Lakukan query langsung di file halaman server (RSC) menggunakan instansi Supabase Server Client, hindari memanggil endpoint API internal dari Server Component.
3. **Pemisahan Validasi Form:** Semua schema validasi form wajib dideklarasikan di dalam folder `lib/` (misalnya `lib/profileForm.ts`) agar bisa digunakan kembali secara konsisten baik di frontend maupun Route Handlers API (Backend).
