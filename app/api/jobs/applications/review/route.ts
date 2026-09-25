// app/api/jobs/applications/review/route.ts
// POST: Terima / Tolak lamaran lowongan (hanya untuk pemilik lowongan)
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

    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        status,
        user_id,
        job_id,
        jobs ( id, owner_id, job_title )
      `)
      .eq('id', applicationId)
      .maybeSingle();

    if (appError) {
      console.error('[REVIEW_JOB_APPLICATION] Error fetching application:', appError.message);
      return NextResponse.json({ error: 'Gagal memuat lamaran.' }, { status: 500 });
    }

    if (!application) {
      return NextResponse.json({ error: 'Lamaran tidak ditemukan.' }, { status: 404 });
    }

    const job = application.jobs as unknown as {
      id: number;
      owner_id: number | null;
      job_title: string;
    } | null;

    if (!job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    if (!job.owner_id || Number(job.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik lowongan ini.' }, { status: 403 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (updateError) {
      console.error('[REVIEW_JOB_APPLICATION] Error updating application:', updateError.message);
      return NextResponse.json({ error: 'Gagal memperbarui status lamaran.' }, { status: 500 });
    }

    await createNotification({
      userId: Number(application.user_id),
      title: action === 'accept' ? 'Lamaran kerja Anda diterima!' : 'Lamaran kerja Anda ditolak',
      content: action === 'accept'
        ? `Selamat! Lamaran Anda untuk "${job.job_title}" diterima.`
        : `Maaf, lamaran Anda untuk "${job.job_title}" belum berhasil.`,
      type: 'job_status',
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
