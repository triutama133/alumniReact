// app/api/cohorts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

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

    // Only members of this cohort may view its detail page.
    const { data: memberCheck } = await supabaseAdmin
      .from('cohort_members')
      .select('role')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke komunitas ini.' }, { status: 403 });
    }

    const { data: cohort, error } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .eq('id', cohortId)
      .maybeSingle();

    if (error || !cohort) {
      return NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 });
    }

    const { count: memberCount } = await supabaseAdmin
      .from('cohort_members')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId);

    return NextResponse.json({
      ...cohort,
      id: Number(cohort.id),
      owner_id: Number(cohort.owner_id),
      viewer_role: memberCheck.role,
      member_count: memberCount ?? 0,
    }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
