// app/api/jobs/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = Number(id);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: 'ID lowongan tidak valid.' }, { status: 400 });
    }

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);
    const { isActive } = await req.json();

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

    // Fetch job to verify ownership — only the user who posted it may toggle it.
    const { data: job, error: getErr } = await supabaseAdmin
      .from('jobs')
      .select('owner_id')
      .eq('id', jobId)
      .single();

    if (getErr || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    if (!job.owner_id || Number(job.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik lowongan ini.' }, { status: 403 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('jobs')
      .update({ is_active: Boolean(isActive) })
      .eq('id', jobId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_active: Boolean(isActive) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
