// app/api/jobs/[id]/applications/route.ts
// GET: Ambil daftar pelamar lowongan (hanya untuk pemilik lowongan)
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET(
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
    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, owner_id')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) {
      console.error('[JOB_APPLICATIONS] Error fetching job:', jobError.message);
      return NextResponse.json({ error: 'Gagal memuat lowongan.' }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    if (!job.owner_id || Number(job.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik lowongan ini.' }, { status: 403 });
    }

    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('id, status, message, created_at, user_id')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[JOB_APPLICATIONS] Error fetching applications:', error.message);
      return NextResponse.json({ error: 'Gagal memuat pelamar.' }, { status: 500 });
    }

    // job_applications.user_id references "user", not alumni_db, so PostgREST can't
    // auto-embed alumni_db here — fetch profiles separately and merge them in.
    const applicantUserIds = (applications || []).map((a) => a.user_id);
    let alumniById = new Map<number, unknown>();
    if (applicantUserIds.length > 0) {
      const { data: alumniRows } = await supabase
        .from('alumni_db')
        .select('id, nama_lengkap, nama_panggilan, aktivitas, skill_gabungan, kota_domisili')
        .in('id', applicantUserIds);
      alumniById = new Map((alumniRows || []).map((a) => [a.id, a]));
    }

    const result = (applications || []).map((a) => ({
      ...a,
      alumni_db: alumniById.get(a.user_id) || null,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
