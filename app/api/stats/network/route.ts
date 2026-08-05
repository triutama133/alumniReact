// app/api/stats/network/route.ts
// GET: Statistik jejaring real dari database
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getAdminClient();

        // Total talent terdaftar di alumni_db
        const { count: totalTalent, error: totalError } = await supabase
            .from('alumni_db')
            .select('id', { count: 'exact', head: true });

        if (totalError) {
            console.error('[STATS_NETWORK] Error fetching total talent:', totalError.message);
            return NextResponse.json({ error: 'Gagal memuat statistik.' }, { status: 500 });
        }

        // Distribusi aktivitas (Grup per aktivitas_primary bila ada, fallback aktivitas)
        const { data: activityRows, error: activityError } = await supabase
            .from('alumni_db')
            .select('aktivitas');

        if (activityError) {
            console.error('[STATS_NETWORK] Error fetching activities:', activityError.message);
            return NextResponse.json({ error: 'Gagal memuat statistik.' }, { status: 500 });
        }

        const distribusiAktivitas: Record<string, number> = {};
        for (const row of activityRows || []) {
            const raw = row.aktivitas as string | null;
            if (!raw) continue;
            // Aktivitas bisa berisi multi-nilai dengan koma/titik koma
            const parts = raw.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
            if (parts.length === 0) continue;
            for (const part of parts) {
                distribusiAktivitas[part] = (distribusiAktivitas[part] ?? 0) + 1;
            }
        }

        // Total proyek aktif
        const { count: totalProyekAktif, error: proyekError } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open');

        if (proyekError) {
            console.error('[STATS_NETWORK] Error fetching active projects:', proyekError.message);
            return NextResponse.json({ error: 'Gagal memuat statistik.' }, { status: 500 });
        }

        // 3 talenta terpopuler minggu ini (berdasarkan jumlah proyek yang dimiliki + like terbanyak)
        const { data: topTalents, error: topError } = await supabase
            .from('alumni_db')
            .select(`
        id,
        nama_lengkap,
        nama_panggilan,
        aktivitas,
        skill_gabungan
      `)
            .order('id', { ascending: true })
            .limit(50);

        if (topError) {
            console.error('[STATS_NETWORK] Error fetching top talents:', topError.message);
            return NextResponse.json({ error: 'Gagal memuat statistik.' }, { status: 500 });
        }

        // Hitung jumlah proyek per user sebagai skor popularitas
        const { data: projectOwners, error: projectOwnerError } = await supabase
            .from('projects')
            .select('owner_id');

        if (projectOwnerError) {
            console.error('[STATS_NETWORK] Error fetching project owners:', projectOwnerError.message);
            return NextResponse.json({ error: 'Gagal memuat statistik.' }, { status: 500 });
        }

        const projectCountByUser: Record<number, number> = {};
        for (const p of projectOwners || []) {
            projectCountByUser[p.owner_id] = (projectCountByUser[p.owner_id] ?? 0) + 1;
        }

        const topTalentsSorted = (topTalents || [])
            .map((t) => ({
                id: t.id,
                nama_lengkap: t.nama_lengkap,
                nama_panggilan: t.nama_panggilan,
                aktivitas: t.aktivitas,
                skill_gabungan: t.skill_gabungan,
                total_proyek: projectCountByUser[t.id] ?? 0,
            }))
            .sort((a, b) => b.total_proyek - a.total_proyek)
            .slice(0, 3);

        return NextResponse.json(
            {
                total_talent: totalTalent ?? 0,
                distribusi_aktivitas: distribusiAktivitas,
                total_proyek_aktif: totalProyekAktif ?? 0,
                top_talents: topTalentsSorted,
            },
            {
                status: 200,
                headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
            }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[STATS_NETWORK] Unexpected error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}