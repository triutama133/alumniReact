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
