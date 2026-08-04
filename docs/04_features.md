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

Unified gateway untuk menjelajah proyek, mencocokkan peluang kerja tim, dan mengelola alur kerja internal proyek.

### Sub-Tab A: Jelajah Proyek (Manual Grid)
* Menampilkan daftar semua proyek kolaborasi yang dibuat oleh alumni dalam bentuk kartu proyek.
* Dilengkapi filter manual berdasarkan Kategori Sektor, Tag Keahlian, dan Durasi Proyek.
* Kartu proyek menampilkan status (Aktif/Selesai), inisiator, badging sektor, dan daftar keahlian yang dibutuhkan.

### Sub-Tab B: Cari Peluang Kolaborasi (AI-Powered)
* Halaman interaktif minimalis dengan **AI Prompt Box** besar di bagian tengah.
* Pengguna mengetikkan preferensi ketersediaan mereka, seperti: *"Saya punya waktu luang 5 jam/minggu, ahli di bidang copywriting bahasa Inggris, tertarik proyek lingkungan hidup."*
* **Prompt Starters:** Rekomendasi template ketikan siap pakai untuk memandu pengguna yang kebingungan.
* **Output Pencocokan Proyek:** Menampilkan daftar proyek yang paling cocok, lengkap dengan persentase kecocokan dan **narasi "Alasan Rekomendasi AI"** yang menjabarkan mengapa proyek tersebut sesuai untuk mereka.

### Fitur Pemilik Proyek (Project Owner Tools)
Pada halaman detail proyek (`/projects/[id]`), pemilik proyek dibekali dengan alat manajemen internal:
* **Pengaturan Visibilitas:** Mengubah status proyek menjadi Publik (dapat dicari oleh siapa saja) atau Privat (hanya dapat dilihat di lingkungan komunitas terkait).
* **Rencana Kerja & Milestones:** Mengedit teks rencana kerja (`plan`) dan menyusun checklist pencapaian target (`milestones`) proyek secara terstruktur.
* **Log Harian / Pembaruan Progres (Project Updates):** Menambahkan catatan pembaruan harian atau mingguan mengenai kemajuan proyek yang dapat dibaca oleh seluruh kolaborator.

---

## 👤 7. Halaman Profil Pengguna

Portofolio personal alumni untuk memamerkan keahlian dan riwayat profesional mereka.
* **Header Profil:** Menampilkan Nama Lengkap, Nama Panggilan, Kota Domisili saat ini, link media sosial (Instagram, LinkedIn, Portofolio), dan tombol "Edit Profile".
* **Tab Info Karier:** Menampilkan detail profesi yang diisi saat onboarding (misalnya, data Wirausaha, data Pendidik) secara rapi dalam panel-panel terpisah.
* **Tab Daftar Proyek:** Memuat dua daftar proyek: proyek yang diinisiasi sendiri oleh pengguna, dan proyek milik orang lain yang sedang/pernah mereka ikuti sebagai kolaborator.
* **Tombol Eksplorasi Hubungan (Visual Nodes):** Tombol interaktif yang mengarahkan pengguna ke halaman visualisasi network relasi mereka dengan talenta/proyek lain secara dinamis.

---

## 💼 8. Portal Jobs, Kesiapan Karir & CV Creator (`/jobs`)

Gerbang karir terpadu yang memadukan pencarian loker, analisis kesiapan karir berbasis AI, dan pembuatan CV berstandar ATS. Fitur ini terbagi menjadi 3 Sub-Tab interaktif:

### Sub-Tab A: Lowongan Pekerjaan (Jobs Portal)
* Menampilkan daftar loker aktif hasil scraping LinkedIn & Kalibrr.
* Dilengkapi kotak pencarian (search bar) posisi/perusahaan dan filter kategori sektor industri.
* Kartu lowongan dapat diekspansi untuk menampilkan detail deskripsi pekerjaan dan daftar keahlian yang dibutuhkan, serta memiliki tombol CTA "Lamar" (External Link) untuk melamar langsung ke platform asal.

### Sub-Tab B: Learning Path (Persiapan Kerja)
* Pengguna menentukan target peran karir (baik peran populer maupun peran kustom).
* **Kalkulasi Selisih Skill (AI Gap Analysis):** Membandingkan skill gabungan pengguna dengan kebutuhan riil industri kerja, lalu menjabarkan skill yang belum dikuasai.
* **Rekomendasi Jalur Belajar:** Merancang kurikulum mandiri terstruktur (topik pelatihan, sertifikasi yang disarankan, dan rencana aksi belajar).
* **Checklist Persiapan Kerja:** Dasbor tugas interaktif (seperti *Perbarui CV*, *Sertifikasi AWS*, dsb.). Progres penyelesaian tugas dihitung dalam bentuk persentase live (Progress Ring) dan status checklist otomatis tersinkronisasi ke tabel database `user_checklists`.

### Sub-Tab C: ATS CV Creator
* Lembar editor draf CV berstandar ATS internasional berbasis tipografi Georgia Serif klasik yang bersih.
* **Kustomisasi Tata Letak (Layout Settings):** Pilihan 1 kolom (standar) atau 2 kolom (posisi sidebar di kiri/kanan, lebar sidebar 20-50%, dan jarak spasi kolom 8-40px).
* **Asisten AI STAR/XYZ:** Kotak dialog AI untuk menulis ulang teks pekerjaan kasar menjadi poin-poin profesional yang berfokus pada hasil/dampak nyata (STAR formula) menggunakan model Google Gemini.
* **Penyimpanan Otomatis (Autosave):** Sistem melakukan autosave ke database `user_cvs` 2 detik setelah pengguna berhenti mengetik, didukung indikator visual status draf (Tersimpan, Menyimpan, Belum Disimpan).
* **Cetak PDF Bersih:** Integrasi media query print untuk memastikan CV dapat diunduh sebagai berkas PDF A4 yang bersih tanpa navbar, sidebar, atau tombol editor.

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

---

## 🛡️ 11. Super Admin Control Panel (`/super-admin`)

Halaman kontrol terpusat bagi pengelola utama platform (khusus pengguna dengan role `super_admin` atau saat berada di lingkungan localhost dev).
* **Manajemen Komunitas (Cohorts):** Memantau semua kelompok komunitas yang terdaftar, memperpanjang lisensi masa berlaku komunitas (+30 Hari), membekukan (suspend) / mengaktifkan status komunitas, serta menghapus komunitas.
* **Manajemen Pengguna:** Melihat seluruh pengguna terdaftar dan menaikkan hak akses pengguna biasa menjadi `super_admin` atau mengembalikannya menjadi `member`.

---

## 👥 12. Konsol Admin Komunitas (`/cohort-admin`)

Halaman khusus pengurus komunitas (Cohort Admin) untuk mengelola kelompok secara mandiri.
* **Pengaturan Komunitas:** Mengubah nama kelompok dan deskripsi visi-misi komunitas.
* **Kelola Anggota:** Mengundang anggota baru berdasarkan email/username, mengubah status peran anggota menjadi `admin` atau `member`, dan mengeluarkan anggota dari kelompok komunitas.
* **Statistik Lisensi:** Menampilkan jumlah anggota aktif, tipe paket langganan, dan sisa hari masa aktif komunitas (langganan).
