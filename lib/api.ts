// src/lib/api.ts
import { AlumniProfileType } from './types'; // Import tipe AlumniProfileType yang sudah didefinisikan

// Fungsi ini sekarang akan menerima objek profil lengkap
export async function getProfileRecommendation(profileData: AlumniProfileType): Promise<string | null> {
  // Pastikan kita memiliki URL backend dan kunci API
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // URL ke FastAPI Render Anda
  const apiKey = process.env.INTERNAL_API_KEY; // Kunci API rahasia untuk FastAPI Anda

  if (!apiUrl || !apiKey) {
    console.error("API URL atau API Key untuk layanan rekomendasi AI tidak dikonfigurasi.");
    return "Layanan rekomendasi AI sedang tidak tersedia.";
  }

  // Siapkan body permintaan untuk FastAPI Anda
  const requestBody = {
    nama_lengkap: profileData.nama_lengkap, // Ambil nama_lengkap dari objek profileData
    language: 'id' // Tetapkan bahasa ke 'id' secara statis seperti yang Anda jelaskan
  };

  try {
    console.log(`[LLM_API] Mengirim permintaan ke FastAPI di ${apiUrl}/rekomendasi dengan body:`, requestBody);
    const response = await fetch(`${apiUrl}/rekomendasi`, {
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
      return `Gagal mengambil rekomendasi. Status: ${response.status}. Pesan: ${errorBody?.detail || errorBody?.message || 'Tidak ada detail error.'}`;
    }

    const data = await response.json();
    console.log("[LLM_API] Respon sukses dari FastAPI:", data);
    return data.rekomendasi || "Tidak ada rekomendasi yang dapat dihasilkan saat ini.";
  } catch (error: any) {
    console.error("[LLM_API] Fetch Error untuk FastAPI Rekomendasi AI:", error);
    return "Terjadi kesalahan saat mencoba menghubungi layanan rekomendasi AI.";
  }
}
