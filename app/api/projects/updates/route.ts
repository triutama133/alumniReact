// app/api/projects/updates/route.ts
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
    const { projectId, title, content } = await req.json();

    if (!projectId || !title || !content) {
      return NextResponse.json({ error: 'Data input tidak lengkap.' }, { status: 400 });
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

    // Insert update log
    const { data: newUpdate, error: insertErr } = await supabaseAdmin
      .from('project_updates')
      .insert({
        project_id: projectId,
        title,
        content,
        author_id: userId
      })
      .select('*, author:alumni_db (id, nama_lengkap)')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Serialize ID fields
    const serializedUpdate = {
      ...newUpdate,
      id: Number(newUpdate.id),
      author_id: Number(newUpdate.author_id),
      author: newUpdate.author ? {
        ...newUpdate.author,
        id: Number(newUpdate.author.id)
      } : null
    };

    return NextResponse.json(serializedUpdate, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
