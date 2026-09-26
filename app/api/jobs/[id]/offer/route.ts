// app/api/jobs/[id]/offer/route.ts
// POST: Owner directly offers their job posting to a talent (e.g. found via AI Scout).
// Unlike the self-serve apply flow, this grants an accepted application immediately —
// the owner is choosing who to hire — and notifies the offered candidate. If that user
// already has a pending/rejected application, it's upgraded to accepted rather than
// erroring, since the owner's intent here supersedes it.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = Number(id);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: 'ID lowongan tidak valid.' }, { status: 400 });
    }

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const { targetUserId } = await req.json();
    if (!targetUserId || Number.isNaN(Number(targetUserId))) {
      return NextResponse.json({ error: 'Target talenta wajib diisi.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, job_title, owner_id')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    if (!job.owner_id || Number(job.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik lowongan ini.' }, { status: 403 });
    }

    if (Number(targetUserId) === userId) {
      return NextResponse.json({ error: 'Anda tidak dapat menawarkan lowongan ke diri sendiri.' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing?.status === 'accepted') {
      return NextResponse.json({ error: 'Talenta ini sudah diterima untuk lowongan ini.' }, { status: 400 });
    }

    let applicationId: number | null = null;
    if (existing) {
      const { error: updateErr } = await supabase
        .from('job_applications')
        .update({ status: 'accepted' })
        .eq('id', existing.id);
      if (updateErr) {
        console.error('[JOB_OFFER] Error updating application:', updateErr.message);
        return NextResponse.json({ error: 'Gagal menawarkan lowongan.' }, { status: 500 });
      }
      applicationId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('job_applications')
        .insert({ job_id: jobId, user_id: targetUserId, status: 'accepted' })
        .select('id')
        .single();
      if (insertErr) {
        console.error('[JOB_OFFER] Error inserting application:', insertErr.message);
        return NextResponse.json({ error: 'Gagal menawarkan lowongan.' }, { status: 500 });
      }
      applicationId = inserted?.id ?? null;
    }

    await createNotification({
      userId: Number(targetUserId),
      title: 'Anda ditawari sebuah lowongan!',
      content: `${job.job_title ? `Pemilik lowongan "${job.job_title}"` : 'Sebuah lowongan'} menawarkan posisi ini langsung kepada Anda.`,
      type: 'job_offer',
      relatedId: applicationId,
    });

    return NextResponse.json({ message: 'Lowongan berhasil ditawarkan ke talenta!' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
