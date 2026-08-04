# 03. Backend & Database Schema - Supabase & API Route Handlers

Dokumen ini menjelaskan infrastruktur backend, skema relasional basis data PostgreSQL Supabase, dan katalog Route Handlers API Next.js.

---

## 🗄️ Skema Database Relasional (Supabase)

Seluruh data alumni disimpan dalam database PostgreSQL Supabase dengan skema relasional yang terbagi menjadi data profil utama, tabel detail bersyarat, data multi-tenant (cohort), serta fitur tambahan (AI & Jobs).

### 1. Tabel Akun & Profil Utama: `user` & `alumni_db`
* **`user`** (Tabel Kredensial Otentikasi):
  * `id` (bigint, PK) - ID Unik Pengguna.
  * `email` (varchar, UNIQUE) - Alamat email terdaftar.
  * `username` (varchar, UNIQUE) - Username kustom.
  * `password` (varchar) - Hash sandi terenkripsi Bcrypt.
  * `role` (varchar) - Tingkat hak akses (`member` / `super_admin`).
  * `created_at` (timestamp) - Waktu pendaftaran.
* **`alumni_db`** (Tabel Biodata Wajib):
  * `id` (bigint, PK, FK → `user.id` ON DELETE CASCADE) - ID Unik Alumni.
  * `email` (varchar, UNIQUE) - Alamat email aktif.
  * `nama_lengkap` (varchar) & `nama_panggilan` (varchar)
  * `tahun_lahir_int` (integer) - Tahun kelahiran.
  * `jenis_kelamin` (varchar) - Laki-laki / Perempuan.
  * `nomor_handphone_varchar` (varchar) - Nomor kontak (format `62xxx`).
  * `domisili_provinsi` & `domisili_kota_kabupaten` (varchar)
  * `skill_gabungan` (text) - Deskripsi keahlian gabungan (untuk pencarian AI).
  * `bahasa_dikuasai` (text) & `sertifikasi` (text)
  * `instagram_link`, `linkedin_link`, `portofolio_link` (varchar)
  * `aktivitas` (varchar) - Array teks aktivitas terpilih (koma-terpisah).
  * `aktivitas_status_durasi` (jsonb) - Menyimpan status keaktifan tiap profesi.
  * `gabungan_data` (text) - Teks gabungan seluruh isi profil yang diindeks untuk AI Search.

### 2. Tabel Multi-Tenant & Komunitas: `cohorts` & `cohort_members`
* **`cohorts`** (Kelompok Komunitas Eksklusif):
  * `id` (bigint, PK) - ID Unik Komunitas.
  * `name` (varchar) - Nama komunitas/instansi.
  * `description` (text) - Penjelasan singkat komunitas.
  * `owner_id` (bigint, FK → `user.id` ON DELETE CASCADE) - Pembuat/Pemilik lisensi.
  * `subscription_plan` (varchar) - Paket langganan (default `free`).
  * `subscription_status` (varchar) - Status komunitas (`active` / `suspended`).
  * `created_at` (timestamp) & `expires_at` (timestamp) - Masa aktif komunitas.
* **`cohort_members`** (Keanggotaan Kelompok Komunitas):
  * `id` (bigint, PK)
  * `cohort_id` (bigint, FK → `cohorts.id` ON DELETE CASCADE)
  * `user_id` (bigint, FK → `user.id` ON DELETE CASCADE)
  * `role` (varchar) - Hak akses di dalam komunitas (`member` / `admin`).
  * `joined_at` (timestamp)
  * *Constraint:* Unique composite index on `(cohort_id, user_id)`.

### 3. Tabel Riwayat Pendidikan: `alumni_education_histories`
Hubungan One-to-Many dengan `alumni_db` untuk menyimpan riwayat studi:
* `id` (bigint, PK)
* `alumni_id` (bigint, FK → `alumni_db.id` ON DELETE CASCADE)
* `level` (varchar) - SMA/SMK, S1, S2, dsb.
* `institution_name` (varchar) - Nama sekolah/kampus.
* `major_program` (varchar) - Jurusan.
* `start_year` & `end_year` (integer)
* `is_current` (boolean) - Apakah sedang menempuh studi di sini.

### 4. Sembilan Tabel Detail Aktivitas Kondisional (One-to-One)
Setiap tabel memiliki Primary Key `id` dan Foreign Key `alumni_id` (bigint, UNIQUE, FK → `alumni_db.id` ON DELETE CASCADE):
1. **`alumni_pekerja`**: `nama_instansi` (text), `posisi` (text), `pengalaman_proyek` (text), `keahlian_pekerja` (text), `akses_jejaring` (boolean), `pengalaman_bermitra` (boolean).
2. **`alumni_bisnis`**: `nama_usaha` (text), `skala_usaha` (text), `keahlian_wirausahaan` (text), `produk_layanan_utama` (text), `kendala_bisnis` (text), `target_pasar` (text), `kolaborasi_terbuka` (text), `keahlian_dibagikan` (text).
3. **`alumni_sosial`**: `nama_organisasi` (text), `isu_fokus` (text), `keahlian_sosial` (text), `pengalaman_proyek_sosial` (text), `pengalaman_bermitra_sosial` (boolean).
4. **`alumni_kreatif`**: `keahlian_kreatif` (text), `platform_digital_utama` (text), `jenis_konten` (text), `total_jangkauan` (text), `kisaran_rate_card` (text), `demografi_followers` (text).
5. **`alumni_rumah_tangga`**: `keahlian_irt` (text), `kegiatan_organisasi_irt` (text), `pengalaman_tim_irt` (boolean), `mencari_pekerjaan_kolaborasi_irt` (boolean).
6. **`alumni_mahasiswa`**: `keahlian_mahasiswa` (text), `kegiatan_organisasi_mahasiswa` (text), `pengalaman_magang` (text), `pengalaman_tim_mahasiswa` (boolean), `mencari_pekerjaan_kolaborasi_mahasiswa` (boolean).
7. **`alumni_informal`**: `keahlian_informal` (text), `pengalaman_tim_informal` (boolean), `pernah_rekrut_memimpin` (boolean).
8. **`alumni_agri`**: `keahlian_agri` (text), `komoditas_utama` (text), `tergabung_kelompok` (boolean), `skala_usaha_agri` (text), `nilai_tambah_diterapkan` (text), `kendala_dihadapi_agri` (text).
9. **`alumni_pendidik`**: `keahlian_pendidik` (text), `jenjang_pendidikan` (text), `mata_pelajaran` (text), `inovasi_pembelajaran` (text), `mengajar_bimbel` (boolean).

### 5. Tabel Fitur Proyek, Jobs, & Penyelarasan Karir
* **`projects`** (Daftar Proyek Kolaborasi Alumni):
  * `id` (uuid, PK)
  * `title` (varchar) & `description` (text)
  * `owner_id` (bigint, FK → `alumni_db.id`)
  * `cohort_id` (bigint, FK → `cohorts.id` ON DELETE SET NULL) - ID komunitas terkait.
  * `is_public` (boolean) - Visibilitas proyek di hub publik (default `false`).
  * `plan` (text) - Rencana pengerjaan / timeline proyek.
  * `milestones` (jsonb) - Daftar pencapaian target proyek (default `[]` array).
* **`project_updates`** (Catatan Progres Harian Proyek):
  * `id` (bigint, PK)
  * `created_at` (timestamp)
  * `project_id` (uuid, FK → `projects.id` ON DELETE CASCADE)
  * `title` (varchar) & `content` (text)
  * `author_id` (bigint, FK → `alumni_db.id`)
* **`jobs`** (Lowongan Kerja Ter-scrape):
  * `id` (bigint, PK)
  * `job_title` (varchar) & `company` (varchar)
  * `platform` (varchar) - Kalibrr, LinkedIn, dsb.
  * `job_url` (varchar) & `description` (text)
  * `requirements` (jsonb) & `job_desk` (jsonb)
  * `is_active` (boolean) & `status_reason` (text)
  * `category` (varchar) - Kategori industri pekerjaan (default `'Others / General'`).
* **`user_cvs`** (Draft CV ATS Pengguna):
  * `user_id` (bigint, PK, FK → `user.id` ON DELETE CASCADE)
  * `cv_data` (jsonb) - Menyimpan `layoutSettings` dan `htmlContent` lembar CV.
  * `updated_at` (timestamp)
* **`user_checklists`** (Progres Persiapan Karir):
  * `user_id` (bigint, FK → `user.id` ON DELETE CASCADE)
  * `target_role` (varchar) - Target posisi pekerjaan.
  * `completed_tasks` (jsonb) - Array string daftar tugas checklist yang telah selesai.
  * `updated_at` (timestamp)
  * *Constraint:* Primary Key on `(user_id, target_role)`.
* **`posts`** (Home Feed Update):
  * `id` (bigint, PK), `user_id` (bigint, FK), `content` (text), `media_url` (varchar), `likes_count` (int), `comments_count` (int), `cohort_id` (bigint, FK).

---

## 📡 API Route Handlers

Route Handlers Next.js dideklarasikan di bawah `app/api/` dan melayani permintaan AJAX dari komponen sisi klien:

### 🏠 Otentikasi & Akun
* **`POST /api/register`**: Mendaftarkan akun baru ke tabel `user` dengan password-hashing Bcrypt, dan menginisialisasi baris kosong untuk data profil di `alumni_db`.
* **`POST /api/login`**: Memverifikasi kredensial pengguna pada tabel `user`, membuat cookie HTTP-only `auth_token` berisi token JWT yang ditandatangani.
* **`POST /api/logout`**: Menghapus cookie `auth_token` dari browser pengguna.
* **`GET /api/me`**: Mengembalikan data identitas pengguna yang sedang masuk berdasarkan JWT.
* **`POST /api/account-settings`**: Mengubah pengaturan keamanan akun (seperti penggantian password).

### 👥 Komunitas (Multi-Tenant Cohorts)
* **`GET /api/cohorts`**: Mengambil daftar komunitas yang diikuti oleh pengguna saat ini (mengambil dari tabel `cohort_members`).
* **`GET /api/cohorts/[id]/members`**: Mengambil daftar seluruh anggota yang tergabung dalam komunitas tertentu.
* **`POST /api/cohorts/[id]/members`**: (Admin Komunitas) Mengundang pengguna lain ke komunitas berdasarkan email atau username.
* **`POST /api/cohorts/[id]/admin`**: (Admin Komunitas) Menjalankan aksi admin: memperbarui detail komunitas (`name`, `description`), mengubah role anggota (`admin` / `member`), atau mengeluarkan anggota dari komunitas (`remove_member`).

### 🛡️ Manajemen Pusat (Super Admin)
* **`GET /api/super-admin`**: Mengambil daftar seluruh komunitas (`cohorts`) dan pengguna (`user`) terdaftar.
* **`POST /api/super-admin`**: Menjalankan aksi super admin: mengubah tingkatan role user (`update_user_role`), memperpanjang masa berlaku komunitas (`extend_cohort` +30 hari), mengubah status langganan (`toggle_cohort_status` active/suspended), atau menghapus komunitas secara permanen (`delete_cohort`).

### 📝 Profil & Pengaturan
* **`GET /api/get-profile`**: Mengambil detail profil lengkap pengguna (termasuk riwayat pendidikan dan 9 profesi kondisional).
* **`POST /api/complete-profile`**: Menerima payload JSON pendaftaran onboarding profil lengkap, memvalidasi dengan Zod, dan menyimpannya menggunakan query SQL transaksi ke `alumni_db` dan tabel detail terkait.
* **`POST /api/profile-settings`**: Memperbarui informasi profil pengguna yang sudah ada.

### 🏢 Hub Proyek & Kolaborasi
* **`GET /api/projects`**: Mengembalikan daftar proyek manual yang tersedia (dapat difilter berdasarkan `cohort_id` komunitas aktif).
* **`POST /api/projects`**: Mengunggah detail proyek kolaborasi baru ke database.
* **`POST /api/projects/apply`**: Mengirimkan lamaran keanggotaan/kolaborasi ke suatu proyek.
* **`POST /api/projects/update-details`**: (Pemilik Proyek) Memperbarui rencana kerja (`plan`) dan target pencapaian (`milestones`) proyek.
* **`POST /api/projects/update-visibility`**: (Pemilik Proyek) Mengubah visibilitas proyek menjadi publik (`is_public = true`) atau privat (`is_public = false`).
* **`POST /api/projects/updates`**: (Pemilik Proyek) Menulis log pembaruan status harian proyek kolaborasi (disimpan di `project_updates`).

### 💼 Portal Lowongan & CV Creator
* **`GET /api/jobs`**: Mengambil daftar lowongan pekerjaan aktif (disaring berdasarkan kata kunci `search` pencarian, filter `category` industri, dan paginasi halaman).
* **`GET /api/jobs/cv`**: Mengambil draf CV ATS tersimpan di `user_cvs`. Jika kosong, akan merender data profil pengguna ke template Georgia Serif secara default.
* **`POST /api/jobs/cv`**: Menyimpan draf tata letak (`layoutSettings`) dan isi dokumen (`htmlContent`) CV pengguna secara real-time.
* **`POST /api/ai/cv-suggest`**: Mengirimkan teks deskripsi kegiatan kasar ke Gemini AI untuk dioptimalkan menjadi poin-poin bernarasi STAR/XYZ (impact-based).
* **`GET /api/learning-path/checklist`**: Membaca data status tugas persiapan karir pengguna dari tabel `user_checklists`.
* **`POST /api/learning-path/checklist`**: Menyimpan array daftar tugas persiapan karir yang telah dicentang pengguna.

### 🗺️ Data Referensi
* **`GET /api/reference/indonesia-cities`**: Autocomplete pencarian nama Kota/Kabupaten dan Provinsi di Indonesia untuk isian Domisili Form secara cepat.

### 🤖 Kecerdasan Buatan (AI) & Rekomendasi
* **`POST /api/ai/talent-search`**: Menghitung vector similarity untuk pencarian talenta semantik.
* **`POST /api/ai/project-recommendation`**: Menganalisis keselarasan profil dengan proyek dan menghasilkan deskripsi narasi kecocokan.
* **`POST /api/ai/gap-analysis`**: Membandingkan skill alumni dengan data lowongan kerja ter-scrape dan menyusun rekomendasi Learning Path.
* **`GET /api/ai/nodes-network`**: Menghasilkan koordinat graf (X, Y) melingkar berdasarkan persentase kecocokan profil untuk visualisasi nodes.
* **`GET /api/ai/saved-searches`**: Mengambil daftar riwayat hasil pencocokan/pencarian AI yang disimpan permanen oleh pengguna.
* **`POST /api/ai/saved-searches`**: Menyimpan payload hasil pencarian/pencocokan AI tertentu ke tabel `saved_ai_searches`.
* **`DELETE /api/ai/saved-searches/[id]`**: Menghapus riwayat pencarian AI tersimpan.

---

## ⚙️ Cara Menjalankan Migrasi Database

Seluruh modifikasi skema database dikelola melalui file migrasi SQL di folder `database/` dan dijalankan menggunakan skrip Python untuk menghindari kesalahan manual.

1. **Buat file SQL baru** di folder `database/` (contoh: `migration_008_new_feature.sql`).
2. **Buat skrip python runner** yang membaca file SQL dan mengeksekusinya menggunakan library `asyncpg` dengan memanfaatkan koneksi database Supabase.
3. Jalankan skrip migrasi lewat terminal:
   ```bash
   source venv/bin/activate
   python database/run_migration_XXX.py
   ```
