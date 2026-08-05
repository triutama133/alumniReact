// app/api/projects/applications/review/route.ts
// POST: Terima / Tolak lamaran proyek (hanya untuk owner)
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        const headersList = await headers();
        const userIdString = headersList.get('x-user-id');
        if (!userIdString) {
            return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
        }

        const userId = Number(userIdString);
        if (Number.isNaN(userId)) {
            return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
        }

        const body = await req.json();
        const applicationId = Number(body?.applicationId);
        const action = body?.action as string;

        if (!applicationId || Number.isNaN(applicationId)) {
            return NextResponse.json({ error: 'ID lamaran tidak valid.' }, { status: 400 });
        }

        if (action !== 'accept' && action !== 'reject') {
            return NextResponse.json({ error: 'Aksi tidak valid. Gunakan accept atau reject.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Ambil lamaran + project untuk validasi ownership
        const { data: application, error: appError } = await supabase
            .from('project_applications')
            .select(`
                id,
                status,
                user_id,
                project_id,
                projects ( id, owner_id, title )
            `)
            .eq('id', applicationId)
            .maybeSingle();

        if (appError) {
            console.error('[REVIEW_APPLICATION] Error fetching application:', appError.message);
            return NextResponse.json({ error: 'Gagal memuat lamaran.' }, { status: 500 });
        }

        if (!application) {
            return NextResponse.json({ error: 'Lamaran tidak ditemukan.' }, { status: 404 });
        }

        const project = application.projects as unknown as {
            id: string;
            owner_id: number;
            title: string;
        } | null;

        if (!project) {
            return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
        }

        if (Number(project.owner_id) !== userId) {
            return NextResponse.json({ error: 'Anda bukan pemilik proyek ini.' }, { status: 403 });
        }

        // Update status lamaran
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        const { error: updateError } = await supabase
            .from('project_applications')
            .update({ status: newStatus })
            .eq('id', applicationId);

        if (updateError) {
            console.error('[REVIEW_APPLICATION] Error updating application:', updateError.message);
            return NextResponse.json({ error: 'Gagal memperbarui status lamaran.' }, { status: 500 });
        }

        // Notifikasi ke pelamar
        await createNotification({
            userId: Number(application.user_id),
            title: action === 'accept' ? 'Lamaran Anda Diterima!' : 'Lamaran Anda Ditolak',
            content: action === 'accept'
                ? `Selamat! Anda diterima untuk proyek "${project.title}".`
                : `Maaf, lamaran Anda untuk proyek "${project.title}" belum berhasil.`,
            type: 'project_status',
            relatedId: Number(application.id),
        });

        return NextResponse.json({
            success: true,
            status: newStatus,
            message: action === 'accept' ? 'Lamaran diterima! Pelamar mendapat notifikasi.' : 'Lamaran ditolak.',
        }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}