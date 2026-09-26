// app/api/cohorts/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import * as z from 'zod';

const addMemberSchema = z.object({
  emailsOrUsernames: z.array(z.string().min(3, 'Email atau username minimal 3 karakter.')).min(1, 'Masukkan minimal satu email atau username.'),
});

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Verifikasi apakah active user terdaftar di cohort tersebut
    const { data: memberCheck } = await supabaseAdmin
      .from('cohort_members')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke kelompok ini.' }, { status: 403 });
    }

    // 2. Ambil daftar anggota cohort
    const { data: members, error } = await supabaseAdmin
      .from('cohort_members')
      .select('id, role, joined_at, user_id')
      .eq('cohort_id', cohortId);

    if (error) {
      console.error('[COHORT_MEMBERS_GET] Error fetching members:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // cohort_members.user_id references "user", not alumni_db, so PostgREST can't
    // auto-embed alumni_db here — fetch profiles separately and merge them in.
    const memberUserIds = (members || []).map((m) => m.user_id);
    let alumniById = new Map<number, { nama_lengkap: string | null; nama_panggilan: string | null; email: string | null; angkatan: string | null }>();
    if (memberUserIds.length > 0) {
      const { data: alumniRows } = await supabaseAdmin
        .from('alumni_db')
        .select('id, nama_lengkap, nama_panggilan, email, angkatan')
        .in('id', memberUserIds);
      alumniById = new Map((alumniRows || []).map((a) => [a.id, a]));
    }

    const formattedMembers = (members || []).map((m) => {
      const alumni = alumniById.get(m.user_id);
      return {
        id: Number(m.id),
        user_id: Number(m.user_id),
        role: m.role,
        joined_at: m.joined_at,
        nama_lengkap: alumni?.nama_lengkap || 'Anonim',
        nama_panggilan: alumni?.nama_panggilan || '',
        email: alumni?.email || '',
        angkatan: alumni?.angkatan || null,
      };
    });

    return NextResponse.json(formattedMembers, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
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

    const body = await req.json();
    const validationResult = addMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Input tidak valid.', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // 1. Verifikasi apakah active user adalah admin di cohort tersebut
    const { data: adminCheck } = await supabaseAdmin
      .from('cohort_members')
      .select('role')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Hanya Admin kelompok yang dapat menambahkan anggota.' }, { status: 403 });
    }

    // 2. Fetch the cohort's name for the notification text, and existing
    // members/invitations so we can skip anyone already in one of those states.
    const { data: cohortRow } = await supabaseAdmin.from('cohorts').select('name').eq('id', cohortId).maybeSingle();
    const { data: existingMembers } = await supabaseAdmin.from('cohort_members').select('user_id').eq('cohort_id', cohortId);
    const existingMemberIds = new Set((existingMembers || []).map((m) => m.user_id));
    const { data: existingInvites } = await supabaseAdmin.from('cohort_invitations').select('invited_user_id').eq('cohort_id', cohortId);
    const existingInviteIds = new Set((existingInvites || []).map((i) => i.invited_user_id));

    const invited: string[] = [];
    const skipped: Array<{ input: string; reason: string }> = [];
    const identifiers = [...new Set(validationResult.data.emailsOrUsernames.map((v) => v.trim().toLowerCase()).filter(Boolean))];

    for (const identifier of identifiers) {
      const { data: targetUser } = await supabaseAdmin
        .from('user')
        .select('id, email')
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .maybeSingle();

      if (!targetUser) {
        skipped.push({ input: identifier, reason: 'Tidak ditemukan' });
        continue;
      }
      if (existingMemberIds.has(targetUser.id)) {
        skipped.push({ input: identifier, reason: 'Sudah menjadi anggota' });
        continue;
      }
      if (existingInviteIds.has(targetUser.id)) {
        skipped.push({ input: identifier, reason: 'Sudah diundang, menunggu respons' });
        continue;
      }

      const { error: inviteInsertError } = await supabaseAdmin
        .from('cohort_invitations')
        .insert({ cohort_id: cohortId, invited_user_id: targetUser.id, invited_by: userId });

      if (inviteInsertError) {
        console.error('[COHORT_MEMBERS_POST] Error inviting', identifier, inviteInsertError.message);
        skipped.push({ input: identifier, reason: 'Gagal mengundang' });
        continue;
      }

      existingInviteIds.add(targetUser.id);
      invited.push(identifier);

      // Best-effort notification — an invite is still considered sent even if this fails.
      await supabaseAdmin.from('notifications').insert({
        user_id: targetUser.id,
        title: 'Undangan Komunitas',
        content: `Anda diundang untuk bergabung dengan komunitas "${cohortRow?.name || 'sebuah komunitas'}".`,
        type: 'cohort_invite',
        related_id: cohortId,
        is_read: false,
      });
    }

    if (invited.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada undangan yang berhasil dikirim.', invited, skipped },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: `Undangan berhasil dikirim ke ${invited.length} orang. Mereka perlu menerima undangan sebelum menjadi anggota.`,
        invited,
        skipped,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
