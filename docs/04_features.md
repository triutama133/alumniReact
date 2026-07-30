# 04. Features - Core Functional Specifications

Dokumen ini menjelaskan alur kerja, spesifikasi detail, dan kebutuhan fungsional dari enam halaman utama yang membentuk ekosistem **Indonesia Talent Hub**.

---

## 🚀 1. Landing Page (Halaman Publik Utama)

Halaman utama yang diakses oleh publik sebelum masuk ke aplikasi. Berfungsi memperkenalkan platform dan menarik alumni baru untuk bergabung.
* **Hero Section:** Judul provokatif bertema kolaborasi AI, deskripsi singkat platform, dan tombol CTA utama "Bergabung Sekarang".
* **Statistik Komunitas:** Menampilkan jumlah total talenta, proyek aktif, dan kolaborasi yang berhasil secara dinamis.
* **Quick Talent Search:** Kotak pencarian tradisional mini untuk memberikan demonstrasi pencarian talenta secara langsung.
* **CTA Register/Login:** Bagian penutup yang mempermudah navigasi user untuk melakukan pendaftaran akun.

---

## 🔑 2. Authentication Page (Registrasi & Login)

Sistem masuk satu pintu menggunakan kredensial email dan kata sandi yang terenkripsi aman.
* **Form Registrasi:** Mengambil Email, Password, Konfirmasi Password, serta Kode Undangan/Aktivasi jika diaktifkan. Validasi password wajib memiliki minimal 8 karakter.
* **Form Login:** Input Email dan Password yang langsung memicu otentikasi Supabase. Jika sukses, browser mendapatkan HTTP-only cookie berisi token JWT.
* **Status Sesi Pengguna:** Jika pengguna yang sudah login mencoba mengakses `/login` atau `/register`, middleware otomatis mengalihkan mereka ke Beranda (`/`).

---

## 📋 3. Onboarding Profile Form (Wajib & Bersyarat)

Formulir 24 pertanyaan wajib diisi setelah pendaftaran sebelum pengguna dapat mengakses halaman dalam aplikasi.
* **Informasi Pribadi & Kontak:** Nama Lengkap, Nama Panggilan, Tahun Lahir, Jenis Kelamin, Kota Domisili (dengan pencarian dinamis), dan Nomor Handphone.
* **Riwayat Pendidikan Terakhir:** Tingkat pendidikan, Institusi, Jurusan, Tahun Masuk/Keluar, dan status keaktifan sekolah/kuliah.
* **Pemilih Aktivitas (Multi-select):** Pengguna dapat memilih satu atau beberapa aktivitas profesi (Pekerja, Wirausaha, Mahasiswa, dsb.).
* **Form Detail Bersyarat (Dynamic Form):**
  * Begitu aktivitas tertentu dipilih, form input spesifik untuk aktivitas tersebut akan muncul.
  * Masing-masing detail diisi dalam bentuk array agar pengguna dapat menambahkan lebih dari satu riwayat pekerjaan/usaha jika dibutuhkan.
  * **Logika Auto-Skip:** Jika status keaktifan aktivitas disetel ke `Berhenti >5 tahun lalu`, semua pertanyaan detail untuk profesi tersebut disembunyikan.

---

## 📰 4. Beranda & Social Feed (Gaya LinkedIn)

Pusat interaksi sosial dan pertukaran informasi antar-alumni yang dinamis.
* **Posting Composer:** Textarea di bagian atas halaman untuk membuat pembaruan status baru. Mendukung pengetikan teks panjang dan penyematan tautan media.
* **Aktivitas Feed:** Menampilkan daftar postingan terbaru dari seluruh alumni, lengkap dengan informasi pembuat post, cap waktu, tombol Suka (Like), dan Komentar.
* **Sidebar AI Recommendations Widget:** Kotak interaktif di bagian samping yang menampilkan nama-nama alumni lain yang memiliki tingkat kecocokan kolaborasi tinggi berdasarkan profil AI.

---

## 🔍 5. AI-Powered Search (Pencarian Talenta Cerdas)

Fitur utama untuk menemukan rekan kolaborasi ideal menggunakan bahasa alami.
* **AI Prompt Box:** Input pencarian besar di bagian atas. Pengguna bisa menulis: *"Saya sedang butuh desainer grafis domisili Bandung yang bisa diajak bikin poster sosial."*
* **Filter Tradisional Dropdown:** Filter pendukung seperti dropdown Kota/Provinsi, checkbox Kategori Profesi, dan pilihan Status Keaktifan.
* **Kartu Hasil Pencarian Talenta:** Menampilkan foto profil, inisial nama, lencana aktivitas utama, tag keahlian, dan tombol "Lihat Profil" untuk membuka data lengkap.

---

## 💼 6. Hub Proyek & Kolaborasi (Dua Sub-Tab)

Unified gateway untuk menjelajah proyek dan mencocokkan peluang kerja tim.

### Sub-Tab A: Jelajah Proyek (Manual Grid)
* Menampilkan daftar semua proyek kolaborasi yang dibuat oleh alumni dalam bentuk kartu proyek.
* Dilengkapi filter manual berdasarkan Kategori Sektor, Tag Keahlian, dan Durasi Proyek.
* Kartu proyek menampilkan status (Aktif/Selesai), inisiator, badging sektor, dan daftar keahlian yang dibutuhkan.

### Sub-Tab B: Cari Peluang Kolaborasi (AI-Powered)
* Halaman interaktif minimalis dengan **AI Prompt Box** besar di bagian tengah.
* Pengguna mengetikkan preferensi ketersediaan mereka, seperti: *"Saya punya waktu luang 5 jam/minggu, ahli di bidang copywriting bahasa Inggris, tertarik proyek lingkungan hidup."*
* **Prompt Starters:** Rekomendasi template ketikan siap pakai untuk memandu pengguna yang kebingungan.
* **Output Pencocokan Proyek:** Menampilkan daftar proyek yang paling cocok, lengkap dengan persentase kecocokan dan **narasi "Alasan Rekomendasi AI"** yang menjabarkan mengapa proyek tersebut sesuai untuk mereka.

---

## 👤 7. Halaman Profil Pengguna

Portofolio personal alumni untuk memamerkan keahlian dan riwayat profesional mereka.
* **Header Profil:** Menampilkan Nama Lengkap, Nama Panggilan, Kota Domisili saat ini, link media sosial (Instagram, LinkedIn, Portofolio), dan tombol "Edit Profile".
* **Tab Info Karier:** Menampilkan detail profesi yang diisi saat onboarding (misalnya, data Wirausaha, data Pendidik) secara rapi dalam panel-panel terpisah.
* **Tab Daftar Proyek:** Memuat dua daftar proyek: proyek yang diinisiasi sendiri oleh pengguna, dan proyek milik orang lain yang sedang/pernah mereka ikuti sebagai kolaborator.
* **Tombol Eksplorasi Hubungan (Visual Nodes):** Tombol interaktif yang mengarahkan pengguna ke halaman visualisasi network relasi mereka dengan talenta/proyek lain secara dinamis.

---

## 📊 8. Halaman Analisis Gap & Jalur Belajar (Learning Path)

Fitur yang mempertemukan profil keahlian alumni dengan kebutuhan real-time industri kerja berdasarkan data lowongan kerja aktif (LinkedIn & Kalibrr) hasil scraping.
* **Kalkulasi Selisih Skill (Gap Analysis):** AI membandingkan daftar skill gabungan alumni dengan persyaratan lowongan kerja terpopuler untuk posisi/peran target mereka.
* **Rekomendasi Jalur Belajar (Learning/Training Path):** AI merancang kurikulum belajar mandiri yang berisi topik pelatihan, sertifikasi yang disarankan, atau kursus yang relevan untuk menutup gap keahlian tersebut.
* **Checklist Persiapan Kerja:** Dasbor interaktif bagi talenta untuk menandai progres persiapan mereka (misalnya: *CV Updated, Portfolio Project A Completed, Certification B Achieved*) guna mengukur persentase kesiapan kerja mereka secara live.

---

## 🕸️ 9. Halaman Visualisasi Relasi Kolaborasi (Nodes Network Page)

Halaman visual interaktif premium untuk menjelajahi potensi kolaborasi tanpa jenuh membaca daftar teks panjang.
* **Visualisasi Simpul Jaringan (Nodes Graph):** Menampilkan profil pengguna saat ini sebagai simpul pusat (*Center Node*) yang bercahaya, dikelilingi oleh simpul-simpul talenta lain dan proyek yang direkomendasikan.
* **Tombol Pemicu "Rekomendasi":** Ketika diklik, sistem menjalankan animasi transisi partikel yang menghubungkan garis relasi (*edges*) dari pusat ke simpul-simpul luar berdasarkan tingkat kecocokan (makin tebal garis/dekat jarak node, semakin tinggi kecocokannya).
* **Sidebar Detail Dinamis:** Klik pada simpul talenta/proyek lain akan membuka panel detail modern di sisi layar, menampilkan skor persentase kecocokan beserta deskripsi **"Alasan Rekomendasi AI"** secara kontekstual.

---

## 💾 10. Fitur Penyimpanan Hasil Pencarian & Pencocokan AI (Saved AI Matches)

Untuk efisiensi kuota biaya API LLM dan kemudahan akses di masa depan:
* **Penanda Pencarian (Bookmark Match):** Pengguna dapat menyimpan hasil pencarian AI (baik pencarian talenta maupun pencocokan proyek) ke dalam daftar simpanan mereka dengan mengklik tombol "Simpan Hasil".
* **Dashboard Riwayat AI:** Halaman arsip personal tempat pengguna membaca kembali daftar rekomendasi dan hasil analisis AI sebelumnya secara instan tanpa memicu LLM ulang.
