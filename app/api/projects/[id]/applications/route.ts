// app/api/projects/[id]/applications/route.ts
// GET: Ambil daftar pelamar proyek (hanya untuk owner)
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;

        const headersList = await headers();
        const userIdString = headersList.get('x-user-id');
        if (!userIdString) {
            return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
        }

        const userId = Number(userIdString);
        if (Number.isNaN(userId)) {
            return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Validasi project ada & user adalah owner
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, owner_id')
            .eq('id', projectId)
            .maybeSingle();

        if (projectError) {
            console.error('[PROJECT_APPLICATIONS] Error fetching project:', projectError.message);
            return NextResponse.json({ error: 'Gagal memuat proyek.' }, { status: 500 });
        }

        if (!project) {
            return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
        }

        if (Number(project.owner_id) !== userId) {
            return NextResponse.json({ error: 'Anda bukan pemilik proyek ini.' }, { status: 403 });
        }

        // Ambil semua aplikasi + profil alumni
        const { data: applications, error } = await supabase
            .from('project_applications')
            .select(`
                id,
                status,
                role,
                created_at,
                user_id,
                alumni_db (
                    id,
                    nama_lengkap,
                    nama_panggilan,
                    aktivitas,
                    skill_gabungan,
                    kota_domisili
                )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[PROJECT_APPLICATIONS] Error fetching applications:', error.message);
            return NextResponse.json({ error: 'Gagal memuat lamaran proyek.' }, { status: 500 });
        }

        return NextResponse.json(applications || [], { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}