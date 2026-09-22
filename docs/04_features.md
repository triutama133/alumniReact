# 04. Features - Core Functional Specifications

Dokumen ini menjelaskan alur kerja, spesifikasi detail, dan kebutuhan fungsional dari fitur-fitur yang membentuk ekosistem **HubTalent**.

> **Catatan verifikasi (22 September 2026):** Dokumen ini awalnya ditulis sebagai spesifikasi rencana. Isinya telah diverifikasi ulang terhadap source code aktual (halaman, API route, dan migrasi database) dan dikoreksi di tempat yang ternyata berbeda dari implementasi nyata. Legenda status yang dipakai di setiap bagian:
> - ✅ **Fully implemented** — berjalan nyata di kode, bukan rencana.
> - ⚠️ **Partially implemented** — sebagian berjalan, ada gap/catatan penting.
> - ❌ **Not implemented** — belum ada di kode meski dideskripsikan di sini sebagai fitur.
>
> Untuk audit lengkap per-fitur beserta referensi file, lihat [`CAPSTONE_PROJECT_DOCUMENTATION.md`](./CAPSTONE_PROJECT_DOCUMENTATION.md).

---

## 🚀 1. Landing Page (Halaman Publik Utama) — ✅ Implemented

Halaman utama yang diakses oleh publik sebelum masuk ke aplikasi (`app/landing`). Middleware mengarahkan pengguna yang belum login ke halaman ini. Berfungsi memperkenalkan platform dan menarik alumni baru untuk bergabung.
* **Hero Section:** Judul provokatif bertema kolaborasi AI, deskripsi singkat platform, dan tombol CTA utama "Bergabung Sekarang".
* **Statistik Komunitas:** Menampilkan jumlah total talenta, proyek aktif, dan kolaborasi yang berhasil secara dinamis.
* **Quick Talent Search:** Kotak pencarian tradisional mini untuk memberikan demonstrasi pencarian talenta secara langsung.
* **CTA Register/Login:** Bagian penutup yang mempermudah navigasi user untuk melakukan pendaftaran akun.

> Catatan: `DEVELOPMENT_PLAN.md` versi lama menandai halaman ini sebagai "❌ Missing" — itu sudah tidak akurat, halaman ini sudah ada dan dipakai oleh middleware sebagai redirect target untuk pengguna anonim.

---

## 🔑 2. Authentication Page (Registrasi & Login) — ✅ Implemented

Sistem masuk satu pintu menggunakan kredensial email dan kata sandi yang terenkripsi aman (bcrypt).
* **Form Registrasi:** Mengambil Email, Password, Konfirmasi Password. Validasi password wajib memiliki minimal 8 karakter. Dilindungi Cloudflare Turnstile (captcha) yang diverifikasi di server.
* **Form Login:** Input Email dan Password memicu otentikasi **custom JWT** — bukan Supabase Auth. Supabase di project ini hanya dipakai sebagai database Postgres (via service-role key), bukan sebagai auth provider. Jika sukses, browser mendapatkan HTTP-only cookie `auth_token` berisi JWT (ditandatangani dengan `jose`) yang menyimpan `sub`, `email`, `role`, `profile_completed`, `must_change_password`, dan `auth_version`.
* **Status Sesi Pengguna:** Middleware (`middleware.ts`) memverifikasi JWT di setiap request; mengarahkan user yang belum login ke `/landing`, dan user yang sudah login yang mencoba akses `/login`/`/register` dialihkan otomatis.
* **Keamanan tambahan:** Rate limiting (in-memory, per-IP) pada endpoint login/register/reset-password, invalidasi sesi otomatis via `auth_session_version` saat password diganti, dan pencatatan audit ke tabel `auth_security_events`/`account_security_audit_logs`.

---

## 📋 3. Onboarding Profile Form (Wajib & Bersyarat) — ✅ Implemented

Formulir satu halaman panjang (bukan wizard multi-step) yang wajib diisi setelah pendaftaran sebelum pengguna dapat mengakses halaman dalam aplikasi. Mencakup ~19+ pertanyaan umum plus form bersyarat untuk 9 jenis aktivitas — semuanya benar-benar tersimpan ke 9 tabel terpisah (`alumni_pekerja`, `alumni_bisnis`, `alumni_sosial`, `alumni_kreatif`, `alumni_rumah_tangga`, `alumni_mahasiswa`, `alumni_informal`, `alumni_agri`, `alumni_pendidik`), bukan hanya 3 seperti yang sempat tercatat di `DEVELOPMENT_PLAN.md` versi lama.
* **Informasi Pribadi & Kontak:** Nama Lengkap, Nama Panggilan, Tahun Lahir, Jenis Kelamin, Kota Domisili (dengan pencarian dinamis), dan Nomor Handphone.
* **Riwayat Pendidikan Terakhir:** Tingkat pendidikan, Institusi, Jurusan, Tahun Masuk/Keluar, dan status keaktifan sekolah/kuliah.
* **Pemilih Aktivitas (Multi-select):** Pengguna dapat memilih satu atau beberapa aktivitas profesi (Pekerja, Wirausaha, Mahasiswa, dsb.).
* **Form Detail Bersyarat (Dynamic Form):**
  * Begitu aktivitas tertentu dipilih, form input spesifik untuk aktivitas tersebut akan muncul.
  * Masing-masing detail diisi dalam bentuk array agar pengguna dapat menambahkan lebih dari satu riwayat pekerjaan/usaha jika dibutuhkan.
  * **Logika Auto-Skip:** Jika status keaktifan aktivitas disetel ke `Berhenti >5 tahun lalu`, semua pertanyaan detail untuk profesi tersebut disembunyikan.

---

## 📰 4. Beranda & Social Feed (Gaya LinkedIn) — ✅ Implemented

Pusat interaksi sosial dan pertukaran informasi antar-alumni yang dinamis. Konten post disanitasi (HTML sanitize) di server sebelum disimpan, dan feed sudah cohort-aware (difilter sesuai komunitas).
* **Posting Composer:** Textarea di bagian atas halaman untuk membuat pembaruan status baru.
* **Aktivitas Feed:** Menampilkan daftar postingan terbaru, lengkap dengan tombol Suka (Like, tabel `post_likes`) dan Komentar (tabel `post_comments`) — keduanya memicu notifikasi real-time ke pemilik post (tabel `notifications`).
* **Sidebar AI Recommendations Widget:** Untuk sumber "home", endpoint `collaboration-recommendation` **tidak memanggil LLM** — skor kecocokan dihitung secara lokal (keyword overlap sederhana terhadap `alumni_db`), lalu disusun jadi teks markdown. Ini bukan LLM call sungguhan seperti yang tersirat sebelumnya.
* **Messaging & Notifikasi:** Fitur terkait yang juga sudah berjalan nyata (di luar cakupan awal dokumen ini): direct messaging 1-on-1 (`/messages`, tabel `conversations`/`messages`, sudah didaftarkan ke Supabase Realtime) dan bell notifikasi di navbar.

---

## 🔍 5. AI-Powered Search (Pencarian Talenta Cerdas) — ✅ Implemented (dua mode)

Fitur pencarian dengan dua tab: pencarian filter tradisional dan pencarian berbasis AI.
* **AI Prompt Box:** Input pencarian besar di bagian atas. Pengguna bisa menulis: *"Saya sedang butuh desainer grafis domisili Bandung yang bisa diajak bikin poster sosial."*
* **Filter Tradisional Dropdown:** Filter pendukung seperti dropdown Kota/Provinsi, checkbox Kategori Profesi, dan pilihan Status Keaktifan.
* **Kartu Hasil Pencarian Talenta:** Menampilkan foto profil, inisial nama, lencana aktivitas utama, tag keahlian, dan tombol "Lihat Profil" untuk membuka data lengkap.
* **Cara kerja AI di balik layar (koreksi penting):** `app/api/ai/talent-search` hanyalah proxy tipis ke backend FastAPI terpisah (`main.py`), yang menjalankan **keyword/weighted-token matching** (`cari_alumni_untuk_proyek`, `compute_weighted_match_score`) untuk menyaring kandidat, lalu mengirim daftar itu ke **Google Gemini** untuk ditulis ulang jadi narasi rekomendasi. Ini bukan *vector/embedding semantic search* — istilah "AI-Powered" di sini berarti "keyword retrieval + LLM narration", bukan pencarian semantik murni.

---

## 💼 6. Hub Proyek & Kolaborasi (Dua Sub-Tab) — ⚠️ Partially implemented

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

> **Catatan implementasi:** Semua fitur di atas berjalan nyata dengan API route dan tabel database sungguhan. Dua hal yang perlu diperbaiki/didokumentasikan lebih lanjut: (1) listing proyek (`GET`) tidak lewat `app/api/projects` (yang hanya punya `POST`) — halaman `/projects` query Supabase langsung dari server component, jadi ada dua jalur akses data yang tidak konsisten; (2) kolom/tabel yang jelas dipakai kode (`projects.is_public`, `projects.plan`, `projects.milestones`, tabel `project_updates`) tidak punya file migrasi yang tercatat di `database/` — riwayat migrasi belum lengkap dibanding skema yang benar-benar dipakai.

---

## 👤 7. Halaman Profil Pengguna — ✅ Implemented (kecuali tombol Nodes)

Portofolio personal alumni untuk memamerkan keahlian dan riwayat profesional mereka. Route yang ada adalah `/profile/[userId]` — tidak ada route `/profile` polos untuk self-view.
* **Header Profil:** Menampilkan Nama Lengkap, Nama Panggilan, Kota Domisili saat ini, link media sosial (Instagram, LinkedIn, Portofolio), dan tombol "Edit Profile" (mengarah ke `/profile/edit/[userId]`, form penuh yang fungsional).
* **Tab Info Karier:** Menampilkan detail profesi yang diisi saat onboarding (misalnya, data Wirausaha, data Pendidik) secara rapi dalam panel-panel terpisah, lengkap dengan ikon berbeda per jenis aktivitas.
* **Tab Daftar Proyek:** Memuat dua daftar proyek: proyek yang diinisiasi sendiri oleh pengguna, dan proyek milik orang lain yang sedang/pernah mereka ikuti sebagai kolaborator.
* ~~**Tombol Eksplorasi Hubungan (Visual Nodes)**~~ — ❌ **Belum ada.** Tidak ditemukan halaman visualisasi network relasi di manapun pada `app/(main)`. Lihat bagian 9 di bawah.

---

## 💼 8. Portal Jobs, Kesiapan Karir & CV Creator (`/jobs`) — ⚠️ Partially implemented

Gerbang karir terpadu yang memadukan pencarian loker, analisis kesiapan karir berbasis AI, dan pembuatan CV berstandar ATS. Fitur ini terbagi menjadi 3 Sub-Tab interaktif:

### Sub-Tab A: Lowongan Pekerjaan (Jobs Portal) — ⚠️ Data real, sumber data belum terverifikasi
* Menampilkan daftar loker aktif dari tabel `jobs` (nyata, bukan mock) dengan search dan filter kategori sektor.
* **Koreksi:** klaim "hasil scraping LinkedIn & Kalibrr" **tidak terbukti di kode** — tidak ditemukan script scraper apapun di repo. Sebuah migration (`migration_008_add_job_category.py`) mengandung path lokal developer, mengindikasikan data loker dimasukkan secara manual/ad hoc, bukan lewat pipeline otomatis. Klaim ini sebaiknya diperbarui atau ditandai sebagai proses manual, bukan fitur otomatis.
* Kartu lowongan dapat diekspansi untuk menampilkan detail deskripsi pekerjaan dan daftar keahlian yang dibutuhkan, serta memiliki tombol CTA "Lamar" (External Link) untuk melamar langsung ke platform asal.

### Sub-Tab B: Learning Path (Persiapan Kerja) — ✅ Implemented
* Pengguna menentukan target peran karir (baik peran populer maupun peran kustom).
* **Kalkulasi Selisih Skill (AI Gap Analysis):** Backend FastAPI membandingkan skill gabungan pengguna dengan kebutuhan riil dari lowongan **aktif sungguhan** di tabel `jobs` (token-weighted matching, bukan embedding), lalu mengirim hasilnya ke Gemini untuk menyusun gap analysis, learning path, dan checklist terstruktur (fallback ke saran generik bila tidak ada lowongan yang cocok).
* **Checklist Persiapan Kerja:** Progres tersimpan nyata per-user per-role di tabel `user_checklists` — bukan sekadar UI statis.

### Sub-Tab C: ATS CV Creator — ✅ Implemented, paling matang di antara semua fitur AI
* Lembar editor draf CV berstandar ATS.
* **Kustomisasi Tata Letak (Layout Settings):** Pilihan 1 kolom atau 2 kolom.
* **Asisten AI STAR/XYZ:** Memanggil Google Gemini langsung dari server Next.js (`app/api/ai/cv-suggest`, bukan lewat backend FastAPI). Dilindungi 3 lapis: cek auth, rate limit per-menit (5/menit, in-memory), dan **kuota harian persisten** (30/hari) via tabel `ai_daily_usage` + RPC atomik `increment_ai_daily_usage`. Ini satu-satunya endpoint AI di repo yang punya kuota harian — endpoint AI lain (talent-search, project-recommendation, learning-path) belum punya proteksi biaya serupa.
* **Penyimpanan Otomatis (Autosave):** Autosave ke tabel `user_cvs`.
* **Cetak PDF Bersih:** Integrasi media query print untuk PDF A4 bersih.

---

## 🕸️ 9. Halaman Visualisasi Relasi Kolaborasi (Nodes Network Page) — ❌ Not implemented

> **Status: fitur ini belum dibangun.** Tidak ada halaman di `app/(main)` yang cocok dengan deskripsi visualisasi node-graph di bawah ini. Satu-satunya artefak terkait, sebuah API statistik jaringan (`app/api/stats/network/route.ts`), justru sedang **dihapus** dari working tree, bukan dikembangkan. Bagian ini sebaiknya diperlakukan sebagai rencana/future work di proposal capstone, bukan fitur yang sudah ada.

Deskripsi rencana awal (belum terwujud):
* **Visualisasi Simpul Jaringan (Nodes Graph):** Menampilkan profil pengguna saat ini sebagai simpul pusat (*Center Node*) yang bercahaya, dikelilingi oleh simpul-simpul talenta lain dan proyek yang direkomendasikan.
* **Tombol Pemicu "Rekomendasi":** Ketika diklik, sistem menjalankan animasi transisi partikel yang menghubungkan garis relasi (*edges*) dari pusat ke simpul-simpul luar berdasarkan tingkat kecocokan.
* **Sidebar Detail Dinamis:** Klik pada simpul talenta/proyek lain akan membuka panel detail modern di sisi layar, menampilkan skor persentase kecocokan beserta deskripsi **"Alasan Rekomendasi AI"** secara kontekstual.

---

## 💾 10. Fitur Penyimpanan Hasil Pencarian & Pencocokan AI (Saved AI Matches) — ❌ Not implemented

> **Status: fitur ini belum dibangun.** Tidak ditemukan tabel `saved_matches` (atau sejenisnya) di migrasi database, dan tidak ada tombol/endpoint "Simpan Hasil" di kode. Deskripsi di bawah adalah rencana, bukan fitur yang sudah berjalan — sebaiknya dipindah ke bagian future work.

Deskripsi rencana awal (belum terwujud):
* **Penanda Pencarian (Bookmark Match):** Pengguna dapat menyimpan hasil pencarian AI (baik pencarian talenta maupun pencocokan proyek) ke dalam daftar simpanan mereka dengan mengklik tombol "Simpan Hasil".
* **Dashboard Riwayat AI:** Halaman arsip personal tempat pengguna membaca kembali daftar rekomendasi dan hasil analisis AI sebelumnya secara instan tanpa memicu LLM ulang.
>
> Catatan: tabel `ai_recommendations` memang ada di skema database dan dipakai untuk menyimpan hasil rekomendasi AI, tapi ini berbeda dari fitur "bookmark/simpan hasil pencarian" yang dideskripsikan di atas — belum terkonfirmasi ada UI/flow bookmark yang memakainya.

---

## 🛡️ 11. Super Admin Control Panel (`/super-admin`) — ⚠️ Implemented, ada celah keamanan

Halaman kontrol terpusat bagi pengelola utama platform.
* **Manajemen Komunitas (Cohorts):** Memantau semua kelompok komunitas yang terdaftar, memperpanjang lisensi masa berlaku komunitas (+30 Hari), membekukan (suspend) / mengaktifkan status komunitas, serta menghapus komunitas.
* **Manajemen Pengguna:** Melihat seluruh pengguna terdaftar dan menaikkan hak akses pengguna biasa menjadi `super_admin` atau mengembalikannya menjadi `member`.
* **Celah akses yang perlu diperbaiki:** Pengecekan akses hanya terjadi di level API handler (bukan di `middleware.ts`), dan kondisinya adalah `role === 'super_admin'` **ATAU** host request mengandung `localhost`/`127.0.0.1` — bukan hanya "atau saat berada di lingkungan localhost dev" sebagai fitur dev yang aman, melainkan sebuah bypass kondisi yang longgar. Ini pantas didaftarkan sebagai known issue/future hardening di laporan capstone, bukan dianggap sebagai desain final yang aman.

---

## 👥 12. Konsol Admin Komunitas (`/cohort-admin`) — ⚠️ Partially implemented

Halaman khusus pengurus komunitas (Cohort Admin) untuk mengelola kelompok secara mandiri.
* **Pengaturan Komunitas:** Mengubah nama kelompok dan deskripsi visi-misi komunitas.
* **Kelola Anggota:** Mengundang anggota baru berdasarkan email/username, mengubah status peran anggota menjadi `admin` atau `member`, dan mengeluarkan anggota dari kelompok komunitas.
* **Statistik Lisensi:** Menampilkan jumlah anggota aktif, tipe paket langganan, dan sisa hari masa aktif komunitas (langganan).
* **Bug yang perlu diperbaiki:** halaman `/cohort-admin/analytics` memanggil `/api/analytics` **tanpa** parameter `cohortId`, sehingga yang ditampilkan sebenarnya statistik seluruh platform, bukan statistik khusus komunitas tersebut — perlu diperbaiki agar benar-benar cohort-scoped.
* **Catatan soal "lisensi":** `subscription_plan`/`subscription_status`/`expires_at` adalah kolom nyata di tabel `cohorts`, tapi **tidak ada integrasi payment apapun**. "Memperpanjang lisensi" hanyalah menambah 30 hari ke sebuah kolom tanggal, dan masa aktif yang sudah lewat tidak benar-benar diblokir di API manapun — jadi ini masih placeholder skema/alur kerja, bukan sistem langganan berbayar yang berfungsi penuh.
