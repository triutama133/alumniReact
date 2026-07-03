// lib/types.ts

// Note: Database uses bigint for IDs, which maps to number in TypeScript
// PostgreSQL bigint → JavaScript number (safe up to 2^53-1)

export type ProjectWithOwner = {
  id: string; // projects.id is UUID (kept as string)
  created_at: string;
  title: string;
  description: string;
  required_skills: string[] | null;
  status: string;
  // 'owner' adalah sebuah array dari objek
  owner: {
    id: number; // alumni_db.id is bigint → number
    nama_lengkap: string;
  }[] | null;
};

// Definisikan bentuk data untuk kartu hasil pencarian alumni
export type AlumniSearchResult = {
  id: number; // alumni_db.id is bigint → number
  nama_lengkap: string | null;
  nama_panggilan: string | null;
  aktivitas: string | null;
  skill_gabungan: string | null;
  fakultas_jurusan: string | null;
};

export interface AlumniProfileType {
  id: number; // alumni_db.id is bigint → number
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
  aktivitas: string | string[] | null;
  skill_gabungan: string | null; // Keterampilan dipisahkan koma
  bahasa_dikuasai?: string | null;
  sertifikasi?: string | null;
  gabungan_data?: string | null;
  jenis_dukungan_dibutuhkan?: string | string[] | null;
  bidang_kontribusi_minat?: string | string[] | null;

  // Sub-relasi dari join
  alumni_pekerja?: Array<Record<string, unknown>>;
  alumni_bisnis?: Array<Record<string, unknown>>;
  alumni_sosial?: Array<Record<string, unknown>>;
  alumni_kreatif?: Array<Record<string, unknown>>;
  alumni_rumah_tangga?: Array<Record<string, unknown>>;
  alumni_mahasiswa?: Array<Record<string, unknown>>;
  alumni_informal?: Array<Record<string, unknown>>;
  alumni_agri?: Array<Record<string, unknown>>;
  alumni_pendidik?: Array<Record<string, unknown>>;
  alumni_education_histories?: Array<{
    level?: string;
    institution_name?: string;
    major_program?: string;
    start_year?: number | null;
    end_year?: number | null;
    is_current?: boolean;
  }>;
}

// Tipe kustom untuk user yang login (dari header/JWT)
export interface CustomUserForProjectCard {
  id: number; // user.id is bigint → number
  email: string;
  role: string | null;
}