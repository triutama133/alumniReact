// src/lib/api.ts
import { AlumniProfileType } from './types'; // Import tipe AlumniProfileType yang sudah didefinisikan

export interface RecommendedCandidate {
  id: number;
  nama_lengkap: string;
  aktivitas: string | null;
  skills: string;
  match_score: number;
  match_strength: number;
  tier: 'kuat' | 'sedang' | 'lemah';
}

export interface ProfileRecommendationResult {
  text: string;
  candidates: RecommendedCandidate[];
}

// Fungsi ini sekarang akan menerima objek profil lengkap
export async function getProfileRecommendation(
  profileData: AlumniProfileType,
  cohortId?: number | null,
  source?: string
): Promise<ProfileRecommendationResult> {
  // Pastikan kita memiliki URL backend dan kunci API
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // URL ke FastAPI Render Anda
  const apiKey = process.env.INTERNAL_API_KEY; // Kunci API rahasia untuk FastAPI Anda

  if (!apiUrl || !apiKey) {
    console.error("API URL atau API Key untuk layanan rekomendasi AI tidak dikonfigurasi.");
    return { text: "Layanan rekomendasi AI sedang tidak tersedia.", candidates: [] };
  }

  const isHome = source === 'home';
  const isKarir = source === 'karir';
  const endpoint = isHome ? '/wawasan' : (isKarir ? '/karir' : '/rekomendasi');

  // Siapkan body permintaan untuk FastAPI Anda
  const requestBody = {
    user_id: profileData.id,
    nama_lengkap: profileData.nama_lengkap, // Ambil nama_lengkap dari objek profileData
    cohort_id: cohortId || null,
    language: 'id' // Tetapkan bahasa ke 'id' secara statis seperti yang Anda jelaskan
  };

  try {
    console.log(`[LLM_API] Mengirim permintaan ke FastAPI di ${apiUrl}${endpoint} dengan body:`, requestBody);
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey, // Menggunakan kunci API rahasia dari server untuk FastAPI
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store', // Pastikan selalu mendapat data baru
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error(`[LLM_API] API Error dari FastAPI: Status ${response.status}`, errorBody);
      return {
        text: `Gagal mengambil rekomendasi. Status: ${response.status}. Pesan: ${errorBody?.detail || errorBody?.message || 'Tidak ada detail error.'}`,
        candidates: [],
      };
    }

    const data = await response.json();
    console.log("[LLM_API] Respon sukses dari FastAPI:", data);
    const candidates: RecommendedCandidate[] = data.candidates || [];
    if (isHome) {
      return { text: data.wawasan || "Tidak ada wawasan yang dapat dihasilkan saat ini.", candidates };
    } else if (isKarir) {
      return { text: data.karir || "Tidak ada rekomendasi pengembangan karir yang dapat dihasilkan saat ini.", candidates };
    } else {
      return { text: data.rekomendasi || "Tidak ada rekomendasi yang dapat dihasilkan saat ini.", candidates };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[LLM_API] Fetch Error untuk FastAPI Rekomendasi AI:", msg);
    return { text: "Terjadi kesalahan saat mencoba menghubungi layanan rekomendasi AI.", candidates: [] };
  }
}

