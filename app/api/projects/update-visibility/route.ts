// app/api/projects/update-visibility/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);
    const { projectId, isPublic } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID wajib ditentukan.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch project to verify ownership
    const { data: project, error: getErr } = await supabaseAdmin
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (getErr || !project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (Number(project.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik proyek ini.' }, { status: 403 });
    }

    // Update visibility
    const { error: updateErr } = await supabaseAdmin
      .from('projects')
      .update({ is_public: isPublic })
      .eq('id', projectId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_public: isPublic });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
