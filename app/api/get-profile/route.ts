// app/api/get-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers'; // Untuk mendapatkan userId dari header

import { AlumniProfileType } from '@/lib/types'; // Import tipe AlumniProfileType

// NOTE: Supabase client is created inside the handler to avoid forcing environment
// variable resolution at module-evaluation time (which breaks `next build` when
// env vars are not available during static analysis).

export async function GET() {
  console.log('--- Memulai Permintaan Get Profile API ---');
  try {
    const headersList = headers();
    const userIdString = (await headersList).get('x-user-id'); // Dapatkan userId dari header

    if (!userIdString) {
      console.log('[GET_PROFILE_API] User ID tidak ditemukan di header.');
      return NextResponse.json({ error: 'Autentikasi gagal: User ID tidak ditemukan.' }, { status: 401 });
    }

    // Convert string to bigint/number for database operations
    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      console.log('[GET_PROFILE_API] User ID tidak valid.');
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    // Create Supabase admin client at runtime (avoids build-time errors)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan untuk route get-profile.');
      return NextResponse.json({ error: 'Server misconfigured: missing environment variables.' }, { status: 500 });
    }

    console.log(`[GET_PROFILE_API] Mencari profil pengguna dengan ID: ${userId} dari alumni_db`);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data: profile, error } = await supabaseAdmin
      .from('alumni_db')
      .select(`
        *,
        user(*),
        alumni_education_histories(*),
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
    const transformedProfile: Record<string, unknown> = { ...profile };
    
    // Fungsi helper untuk mengonversi string comma-separated ke array
    const convertStringToArray = (field: string | null | undefined): string[] => {
      return (typeof field === 'string' ? field.split(',').map(s => s.trim()).filter(Boolean) : []);
    };

    // Safely set transformed array fields
    const aktivitasField = transformedProfile['aktivitas'];
    if (typeof aktivitasField === 'string') transformedProfile['aktivitas'] = convertStringToArray(aktivitasField);
    const jenisDukungan = transformedProfile['jenis_dukungan_dibutuhkan'];
    if (typeof jenisDukungan === 'string') transformedProfile['jenis_dukungan_dibutuhkan'] = convertStringToArray(jenisDukungan);
    const bidangKontribusi = transformedProfile['bidang_kontribusi_minat'];
    if (typeof bidangKontribusi === 'string') transformedProfile['bidang_kontribusi_minat'] = convertStringToArray(bidangKontribusi);
    // --- Akhir transformasi data ---

    console.log('[GET_PROFILE_API] Profil berhasil dimuat.');
    return NextResponse.json(transformedProfile, { status: 200 });

  } catch (error: unknown) {
    console.error('[GET_PROFILE_API] ERROR FATAL:', (error as Error).message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
