// app/api/cohorts/[id]/join/route.ts
// GET: Preview a cohort before joining (used by both the public discovery page and the
//      private /communities/join/[id]?key=... invite-link landing page). For a private
//      cohort, a missing/wrong find_key gets the exact same 404 as a nonexistent id — the
//      point of "private" is that the cohort's name isn't discoverable without it.
// POST: Actually join. find_key only unlocked the preview — this is gated independently
//       by join_key, a separate secret the user must provide even if they already have a
//       working invite link. Grants instant membership if join_mode is 'auto', otherwise
//       files a pending row in cohort_join_requests for an admin to review.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

const NOT_FOUND = NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 });

async function resolvePreviewableCohort(cohortId: number, userId: number, findKey: string | null) {
  const supabase = getAdminClient();

  const { data: cohort } = await supabase
    .from('cohorts')
    .select('id, name, description, visibility, join_mode')
    .eq('id', cohortId)
    .maybeSingle();

  if (!cohort) return { error: NOT_FOUND } as const;

  const { data: membership } = await supabase
    .from('cohort_members')
    .select('id')
    .eq('cohort_id', cohortId)
    .eq('user_id', userId)
    .maybeSingle();

  // Members (and the cohort's own admins) can always see it regardless of key/visibility.
  if (!membership && cohort.visibility === 'private') {
    const { data: keyMatch } = await supabase
      .from('cohorts')
      .select('id')
      .eq('id', cohortId)
      .eq('find_key', findKey || '__no_key__')
      .maybeSingle();
    if (!keyMatch) return { error: NOT_FOUND } as const;
  }

  return { cohort, isMember: Boolean(membership), supabase } as const;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) return NOT_FOUND;

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const findKey = new URL(req.url).searchParams.get('key');
    const resolved = await resolvePreviewableCohort(cohortId, userId, findKey);
    if ('error' in resolved) return resolved.error;

    const { cohort, isMember, supabase } = resolved;

    let viewerStatus: 'member' | 'pending' | null = isMember ? 'member' : null;
    if (!isMember) {
      const { data: pendingRequest } = await supabase
        .from('cohort_join_requests')
        .select('id')
        .eq('cohort_id', cohortId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      if (pendingRequest) viewerStatus = 'pending';
    }

    const { count: memberCount } = await supabase
      .from('cohort_members')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId);

    return NextResponse.json({
      id: Number(cohort.id),
      name: cohort.name,
      description: cohort.description,
      visibility: cohort.visibility,
      join_mode: cohort.join_mode,
      member_count: memberCount ?? 0,
      viewer_status: viewerStatus,
    }, { status: 200 });
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
    if (Number.isNaN(cohortId)) return NOT_FOUND;

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const joinKey = typeof body.joinKey === 'string' ? body.joinKey.trim() : '';

    const supabase = getAdminClient();
    const { data: cohort } = await supabase
      .from('cohorts')
      .select('id, name, visibility, join_mode, join_key')
      .eq('id', cohortId)
      .maybeSingle();

    if (!cohort) return NOT_FOUND;

    const { data: membership } = await supabase
      .from('cohort_members')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) {
      return NextResponse.json({ error: 'Anda sudah menjadi anggota komunitas ini.' }, { status: 400 });
    }

    // join_key is the actual access gate, independent of find_key — required for every
    // private cohort regardless of how the user got here (search-by-code or direct link).
    if (cohort.visibility === 'private' && joinKey !== cohort.join_key) {
      return NextResponse.json({ error: 'Kode gabung tidak valid.' }, { status: 403 });
    }

    const { data: existingPending } = await supabase
      .from('cohort_join_requests')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json({ error: 'Permintaan bergabung Anda sedang menunggu persetujuan admin.' }, { status: 400 });
    }

    if (cohort.join_mode === 'auto') {
      const { error: insertErr } = await supabase
        .from('cohort_members')
        .insert({ cohort_id: cohortId, user_id: userId, role: 'member' });

      if (insertErr) {
        console.error('[COHORT_JOIN] Error auto-joining:', insertErr.message);
        return NextResponse.json({ error: 'Gagal bergabung ke komunitas.' }, { status: 500 });
      }

      return NextResponse.json({ message: `Anda telah bergabung dengan ${cohort.name}!`, status: 'joined' }, { status: 200 });
    }

    const { error: requestErr } = await supabase
      .from('cohort_join_requests')
      .insert({ cohort_id: cohortId, user_id: userId, status: 'pending' });

    if (requestErr) {
      console.error('[COHORT_JOIN] Error filing join request:', requestErr.message);
      return NextResponse.json({ error: 'Gagal mengirim permintaan bergabung.' }, { status: 500 });
    }

    return NextResponse.json({ message: `Permintaan bergabung ke ${cohort.name} telah dikirim, menunggu persetujuan admin.`, status: 'pending' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
