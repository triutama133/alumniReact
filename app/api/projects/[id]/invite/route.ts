// app/api/projects/[id]/invite/route.ts
// POST: Owner directly invites a talent (e.g. found via AI Scout) as a project
// collaborator. Unlike the self-serve apply flow, this grants membership immediately —
// the owner is exercising their own authority over who's on their team — and notifies
// the invited user. If that user already has a pending/rejected application, it's
// upgraded to accepted rather than erroring, since the owner's intent here supersedes it.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId || Number.isNaN(Number(targetUserId))) {
      return NextResponse.json({ error: 'Target talenta wajib diisi.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .select('id, title, owner_id')
      .eq('id', projectId)
      .maybeSingle();

    if (projectErr || !project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (Number(project.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik proyek ini.' }, { status: 403 });
    }

    if (Number(targetUserId) === userId) {
      return NextResponse.json({ error: 'Anda tidak dapat mengundang diri sendiri.' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('project_applications')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing?.status === 'accepted') {
      return NextResponse.json({ error: 'Talenta ini sudah menjadi kolaborator proyek ini.' }, { status: 400 });
    }

    let applicationId: number | null = null;
    if (existing) {
      const { error: updateErr } = await supabase
        .from('project_applications')
        .update({ status: 'accepted' })
        .eq('id', existing.id);
      if (updateErr) {
        console.error('[PROJECT_INVITE] Error updating application:', updateErr.message);
        return NextResponse.json({ error: 'Gagal mengundang talenta.' }, { status: 500 });
      }
      applicationId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('project_applications')
        .insert({ project_id: projectId, user_id: targetUserId, status: 'accepted', role: 'collaborator' })
        .select('id')
        .single();
      if (insertErr) {
        console.error('[PROJECT_INVITE] Error inserting application:', insertErr.message);
        return NextResponse.json({ error: 'Gagal mengundang talenta.' }, { status: 500 });
      }
      applicationId = inserted?.id ?? null;
    }

    await createNotification({
      userId: Number(targetUserId),
      title: 'Anda diundang bergabung ke proyek!',
      content: `${project.title ? `Pemilik proyek "${project.title}"` : 'Seorang pemilik proyek'} mengundang Anda sebagai kolaborator.`,
      type: 'project_invite',
      relatedId: applicationId,
    });

    return NextResponse.json({ message: 'Talenta berhasil diundang sebagai kolaborator!' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
