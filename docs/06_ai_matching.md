# 06. AI & Semantic Search - LLM Integrations & Recommendations

Dokumen ini menjelaskan integrasi kecerdasan buatan (AI/LLM) untuk pencarian semantik (Semantic Search) talenta dan sistem pencocokan proyek kolaborasi otomatis (AI Matching).

---

## 🧠 Konsep AI Semantic Search vs Traditional Search

Pencarian tradisional hanya mencocokkan kata kunci (*keyword matching*) secara harfiah. Jika pengguna mencari *"ahli coding"*, database tidak akan menampilkan alumni yang menulis *"software engineer"* di profilnya karena katanya berbeda.

**AI Semantic Search** memecahkan masalah ini dengan memahami makna kontekstual:
* Mengubah teks profil alumni menjadi representasi numerik (**Embedding Vector**) berdimensi tinggi.
* Mencari kemiripan makna menggunakan **Cosine Similarity** di PostgreSQL (dengan bantuan ekstensi `pgvector`).
* Hasilnya, pencarian *"ahli coding"* akan secara cerdas menampilkan alumni dengan keahlian *"programmer"*, *"software developer"*, atau *"web engineer"*.

---

## 🛠️ Alur Kerja AI Matching & Semantic Search

Aplikasi mengimplementasikan pencarian AI melalui API Routes khusus:

### 1. Pencarian Talenta via AI (`POST /api/ai/talent-search`)
1. Pengguna memasukkan prompt bahasa alami di search bar, misalnya: *"Saya butuh orang untuk mengelola akun media sosial dan membuat konten tiktok."*
2. API Route mengirimkan prompt tersebut ke API LLM (Google Gemini / OpenAI) untuk diubah menjadi vektor embedding.
3. Melakukan query kemiripan vektor ke database Supabase membandingkan dengan kolom `gabungan_data` milik seluruh alumni.
4. Mengembalikan daftar talenta terbaik yang diurutkan berdasarkan skor kemiripan (*similarity score*).

### 2. Rekomendasi Kolaborasi Proyek (`POST /api/ai/project-recommendation`)
Sistem mencocokkan profil personal pengguna dengan proyek-proyek yang terdaftar di Hub Proyek.
1. Menggabungkan data profil pengguna saat ini (keahlian, pendidikan, minat kontribusi).
2. LLM membandingkan data profil tersebut dengan brief deskripsi seluruh proyek aktif.
3. LLM menghasilkan skor kecocokan dan menulis **"Alasan Rekomendasi AI"** dalam bentuk penjelasan naratif mengapa proyek tersebut sangat cocok untuk diambil oleh pengguna.

### 3. AI Gap Analysis & Learning Path (`POST /api/ai/gap-analysis`)
1. Mengambil data keahlian dari `alumni_db.skill_gabungan` pengguna.
2. Mengambil data lowongan kerja dari tabel `jobs` (hasil scraping LinkedIn/Kalibrr) yang relevan dengan kata kunci peran incaran alumni.
3. Mengirimkan kedua kumpulan data ke LLM dengan instruksi prompt terstruktur:
   * **Identifikasi Match:** Skill yang sudah dikuasai alumni.
   * **Identifikasi Gap:** Skill penting dari lowongan industri yang belum dimiliki alumni.
   * **Jalur Pembelajaran (Learning Path):** Daftar topik pelatihan, sertifikasi yang disarankan, dan referensi belajar secara bertahap untuk menutup gap keahlian tersebut.
4. Output dikembalikan sebagai skema JSON terstruktur untuk dirender di Frontend.

### 4. Engine Koordinat Visual Relasi Nodes (`GET /api/ai/nodes-network`)
Untuk menyajikan graf visual nodes di sisi frontend (menggunakan D3.js, Sigma.js, atau React Flow):
1. Mengambil top 5-10 talenta dan proyek yang direkomendasikan untuk pengguna berdasarkan cosine similarity vector.
2. Menghitung kekuatan hubungan (*weight*) berdasarkan persentase skor kecocokan.
3. Menghasilkan payload koordinat graf (X, Y) serta data relasi (*nodes* & *edges*):
   * **Node Pusat (User):** `type: "user"`, `coordinates: { x: 0, y: 0 }`.
   * **Nodes Sekitar (Matches):** `type: "talent" | "project"`, dihitung posisinya secara melingkar menggunakan trigonometri dasar (`sin` & `cos`) dengan jarak radius berbanding terbalik dari skor kecocokan (makin cocok, posisi node makin dekat ke pusat).
   * **Edges (Garis Relasi):** Menghubungkan pusat ke node sekitar dengan warna garis yang merepresentasikan ketebalan/kecocokan, serta menyimpan teks deskripsi alasan rekomendasi yang akan ditampilkan di sidebar ketika node diklik.

---

## ⚡ Sistem Caching & Penyimpanan Hasil AI (Caching vs Saved Matches)

Platform memisahkan penyimpanan data AI berdasarkan cara interaksi pengguna untuk mengoptimalkan performa dan menghemat biaya API:

### A. Caching Otomatis Sisi Server (`ai_recommendations` Table)
* **Sifat:** Sementara (*Transient*), otomatis di-refresh.
* **Tujuan:** Menghindari beban komputasi ganda jika user melakukan refresh halaman rekomendasi dalam waktu berdekatan.
* **Durasi:** Standard durasi cache disetel selama **1 jam** (`expires_at = NOW() + INTERVAL '1 hour'`).
* **Pembersihan Otomatis:** Fungsi database `cleanup_expired_ai_recommendations()` menghapus cache kadaluarsa secara berkala.

### B. Penyimpanan Permanen Pilihan Pengguna (`saved_ai_searches` Table)
* **Sifat:** Permanen (*Persistent*) atas inisiatif pengguna (User-initiated).
* **Tujuan:** Pengguna secara sadar ingin menyimpan riwayat pencarian talenta atau rekomendasi proyek tertentu agar bisa dibuka kembali kapan saja tanpa batas waktu.
* **Skema Tabel `saved_ai_searches`:**
  ```sql
  CREATE TABLE IF NOT EXISTS saved_ai_searches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,                    -- Nama/Judul pencarian
    search_type VARCHAR(50) NOT NULL,               -- 'talent' atau 'project'
    query_prompt TEXT,                              -- Prompt pencarian asli
    results_payload JSONB NOT NULL,                 -- Salinan payload hasil AI saat disimpan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX idx_saved_ai_searches_user ON saved_ai_searches(user_id);
  ```

---

## ↩️ Fallback Workflow (Penanganan Kegagalan)

Jika kuota API LLM habis atau jaringan terputus, sistem akan mengaktifkan **Fallback Mode** secara otomatis:
* **Pada Fitur Pencarian:** Sistem beralih ke pencarian teks penuh (*Full-Text Search*) menggunakan indeks `tsvector` bawaan PostgreSQL pada kolom `gabungan_data` atau `skill_gabungan`.
* **Pada Fitur Kolaborasi:** Menampilkan daftar proyek terpopuler atau proyek terbaru secara kronologis dengan pesan pemberitahuan halus bahwa rekomendasi AI sedang tidak tersedia sementara waktu.

---

## 🔌 Integrasi Microservice Python (alumni_RESTAPI)

Untuk efisiensi komputasi dan memisahkan beban kerja kecerdasan buatan, Next.js tidak memproses LLM secara langsung. Seluruh beban kerja LLM dilimpahkan ke **Microservice Python FastAPI (`alumni_RESTAPI`)**:

### 1. Arsitektur Komunikasi
* **Next.js API Route (Proxy Client):** Mencegat permintaan pengguna, memeriksa otentikasi JWT Cookie, lalu mengirimkan HTTP Request ke FastAPI.
* **FastAPI Backend (AI Engine):** Berjalan secara lokal (port default `8000`), memproses pencarian/pencocokan kemiripan kata kunci menggunakan PostgreSQL Pooler, dan berinteraksi langsung dengan API Google Gemini.

### 2. Peta Endpoint Komunikasi Internal

| Fitur Next.js | Endpoint FastAPI | Metode | Autentikasi Header | Deskripsi |
|---|---|---|---|---|
| `/api/ai/project-recommendation` | `/rekomendasi` | `POST` | `X-API-KEY` | Rekomendasi kolaborasi proyek |
| `/api/ai/project-recommendation` (Home) | `/wawasan` | `POST` | `X-API-KEY` | Posisi jejaring & statistik wawasan |
| `/api/ai/gap-analysis` | `/karir` | `POST` | `X-API-KEY` | Analisis gap & rekomendasi upskilling |
| `/api/ai/talent-search` | `/proyek_rekomendasi` | `POST` | `X-API-KEY` | Rekomendasi talenta untuk ide proyek |

### 3. Keamanan Endpoint Internal
Semua rute di FastAPI dilindungi menggunakan `X-API-KEY` yang harus dicocokkan dengan nilai `INTERNAL_API_KEY` pada file konfigurasi `.env`. Hanya Next.js API Route yang memiliki akses ke key ini, menjaga agar API AI tidak dapat diakses langsung secara bebas dari luar.

