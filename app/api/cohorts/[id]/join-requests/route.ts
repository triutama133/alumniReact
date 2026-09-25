// app/api/cohorts/[id]/join-requests/route.ts
// GET: Admin-only — list pending join requests for a cohort, with the requester's
//      alumni profile merged in (cohort_join_requests.user_id references "user", not
//      alumni_db, so it needs the same two-query merge as cohort_members/members).
// POST: Admin-only — approve or reject a pending request. Approving inserts the user
//       into cohort_members; rejecting just marks the request as decided.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

async function requireAdmin(cohortId: number, userId: number) {
  const supabase = getAdminClient();
  const { data: adminCheck } = await supabase
    .from('cohort_members')
    .select('role')
    .eq('cohort_id', cohortId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return Boolean(adminCheck);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) {
      return NextResponse.json({ error: 'ID Komunitas tidak valid.' }, { status: 400 });
    }

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    if (!(await requireAdmin(cohortId, userId))) {
      return NextResponse.json({ error: 'Hanya Admin komunitas yang dapat melihat permintaan bergabung.' }, { status: 403 });
    }

    const supabase = getAdminClient();
    const { data: requests, error } = await supabase
      .from('cohort_join_requests')
      .select('id, user_id, status, created_at')
      .eq('cohort_id', cohortId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[COHORT_JOIN_REQUESTS_GET] Error:', error.message);
      return NextResponse.json({ error: 'Gagal memuat permintaan bergabung.' }, { status: 500 });
    }

    const requesterIds = (requests || []).map((r) => r.user_id);
    let alumniById = new Map<number, { nama_lengkap: string | null; nama_panggilan: string | null; email: string | null }>();
    if (requesterIds.length > 0) {
      const { data: alumniRows } = await supabase
        .from('alumni_db')
        .select('id, nama_lengkap, nama_panggilan, email')
        .in('id', requesterIds);
      alumniById = new Map((alumniRows || []).map((a) => [a.id, a]));
    }

    const result = (requests || []).map((r) => {
      const alumni = alumniById.get(r.user_id);
      return {
        id: Number(r.id),
        user_id: Number(r.user_id),
        status: r.status,
        created_at: r.created_at,
        nama_lengkap: alumni?.nama_lengkap || 'Anonim',
        nama_panggilan: alumni?.nama_panggilan || '',
        email: alumni?.email || '',
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) {
      return NextResponse.json({ error: 'ID Komunitas tidak valid.' }, { status: 400 });
    }

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    if (!(await requireAdmin(cohortId, userId))) {
      return NextResponse.json({ error: 'Hanya Admin komunitas yang dapat memproses permintaan bergabung.' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action } = body;
    if (!requestId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: joinRequest, error: fetchErr } = await supabase
      .from('cohort_join_requests')
      .select('id, cohort_id, user_id, status')
      .eq('id', requestId)
      .eq('cohort_id', cohortId)
      .maybeSingle();

    if (fetchErr || !joinRequest) {
      return NextResponse.json({ error: 'Permintaan bergabung tidak ditemukan.' }, { status: 404 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Permintaan ini sudah diproses sebelumnya.' }, { status: 400 });
    }

    if (action === 'approve') {
      const { error: insertErr } = await supabase
        .from('cohort_members')
        .insert({ cohort_id: cohortId, user_id: joinRequest.user_id, role: 'member' });

      if (insertErr) {
        console.error('[COHORT_JOIN_REQUESTS_POST] Error approving:', insertErr.message);
        return NextResponse.json({ error: 'Gagal menyetujui permintaan.' }, { status: 500 });
      }
    }

    const { error: updateErr } = await supabase
      .from('cohort_join_requests')
      .update({ status: action === 'approve' ? 'approved' : 'rejected', decided_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateErr) {
      console.error('[COHORT_JOIN_REQUESTS_POST] Error updating request status:', updateErr.message);
      return NextResponse.json({ error: 'Gagal memperbarui status permintaan.' }, { status: 500 });
    }

    return NextResponse.json({
      message: action === 'approve' ? 'Anggota berhasil disetujui dan ditambahkan.' : 'Permintaan bergabung telah ditolak.',
    }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
