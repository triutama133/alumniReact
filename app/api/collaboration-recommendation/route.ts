// app/api/collaboration-recommendation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProfileRecommendation } from '@/lib/api';
import { AlumniProfileType } from '@/lib/types';

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
    const { userId } = await req.json();

    if (!userId) {
      console.log('[REC_API] userId tidak ada dalam permintaan.');
      return NextResponse.json({ error: 'ID pengguna wajib diisi.' }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('alumni_db')
      .select(`
        *,
        alumni_pekerja(*),
        alumni_bisnis(*),
        alumni_rumah_tangga(*)
      `)
      .eq('id', userId)
      .single() as { data: AlumniProfileType | null, error: unknown }; // Perbaikan: Ganti 'any' dengan 'unknown'

    if (error || !profile) {
      console.error('[REC_API] Error fetching profile for recommendation:', (error as Error)?.message || 'Profile not found.'); // Perbaikan: Type assertion
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan untuk rekomendasi.' }, { status: 404 });
    }

    console.log(`[REC_API] Profil ditemukan: ${profile.nama_lengkap}. Menghasilkan rekomendasi...`);
    const recommendation = await getProfileRecommendation(profile);
    console.log('[REC_API] Rekomendasi berhasil dihasilkan.');

    return NextResponse.json({ recommendation: recommendation }, { status: 200 });

  } catch (error: unknown) { // Perbaikan: Ganti 'any' dengan 'unknown'
    console.error('[REC_API] ERROR FATAL di Rekomendasi Kolaborasi API Route:', (error as Error).message); // Perbaikan: Type assertion
    return NextResponse.json({ error: 'Terjadi kesalahan internal server saat menghasilkan rekomendasi.' }, { status: 500 });
  }
}
