// app/api/get-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers'; // Untuk mendapatkan userId dari header

import { AlumniProfileType } from '@/lib/types'; // Import tipe AlumniProfileType

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan untuk route get-profile.');
  throw new Error('Missing environment variables for get-profile API route.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function GET(req: NextRequest) {
  console.log('--- Memulai Permintaan Get Profile API ---');
  try {
    const headersList = headers();
    const userId = (await headersList).get('x-user-id'); // Dapatkan userId dari header

    if (!userId) {
      console.log('[GET_PROFILE_API] User ID tidak ditemukan di header.');
      return NextResponse.json({ error: 'Autentikasi gagal: User ID tidak ditemukan.' }, { status: 401 });
    }

    // Ambil profil lengkap pengguna dari database
    console.log(`[GET_PROFILE_API] Mencari profil pengguna dengan ID: ${userId} dari alumni_db`);
    const { data: profile, error } = await supabaseAdmin
      .from('alumni_db')
      .select(`
        *,
        user(*),
        alumni_pekerja(*),
        alumni_bisnis(*),
        alumni_sosial(*),
        alumni_kreatif(*),
        alumni_rumah_tangga(*),
        alumni_mahasiswa(*),
        alumni_informal(*),
        alumni_agri(*),
        alumni_pendidik(*)
      `)
      
      .eq('id', userId)
      .single() as { data: AlumniProfileType | null, error: unknown }; // Tetap type assertion ke unknown

    // Perbaikan: Lakukan pengecekan yang lebih aman untuk error.code
    const supabaseError = error as { code?: string, message?: string }; // Type assertion ke objek dengan properti opsional

    if (error && supabaseError.code !== 'PGRST116') { // PGRST116 = row not found (profil belum ada)
      console.error('[GET_PROFILE_API] Error fetching profile:', supabaseError.message || "Unknown Supabase error");
      return NextResponse.json({ error: 'Gagal memuat data profil.' }, { status: 500 });
    }

    if (!profile) {
      console.log('[GET_PROFILE_API] Profil belum ada untuk user ini. Mengembalikan data kosong.');
      // Mengembalikan objek kosong atau default jika profil belum ada
      return NextResponse.json({}, { status: 200 }); 
    }

    // --- Transformasi data sebelum dikirim ke klien ---
    const transformedProfile = { ...profile };
    
    // Fungsi helper untuk mengonversi string comma-separated ke array
    const convertStringToArray = (field: string | null | undefined): string[] => {
      return (typeof field === 'string' ? field.split(',').map(s => s.trim()).filter(Boolean) : []);
    };

    (transformedProfile as any).aktivitas = convertStringToArray(transformedProfile.aktivitas);
    (transformedProfile as any).jenis_dukungan_dibutuhkan = convertStringToArray(transformedProfile.jenis_dukungan_dibutuhkan);
    (transformedProfile as any).bidang_kontribusi_minat = convertStringToArray(transformedProfile.bidang_kontribusi_minat);
    // --- Akhir transformasi data ---

    console.log('[GET_PROFILE_API] Profil berhasil dimuat.');
    return NextResponse.json(transformedProfile, { status: 200 });

  } catch (error: unknown) {
    console.error('[GET_PROFILE_API] ERROR FATAL:', (error as Error).message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
