// app/api/cohorts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import * as z from 'zod';

const cohortSchema = z.object({
  name: z.string().min(3, 'Nama kelompok minimal 3 karakter.').max(100, 'Nama kelompok terlalu panjang.'),
  description: z.string().max(1000, 'Deskripsi terlalu panjang.').optional().nullable(),
});

export async function GET(req: NextRequest) {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Ambil kelompok cohort yang diikuti pengguna
    const { data: members, error } = await supabaseAdmin
      .from('cohort_members')
      .select('role, joined_at, cohorts:cohorts (*)')
      .eq('user_id', userId);

    if (error) {
      console.error('[COHORTS_GET_API] Error fetching user cohorts:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format output
    const formattedCohorts = (members || []).map((m: any) => ({
      role: m.role,
      joined_at: m.joined_at,
      ...m.cohorts,
      id: Number(m.cohorts.id),
      owner_id: Number(m.cohorts.owner_id),
    }));

    return NextResponse.json(formattedCohorts, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
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
    const validationResult = cohortSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data kelompok tidak valid.', details: validationResult.error.errors },
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

    // 1. Insert new cohort (mocking 30 days subscription)
    const { data: newCohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .insert({
        name: validationResult.data.name,
        description: validationResult.data.description || null,
        owner_id: userId,
        subscription_plan: 'premium',
        subscription_status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select('*')
      .single();

    if (cohortError || !newCohort) {
      console.error('[COHORTS_POST_API] Error inserting cohort:', cohortError?.message);
      return NextResponse.json({ error: cohortError?.message || 'Gagal membuat kelompok.' }, { status: 500 });
    }

    // 2. Auto register creator as admin in cohort_members
    const { error: memberError } = await supabaseAdmin
      .from('cohort_members')
      .insert({
        cohort_id: newCohort.id,
        user_id: userId,
        role: 'admin'
      });

    if (memberError) {
      console.error('[COHORTS_POST_API] Error inserting admin member:', memberError.message);
      // Rollback cohort creation if member mapping fails
      await supabaseAdmin.from('cohorts').delete().eq('id', newCohort.id);
      return NextResponse.json({ error: 'Gagal mendaftarkan keanggotaan admin kelompok.' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Kelompok eksklusif berhasil dibuat!', 
      cohort: {
        ...newCohort,
        id: Number(newCohort.id),
        owner_id: Number(newCohort.owner_id)
      } 
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
