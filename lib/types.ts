// lib/types.ts

export type ProjectWithOwner = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  required_skills: string[] | null;
  status: string;
  // 'owner' adalah sebuah array dari objek
  owner: {
    id: string;
    nama_lengkap: string;
  }[] | null;
};

// Definisikan bentuk data untuk kartu hasil pencarian alumni
export type AlumniSearchResult = {
  id: string; // Sebenarnya UUID, tapi kita gunakan string untuk aman
  nama_lengkap: string | null;
  nama_panggilan: string | null;
  aktivitas: string | null;
  skill_gabungan: string | null;
  fakultas_jurusan: string | null;
};

export interface AlumniProfileType {
  id: string; // Asumsi ID alumni_db juga string (UUID) atau sesuaikan dengan bigint jika itu
  created_at: string;
  email: string;
  password_hash: string | null; // Hanya jika Anda masih punya ini di alumni_db
  username: string | null;
  role: string;
  last_login: string | null;
  // Kolom dari alumni_db
  nama_lengkap: string;
  nama_panggilan: string | null;
  angkatan: number | null;
  fakultas_jurusan: string | null;
  aktivitas: 'Pekerja' | 'Bisnis' | 'Rumah Tangga' | null;
  skill_gabungan: string | null; // Keterampilan dipisahkan koma

  // Sub-relasi dari join
  alumni_pekerja: Array<{
    nama_instansi: string;
    posisi: string;
    // ... kolom alumni_pekerja lainnya
  }>;
  alumni_bisnis: Array<{
    nama_usaha: string;
    bidang_usaha: string;
    // ... kolom alumni_bisnis lainnya
  }>;
  alumni_rumah_tangga: Array<{
    bidang_minat: string;
    // ... kolom alumni_rumah_tangga lainnya
  }>;
}

// Tipe kustom untuk user yang login (dari header/JWT)
export interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}