// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import * as z from 'zod';

interface JobRow {
  id: number;
  [key: string]: unknown;
}

const createJobSchema = z.object({
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    const source = searchParams.get('source') || 'all'; // 'all' | 'database' | 'user'
    const ownerIdParam = searchParams.get('ownerId');
    const ownerId = ownerIdParam ? Number(ownerIdParam) : null;
    const cohortIdParam = searchParams.get('cohortId');
    const cohortId = cohortIdParam ? Number(cohortIdParam) : null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(Number.isNaN(requestedLimit) ? 10 : requestedLimit, 1), 100);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing environment variables.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const headersList = await headers();
    const requestingUserId = Number(headersList.get('x-user-id'));

    let query = supabaseAdmin
      .from('jobs')
      .select('*, job_cohorts ( cohort_id )', { count: 'exact' });

    // Filter active jobs by default — but NOT when a user is looking at their own
    // postings ("My Jobs Post"), since they need to see (and re-toggle) inactive ones too.
    if (!ownerId || Number.isNaN(ownerId)) {
      query = query.eq('is_active', true);
    } else {
      query = query.eq('owner_id', ownerId);
    }

    if (cohortId && !Number.isNaN(cohortId)) {
      // Scoped to a specific community: verify the requester is actually a member
      // before returning anything cohort-tagged (this route has no auth requirement
      // by default, so the cohortId param must never be trusted on its own).
      if (Number.isNaN(requestingUserId)) {
        return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
      }
      const { data: membership } = await supabaseAdmin
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', requestingUserId)
        .eq('cohort_id', cohortId)
        .maybeSingle();
      if (!membership) {
        return NextResponse.json({ error: 'Anda bukan anggota komunitas ini.' }, { status: 403 });
      }
      const { data: taggedRows } = await supabaseAdmin
        .from('job_cohorts')
        .select('job_id')
        .eq('cohort_id', cohortId);
      const taggedIds = (taggedRows || []).map((r) => r.job_id);
      query = query.in('id', taggedIds.length > 0 ? taggedIds : [-1]);
    } else if (!ownerId || Number.isNaN(ownerId)) {
      // Default listing (no explicit cohortId — the jobs page has no portal switcher
      // of its own): show global jobs plus any community-tagged job the requester
      // is actually a member of, and hide the rest. Untagged jobs are always visible.
      const { data: allTaggedRows } = await supabaseAdmin.from('job_cohorts').select('job_id, cohort_id');
      const tagsByJob = new Map<number, number[]>();
      for (const row of allTaggedRows || []) {
        const list = tagsByJob.get(row.job_id) || [];
        list.push(row.cohort_id);
        tagsByJob.set(row.job_id, list);
      }

      let myCohortIds = new Set<number>();
      if (!Number.isNaN(requestingUserId) && tagsByJob.size > 0) {
        const { data: myMemberships } = await supabaseAdmin
          .from('cohort_members')
          .select('cohort_id')
          .eq('user_id', requestingUserId);
        myCohortIds = new Set((myMemberships || []).map((m) => m.cohort_id));
      }

      const hiddenJobIds = [...tagsByJob.entries()]
        .filter(([, cohortTags]) => !cohortTags.some((cid) => myCohortIds.has(cid)))
        .map(([jobId]) => jobId);

      if (hiddenJobIds.length > 0) {
        query = query.not('id', 'in', `(${hiddenJobIds.join(',')})`);
      }
    }

    // Filter by category
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Filter by source (database-scraped vs user-submitted), so the UI can keep them separate
    if (source === 'database' || source === 'user') {
      query = query.eq('source', source);
    }

    // Filter by search term
    if (search && search.trim() !== '') {
      query = query.or(`job_title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort by id descending
    query = query.order('id', { ascending: false });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error('Error fetching jobs:', error.message);
      return NextResponse.json({ error: 'Gagal mengambil lowongan kerja.' }, { status: 500 });
    }

    // Attach the requesting user's own application status to each job (if any), so
    // the jobs page can render "Sudah Melamar" instead of re-showing the apply button.
    let jobsWithApplicationStatus: JobRow[] = (jobs || []) as JobRow[];
    if (!Number.isNaN(requestingUserId) && jobsWithApplicationStatus.length > 0) {
      const jobIds = jobsWithApplicationStatus.map((j) => j.id);
      const { data: myApplications } = await supabaseAdmin
        .from('job_applications')
        .select('job_id, status')
        .eq('user_id', requestingUserId)
        .in('job_id', jobIds);

      const statusByJobId = new Map((myApplications || []).map((a) => [a.job_id, a.status]));
      jobsWithApplicationStatus = jobsWithApplicationStatus.map((job) => ({
        ...job,
        applied_status: statusByJobId.get(job.id) || null,
      }));
    }

    // Get all unique categories for the filter
    const { data: catData, error: catError } = await supabaseAdmin
      .from('jobs')
      .select('category');

    let categories: string[] = ['All'];
    if (!catError && catData) {
      const uniqueCats = Array.from(new Set(catData.map((j: any) => j.category).filter(Boolean))) as string[];
      categories = ['All', ...uniqueCats.sort()];
    }

    // Flatten the job_cohorts embed into a plain cohort_ids array per job.
    const normalizedJobs = jobsWithApplicationStatus.map((job) => {
      const tags = (job.job_cohorts as unknown as Array<{ cohort_id: number }> | null) || [];
      const rest: JobRow = { ...job };
      delete rest.job_cohorts;
      return { ...rest, cohort_ids: tags.map((t) => t.cohort_id) };
    });

    return NextResponse.json({
      jobs: normalizedJobs,
      total: count || 0,
      page,
      limit,
      categories
    }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createJobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data lowongan tidak valid.', details: validationResult.error.errors },
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
    if (cohortIds.length > 0) {
      const { data: memberships } = await supabaseAdmin
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', userId)
        .in('cohort_id', cohortIds);
      const memberCohortIds = new Set((memberships || []).map((m) => m.cohort_id));
      const notMember = cohortIds.filter((id) => !memberCohortIds.has(id));
      if (notMember.length > 0) {
        return NextResponse.json({ error: 'Anda bukan anggota salah satu komunitas yang dipilih.' }, { status: 403 });
      }
    }

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        job_title: validationResult.data.job_title,
        company: validationResult.data.company,
        description: validationResult.data.description,
        job_desk: validationResult.data.job_desk,
        requirements: validationResult.data.requirements,
        category: validationResult.data.category,
        // jobs.job_url is NOT NULL in the database (existing scraped rows always have one),
        // so a user-submitted posting with no external link gets an empty string, not null.
        job_url: validationResult.data.job_url || '',
        salary: validationResult.data.salary || null,
        platform: 'Komunitas',
        owner_id: userId,
        source: 'user',
        is_active: true,
      })
      .select('*')
      .single();

    if (error || !job) {
      console.error('[JOBS_POST_API] Error inserting job:', error?.message);
      return NextResponse.json({ error: error?.message || 'Gagal memasang lowongan.' }, { status: 500 });
    }

    if (cohortIds.length > 0) {
      const { error: tagErr } = await supabaseAdmin
        .from('job_cohorts')
        .insert(cohortIds.map((cohortId) => ({ job_id: job.id, cohort_id: cohortId })));
      if (tagErr) {
        console.error('[JOBS_POST_API] Error tagging job cohorts:', tagErr.message);
      }
    }

    return NextResponse.json({ message: 'Lowongan berhasil dipasang!', job }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
