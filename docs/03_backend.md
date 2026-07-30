# 03. Backend & Database Schema - Supabase & API Route Handlers

Dokumen ini menjelaskan infrastruktur backend, skema relasional basis data PostgreSQL Supabase, dan katalog Route Handlers API Next.js.

---

## 🗄️ Skema Database Relasional (Supabase)

Seluruh data alumni disimpan dalam database PostgreSQL Supabase dengan skema relasional yang terbagi menjadi data profil utama dan tabel detail bersyarat.

### 1. Tabel Profil Utama: `alumni_db`
Menyimpan biodata wajib pengguna. Pengguna diidentifikasi menggunakan `id` (bigint) yang terhubung ke `auth.users(id)` di Supabase.

* **`id`** (bigint, PK) - ID Unik Alumni.
* **`email`** (varchar, UNIQUE) - Alamat email aktif.
* **`nama_lengkap`** (varchar) & **`nama_panggilan`** (varchar)
* **`tahun_lahir_int`** (integer) - Tahun kelahiran.
* **`jenis_kelamin`** (varchar) - Laki-laki / Perempuan.
* **`nomor_handphone_varchar`** (varchar) - Nomor kontak (format `62xxx`).
* **`domisili_provinsi`** (varchar) & **`domisili_kota_kabupaten`** (varchar)
* **`skill_gabungan`** (text) - Deskripsi keahlian gabungan (untuk pencarian AI).
* **`bahasa_dikuasai`** (text) & **`sertifikasi`** (text)
* **`instagram_link`**, **`linkedin_link`**, **`portofolio_link`** (varchar)
* **`aktivitas`** (varchar) - Array teks aktivitas yang dipilih (disimpan koma-terpisah).
* **`aktivitas_status_durasi`** (jsonb) - Menyimpan status keaktifan tiap profesi.
* **`gabungan_data`** (text) - Teks gabungan seluruh isi profil yang diindeks untuk AI Search.

### 2. Tabel Riwayat Pendidikan: `alumni_education_histories`
Hubungan One-to-Many dengan `alumni_db` untuk menyimpan riwayat studi:
* `id` (bigint, PK)
* `alumni_id` (bigint, FK → `alumni_db.id`)
* `level` (varchar) - SMA/SMK, S1, S2, dsb.
* `institution_name` (varchar) - Nama sekolah/kampus.
* `major_program` (varchar) - Jurusan.
* `start_year` & `end_year` (integer)
* `is_current` (boolean) - Apakah sedang menempuh studi di sini.

### 3. Sembilan Tabel Detail Aktivitas Kondisional (One-to-One)
Setiap tabel memiliki Primary Key `id` dan Foreign Key `alumni_id` (bigint, UNIQUE, FK → `alumni_db.id`):

1. **`alumni_pekerja`**: `nama_instansi` (text), `posisi` (text), `pengalaman_proyek` (text), `keahlian_pekerja` (text), `akses_jejaring` (boolean), `pengalaman_bermitra` (boolean).
2. **`alumni_bisnis`**: `nama_usaha` (text), `skala_usaha` (text), `keahlian_wirausahaan` (text), `produk_layanan_utama` (text), `kendala_bisnis` (text), `target_pasar` (text), `kolaborasi_terbuka` (text), `keahlian_dibagikan` (text).
3. **`alumni_sosial`**: `nama_organisasi` (text), `isu_fokus` (text), `keahlian_sosial` (text), `pengalaman_proyek_sosial` (text), `pengalaman_bermitra_sosial` (boolean).
4. **`alumni_kreatif`**: `keahlian_kreatif` (text), `platform_digital_utama` (text), `jenis_konten` (text), `total_jangkauan` (text), `kisaran_rate_card` (text), `demografi_followers` (text).
5. **`alumni_rumah_tangga`**: `keahlian_irt` (text), `kegiatan_organisasi_irt` (text), `pengalaman_tim_irt` (boolean), `mencari_pekerjaan_kolaborasi_irt` (boolean).
6. **`alumni_mahasiswa`**: `keahlian_mahasiswa` (text), `kegiatan_organisasi_mahasiswa` (text), `pengalaman_magang` (text), `pengalaman_tim_mahasiswa` (boolean), `mencari_pekerjaan_kolaborasi_mahasiswa` (boolean).
7. **`alumni_informal`**: `keahlian_informal` (text), `pengalaman_tim_informal` (boolean), `pernah_rekrut_memimpin` (boolean).
8. **`alumni_agri`**: `keahlian_agri` (text), `komoditas_utama` (text), `tergabung_kelompok` (boolean), `skala_usaha_agri` (text), `nilai_tambah_diterapkan` (text), `kendala_dihadapi_agri` (text).
9. **`alumni_pendidik`**: `keahlian_pendidik` (text), `jenjang_pendidikan` (text), `mata_pelajaran` (text), `inovasi_pembelajaran` (text), `mengajar_bimbel` (boolean).

### 4. Tabel Fitur Tambahan (Otomatisasi & AI)
* **`saved_ai_searches`** (Penyimpanan Hasil AI): `id` (bigint, PK), `user_id` (bigint, FK → `user.id`), `title` (varchar), `search_type` (varchar), `query_prompt` (text), `results_payload` (jsonb), `created_at` (timestamp).
* **`ai_recommendations`** (Cache Sementara): `id` (bigint, PK), `user_id` (bigint, FK → `user.id`), `recommendation_type` (varchar), `input_prompt` (text), `output_result` (jsonb), `created_at` (timestamp), `expires_at` (timestamp).

---

## 📡 API Route Handlers

Route Handlers Next.js dideklarasikan di bawah `app/api/` dan melayani permintaan AJAX dari komponen sisi klien:

### 🏠 Otentikasi & Akun
* **`POST /api/register`**: Mendaftarkan akun baru ke tabel `user` dengan password-hashing Bcrypt, dan menginisialisasi baris kosong untuk data profil di `alumni_db`.
* **`POST /api/login`**: Memverifikasi kredensial pengguna pada tabel `user`, membuat cookie HTTP-only `auth_token` berisi token JWT yang ditandatangani.
* **`POST /api/logout`**: Menghapus cookie `auth_token` dari browser pengguna.
* **`GET /api/me`**: Mengembalikan data identitas pengguna yang sedang masuk berdasarkan JWT.
* **`POST /api/account-settings`**: Mengubah pengaturan keamanan akun (seperti penggantian password).

### 📝 Profil & Pengaturan
* **`GET /api/get-profile`**: Mengambil detail profil lengkap pengguna (termasuk riwayat pendidikan dan 9 profesi kondisional).
* **`POST /api/complete-profile`**: Menerima payload JSON pendaftaran onboarding profil lengkap, memvalidasi dengan Zod, dan menyimpannya menggunakan query SQL transaksi ke `alumni_db` dan tabel detail terkait.
* **`POST /api/profile-settings`**: Memperbarui informasi profil pengguna yang sudah ada.

### 🏢 Hub Proyek & Kolaborasi
* **`GET /api/projects`**: Mengembalikan daftar proyek manual yang tersedia.
* **`POST /api/projects`**: Mengunggah detail proyek kolaborasi baru ke database.
* **`POST /api/projects/apply`**: Mengirimkan lamaran keanggotaan/kolaborasi ke suatu proyek.

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
