// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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

    let query = supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact' });

    // Filter active jobs by default
    query = query.eq('is_active', true);

    // Filter by category
    if (category && category !== 'All') {
      query = query.eq('category', category);
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

    // Get all unique categories for the filter
    const { data: catData, error: catError } = await supabaseAdmin
      .from('jobs')
      .select('category');

    let categories: string[] = ['All'];
    if (!catError && catData) {
      const uniqueCats = Array.from(new Set(catData.map((j: any) => j.category).filter(Boolean))) as string[];
      categories = ['All', ...uniqueCats.sort()];
    }

    return NextResponse.json({
      jobs: jobs || [],
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
