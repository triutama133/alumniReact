import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as z from 'zod';

const projectSchema = z.object({
  title: z.string().min(10),
  description: z.string().min(50),
  required_skills: z.array(z.string().min(1)).min(1),
  // A project is global when this is empty/omitted, or scoped to every cohort
  // listed here (migration 025 — project_cohorts). cohortId is deprecated.
  cohortIds: z.array(z.number().int()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const ownerIdString = headersList.get('x-user-id');

    if (!ownerIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const ownerId = Number(ownerIdString);
    if (Number.isNaN(ownerId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data proyek tidak valid.', details: validationResult.error.errors },
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

    const cohortIds = [...new Set(validationResult.data.cohortIds)];

    // Only allow tagging communities the author actually belongs to — the client
    // supplies which cohorts to tag, so this has to be re-verified server-side.
    if (cohortIds.length > 0) {
      const { data: memberships } = await supabaseAdmin
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', ownerId)
        .in('cohort_id', cohortIds);
      const memberCohortIds = new Set((memberships || []).map((m) => m.cohort_id));
      const notMember = cohortIds.filter((id) => !memberCohortIds.has(id));
      if (notMember.length > 0) {
        return NextResponse.json({ error: 'Anda bukan anggota salah satu komunitas yang dipilih.' }, { status: 403 });
      }
    }

    const { data: newProject, error } = await supabaseAdmin
      .from('projects')
      .insert({
        title: validationResult.data.title,
        description: validationResult.data.description,
        required_skills: validationResult.data.required_skills,
        owner_id: ownerId,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (cohortIds.length > 0 && newProject) {
      const { error: tagErr } = await supabaseAdmin
        .from('project_cohorts')
        .insert(cohortIds.map((cohortId) => ({ project_id: newProject.id, cohort_id: cohortId })));
      if (tagErr) {
        console.error('[PROJECTS_API] Error tagging project cohorts:', tagErr.message);
      }
    }

    return NextResponse.json({ message: 'Proyek berhasil dibuat!' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
