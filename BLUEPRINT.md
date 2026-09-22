# HubTalent — Blueprint & Implementation Status

**Replaces:** `BLUEPRINT_TEXT.md` and `BLUEPRINT_ANALYSIS.md` (both removed and merged into this single document).
**Last verified:** September 22, 2026

This document has two parts:
- **Part 1 — The Original Blueprint**: the original requirements brief exactly as given (from the source "Panduan Instrumen Pertanyaan" PDF), preserved as a fixed reference. This is *what was asked for*, not a status report — it is not edited to match current reality.
- **Part 2 — Verified Implementation Status**: a fresh gap analysis comparing that brief against the actual codebase as of today, replacing the old `BLUEPRINT_ANALYSIS.md`, which was dated June 13, 2026 and had drifted badly out of date (it still claimed the landing page, home feed posting, and 6 of 9 profession types were missing — all of that is now built). Every claim in Part 2 was checked directly against source code, not carried over from the old analysis.

For the full feature-by-feature audit beyond blueprint scope, see [`docs/CAPSTONE_PROJECT_DOCUMENTATION.md`](./docs/CAPSTONE_PROJECT_DOCUMENTATION.md). For the actionable remaining-work checklist, see [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) and [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md).

---

# Part 1 — The Original Blueprint

## BAB I: Ringkasan Eksekutif Proyek

HubTalent adalah platform ekosistem digital bertenaga AI (LLM-Powered) yang dirancang untuk menghubungkan alumni universitas (berawal dari alumni IPB dan dikembangkan secara universal) guna memfasilitasi pencarian talenta, pencocokan proyek, dan akselerasi kolaborasi strategis secara otomatis melalui pendekatan semantic analysis. Ide dasarnya adalah membuat tampilan dan fungsi profesional mirip LinkedIn, namun dengan keunggulan fitur prompting judul proyek dan brief singkat untuk menemukan talenta yang paling cocok menggunakan Large Language Model (LLM).

## BAB II: Arsitektur Halaman & Sitemap Aplikasi

| # | Halaman Utama | Komponen di Dalam Halaman | Deskripsi Fungsionalitas |
|---|---|---|---|
| 1 | Landing Page | Hero Section, Statistik Komunitas, Call to Action (CTA) Button | Halaman publik untuk memperkenalkan platform dan mengarahkan pengguna baru untuk melakukan registrasi. |
| 2 | Authentication Page | Form Login (Email & Password), Form Registrasi Akun Baru, OAuth Integration | Gerbang masuk sistem. Registrasi baru memerlukan verifikasi akun guna menjaga keaslian basis data alumni. |
| 3 | Onboarding Profile Form (Wajib) | Form Profil Dasar (24 Pertanyaan Utama), Dynamic Conditional Form, Sistem Validasi Keaktifan (>5 Tahun) | Halaman krusial. Pengguna baru wajib mengisi kuesioner profil lengkap sebelum diizinkan masuk ke Beranda. |
| 4 | Beranda (Home Feed) | Global Header, Posting Composer, Aktivitas Feed (Gaya LinkedIn), Sidebar Rekomendasi Kolaborasi AI | Pusat interaksi sosial antar-alumni. Tempat berbagi pembaruan status dan melihat rekomendasi mitra kerja otomatis. |
| 5 | Search Talent Hub | AI Prompting Box, Advanced Filter (Domisili, Keahlian, Sektor), Daftar Kartu Profil Talenta | Wadah pencarian talenta dengan mengetikkan brief kebutuhan secara natural bertenaga LLM semantic search. |
| 6 | Hub Proyek & Kolaborasi | Sub-Tab 1: Jelajah Proyek (Manual Grid), Sub-Tab 2: Cari Peluang Kolaborasi (AI-Powered), Tombol Utama 'Upload Project' | Pusat kendali pencarian kontribusi aktif. Memisahkan pencarian manual konvensional dengan pencarian berbasis kebutuhan personal via prompt AI. |
| 7 | Halaman Profil Proyek | Header Proyek & Status (Aktif/Selesai), Identitas Project Owner, Detail Brief Proyek, Action Button: 'Cari Talenta via AI', 'Ajukan Kolaborasi' | Menampilkan detail spesifik dari proyek yang diunggah. Tombol AI memungkinkan pencarian talenta otomatis secara instan. |
| 8 | Halaman Profil Pengguna | Biodata, Informasi Kontak Utama, Tab Karier & Detail Profesi, Tab 'Daftar Proyek Saya' (Terinisiasi & Diikuti), Tombol 'Edit Profile' | Halaman portofolio personal pengguna serta manajemen pengaturan data profil dan akun. |

## BAB III: Spesifikasi Detail Modul Hub Proyek & Kolaborasi

Sesuai dengan kesepakatan integrasi UX, fitur pencarian peluang kolaborasi dilebur ke dalam satu gerbang utama bernama Hub Proyek & Kolaborasi yang membagi alur kerja menjadi dua sub-tab strategis:

- **Sub-Tab 1: Jelajah Proyek (Traditional Grid/List View)** — Fokus pada pencarian manual eksploratif. Menyediakan tombol 'Upload Project' di sisi kanan atas, komponen filter organik (Kategori Sektor, Multi-select Tags Hard Skill, dan Durasi Proyek), serta tampilan kartu proyek (Project Cards) bergaya LinkedIn yang memuat Judul Proyek, Nama Inisiator, Badge Kategori, dan Tag Skill.
- **Sub-Tab 2: Cari Peluang Kolaborasi (AI-Powered Prompt Hub)** — Halaman minimalis interaktif bertenaga LLM semantic search. Menyediakan AI Prompt Box besar di tengah halaman bagi user untuk mengetikkan situasi personal, keahlian, atau ketersediaan waktu mereka secara bebas (Natural Language). Dilengkapi widget Prompt Starters untuk memicu inspirasi, serta output rekomendasi cerdas yang dilengkapi narasi 'Alasan Rekomendasi AI' yang membandingkan tingkat kecocokan proyek dengan profil personal pengguna.

## BAB IV: Instrumen Pertanyaan Onboarding (Fondasi Data AI)

Data berikut wajib dikumpulkan saat onboarding agar LLM dapat memahami profil pengguna secara semantik dan melakukan pencocokan kolaborasi secara akurat.

| No | Pertanyaan | Tujuan Pertanyaan | Saran Format Jawaban |
|---|---|---|---|
| 1 | Alamat email aktif | Kontak utama dan identifikasi responden | Isian singkat (format email) |
| 2 | Nama lengkap | Identifikasi resmi | Isian singkat |
| 3 | Nama panggilan / sapaan sehari-hari | Untuk keperluan komunikasi informal | Isian singkat |
| 4 | Tahun lahir Anda | Mengelompokkan usia/generasi | Isian angka |
| 5 | Jenis Kelamin | - | Single choice |
| 6 | Kota atau kabupaten domisili saat ini | Pemetaan wilayah jaringan | Isian singkat |
| 7 | Nomor handphone (diawali dengan 62) | Kontak cepat untuk follow-up | Isian angka |
| 8 | Pendidikan terakhir yang Anda tempuh | Latar belakang akademik | Single choice |
| 9 | Nama institusi pendidikan terakhir | Jejaring alumni | Isian singkat |
| 10 | Jurusan atau program studi | Pemetaan keahlian akademik | Isian singkat |
| 11 | Tahun kelulusan | Estimasi pengalaman dan fase karier | Isian angka |
| 12 | Keahlian apa yang kamu miliki? | - | - |
| 13 | Bahasa yang dikuasai | - | - |
| 14 | Sertifikasi yang kamu miliki berkaitan dengan keahlian dan skill? | - | - |
| 15 | Tautan profil Instagram | Melihat jejak digital atau potensi branding | Isian singkat (opsional) |
| 16 | Tautan profil LinkedIn | Menilai jejaring dan riwayat karier | Isian singkat (opsional) |
| 17 | Apa saja aktivitas atau pekerjaan yang pernah dilakukan? | Dasar pemunculan pertanyaan lanjutan berdasarkan bidang profesi | Checkbox (multiselect): Profesional Institusi, Entrepreneur/Wirausaha, Pekerja Sosial/NGO, Content Creator, Belum Bekerja, Pekerja Informal, Petani/Nelayan/Peternak, Guru/Pendidik. Ada pertanyaan lanjutan setiap checkbox-nya apakah masih aktif saat ini, atau aktivitas sudah berhenti (1 tahun lalu, 2-3 tahun lalu, 3-5 tahun lalu, >5 tahun). Jika memilih di atas 5 tahun maka tidak perlu ada pertanyaan lanjutan, jika selain itu maka ada pertanyaan lanjutan. |
| 18 | Apakah sedang mengikuti pelatihan? Sebutkan dan deskripsikan mengapa ikut pelatihan tersebut | - | Isian paragraf |
| 19 | Jenis dukungan apa yang paling Anda butuhkan saat ini? | Menyediakan ruang aspirasi dan koneksi tepat sasaran | Checkbox multiselect: Peluang kerja, Kolaborasi proyek, Mentor, Pendamping usaha, Relasi profesional, Akses pasar, Lainnya (isian) |
| 20 | Bidang apa yang paling tertarik untuk berkontribusi? (minat pengembangan diri/karir) | Pemetaan potensi lintas sektor | Checkbox: Pendidikan, Lingkungan, Ekonomi, Teknologi, Kesehatan, Komunitas, Kreatif, dll |
| 21 | Peran seperti apa yang Anda minati dalam proyek kolaborasi? | Menentukan fungsi: inisiator, eksekutor, fasilitator, dll. | Checkbox: Inisiator, Fasilitator, Pelaksana, Mentor, Dokumentator, Penghubung, dll |
| 22 | Link portofolio produk/karya (tidak wajib) | - | - |
| 24 | Pernah terlibat proyek / komunitas sosial? Peran? | - | - |
| 25 | Ketersediaan waktu Anda jika diajak kolaborasi | - | - |

*(Nomor 23 memang tidak ada pada dokumen sumber asli.)*

## BAB V: Pertanyaan Lanjutan Kondisional Berdasarkan Profesi

**1. Profesional Institusi (Pemerintah / Swasta / BUMN / Akademisi)**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? (ceklis keahlian di profesional berdasar no 12) [Isian Singkat/Paragraf]
- Dari instansi atau lembaga mana Kamu berasal saat ini? [Isian Singkat/Paragraf]
- Sebutkan pengalaman kamu dalam program atau proyek kerja yang pernah dijalankan? (Sebutkan peran dan tanggung jawab kamu dalam proyeknya, hubungkan dengan keahlian kamu) [Isian Singkat/Paragraf]
- Apakah Kamu memiliki akses jejaring atau koneksi strategis yang dapat mendukung kolaborasi lintas pihak? [Isian Singkat/Paragraf]
- Apakah Kamu memiliki pengalaman bermitra dengan sektor lain (pemerintah, swasta, komunitas)? [Isian Singkat/Paragraf]
- Apa bidang keahlian utama Anda dalam pekerjaan saat ini? [Pilihan Ganda]
- Apakah Anda pernah terlibat dalam kerja lintas divisi atau antar lembaga? [Pilihan Ganda]
- Apakah Anda memiliki akses atau jejaring strategis untuk kolaborasi? [Pilihan Ganda]
- Apakah Anda tertarik menjadi mentor atau narasumber dalam bidang Anda? [Isian Singkat]

**2. Entrepreneur / Wirausaha**
- Apa keahlian utama yang kamu miliki terkait kewirausahaan ini? (ceklis keahlian berdasar no 12) [Isian Singkat/Paragraf]
- Apa produk atau layanan utama dari usaha Kamu saat ini? [Isian Singkat/Paragraf]
- Apa nama entitas atau badan usaha yang Kamu jalankan? [Isian Singkat/Paragraf]
- Jelaskan sebesar apa skala usaha Kamu (cakupan pasar dan kisaran omzet)? [Isian Singkat/Paragraf]
- Kendala yang dihadapi [Isian Singkat/Paragraf]
- Target pasar (B2C atau B2B) [Isian Singkat/Paragraf]
- Tantangan apa yang sering Anda hadapi dalam mengembangkan usaha? [Pilihan Ganda]
- Apakah Anda terbuka untuk kolaborasi (inkubasi, ekspansi, dsb)? [Isian Singkat]
- Keahlian apa yang bisa Anda bagikan ke komunitas? [Isian Singkat]

**3. Pekerja Sosial / NGO / Filantropi**
- Apa Keahlian utama kamu berkaitan dengan aktivitas ini? (ceklis keahlian berdasar no 12) [Isian Singkat/Paragraf]
- Sebutkan pengalaman kamu dalam program atau proyek kerja yang pernah dijalankan? [Isian Singkat/Paragraf]
- Isu sosial atau lingkungan apa yang menjadi fokus utama kegiatan Kamu saat ini? [Isian Singkat/Paragraf]
- Apa nama organisasi atau lembaga tempat Kamu beraktivitas saat ini? [Isian Singkat/Paragraf]
- Apakah Kamu memiliki pengalaman bermitra dengan sektor lain (pemerintah, swasta, komunitas)? [Isian Singkat/Paragraf]
- Apakah Anda punya pengalaman bermitra lintas sektor? [Isian Singkat]
- Pendekatan unik apa yang Anda gunakan dalam memberdayakan masyarakat? [Pilihan Ganda]
- Bersediakah Anda menjadi fasilitator komunitas? [Pilihan Ganda]

**4. Content Creator / Pekerja Kreatif Digital**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? [Isian Singkat/Paragraf]
- Platform digital apa yang paling sering Kamu gunakan untuk berkarya? [Isian Singkat/Paragraf]
- Jenis konten apa yang biasa Kamu buat atau fokuskan? [Isian Singkat/Paragraf]
- Berapa total jangkauan Kamu saat ini (jumlah followers, subscribers, dsb)? [Isian Singkat/Paragraf]
- Kisaran rate-card saat ini [Isian Singkat/Paragraf]
- Demografi followers/subscribers [Isian Singkat/Paragraf]
- Pernahkah Anda terlibat dalam kampanye sosial/edukatif? [Pilihan Ganda]
- Bersediakah Anda mendukung program kolaboratif secara digital? [Isian Singkat]

**5. Ibu Rumah Tangga (IRT)**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? [Isian Singkat/Paragraf]
- Kegiatan atau organisasi apa yang pernah Kamu ikuti dan berkesan bagi Kamu? [Isian Singkat/Paragraf]
- Ceritakan pengalaman Kamu bekerja dalam tim (jika ada). [Isian Singkat/Paragraf]
- Apakah kamu sedang mencari pekerjaan atau peluang kolaborasi? [Isian Singkat/Paragraf]

**6. Mahasiswa & Fresh Graduate / Belum Bekerja**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? [Isian Singkat/Paragraf]
- Kegiatan atau organisasi apa yang pernah Kamu ikuti dan berkesan bagi Kamu? [Isian Singkat/Paragraf]
- Ceritakan pengalaman Kamu bekerja dalam tim (jika ada). [Isian Singkat/Paragraf]
- Apakah kamu sedang mencari pekerjaan atau peluang kolaborasi? [Isian Singkat/Paragraf]
- Pengalaman magang [Isian Singkat/Paragraf]
- Keahlian praktis apa yang Anda miliki? [Pilihan Ganda]
- Peran apa yang Anda minati dalam proyek kolaboratif? [Pilihan Ganda]
- Apakah Anda tertarik ikut pelatihan lanjutan? [Isian Singkat]

**7. Pekerja Informal / Freelance / Harian (termasuk Coach/Trainer)**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? [Isian Singkat/Paragraf]
- Apakah Kamu memiliki pengalaman bekerja dalam tim? [Isian Singkat/Paragraf]
- Apakah Kamu pernah merekrut atau memimpin orang lain dalam pekerjaan yang Kamu lakukan? [Isian Singkat/Paragraf]
- Keterampilan teknis apa yang Anda kuasai? [Pilihan Ganda]
- Apakah Anda biasa bekerja secara individu atau tim? [Isian Singkat]
- Bidang apa yang Anda minati untuk proyek kolaboratif? [Pilihan Ganda]
- Bersediakah Anda ikut dalam proyek komunitas? [Isian Singkat]

**8. Petani / Nelayan / Peternak**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? [Isian Singkat/Paragraf]
- Komoditas utama apa yang Kamu kelola saat ini? [Isian Singkat/Paragraf]
- Apakah Kamu tergabung dalam kelompok tani, nelayan, peternak, atau koperasi? [Isian Singkat/Paragraf]
- Bagaimana skala usaha Kamu (misalnya: luas lahan, jumlah ternak, kisaran omzet)? [Isian Singkat/Paragraf]
- Nilai tambah yang diterapkan dalam usaha [Isian Singkat/Paragraf]
- Kendala yang dihadapi [Isian Singkat/Paragraf]
- Apakah Anda tergabung dalam kelompok atau koperasi? [Isian Singkat]
- Inovasi apa yang pernah Anda terapkan? [Pilihan Ganda]
- Tertarik jadi lokasi percontohan program? [Isian Singkat]

**9. Guru / Tenaga Pendidik**
- Apa Keahlian utama kamu berkaitan dengan profesi ini? [Isian Singkat/Paragraf]
- Pada jenjang pendidikan apa Kamu mengajar saat ini? [Isian Singkat/Paragraf]
- Mata pelajaran atau bidang pendidikan apa yang Kamu ajarkan? [Isian Singkat/Paragraf]
- Inovasi pembelajaran apa yang pernah Kamu terapkan atau kembangkan? [Isian Singkat/Paragraf]
- Apakah kamu mengajar bimbel? [Isian Singkat/Paragraf]
- Inovasi pembelajaran apa yang Anda kembangkan? [Pilihan Ganda]
- Apakah Anda aktif di komunitas belajar atau pelatihan? [Pilihan Ganda]
- Apakah Anda tertarik menjadi fasilitator edukasi? [Pilihan Ganda/Isian]

---

# Part 2 — Verified Implementation Status (September 22, 2026)

## Executive Summary

Where the June 2026 analysis found ~35-40% of the blueprint built, the verified state today is dramatically further along: **all 8 sitemap pages exist and work**, **all 9 conditional profession forms are implemented**, and the platform has substantially *exceeded* the blueprint's scope in several areas (direct messaging, notifications, a jobs portal, an AI-driven learning path, an ATS CV builder, and cohort/admin governance — none of which the original blueprint specified at all). At the same time, a small number of **specific, granular requirements from the blueprint were never built** and are called out precisely below, rather than papered over.

## Page-by-Page Status (BAB II)

| # | Halaman | Blueprint Requirement | Status | Notes |
|---|---|---|---|---|
| 1 | Landing Page | Hero, stats, CTA | ✅ Done | Was "missing" in the old analysis; fully built at `app/landing`, now with a real logo and cleaned-up styling. |
| 2 | Authentication Page | Login/register, OAuth, account verification | ⚠️ Partial | Login/register work (custom JWT, not Supabase Auth), protected by Cloudflare Turnstile captcha. **OAuth is not implemented** (email+password only). **Registration has no email verification step** — an account is immediately usable on signup, with no confirmation email/token gate. |
| 3 | Onboarding Profile Form | 24 questions + 9 conditional profession forms + >5yr auto-skip | ⚠️ Mostly done, with real gaps | See the dedicated section below — most of the 25 questions and all 9 profession types exist, but 3 specific fields and the entire ">5 years auto-skip" mechanic are missing. |
| 4 | Beranda (Home Feed) | Header, posting composer, feed, AI sidebar | ✅ Done | Was "critical gap, no posting system" in the old analysis; posts, likes, and comments are all real and working, plus messaging and notifications that weren't even in the original blueprint. |
| 5 | Search Talent Hub | AI prompt box + traditional filters | ✅ Done | Both modes work. The AI mode is keyword-weighted retrieval + Gemini-written narrative, not vector/embedding semantic search — worth stating precisely rather than as "semantic search" in any capstone claim. |
| 6 | Hub Proyek & Kolaborasi | Manual grid + AI-powered matching, "Upload Project" | ✅ Done | Both sub-tabs work; "Prompt Starters" (clickable example prompts) are implemented exactly as specified in `components/projects/AIPromptHub.tsx`. |
| 7 | Halaman Profil Proyek | Status, owner info, brief, "Cari Talenta via AI" + "Ajukan Kolaborasi" buttons | ✅ Done | Both actions exist in `components/projects/ProjectDetailClient.tsx` — the apply button is labeled "Ajukan Diri sebagai Kolaborator" (same function, slightly different wording than the blueprint's exact phrase). |
| 8 | Halaman Profil Pengguna | Biodata, contact, career tab, my-projects tab, edit button | ✅ Done | Fully implemented, including a functional edit flow. |

## Onboarding Questions (BAB IV) — Field-by-Field Status

Of the 24 main questions, the large majority are implemented. Three specific ones are not:

| Question | Status |
|---|---|
| Q1-11 (email, name, DOB, gender, domicile, phone, education history) | ✅ Present |
| Q12 Keahlian/skills | ✅ Present |
| Q13 Bahasa dikuasai | ✅ Present |
| Q14 Sertifikasi | ✅ Present |
| Q15 Instagram link | ✅ Present |
| Q16 LinkedIn link | ✅ Present |
| Q17 Aktivitas (multi-select) | ✅ Present, but see the auto-skip gap below |
| **Q18 Pelatihan yang sedang diikuti (paragraph)** | ❌ **Missing** — no such field exists anywhere in the onboarding form |
| Q19 Jenis dukungan dibutuhkan (multi-select) | ✅ Present |
| Q20 Bidang kontribusi/minat (multi-select) | ✅ Present |
| **Q21 Peran dalam kolaborasi yang diminati (multi-select)** | ❌ **Missing** — only 3 multi-checkbox groups exist (aktivitas, dukungan, kontribusi); this one was never added |
| Q22 Link portofolio | ✅ Present |
| Q24 Pengalaman proyek/komunitas sosial | ✅ Present (conditionally, inside the relevant profession sections) |
| **Q25 Ketersediaan waktu untuk kolaborasi** | ❌ **Missing** — no availability field anywhere in the form |

**The ">5 years auto-skip" logic (part of Q17) does not exist at all** — not partially, not differently implemented, simply absent. There is no per-activity status field ("masih aktif" vs "berhenti >5 tahun lalu") anywhere in the onboarding form. Activities are plain checkboxes, and each profession's conditional sub-form is shown purely based on whether that checkbox is selected — with no additional status question and no hide/skip logic layered on top. This is a genuine, fully-open gap, not a documentation error.

## Conditional Profession Forms (BAB V) — Status

All 9 profession types from the blueprint have a real, dedicated database table and a working conditional sub-form in `app/(auth)/complete-profile/page.tsx`:

1. Profesional Institusi — ✅ (`alumni_pekerja`)
2. Entrepreneur/Wirausaha — ✅ (`alumni_bisnis`)
3. Pekerja Sosial/NGO — ✅ (`alumni_sosial`)
4. Content Creator — ✅ (`alumni_kreatif`)
5. Ibu Rumah Tangga — ✅ (`alumni_rumah_tangga`)
6. Mahasiswa/Fresh Graduate — ✅ (`alumni_mahasiswa`)
7. Pekerja Informal/Freelance — ✅ (`alumni_informal`)
8. Petani/Nelayan/Peternak — ✅ (`alumni_agri`)
9. Guru/Pendidik — ✅ (`alumni_pendidik`)

This fully reverses the old analysis, which had marked 6 of these 9 as "table & logic missing." The exact field-by-field completeness of each profession's specific sub-questions (e.g. every bullet listed in BAB V above) was not re-verified question-by-question in this pass — the tables and top-level conditional rendering are confirmed real and populated, but a full 1:1 audit of every single sub-question per profession is a reasonable follow-up if that level of grading precision is needed.

## Net-New Gap List (for a capstone "known limitations" section)

Distinct from the general gaps already tracked in `DEVELOPMENT_PLAN.md` and `docs/IMPLEMENTATION_PLAN.md`, these are specific to the original blueprint brief and not yet built:

1. **No OAuth login** — email+password only.
2. **No email verification at registration** — accounts are usable immediately on signup (registration is a separate flow from the already-implemented forgot-password email delivery).
3. **Q18 "pelatihan yang sedang diikuti" field missing** from onboarding.
4. **Q21 "peran dalam kolaborasi" multi-select field missing** from onboarding.
5. **Q25 "ketersediaan waktu untuk kolaborasi" field missing** from onboarding.
6. **The entire ">5 years auto-skip" conditional-logic requirement is unbuilt** — no activity status tracking exists at all.

## What Was Built Beyond the Original Blueprint

Worth stating explicitly for a capstone defense — the platform grew well past this brief's scope: direct messaging, in-app notifications, a jobs portal, AI-driven learning-path/skill-gap analysis, an ATS CV builder with AI rewriting, saved AI usage quotas, and a full cohort/community admin system (super-admin + cohort-admin panels) — none of which appear anywhere in the original blueprint's 8-page sitemap.
