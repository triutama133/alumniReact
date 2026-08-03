// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohortId');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Database environment variables are missing.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    let query = supabaseAdmin
      .from('alumni_db')
      .select('id, nama_lengkap, aktivitas, skill_gabungan, angkatan, kota_domisili, fakultas_jurusan');

    // If cohortId is provided, filter by cohort_members
    if (cohortId && cohortId !== 'null' && cohortId !== 'undefined') {
      const { data: memberRows, error: memberError } = await supabaseAdmin
        .from('cohort_members')
        .select('user_id')
        .eq('cohort_id', Number(cohortId));

      if (memberError) {
        console.error('Error fetching cohort members:', memberError);
        return NextResponse.json({ error: 'Gagal mengambil anggota kelompok.' }, { status: 500 });
      }

      const userIds = memberRows.map(m => m.user_id);
      if (userIds.length === 0) {
        return NextResponse.json({
          totalAlumni: 0,
          activityDistribution: { pekerja: 0, bisnis: 0, irt: 0, campuran: 0 },
          angkatanDistribution: [],
          kotaDistribution: [],
          topSkills: [],
          insight: 'Belum ada anggota di kelompok ini.'
        });
      }
      query = query.in('id', userIds);
    }

    const { data: alumni, error: alumniError } = await query;

    if (alumniError || !alumni) {
      console.error('Error fetching alumni statistics:', alumniError);
      return NextResponse.json({ error: 'Gagal mengambil data statistik alumni.' }, { status: 500 });
    }

    // 1. Calculate Activity Distribution
    let pekerjaCount = 0;
    let bisnisCount = 0;
    let irtCount = 0;
    let campuranCount = 0;

    alumni.forEach(a => {
      const act = (a.aktivitas || '').toLowerCase();
      const hasPekerja = act.includes('bekerja') || act.includes('pekerja');
      const hasBisnis = act.includes('bisnis') || act.includes('freelance') || act.includes('wirausaha');
      const hasIrt = act.includes('rumah tangga') || act.includes('irt');

      if ((hasPekerja && hasBisnis) || (hasPekerja && hasIrt) || (hasBisnis && hasIrt)) {
        campuranCount++;
      } else if (hasPekerja) {
        pekerjaCount++;
      } else if (hasBisnis) {
        bisnisCount++;
      } else if (hasIrt) {
        irtCount++;
      } else {
        pekerjaCount++; // Default fallback
      }
    });

    // 2. Calculate Graduation Year (Angkatan) Distribution
    const angkatanMap: Record<number, number> = {};
    alumni.forEach(a => {
      if (a.angkatan) {
        angkatanMap[a.angkatan] = (angkatanMap[a.angkatan] || 0) + 1;
      }
    });
    const angkatanDistribution = Object.entries(angkatanMap)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year);

    // 3. Calculate Location Distribution (Kota Domisili)
    const kotaMap: Record<string, number> = {};
    alumni.forEach(a => {
      if (a.kota_domisili) {
        const kota = a.kota_domisili.trim().replace(/^\w/, (c: string) => c.toUpperCase());
        kotaMap[kota] = (kotaMap[kota] || 0) + 1;
      }
    });
    const kotaDistribution = Object.entries(kotaMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Calculate Top 8 Skills
    const skillsMap: Record<string, { display: string; count: number }> = {};
    alumni.forEach(a => {
      if (a.skill_gabungan) {
        const parts = a.skill_gabungan
          .replace(/,/g, ';')
          .replace(/\|/g, ';')
          .split(';');

        parts.forEach((part: string) => {
          const clean = part.trim();
          if (clean.length > 1) {
            const key = clean.toLowerCase();
            // Filter out common useless keywords if any
            if (!['dan', 'atau', 'dengan', 'yang'].includes(key)) {
              if (skillsMap[key]) {
                skillsMap[key].count += 1;
              } else {
                skillsMap[key] = { display: clean, count: 1 };
              }
            }
          }
        });
      }
    });
    const topSkills = Object.values(skillsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(s => ({ name: s.display, count: s.count }));

    // 4.5 Calculate Top 5 Majors / Fakultas
    const majorsMap: Record<string, { display: string; count: number }> = {};
    alumni.forEach(a => {
      if (a.fakultas_jurusan) {
        const clean = a.fakultas_jurusan.trim();
        if (clean.length > 1) {
          const key = clean.toLowerCase();
          if (majorsMap[key]) {
            majorsMap[key].count += 1;
          } else {
            majorsMap[key] = { display: clean, count: 1 };
          }
        }
      }
    });
    const topMajors = Object.values(majorsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(m => ({ name: m.display, count: m.count }));

    // 5. Generate Smart Network Synergy Insight
    let insight = '';
    const total = alumni.length;
    if (total > 0) {
      const pPersen = Math.round((pekerjaCount / total) * 100);
      const bPersen = Math.round((bisnisCount / total) * 100);
      const iPersen = Math.round((irtCount / total) * 100);
      
      if (pekerjaCount > bisnisCount && pekerjaCount > irtCount) {
        insight = `Komunitas didominasi oleh kalangan **Profesional/Pekerja** (${pPersen}%). Keahlian teknis dan manajerial sangat melimpah, siap mendukung digitalisasi bagi ${bisnisCount} pelaku bisnis di dalam kelompok.`;
      } else if (bisnisCount > pekerjaCount && bisnisCount > irtCount) {
        insight = `Komunitas didominasi oleh **Wirausahawan/Pebisnis** (${bPersen}%). Ini adalah ekosistem kolaborasi komersial yang dinamis, dengan peluang kemitraan bisnis dan penyediaan lapangan kerja baru yang tinggi.`;
      } else {
        insight = `Komunitas memiliki komposisi yang **beragam dan seimbang** antara Profesional (${pPersen}%), Pebisnis (${bPersen}%), dan Ibu Rumah Tangga (${iPersen}%). Sinergi antar-sektor sangat terbuka lebar.`;
      }
    } else {
      insight = 'Belum ada data anggota terdaftar.';
    }

    return NextResponse.json({
      totalAlumni: total,
      activityDistribution: {
        pekerja: pekerjaCount,
        bisnis: bisnisCount,
        irt: irtCount,
        campuran: campuranCount,
      },
      angkatanDistribution,
      kotaDistribution,
      topSkills,
      topMajors,
      insight,
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ANALYTICS_API] error:', message);
    return NextResponse.json({ error: 'Internal server error saat mengambil data analitik.' }, { status: 500 });
  }
}
