// app/api/cohorts/[id]/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

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

    // 1. Verifikasi apakah calling user adalah admin di cohort tersebut
    const { data: adminCheck, error: adminCheckErr } = await supabaseAdmin
      .from('cohort_members')
      .select('role')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (adminCheckErr || !adminCheck) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Admin komunitas yang dapat melakukan tindakan ini.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'remove_member') {
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'User ID target wajib diisi.' }, { status: 400 });

      // Cannot remove yourself if you are the last admin, but let's just delete the user_id row
      const { error: deleteErr } = await supabaseAdmin
        .from('cohort_members')
        .delete()
        .eq('cohort_id', cohortId)
        .eq('user_id', Number(targetUserId));

      if (deleteErr) {
        return NextResponse.json({ error: 'Gagal mengeluarkan anggota.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Anggota berhasil dikeluarkan dari komunitas.' });
    }

    if (action === 'update_member_role') {
      const { targetUserId, newRole } = body;
      if (!targetUserId || !newRole) {
        return NextResponse.json({ error: 'User ID target dan role baru wajib diisi.' }, { status: 400 });
      }

      if (newRole !== 'admin' && newRole !== 'member') {
        return NextResponse.json({ error: 'Role tidak didukung.' }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('cohort_members')
        .update({ role: newRole })
        .eq('cohort_id', cohortId)
        .eq('user_id', Number(targetUserId));

      if (updateErr) {
        return NextResponse.json({ error: 'Gagal memperbarui role anggota.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Role anggota berhasil diperbarui.' });
    }

    if (action === 'update_cohort_details') {
      const { name, description } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Nama komunitas wajib diisi.' }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('cohorts')
        .update({ name: name.trim(), description: description ? description.trim() : null })
        .eq('id', cohortId);

      if (updateErr) {
        return NextResponse.json({ error: 'Gagal memperbarui profil komunitas.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Profil komunitas berhasil diperbarui.' });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
