// app/api/jobs/apply/route.ts
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
    const jobId = Number(body?.jobId);
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1000) : null;

    if (!jobId || Number.isNaN(jobId)) {
      return NextResponse.json({ error: 'ID lowongan tidak valid.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, job_title, owner_id, source, is_active')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    if (!job.is_active) {
      return NextResponse.json({ error: 'Lowongan ini sudah tidak aktif.' }, { status: 400 });
    }

    if (job.source !== 'user' || !job.owner_id) {
      return NextResponse.json({ error: 'Lowongan ini hanya bisa dilamar melalui link eksternal.' }, { status: 400 });
    }

    if (Number(job.owner_id) === userId) {
      return NextResponse.json({ error: 'Anda tidak bisa melamar lowongan Anda sendiri.' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.error('[JOB_APPLY] Error checking existing application:', existingError.message);
      return NextResponse.json({ error: 'Gagal memverifikasi status pengajuan sebelumnya.' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        message: 'Anda sudah mengajukan lamaran untuk lowongan ini.',
        status: existing.status,
      }, { status: 400 });
    }

    const { data: application, error: insertError } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, user_id: userId, status: 'pending', message })
      .select('id, status, created_at')
      .single();

    if (insertError || !application) {
      console.error('[JOB_APPLY] Error inserting application:', insertError?.message);
      return NextResponse.json({ error: 'Gagal mengirimkan lamaran.' }, { status: 500 });
    }

    await createNotification({
      userId: Number(job.owner_id),
      title: 'Ada pelamar baru!',
      content: `Seseorang melamar untuk lowongan "${job.job_title}" yang Anda pasang.`,
      type: 'job_apply',
      relatedId: jobId,
    });

    return NextResponse.json({ message: 'Lamaran berhasil dikirim!', application }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
