// app/api/cohorts/resolve-key/route.ts
// GET: Look up a cohort by its find_key alone (no id needed), for the "Punya kode
// undangan?" search box on the discovery page — someone who was only given a code
// verbally/in chat, not a full /community/join/[id]?key=... link, can still locate a
// private cohort this way. find_key only unlocks the preview (name/description/member
// count) — it is NOT sufficient to join; the separate join_key is required for that, so
// this response never includes join_key. A wrong code gets the same generic error as
// any other lookup failure, so codes can't be brute-forced by distinguishing error types.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const findKey = (new URL(req.url).searchParams.get('findKey') || '').trim();
    if (!findKey) {
      return NextResponse.json({ error: 'Masukkan kode pencarian.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: cohort } = await supabase
      .from('cohorts')
      .select('id, name, description, visibility, join_mode')
      .eq('find_key', findKey)
      .maybeSingle();

    if (!cohort) {
      return NextResponse.json({ error: 'Kode pencarian tidak ditemukan. Periksa kembali kode Anda.' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('cohort_members')
      .select('id')
      .eq('cohort_id', cohort.id)
      .eq('user_id', userId)
      .maybeSingle();

    let viewerStatus: 'member' | 'pending' | null = membership ? 'member' : null;
    if (!membership) {
      const { data: pendingRequest } = await supabase
        .from('cohort_join_requests')
        .select('id')
        .eq('cohort_id', cohort.id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      if (pendingRequest) viewerStatus = 'pending';
    }

    const { count: memberCount } = await supabase
      .from('cohort_members')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohort.id);

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
