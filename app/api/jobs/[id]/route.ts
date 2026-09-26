// app/api/jobs/[id]/route.ts
// PATCH: Owner-only edit of a user-submitted job posting. Database-sourced (scraped)
// jobs have no owner_id and can't be edited through this route.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as z from 'zod';
import { getAdminClient } from '@/lib/adminClient';

const updateJobSchema = z.object({
  job_title: z.string().min(3, 'Judul posisi minimal 3 karakter.'),
  company: z.string().min(1, 'Nama perusahaan wajib diisi.'),
  description: z.string().min(1, 'Deskripsi wajib diisi.'),
  job_desk: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('Others / General'),
  job_url: z.string().url().or(z.literal('')).optional().nullable(),
  salary: z.string().optional().nullable(),
  // A job is global when this is empty/omitted, or scoped to every cohort
  // listed here (migration 025 — job_cohorts).
  cohortIds: z.array(z.number().int()).optional().default([]),
});

export async function PATCH(
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
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const body = await req.json();
    const validationResult = updateJobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data lowongan tidak valid.', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: job, error: getErr } = await supabase
      .from('jobs')
      .select('owner_id, source')
      .eq('id', jobId)
      .maybeSingle();

    if (getErr || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    if (job.source !== 'user' || !job.owner_id || Number(job.owner_id) !== userId) {
      return NextResponse.json({ error: 'Anda bukan pemilik lowongan ini.' }, { status: 403 });
    }

    const cohortIds = [...new Set(validationResult.data.cohortIds)];
    if (cohortIds.length > 0) {
      const { data: memberships } = await supabase
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', userId)
        .in('cohort_id', cohortIds);
      const memberCohortIds = new Set((memberships || []).map((m) => m.cohort_id));
      const notMember = cohortIds.filter((cid) => !memberCohortIds.has(cid));
      if (notMember.length > 0) {
        return NextResponse.json({ error: 'Anda bukan anggota salah satu komunitas yang dipilih.' }, { status: 403 });
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('jobs')
      .update({
        job_title: validationResult.data.job_title,
        company: validationResult.data.company,
        description: validationResult.data.description,
        job_desk: validationResult.data.job_desk,
        requirements: validationResult.data.requirements,
        category: validationResult.data.category,
        job_url: validationResult.data.job_url || '',
        salary: validationResult.data.salary || null,
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      console.error('[JOBS_PATCH] Error updating job:', updateErr?.message);
      return NextResponse.json({ error: updateErr?.message || 'Gagal memperbarui lowongan.' }, { status: 500 });
    }

    // Replace this job's cohort tags wholesale with the submitted set.
    const { error: clearTagsErr } = await supabase.from('job_cohorts').delete().eq('job_id', jobId);
    if (clearTagsErr) {
      console.error('[JOBS_PATCH] Error clearing job cohorts:', clearTagsErr.message);
    }
    if (cohortIds.length > 0) {
      const { error: tagErr } = await supabase
        .from('job_cohorts')
        .insert(cohortIds.map((cohortId) => ({ job_id: jobId, cohort_id: cohortId })));
      if (tagErr) {
        console.error('[JOBS_PATCH] Error tagging job cohorts:', tagErr.message);
      }
    }

    return NextResponse.json({ message: 'Lowongan berhasil diperbarui!', job: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
