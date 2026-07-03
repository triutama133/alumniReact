BLUEPRINT & PANDUAN STRUKTUR PROYEK 
INDONESIA TALENT HUB (LLM-POWERED) 
BAB I: RINGKASAN EKSEKUTIF PROYEK 
Indonesia Talent Hub adalah platform ekosistem digital bertenaga AI (LLM-Powered) yang 
dirancang untuk menghubungkan alumni universitas (berawal dari alumni IPB dan 
dikembangkan secara universal) guna memfasilitasi pencarian talenta, pencocokan proyek, dan 
akselerasi kolaborasi strategis secara otomatis melalui pendekatan semantic analysis. Ide 
dasarnya adalah membuat tampilan dan fungsi profesional mirip LinkedIn, namun dengan 
keunggulan fitur prompting judul proyek dan brief singkat untuk menemukan talenta yang paling 
cocok menggunakan Large Language Model (LLM). 
BAB II: ARSITEKTUR HALAMAN & SITEMAP APLIKASI 
Halaman Utama Komponen di Dalam Halaman Deskripsi Fungsionalitas 
1. Landing Page Hero Section, Statistik Komunitas, 
Call to Action (CTA) Button 
Halaman publik untuk memperkenalkan 
platform dan mengarahkan pengguna 
baru untuk melakukan registrasi. 
2. Authentication Page Form Login (Email & Password), 
Form Registrasi Akun Baru, OAuth 
Integration 
Gerbang masuk sistem. Registrasi baru 
memerlukan verifikasi akun guna 
menjaga keaslian basis data alumni. 
3. Onboarding Profile Form 
(Wajib) 
Form Profil Dasar (24 Pertanyaan 
Utama), Dynamic Conditional 
Form, Sistem Validasi Keaktifan 
(>5 Tahun) 
Halaman krusial. Pengguna baru wajib 
mengisi kuesioner profil lengkap 
sebelum diizinkan masuk ke Beranda. 
4. Beranda (Home Feed) Global Header, Posting Composer, 
Aktivitas Feed (Gaya LinkedIn), 
Sidebar Rekomendasi Kolaborasi 
AI 
Pusat interaksi sosial antar-alumni. 
Tempat berbagi pembaruan status dan 
melihat rekomendasi mitra kerja 
otomatis. 
5. Search Talent Hub AI Prompting Box, Advanced Filter 
(Domisili, Keahlian, Sektor), Daftar 
Kartu Profil Talenta 
Wadah pencarian talenta dengan 
mengetikkan brief kebutuhan secara 
natural bertenaga LLM semantic 
search. 
6. Hub Proyek & Kolaborasi Sub-Tab 1: Jelajah Proyek 
(Manual Grid), Sub-Tab 2: Cari 
Peluang Kolaborasi (AI-Powered), 
Tombol Utama 'Upload Project' 
Pusat kendali pencarian kontribusi aktif. 
Memisahkan pencarian manual 
konvensional dengan pencarian 
berbasis kebutuhan personal via prompt 
AI. 
7. Halaman Profil Proyek Header Proyek & Status 
(Aktif/Selesai), Identitas Project 
Owner, Detail Brief Proyek, Action 
Menampilkan detail spesifik dari proyek 
yang diunggah. Tombol AI 
memungkinkan pencarian talenta 

--- PAGE BREAK ---

Button: 'Cari Talenta via AI', 
'Ajukan Kolaborasi' 
otomatis secara instan. 
8. Halaman Profil 
Pengguna 
Biodata, Informasi Kontak Utama, 
Tab Karier & Detail Profesi, Tab 
'Daftar Proyek Saya' (Terinisiasi & 
Diikuti), Tombol 'Edit Profile' 
Halaman portofolio personal pengguna 
serta manajemen pengaturan data profil 
dan akun. 
 
BAB III: SPESIFIKASI DETAIL MODUL HUB PROYEK & KOLABORASI 
Sesuai dengan kesepakatan integrasi UX, fitur pencarian peluang kolaborasi dilebur ke dalam 
satu gerbang utama bernama Hub Proyek & Kolaborasi yang membagi alur kerja menjadi dua 
sub-tab strategis: 
• Sub-Tab 1: Jelajah Proyek (Traditional Grid/List View): Fokus pada pencarian manual 
eksploratif. Menyediakan tombol 'Upload Project' di sisi kanan atas, komponen filter organik 
(Kategori Sektor, Multi-select Tags Hard Skill, dan Durasi Proyek), serta tampilan kartu 
proyek (Project Cards) bergaya LinkedIn yang memuat Judul Proyek, Nama Inisiator, Badge 
Kategori, dan Tag Skill. 
• Sub-Tab 2: Cari Peluang Kolaborasi (AI-Powered Prompt Hub): Halaman minimalis 
interaktif bertenaga LLM semantic search. Menyediakan AI Prompt Box besar di tengah 
halaman bagi user untuk mengetikkan situasi personal, keahlian, atau ketersediaan waktu 
mereka secara bebas (Natural Language). Dilengkapi widget Prompt Starters untuk memicu 
inspirasi, serta output rekomendasi cerdas yang dilengkapi narasi 'Alasan Rekomendasi AI' 
yang membandingkan tingkat kecocokan proyek dengan profil personal pengguna. 
BAB IV: INSTRUMEN PERTANYAAN ONBOARDING (FONDASI DATA AI) 
Data berikut wajib dikumpulkan saat onboarding agar LLM dapat memahami profil pengguna 
secara semantik dan melakukan pencocokan kolaborasi secara akurat. 
No Pertanyaan Tujuan Pertanyaan Saran Format Jawaban 
1 Alamat email aktif Kontak utama dan identifikasi 
responden 
Isian singkat (format email) 
2 Nama lengkap Identifikasi resmi Isian singkat 
3 Nama panggilan / sapaan sehari-
hari 
Untuk keperluan komunikasi 
informal 
Isian singkat 
4 Tahun lahir Anda Mengelompokkan 
usia/generasi 
Isian angka 
5 Jenis Kelamin - Single choice 
6 Kota atau kabupaten domisili saat 
ini (misal kota banjar, kabupaten 
Pemetaan wilayah jaringan Isian singkat 

--- PAGE BREAK ---

deli serdang) 
7 Nomor handphone (diawali 
dengan 62) 
Kontak cepat untuk follow-up Isian angka 
8 Pendidikan terakhir yang Anda 
tempuh 
Latar belakang akademik Single choice 
9 Nama institusi pendidikan terakhir Jejaring alumni Isian singkat 
10 Jurusan atau program studi Pemetaan keahlian akademik Isian singkat 
11 Tahun kelulusan Estimasi pengalaman dan fase 
karier 
Isian angka 
12 Keahlian apa yang kamu miliki? - - 
13 Bahasa yang dikuasai - - 
14 Sertifikasi yang kamu miliki 
berkaitan dengan keahlian dan 
skill? 
- - 
15 Tautan profil Instagram Melihat jejak digital atau 
potensi branding 
Isian singkat (opsional) 
16 Tautan profil LinkedIn Menilai jejaring dan riwayat 
karier 
Isian singkat (opsional) 
17 Apa saja aktivitas atau pekerjaan 
yang pernah dilakukan? 
Dasar pemunculan pertanyaan 
lanjutan berdasarkan bidang 
profesi 
Checkbox (multiselect): 
Profesional Institusi, 
Entrepreneur/Wirausaha, 
Pekerja Sosial/NGO, 
Content Creator, Belum 
Bekerja, Pekerja Informal, 
Petani/Nelayan/Peternak, 
Guru/Pendidik 
Ada pertanyaan lanjutan 
setiap checkbox nya 
apakah masih aktif saat ini, 
atau aktivitas sudah 
berhenti (1 tahun lalu, 2-3 
tahun lalu, 3-5 tahun lalu, 
>5 tahun) 
Jika memilih di atas 5 tahun 
maka tidak perlu ada 
pertanyaan lanjutan, jika 
selain itu maka ada 
pertanyaan lanjutan 
18 Apakah sedang mengikuti 
pelatihan? Sebutkan dan 
deskripsikan mengapa ikut 
pelatihan tersebut 
- Isian paragraf 

--- PAGE BREAK ---

19 Jenis dukungan apa yang paling 
Anda butuhkan saat ini? 
Menyediakan ruang aspirasi 
dan koneksi tepat sasaran 
Checkbox multiselect: 
Peluang kerja, Kolaborasi 
proyek, Mentor, 
Pendamping usaha, Relasi 
profesional, Akses pasar, 
Lainnya (isian) 
20 Bidang apa yang paling tertarik 
untuk berkontribusi? (minat 
pengembangan diri/karir) 
Pemetaan potensi lintas sektor Checkbox: Pendidikan, 
Lingkungan, Ekonomi, 
Teknologi, Kesehatan, 
Komunitas, Kreatif, dll 
21 Peran seperti apa yang Anda 
minati dalam proyek kolaborasi? 
Menentukan fungsi: inisiator, 
eksekutor, fasilitator, dll. 
Checkbox: Inisiator, 
Fasilitator, Pelaksana, 
Mentor, Dokumentator, 
Penghubung, dll 
22 Link portofolio produk/karya (tidak 
wajib) 
- - 
24 Pernah terlibat proyek / komunitas 
sosial? Peran? 
- - 
25 Ketersediaan waktu Anda jika 
diajak kolaborasi 
- - 
 
BAB V: PERTANYAAN LANJUTAN KONDISIONAL BERDASARKAN 
PROFESI 
1. Profesional Institusi (Pemerintah / Swasta / BUMN / Akademisi) 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Dari instansi atau lembaga mana Kamu berasal saat ini? [Isian Singkat/Paragraf] 
• Sebutkan pengalaman kamu dalam program atau proyek kerja yang pernah dijalankan? (Sebutkan 
peran dan tanggung jawab kamu dalam proyeknya hubungkan dengan keahlian kamu) [Isian 
Singkat/Paragraf] 
• Apakah Kamu memiliki akses jejaring atau koneksi strategis yang dapat mendukung kolaborasi lintas 
pihak? [Isian Singkat/Paragraf] 
• Apakah Kamu memiliki pengalaman bermitra dengan sektor lain (pemerintah, swasta, komunitas)? 
[Isian Singkat/Paragraf] 
• Apa bidang keahlian utama Anda dalam pekerjaan saat ini? [Pilihan Ganda] 
• Apakah Anda pernah terlibat dalam kerja lintas divisi atau antar lembaga? [Pilihan Ganda] 
• Apakah Anda memiliki akses atau jejaring strategis untuk kolaborasi? [Pilihan Ganda] 
• Apakah Anda tertarik menjadi mentor atau narasumber dalam bidang Anda? [Isian Singkat] 
2. Entrepreneur / Wirausaha 
• Apa keahlian utama yang kamu miliki terkait kewirausahaan ini? (ceklis keahlian berdasar no 12) 
[Isian Singkat/Paragraf] 

--- PAGE BREAK ---

• Apa produk atau layanan utama dari usaha Kamu saat ini? [Isian Singkat/Paragraf] 
• Apa nama entitas atau badan usaha yang Kamu jalankan? [Isian Singkat/Paragraf] 
• Jelaskan sebesar apa skala usaha Kamu (cakupan pasar dan kisaran omzet)? [Isian Singkat/Paragraf] 
• Kendala yang dihadapi [Isian Singkat/Paragraf] 
• Target pasar (B2C atau B2B) [Isian Singkat/Paragraf] 
• Apa produk atau layanan utama dari usaha Anda? [Isian Singkat] 
• Tantangan apa yang sering Anda hadapi dalam mengembangkan usaha? [Pilihan Ganda] 
• Apakah Anda terbuka untuk kolaborasi (inkubasi, ekspansi, dsb)? [Isian Singkat] 
• Keahlian apa yang bisa Anda bagikan ke komunitas? [Isian Singkat] 
3. Pekerja Sosial / NGO / Filantropi 
• Apa Keahlian utama kamu berkaitan dengan aktivitas ini? (ceklis keahlian berdasar no 12) [Isian 
Singkat/Paragraf] 
• Sebutkan pengalaman kamu dalam program atau proyek kerja yang pernah dijalankan? (Sebutkan 
peran dan tanggung jawab kamu dalam proyeknya hubungkan dengan keahlian kamu) [Isian 
Singkat/Paragraf] 
• Isu sosial atau lingkungan apa yang menjadi fokus utama kegiatan Kamu saat ini? [Isian 
Singkat/Paragraf] 
• Apa nama organisasi atau lembaga tempat Kamu beraktivitas saat ini? [Isian Singkat/Paragraf] 
• Apakah Kamu memiliki pengalaman bermitra dengan sektor lain (pemerintah, swasta, komunitas)? 
[Isian Singkat/Paragraf] 
• Isu sosial atau lingkungan apa yang paling Anda fokuskan saat ini? [Pilihan Ganda] 
• Apakah Anda punya pengalaman bermitra lintas sektor? [Isian Singkat] 
• Pendekatan unik apa yang Anda gunakan dalam memberdayakan masyarakat? [Pilihan Ganda] 
• Bersediakah Anda menjadi fasilitator komunitas? [Pilihan Ganda] 
4. Content Creator / Pekerja Kreatif Digital 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Platform digital apa yang paling sering Kamu gunakan untuk berkarya? [Isian Singkat/Paragraf] 
• Jenis konten apa yang biasa Kamu buat atau fokuskan? [Isian Singkat/Paragraf] 
• Berapa total jangkauan Kamu saat ini (jumlah followers, subscribers, dsb)? [Isian Singkat/Paragraf] 
• Kisaran rate-card saat ini [Isian Singkat/Paragraf] 
• Demografi followers/subscribers [Isian Singkat/Paragraf] 
• Apa platform utama Anda dalam berkarya? [Isian Singkat] 
• Apa jenis konten utama yang Anda buat? [Pilihan Ganda] 
• Pernahkah Anda terlibat dalam kampanye sosial/edukatif? [Pilihan Ganda] 
• Bersediakah Anda mendukung program kolaboratif secara digital? [Isian Singkat] 
5. Ibu Rumah Tangga (IRT) 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Kegiatan atau organisasi apa yang pernah Kamu ikuti dan berkesan bagi Kamu? [Isian 
Singkat/Paragraf] 
• Ceritakan pengalaman Kamu bekerja dalam tim (jika ada). [Isian Singkat/Paragraf] 

--- PAGE BREAK ---

• Apakah kamu sedang mencari pekerjaan atau peluang kolaborasi? [Isian Singkat/Paragraf] 
6. Mahasiswa & Fresh Graduate / Belum Bekerja 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Kegiatan atau organisasi apa yang pernah Kamu ikuti dan berkesan bagi Kamu? [Isian 
Singkat/Paragraf] 
• Ceritakan pengalaman Kamu bekerja dalam tim (jika ada). [Isian Singkat/Paragraf] 
• Apakah kamu sedang mencari pekerjaan atau peluang kolaborasi? [Isian Singkat/Paragraf] 
• Pengalaman magang [Isian Singkat/Paragraf] 
• Aktivitas atau organisasi apa yang pernah Anda ikuti? [Isian Singkat] 
• Keahlian praktis apa yang Anda miliki? [Pilihan Ganda] 
• Peran apa yang Anda minati dalam proyek kolaboratif? [Pilihan Ganda] 
• Apakah Anda tertarik ikut pelatihan lanjutan? [Isian Singkat] 
7. Pekerja Informal / Freelance / Harian (termasuk Coach/Trainer) 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Apakah Kamu memiliki pengalaman bekerja dalam tim? [Isian Singkat/Paragraf] 
• Apakah Kamu pernah merekrut atau memimpin orang lain dalam pekerjaan yang Kamu lakukan? 
[Isian Singkat/Paragraf] 
• Keterampilan teknis apa yang Anda kuasai? [Pilihan Ganda] 
• Apakah Anda biasa bekerja secara individu atau tim? [Isian Singkat] 
• Bidang apa yang Anda minati untuk proyek kolaboratif? [Pilihan Ganda] 
• Bersediakah Anda ikut dalam proyek komunitas? [Isian Singkat] 
8. Petani / Nelayan / Peternak 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Komoditas utama apa yang Kamu kelola saat ini? [Isian Singkat/Paragraf] 
• Apakah Kamu tergabung dalam kelompok tani, nelayan, peternak, atau koperasi? [Isian 
Singkat/Paragraf] 
• Bagaimana skala usaha Kamu (misalnya: luas lahan, jumlah ternak, kisaran omzet)? [Isian 
Singkat/Paragraf] 
• Nilai tambah yang diterapkan dalam usaha [Isian Singkat/Paragraf] 
• Kendala yang dihadapi [Isian Singkat/Paragraf] 
• Apa komoditas utama yang Anda kelola? [Pilihan Ganda] 
• Apakah Anda tergabung dalam kelompok atau koperasi? [Isian Singkat] 
• Inovasi apa yang pernah Anda terapkan? [Pilihan Ganda] 
• Tertarik jadi lokasi percontohan program? [Isian Singkat] 
9. Guru / Tenaga Pendidik 
• Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 
12) [Isian Singkat/Paragraf] 
• Pada jenjang pendidikan apa Kamu mengajar saat ini? [Isian Singkat/Paragraf] 

--- PAGE BREAK ---

• Mata pelajaran atau bidang pendidikan apa yang Kamu ajarkan? [Isian Singkat/Paragraf] 
• Inovasi pembelajaran apa yang pernah Kamu terapkan atau kembangkan? [Isian Singkat/Paragraf] 
• Apakah kamu mengajar bimbel? [Isian Singkat/Paragraf] 
• Apa jenjang pendidikan dan mata pelajaran Anda? [Isian Singkat] 
• Inovasi pembelajaran apa yang Anda kembangkan? [Pilihan Ganda] 
• Apakah Anda aktif di komunitas belajar atau pelatihan? [Pilihan Ganda] 
• Apakah Anda tertarik menjadi fasilitator edukasi? [Pilihan Ganda/Isian] 