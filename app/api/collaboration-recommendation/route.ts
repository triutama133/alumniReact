// app/api/collaboration-recommendation/route.ts
// Ini adalah API Route sisi server untuk menghasilkan rekomendasi kolaborasi LLM.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProfileRecommendation } from '@/lib/api'; // Mengimpor fungsi LLM Anda
import { AlumniProfileType } from '@/lib/types'; // Import tipe AlumniProfileType

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan untuk route rekomendasi.');
  throw new Error('Missing environment variables for recommendation API route.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function POST(req: NextRequest) {
  console.log('--- Memulai Permintaan Rekomendasi Kolaborasi API ---');
  try {
    const { userId } = await req.json(); // Menerima ID pengguna dari klien

    if (!userId) {
      console.log('[REC_API] userId tidak ada dalam permintaan.');
      return NextResponse.json({ error: 'ID pengguna wajib diisi.' }, { status: 400 });
    }

    // Ambil profil lengkap pengguna dari database
    console.log(`[REC_API] Mencari profil pengguna dengan ID: ${userId} dari alumni_db`);
    const { data: profile, error } = await supabaseAdmin
      .from('alumni_db')
      .select(`
        *,
        alumni_pekerja(*),
        alumni_bisnis(*),
        alumni_rumah_tangga(*)
      `)
      .eq('id', userId)
      .single() as { data: AlumniProfileType | null, error: any }; // Type assertion

    if (error || !profile) {
      console.error('[REC_API] Error fetching profile for recommendation:', error?.message || 'Profile not found.');
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan untuk rekomendasi.' }, { status: 404 });
    }

    console.log(`[REC_API] Profil ditemukan: ${profile.nama_lengkap}. Menghasilkan rekomendasi...`);
    const recommendation = await getProfileRecommendation(profile); // Teruskan objek profil lengkap ke fungsi LLM
    console.log('[REC_API] Rekomendasi berhasil dihasilkan.');

    return NextResponse.json({ recommendation: recommendation }, { status: 200 });

  } catch (error: any) {
    console.error('[REC_API] ERROR FATAL di Rekomendasi Kolaborasi API Route:', error.message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server saat menghasilkan rekomendasi.' }, { status: 500 });
  }
}
