# 02. Style & UI/UX - Design System & Styling Guidelines

Dokumen ini menjelaskan pedoman desain, palet warna, tipografi, dan standar antarmuka (UI/UX) untuk menghasilkan aplikasi **Indonesia Talent Hub** yang tampak premium, modern, dan responsif.

---

## 🎨 Palet Warna & Tema (Design Tokens)

Indonesia Talent Hub menggunakan sistem tema modern dengan dukungan penuh untuk **Mode Terang (Light)** dan **Mode Gelap (Dark)**. Identitas warna menggunakan aksen Indigo premium dipadukan dengan latar belakang gelap yang elegan.

Berikut variabel CSS utama yang didefinisikan di `globals.css`:

| Token | Light Mode | Dark Mode | Deskripsi |
|-------|------------|-----------|-----------|
| **`background`** | `hsl(0, 0%, 100%)` | `hsl(224, 71%, 4%)` | Latar belakang halaman |
| **`foreground`** | `hsl(224, 71%, 4%)` | `hsl(210, 20%, 98%)` | Warna teks utama |
| **`card`** | `hsl(0, 0%, 100%)` | `hsl(224, 71%, 7%)` | Latar belakang Card / Box |
| **`popover`** | `hsl(0, 0%, 100%)` | `hsl(224, 71%, 5%)` | Dropdown, Modal, Tooltip |
| **`primary`** | `hsl(263, 70%, 50%)` | `hsl(263, 70%, 50%)` | Warna branding utama (Indigo) |
| **`accent`** | `hsl(262, 80%, 96%)` | `hsl(263, 50%, 15%)` | Efek hover & badge aktif |
| **`border`** | `hsl(220, 13%, 91%)` | `hsl(224, 71%, 12%)` | Garis pembatas komponen |

---

## ✍️ Tipografi (Typography)

Untuk memberikan kesan yang profesional, modern, dan sangat mudah dibaca:
* **Font Utama:** Menggunakan **Inter** atau **Outfit** dari Google Fonts.
* **Ukuran Heading (`h1` sampai `h6`):** Wajib menggunakan font-weight `font-semibold` atau `font-bold` dengan *tracking* ketat (`tracking-tight`).
* **Ukuran Body:** Standar pembacaan menggunakan `text-sm` (14px) untuk data padat dan `text-base` (16px) untuk deskripsi naratif.

---

## ✨ Estetika & UX Premium

Untuk menonjolkan nilai estetika platform, pastikan pengembang menerapkan gaya berikut:

1. **Aksen Glassmorphism:**
   Gunakan perpaduan background semi-transparan, blur filter, dan border halus untuk komponen seperti Navbar dan Sidebar.
   ```tailwind
   bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50
   ```
2. **Subtle Micro-Animations:**
   Gunakan transisi halus durasi pendek (`duration-200` atau `duration-300`) untuk efek hover pada tombol, kartu talenta, atau item menu navigasi.
   ```tailwind
   transition-all duration-300 hover:scale-[1.01] hover:border-primary/30
   ```
3. **Responsive Breakpoints (Mobile First):**
   * Desain grid untuk layout utama harus mendukung satu kolom di layar handphone dan otomatis terbagi menjadi beberapa kolom di layar tablet/desktop.
   ```tailwind
   grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
   ```

---

## 📑 Struktur Layout Form & Tampilan Kondisional

Form onboarding profil memiliki banyak pertanyaan bersyarat (Conditional Fields). Untuk menjaga alur UX tetap mulus dan terarah:
* **Tampilan Fleksibel:** Field bersyarat dibungkus di dalam animasi *fade-in slide-down* saat diaktifkan agar pengguna tidak bingung dengan perubahan form.
* **Skip Logic untuk Keaktifan >5 Tahun:** Jika pengguna memilih status keaktifan aktivitas berdurasi lebih dari 5 tahun lalu, form detail untuk aktivitas tersebut otomatis disembunyikan (*auto-skip*) dengan keterangan visual yang jelas.
* **Indikator Progres Tab:** Pada bagian profil, pisahkan detail profesi ke dalam tab interaktif (Tab Pekerjaan, Tab Wirausaha, Tab Sosial) agar halaman profil tidak terkesan sangat panjang dan berantakan.

---

## 🔊 5. Fitur UX Interaktif Tambahan (Sound Effects & Autosave)

Untuk meningkatkan tingkat keterikatan (*user engagement*) dan memberikan impresi platform yang premium, pengembang menerapkan dua fitur berikut:

1. **Umpan Balik Suara (Audio Feedback):**
   * Pemicu audio taktil menggunakan library audio lokal `@/lib/audio.ts`.
   * Panggil `playClickSound()` saat pengguna mengklik tombol penting (seperti perpindahan tab, pemicu analisis, format teks).
   * Panggil `playSuccessSound()` untuk momen kepuasan pengguna (*peak-end rule*), seperti penyelesaian checklist persiapan kerja 100% atau setelah draf CV berhasil disimpan manual.
2. **Mesin Penyimpanan Otomatis (Autosave Engine & Indicators):**
   * Pada fitur CV Creator, perubahan draf teks disimpan secara otomatis ke database Supabase 2 detik setelah pengguna berhenti mengetik (debounce mechanism).
   * Tampilkan label status draf real-time di UI:
     * `Draf Tersimpan` (Hijau, dengan ikon Check): Perubahan sinkron sepenuhnya dengan DB.
     * `Menyimpan otomatis...` (Abu-abu, dengan ikon Spinner): Proses sync sedang berjalan.
     * `Perubahan belum disimpan` (Oranye, Italic): Menandakan input baru sedang diedit di browser.
3. **Styling Cetak Lembar A4 (Print Media Query):**
   * Supaya draf CV dapat diunduh sebagai PDF dengan rapi, gunakan target stylesheet `@media print`.
   * Sembunyikan elemen non-dokumen seperti Navbar, Sidebar, Toolbar Editor, Panel AI, dan tombol cetak (`display: none !important`), serta setel canvas CV menjadi posisi absolut dengan lebar 100% dan hilangkan bayangan border kartu agar tercetak bersih pada kertas A4 standar.
