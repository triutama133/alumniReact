// app/api/collaboration-recommendation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProfileRecommendation } from '@/lib/api';
import { AlumniProfileType } from '@/lib/types';

// Supabase admin client will be created at runtime inside the handler to avoid
// build-time failures if environment variables are not present during static
// analysis.

export async function POST(req: NextRequest) {
  console.log('--- Memulai Permintaan Rekomendasi Kolaborasi API ---');
  try {
    const { userId, cohortId, source } = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan untuk route rekomendasi.');
      return NextResponse.json({ error: 'Server misconfigured: missing environment variables.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    if (!userId) {
      console.log('[REC_API] userId tidak ada dalam permintaan.');
      return NextResponse.json({ error: 'ID pengguna wajib diisi.' }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('alumni_db')
      .select(`
        *,
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
      .single() as { data: AlumniProfileType | null, error: unknown }; // Perbaikan: Ganti 'any' dengan 'unknown'

    if (error || !profile) {
      console.error('[REC_API] Error fetching profile for recommendation:', (error as Error)?.message || 'Profile not found.'); // Perbaikan: Type assertion
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan untuk rekomendasi.' }, { status: 404 });
    }

    if (source === 'home') {
      console.log('[REC_API] Menghitung wawasan partner kolaborasi secara lokal (Tanpa LLM)...');
      
      // 1. Ambil data semua alumni untuk statistik
      const { data: allAlumni, error: alumniError } = await supabaseAdmin
        .from('alumni_db')
        .select('id, nama_lengkap, aktivitas, skill_gabungan, gabungan_data');
        
      if (alumniError || !allAlumni) {
        throw new Error(alumniError?.message || 'Gagal mengambil data alumni.');
      }
      
      // Saring agar tidak menyertakan profil diri sendiri
      const otherAlumni = allAlumni.filter(x => Number(x.id) !== Number(userId));
      
      // Tokenisasi skill & aktivitas saya dengan penanganan tipe data aman
      const mySkills = (profile.skill_gabungan || '').toLowerCase().split(/[\s,;]+/).filter(s => s.length > 2);
      
      let myActivities: string[] = [];
      if (typeof profile.aktivitas === 'string') {
        myActivities = profile.aktivitas.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean);
      } else if (Array.isArray(profile.aktivitas)) {
        myActivities = profile.aktivitas.map((a: string) => a.trim().toLowerCase()).filter(Boolean);
      }
      
      // Cari 3 alumni teratas dengan kecocokan keahlian
      const ranked = otherAlumni.map(other => {
        const otherText = `${other.skill_gabungan || ''} ${other.gabungan_data || ''}`.toLowerCase();
        let score = 0;
        
        // Cek overlap kata kunci skill
        for (const word of mySkills) {
          if (otherText.includes(word)) {
            score += word.length >= 6 ? 1.5 : 1.0;
          }
        }
        
        // Bonus kecocokan aktivitas
        let otherActivities: string[] = [];
        if (typeof other.aktivitas === 'string') {
          otherActivities = other.aktivitas.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean);
        } else if (Array.isArray(other.aktivitas)) {
          otherActivities = other.aktivitas.map((a: string) => a.trim().toLowerCase()).filter(Boolean);
        }
        
        const hasOverlap = myActivities.some((myAct: string) => otherActivities.includes(myAct));
        if (hasOverlap) {
          score += 2.0;
        }
        
        return {
          nama_lengkap: other.nama_lengkap,
          aktivitas: other.aktivitas,
          skill_gabungan: other.skill_gabungan,
          score
        };
      }).filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
        
      // Hitung statistik kategori
      const totalAlumni = allAlumni.length || 1;
      const sameActivityCount = allAlumni.filter(x => {
        let otherActs: string[] = [];
        if (typeof x.aktivitas === 'string') {
          otherActs = x.aktivitas.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean);
        } else if (Array.isArray(x.aktivitas)) {
          otherActs = x.aktivitas.map((a: string) => a.trim().toLowerCase()).filter(Boolean);
        }
        return myActivities.some((myAct: string) => otherActs.includes(myAct));
      }).length;
      
      const percentage = Math.round((sameActivityCount / totalAlumni) * 100);
      const primaryActivity = myActivities[0] || 'Alumni';
      
      // Buat ringkasan markdown yang persis sama dengan output prompt
      let wawasan = `📊 **Posisi Jejaring**: Anda berada di kategori **${primaryActivity}** bersama **${sameActivityCount}** alumni lainnya (${percentage}% dari total ${totalAlumni} alumni di jejaring).\n\n`;
      wawasan += `🤝 **Partner Kolaborasi Teratas**:\n`;
      
      if (ranked.length > 0) {
        ranked.forEach(partner => {
          let act = 'Alumni';
          if (typeof partner.aktivitas === 'string') {
            act = partner.aktivitas.split(',')[0]?.trim() || 'Alumni';
          } else if (Array.isArray(partner.aktivitas) && partner.aktivitas.length > 0) {
            act = partner.aktivitas[0]?.trim() || 'Alumni';
          }
          wawasan += `- **${partner.nama_lengkap}** (${act}): Cocok untuk kolaborasi di bidang *${partner.skill_gabungan || 'umum'}*.\n`;
        });
      } else {
        wawasan += `- Belum ada partner dengan skill yang selaras dalam jejaring saat ini.\n`;
      }
      
      wawasan += `\n💡 **Peluang Kolaborasi**: Disarankan untuk berdiskusi tentang integrasi proyek atau bertukar keahlian praktikal bersama partner terdekat Anda.`;
      
      return NextResponse.json({ recommendation: wawasan }, { status: 200 });
    }

    console.log(`[REC_API] Profil ditemukan: ${profile.nama_lengkap}. Menghasilkan rekomendasi...`);
    const recommendation = await getProfileRecommendation(profile, cohortId, source);
    console.log('[REC_API] Rekomendasi berhasil dihasilkan.');

    return NextResponse.json({ recommendation: recommendation }, { status: 200 });

  } catch (error: unknown) { // Perbaikan: Ganti 'any' dengan 'unknown'
    console.error('[REC_API] ERROR FATAL di Rekomendasi Kolaborasi API Route:', (error as Error).message); // Perbaikan: Type assertion
    return NextResponse.json({ error: 'Terjadi kesalahan internal server saat menghasilkan rekomendasi.' }, { status: 500 });
  }
}
