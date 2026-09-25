// app/api/cohorts/discover/route.ts
// GET: List public (visibility='public') cohorts for the "Jelajahi Komunitas" discovery
// page. Private cohorts never appear here — they're only reachable via a direct
// /communities/join/[id]?key=... link, which is the whole point of being private.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

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

    const supabase = getAdminClient();

    let query = supabase
      .from('cohorts')
      .select('id, name, description, join_mode, created_at')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data: cohorts, error } = await query;
    if (error) {
      console.error('[COHORTS_DISCOVER] Error fetching cohorts:', error.message);
      return NextResponse.json({ error: 'Gagal memuat daftar komunitas.' }, { status: 500 });
    }

    const cohortIds = (cohorts || []).map((c) => c.id);
    if (cohortIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Member counts per cohort
    const { data: memberRows } = await supabase
      .from('cohort_members')
      .select('cohort_id, user_id')
      .in('cohort_id', cohortIds);

    const memberCountByCohort = new Map<number, number>();
    const myMembership = new Set<number>();
    (memberRows || []).forEach((m) => {
      memberCountByCohort.set(m.cohort_id, (memberCountByCohort.get(m.cohort_id) || 0) + 1);
      if (Number(m.user_id) === userId) myMembership.add(m.cohort_id);
    });

    // My pending join requests, so the UI can show "Menunggu Persetujuan" instead of a Join button
    const { data: myRequests } = await supabase
      .from('cohort_join_requests')
      .select('cohort_id, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .in('cohort_id', cohortIds);

    const myPending = new Set((myRequests || []).map((r) => r.cohort_id));

    const result = (cohorts || []).map((c) => ({
      id: Number(c.id),
      name: c.name,
      description: c.description,
      join_mode: c.join_mode,
      member_count: memberCountByCohort.get(c.id) || 0,
      viewer_status: myMembership.has(c.id) ? 'member' : myPending.has(c.id) ? 'pending' : null,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
