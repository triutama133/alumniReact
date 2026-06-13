// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// Asumsikan Anda memiliki tipe database jika ingin type-safe
// import { Database } from '@/types/supabase';

// Buat fungsi untuk mendapatkan JWT kustom dari localStorage
const getCustomJwt = (): string | null => {
  if (typeof window !== 'undefined') { // Pastikan kode berjalan di sisi klien
    return localStorage.getItem('custom-jwt-token');
  }
  return null;
};

// Buat fungsi untuk menginisialisasi klien Supabase
// Ini akan selalu mencoba menyertakan JWT kustom jika ada
export function createClient(): SupabaseClient { // Atau SupabaseClient<Database> jika ada tipe
  const customJwt = getCustomJwt();

  // Opsi 1: Jika Anda hanya ingin menggunakan token untuk RLS via header.
  // Supabase client secara otomatis menyertakan header Authorization jika token tersedia.
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Ini adalah cara untuk "mengatur" token awal.
        // Namun, untuk Custom JWT, RLS akan membaca JWT dari header secara langsung,
        // bukan dari sesi internal Supabase.
        // Supabase client akan menambahkan header Authorization secara otomatis
        // jika ada session yang valid.
        // setSession mungkin tidak sepenuhnya diperlukan karena kita tidak pakai GoTrue
        // tapi bisa membantu tools lain yang mengandalkan state auth.
      },
      global: {
        headers: {
          // Secara eksplisit tambahkan header Authorization jika token kustom ada
          ...(customJwt && { Authorization: `Bearer ${customJwt}` })
        }
      }
    }
  );

  // Jika Anda ingin Supabase Client merasa "terautentikasi" (meskipun bukan melalui GoTrue),
  // Anda bisa mengatur session secara manual. Namun ini tidak akan memicu GoTrue
  // atau membuat data di auth.users. Ini hanya untuk state klien.
  // if (customJwt) {
  //   supabase.auth.setSession({
  //     access_token: customJwt,
  //     refresh_token: 'dummy-refresh-token', // Dummy refresh token
  //     user: { /* Parse JWT untuk mengisi data user */ },
  //     expires_in: 3600,
  //     expires_at: Math.floor(Date.now() / 1000) + 3600
  //   }).then(({ error }) => {
  //     if (error) console.error('Error setting custom session in client:', error);
  //   });
  // }

  return supabase;
}
