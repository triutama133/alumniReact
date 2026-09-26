// app/api/projects/update-details/route.ts
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
    const { projectId, plan, milestones } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID wajib ditentukan.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch project to check permissions. The plan is an owner-only concern, but the
    // milestone checklist is a shared team task list — an accepted collaborator can
    // update milestones, just not the plan.
    const { data: project, error: getErr } = await supabaseAdmin
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (getErr || !project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const isOwner = Number(project.owner_id) === userId;
    if (!isOwner) {
      if (plan !== undefined) {
        return NextResponse.json({ error: 'Hanya pemilik proyek yang dapat mengubah rencana proyek.' }, { status: 403 });
      }

      const { data: application } = await supabaseAdmin
        .from('project_applications')
        .select('status')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (application?.status !== 'accepted') {
        return NextResponse.json({ error: 'Anda bukan pemilik atau anggota proyek ini.' }, { status: 403 });
      }
    }

    // Prepare update payload
    const updatePayload: Record<string, any> = {};
    if (plan !== undefined) updatePayload.plan = plan;
    if (milestones !== undefined) updatePayload.milestones = milestones;

    // Update
    const { error: updateErr } = await supabaseAdmin
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan, milestones });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
