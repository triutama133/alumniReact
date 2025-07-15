// src/lib/types.ts

// --- Tipe Project (pertahankan jika ada) ---
export interface ProjectWithOwner {
  id: string;
  created_at: string;
  title: string;
  description: string;
  required_skills: string[];
  status: string;
  owner: Array<{ id: string; nama_lengkap: string; }>;
}

// --- Tipe User Kustom (pertahankan jika ada) ---
export interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}

// --- Tipe untuk Pendidikan (Q8-Q11) ---
export type PendidikanTerakhir = 'SD' | 'SMP' | 'SMA/SMK' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3';

// --- Tipe untuk Aktivitas/Pekerjaan (Q17) ---
export type AktivitasPekerjaan = 
  'Profesional Institusi' | 
  'Entrepreneur/Wirausaha' | 
  'Pekerja Sosial/NGO' | 
  'Content Creator/Pekerja Kreatif Digital' | 
  'Belum Bekerja' | 
  'Pekerja Informal/Freelance/Harian' | 
  'Petani/Nelayan/Peternak' | 
  'Guru/Tenaga Pendidik' |
  'Ibu Rumah Tangga' |
  'Mahasiswa dan FG';

// --- Tipe untuk Status Durasi Aktivitas ---
export type AktivitasStatusDurasi = 
  "Masih aktif" | 
  "1 tahun lalu" | 
  "2-3 tahun lalu" | 
  "3-5 tahun lalu" | 
  ">5 tahun";

// --- Tipe untuk Detail Aktivitas (untuk aktivitas_status_durasi) ---
export interface AktivitasDetailType {
  name: AktivitasPekerjaan;
  duration: AktivitasStatusDurasi;
}

// --- Tipe untuk Jenis Dukungan (Q18) ---
export type JenisDukungan = 
  'Peluang kerja' | 
  'Kolaborasi proyek' | 
  'Mentor' | 
  'Pendamping usaha' | 
  'Relasi profesional' | 
  'Akses pasar' | 
  'Lainnya';

// --- Tipe untuk Bidang Kontribusi (Q19) ---
export type BidangKontribusi = 
  'Pendidikan' | 
  'Lingkungan' | 
  'Ekonomi' | 'Teknologi' | 'Kesehatan' | 'Komunitas' | 'Kreatif' |
  'Pertanian/Pangan' | 'Perikanan' | 'Peternakan';

// --- Tipe untuk Relasi Pekerjaan (alumni_pekerja) ---
export interface AlumniPekerjaType {
  id?: number;
  nama_instansi: string | null;
  posisi: string | null;
  pengalaman_proyek: string | null;
  akses_jejaring: boolean | null;
  pengalaman_bermitra: boolean | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Bisnis (alumni_bisnis) ---
export interface AlumniBisnisType {
  id?: number;
  keahlian_wirausahaan: string | null;
  produk_layanan_utama: string | null;
  nama_usaha: string | null;
  skala_usaha: string | null;
  kendala_bisnis: string | null;
  target_pasar: 'B2C' | 'B2B' | 'B2C dan B2B' | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Filantropi/NGO (alumni_sosial) ---
export interface AlumniSosialType {
  id?: number;
  keahlian_sosial: string | null;
  pengalaman_proyek_sosial: string | null;
  isu_fokus: string | null;
  nama_organisasi: string | null;
  pengalaman_bermitra_sosial: boolean | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Content Creator (alumni_kreatif) ---
export interface AlumniKreatifType {
  id?: number;
  keahlian_kreatif: string | null;
  platform_digital_utama: string | null;
  jenis_konten: string | null;
  total_jangkauan: string | null;
  kisaran_rate_card: string | null;
  demografi_followers: string | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Ibu Rumah Tangga (alumni_rumah_tangga) ---
export interface AlumniRumahTanggaType {
  id?: number;
  keahlian_irt: string | null;
  kegiatan_organisasi_irt: string | null;
  pengalaman_tim_irt: boolean | null;
  mencari_pekerjaan_kolaborasi_irt: boolean | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Mahasiswa dan FG (alumni_mahasiswa) ---
export interface AlumniMahasiswaType {
  id?: number;
  keahlian_mahasiswa: string | null;
  kegiatan_organisasi_mahasiswa: string | null;
  pengalaman_tim_mahasiswa: boolean | null;
  mencari_pekerjaan_kolaborasi_mahasiswa: boolean | null;
  pengalaman_magang: string | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Pekerja Informal/Freelance/Harian (alumni_informal) ---
export interface AlumniInformalType {
  id?: number;
  keahlian_informal: string | null;
  pengalaman_tim_informal: boolean | null;
  pernah_rekrut_memimpin: boolean | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Petani/Nelayan/Peternak (alumni_agri) ---
export interface AlumniAgriType {
  id?: number;
  keahlian_agri: string | null;
  komoditas_utama: string | null;
  tergabung_kelompok: boolean | null;
  skala_usaha_agri: string | null;
  nilai_tambah_diterapkan: string | null;
  kendala_dihadapi_agri: string | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}

// --- Tipe untuk Relasi Guru/Tenaga Pendidik (alumni_pendidik) ---
export interface AlumniPendidikType {
  id?: number;
  keahlian_pendidik: string | null;
  jenjang_pendidikan: string | null;
  mata_pelajaran: string | null;
  inovasi_pembelajaran: string | null;
  mengajar_bimbel: boolean | null;
  relevant_skills: string | null; // Disimpan sebagai string comma-separated di DB
}


// --- Tipe Utama AlumniProfileType (alumni_db) ---
export interface AlumniProfileType {
  id: string; // ID dari user (string, karena dari JWT/params)
  created_at: string;
  email: string | null;
  username: string | null;
  role: string;
  last_login: string | null;

  // Q1-Q16 (General Information)
  nama_lengkap: string | null;
  nama_panggilan: string | null;
  tahun_lahir: number | null;
  jenis_kelamin: 'Laki-laki' | 'Perempuan' | null;
  kota_domisili: string | null;
  nomor_handphone: string | null;
  pendidikan_terakhir: PendidikanTerakhir | null;
  nama_institusi_pendidikan_terakhir: string | null;
  jurusan_studi: string | null;
  tahun_kelulusan: number | null;
  skill_gabungan: string | null; // Ini adalah STRING comma-separated dari DB
  bahasa_dikuasai: string | null; // Ini adalah STRING comma-separated dari DB
  sertifikasi: string | null;
  instagram_link: string | null;
  linkedin_link: string | null;
  portofolio_link: string | null;

  // Q17 (Aktivitas/Pekerjaan - Multi-select, disimpan sebagai string di DB)
  aktivitas: string | null; // Ini adalah STRING comma-separated dari DB
  
  // Q18 (Jenis Dukungan - Multi-select, disimpan sebagai string di DB)
  jenis_dukungan_dibutuhkan: string | null;

  // Q19 (Bidang Kontribusi - Multi-select, disimpan sebagai string di DB)
  bidang_kontribusi_minat: string | null;

  // Relasi Data (Conditional - Q17 Follow-up)
  alumni_pekerja: AlumniPekerjaType[];
  alumni_bisnis: AlumniBisnisType[];
  alumni_sosial: AlumniSosialType[];
  alumni_kreatif: AlumniKreatifType[];
  alumni_rumah_tangga: AlumniRumahTanggaType[];
  alumni_mahasiswa: AlumniMahasiswaType[];
  alumni_informal: AlumniInformalType[];
  alumni_agri: AlumniAgriType[];
  alumni_pendidik: AlumniPendidikType[];
}
