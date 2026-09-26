// app/api/cohorts/invitations/route.ts
// GET: List the current user's own pending community invitations.
// POST: Accept or decline one of them. Accepting is the only path that actually
// creates a cohort_members row — an admin sending an invite never does that
// directly anymore (see POST /api/cohorts/[id]/members).
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as z from 'zod';
import { getAdminClient } from '@/lib/adminClient';

const respondSchema = z.object({
  invitationId: z.number().int(),
  action: z.enum(['accept', 'decline']),
});

export async function GET() {
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

    const supabase = getAdminClient();

    const { data: invitations, error } = await supabase
      .from('cohort_invitations')
      .select('id, cohort_id, invited_by, created_at')
      .eq('invited_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MY_INVITATIONS_GET] Error:', error.message);
      return NextResponse.json({ error: 'Gagal memuat undangan.' }, { status: 500 });
    }

    if (!invitations || invitations.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const cohortIds = [...new Set(invitations.map((i) => i.cohort_id))];
    const inviterIds = [...new Set(invitations.map((i) => i.invited_by))];

    const [{ data: cohorts }, { data: inviters }] = await Promise.all([
      supabase.from('cohorts').select('id, name, description').in('id', cohortIds),
      supabase.from('alumni_db').select('id, nama_lengkap').in('id', inviterIds),
    ]);

    const cohortById = new Map((cohorts || []).map((c) => [c.id, c]));
    const inviterById = new Map((inviters || []).map((a) => [a.id, a]));

    const formatted = invitations.map((i) => {
      const cohort = cohortById.get(i.cohort_id);
      const inviter = inviterById.get(i.invited_by);
      return {
        id: i.id,
        cohort_id: i.cohort_id,
        cohort_name: cohort?.name || 'Komunitas',
        cohort_description: cohort?.description || null,
        invited_by_name: inviter?.nama_lengkap || 'Admin komunitas',
        created_at: i.created_at,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const validationResult = respondSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Input tidak valid.' }, { status: 400 });
    }
    const { invitationId, action } = validationResult.data;

    const supabase = getAdminClient();

    // The invitation must belong to the requester — never trust the id alone.
    const { data: invitation } = await supabase
      .from('cohort_invitations')
      .select('id, cohort_id, invited_user_id')
      .eq('id', invitationId)
      .eq('invited_user_id', userId)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: 'Undangan tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'accept') {
      const { error: memberInsertError } = await supabase
        .from('cohort_members')
        .insert({ cohort_id: invitation.cohort_id, user_id: userId, role: 'member' });

      if (memberInsertError && !memberInsertError.message.includes('duplicate key')) {
        console.error('[MY_INVITATIONS_POST] Error accepting invitation:', memberInsertError.message);
        return NextResponse.json({ error: 'Gagal bergabung ke komunitas.' }, { status: 500 });
      }
    }

    await supabase.from('cohort_invitations').delete().eq('id', invitationId);

    return NextResponse.json(
      { message: action === 'accept' ? 'Anda berhasil bergabung dengan komunitas!' : 'Undangan ditolak.', cohortId: invitation.cohort_id },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
