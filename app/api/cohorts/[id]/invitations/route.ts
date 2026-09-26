// app/api/cohorts/[id]/invitations/route.ts
// GET: List pending (not yet accepted/declined) invitations sent by this cohort's
// admins, so the admin console can show who's been invited and avoid re-inviting.
// DELETE: Cancel a pending invitation before the invitee responds.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) {
      return NextResponse.json({ error: 'ID Kelompok tidak valid.' }, { status: 400 });
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

    const { data: adminCheck } = await supabase
      .from('cohort_members')
      .select('role')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Hanya Admin kelompok yang dapat melihat daftar undangan.' }, { status: 403 });
    }

    const { data: invitations, error } = await supabase
      .from('cohort_invitations')
      .select('id, invited_user_id, created_at')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[COHORT_INVITATIONS_GET] Error:', error.message);
      return NextResponse.json({ error: 'Gagal memuat daftar undangan.' }, { status: 500 });
    }

    const invitedUserIds = (invitations || []).map((i) => i.invited_user_id);
    let alumniById = new Map<number, { nama_lengkap: string | null; nama_panggilan: string | null; email: string | null }>();
    if (invitedUserIds.length > 0) {
      const { data: alumniRows } = await supabase
        .from('alumni_db')
        .select('id, nama_lengkap, nama_panggilan, email')
        .in('id', invitedUserIds);
      alumniById = new Map((alumniRows || []).map((a) => [a.id, a]));
    }

    const formatted = (invitations || []).map((i) => {
      const alumni = alumniById.get(i.invited_user_id);
      return {
        id: i.id,
        user_id: i.invited_user_id,
        created_at: i.created_at,
        nama_lengkap: alumni?.nama_lengkap || 'Anonim',
        nama_panggilan: alumni?.nama_panggilan || '',
        email: alumni?.email || '',
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) {
      return NextResponse.json({ error: 'ID Kelompok tidak valid.' }, { status: 400 });
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

    const body = await req.json().catch(() => ({}));
    const invitationId = Number(body?.invitationId);
    if (!invitationId || Number.isNaN(invitationId)) {
      return NextResponse.json({ error: 'ID undangan tidak valid.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: adminCheck } = await supabase
      .from('cohort_members')
      .select('role')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Hanya Admin kelompok yang dapat membatalkan undangan.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('cohort_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('cohort_id', cohortId);

    if (error) {
      console.error('[COHORT_INVITATIONS_DELETE] Error:', error.message);
      return NextResponse.json({ error: 'Gagal membatalkan undangan.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Undangan dibatalkan.' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
