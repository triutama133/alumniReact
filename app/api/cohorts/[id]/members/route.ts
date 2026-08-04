// app/api/cohorts/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import * as z from 'zod';

const addMemberSchema = z.object({
  emailOrUsername: z.string().min(3, 'Email atau username minimal 3 karakter.'),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) {
      return NextResponse.json({ error: 'ID Kelompok tidak valid.' }, { status: 400 });
    }

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

    // 1. Verifikasi apakah active user terdaftar di cohort tersebut
    const { data: memberCheck } = await supabaseAdmin
      .from('cohort_members')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke kelompok ini.' }, { status: 403 });
    }

    // 2. Ambil daftar anggota cohort
    const { data: members, error } = await supabaseAdmin
      .from('cohort_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        alumni:alumni_db (nama_lengkap, nama_panggilan, email, angkatan)
      `)
      .eq('cohort_id', cohortId);

    if (error) {
      console.error('[COHORT_MEMBERS_GET] Error fetching members:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedMembers = (members || []).map((m: any) => ({
      id: Number(m.id),
      user_id: Number(m.user_id),
      role: m.role,
      joined_at: m.joined_at,
      nama_lengkap: m.alumni?.nama_lengkap || 'Anonim',
      nama_panggilan: m.alumni?.nama_panggilan || '',
      email: m.alumni?.email || '',
      angkatan: m.alumni?.angkatan || null,
    }));

    return NextResponse.json(formattedMembers, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cohortId = Number(id);
    if (Number.isNaN(cohortId)) {
      return NextResponse.json({ error: 'ID Kelompok tidak valid.' }, { status: 400 });
    }

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
    const validationResult = addMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Input tidak valid.', details: validationResult.error.errors },
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

    // 1. Verifikasi apakah active user adalah admin di cohort tersebut
    const { data: adminCheck } = await supabaseAdmin
      .from('cohort_members')
      .select('role')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Hanya Admin kelompok yang dapat menambahkan anggota.' }, { status: 403 });
    }

    // 2. Cari user target di database
    const emailOrUsername = validationResult.data.emailOrUsername.trim().toLowerCase();
    const { data: targetUser } = await supabaseAdmin
      .from('user')
      .select('id, email')
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: 'Talenta dengan email atau username tersebut tidak ditemukan.' }, { status: 404 });
    }

    // 3. Tambahkan ke cohort_members
    const { error: insertError } = await supabaseAdmin
      .from('cohort_members')
      .insert({
        cohort_id: cohortId,
        user_id: targetUser.id,
        role: 'member'
      });

    if (insertError) {
      if (insertError.message.includes('unique_conflict') || insertError.message.includes('duplicate key')) {
        return NextResponse.json({ error: 'Pengguna tersebut sudah menjadi anggota kelompok ini.' }, { status: 400 });
      }
      console.error('[COHORT_MEMBERS_POST] Error adding member:', insertError.message);
      return NextResponse.json({ error: 'Gagal menambahkan anggota.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Anggota berhasil ditambahkan ke kelompok!' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
