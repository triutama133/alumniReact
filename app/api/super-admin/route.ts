// app/api/super-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    const host = headersList.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify user role
    const { data: userRecord, error: userErr } = await supabaseAdmin
      .from('user')
      .select('role')
      .eq('id', Number(userIdString))
      .single();

    if (userErr || !userRecord) {
      return NextResponse.json({ error: 'Gagal memverifikasi akun.' }, { status: 500 });
    }

    const isSuperAdmin = userRecord.role === 'super_admin';

    if (!isSuperAdmin && !isLocal) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Fetch all cohorts
    const { data: cohorts, error: cohortsErr } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .order('created_at', { ascending: false });

    if (cohortsErr) throw cohortsErr;

    // Fetch all users
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('user')
      .select('id, email, username, role, created_at')
      .order('created_at', { ascending: false });

    if (usersErr) throw usersErr;

    return NextResponse.json({
      cohorts: (cohorts || []).map(c => ({
        ...c,
        id: Number(c.id),
        owner_id: Number(c.owner_id)
      })),
      users: (users || []).map(u => ({
        ...u,
        id: Number(u.id)
      }))
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    const host = headersList.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify user role
    const { data: userRecord, error: userErr } = await supabaseAdmin
      .from('user')
      .select('role')
      .eq('id', Number(userIdString))
      .single();

    if (userErr || !userRecord) {
      return NextResponse.json({ error: 'Gagal memverifikasi akun.' }, { status: 500 });
    }

    const isSuperAdmin = userRecord.role === 'super_admin';

    // Strict check: must be either super_admin OR running in local dev environment
    if (!isSuperAdmin && !isLocal) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'extend_cohort') {
      const { cohortId } = body;
      if (!cohortId) return NextResponse.json({ error: 'Cohort ID wajib diisi.' }, { status: 400 });

      // Fetch current expiry
      const { data: cohort, error: fetchErr } = await supabaseAdmin
        .from('cohorts')
        .select('expires_at')
        .eq('id', Number(cohortId))
        .single();

      if (fetchErr || !cohort) {
        return NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 });
      }

      const currentExpiry = cohort.expires_at ? new Date(cohort.expires_at) : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error: updateErr } = await supabaseAdmin
        .from('cohorts')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', Number(cohortId));

      if (updateErr) {
        return NextResponse.json({ error: 'Gagal memperpanjang lisensi.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Lisensi berhasil diperpanjang 30 hari!' });
    }

    if (action === 'toggle_cohort_status') {
      const { cohortId, currentStatus } = body;
      if (!cohortId) return NextResponse.json({ error: 'Cohort ID wajib diisi.' }, { status: 400 });

      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';

      const { error: updateErr } = await supabaseAdmin
        .from('cohorts')
        .update({ subscription_status: nextStatus })
        .eq('id', Number(cohortId));

      if (updateErr) {
        return NextResponse.json({ error: 'Gagal memperbarui status.' }, { status: 500 });
      }

      return NextResponse.json({ message: `Status berhasil diubah menjadi ${nextStatus}!` });
    }

    if (action === 'delete_cohort') {
      const { cohortId } = body;
      if (!cohortId) return NextResponse.json({ error: 'Cohort ID wajib diisi.' }, { status: 400 });

      const { error: deleteErr } = await supabaseAdmin
        .from('cohorts')
        .delete()
        .eq('id', Number(cohortId));

      if (deleteErr) {
        return NextResponse.json({ error: 'Gagal menghapus komunitas.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Komunitas berhasil dihapus!' });
    }

    if (action === 'update_user_role') {
      const { targetUserId, newRole } = body;
      if (!targetUserId || !newRole) return NextResponse.json({ error: 'Target User ID dan role baru wajib diisi.' }, { status: 400 });

      const { error: updateErr } = await supabaseAdmin
        .from('user')
        .update({ role: newRole })
        .eq('id', Number(targetUserId));

      if (updateErr) {
        return NextResponse.json({ error: 'Gagal memperbarui role pengguna.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Role pengguna berhasil diperbarui!' });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
