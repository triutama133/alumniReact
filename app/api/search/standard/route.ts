// app/api/search/standard/route.ts
// GET: Standard (non-AI) talent search on the search page. Runs server-side so a
// community-scoped search can actually verify the requester's membership before
// returning that community's roster — the previous implementation ran this query
// directly from the browser with the anon key, trusting the client-writable
// active_cohort_id cookie with no verification at all.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 3) {
      return NextResponse.json({ error: 'Kata kunci pencarian minimal 3 karakter.' }, { status: 400 });
    }

    const cohortIdParam = searchParams.get('cohortId');
    const cohortId = cohortIdParam ? Number(cohortIdParam) : null;

    const supabase = getAdminClient();

    let memberIds: number[] | null = null;
    if (cohortId && !Number.isNaN(cohortId)) {
      const { data: membership } = await supabase
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', userId)
        .eq('cohort_id', cohortId)
        .maybeSingle();
      if (!membership) {
        return NextResponse.json({ error: 'Anda bukan anggota komunitas ini.' }, { status: 403 });
      }
      const { data: memberRows } = await supabase
        .from('cohort_members')
        .select('user_id')
        .eq('cohort_id', cohortId);
      memberIds = (memberRows || []).map((r) => Number(r.user_id));
    }

    let dbQuery = supabase
      .from('alumni_db')
      .select('id, nama_lengkap, nama_panggilan, aktivitas, skill_gabungan, fakultas_jurusan');

    if (memberIds !== null) {
      dbQuery = dbQuery.in('id', memberIds.length > 0 ? memberIds : [-1]);
    }

    const { data, error } = await dbQuery.or(`nama_lengkap.ilike.%${q}%,skill_gabungan.ilike.%${q}%`);

    if (error) {
      console.error('[SEARCH_STANDARD] Error:', error.message);
      return NextResponse.json({ error: 'Gagal melakukan pencarian standar.' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
