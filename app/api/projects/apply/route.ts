// app/api/projects/apply/route.ts
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
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'ID proyek wajib diisi.' }, { status: 400 });
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

    // Periksa apakah pengguna sudah pernah mengajukan lamaran
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('project_applications')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[PROJECT_APPLY] Error fetching application:', fetchError.message);
      return NextResponse.json({ error: 'Gagal memverifikasi status pengajuan sebelumnya.' }, { status: 500 });
    }

    if (existingApp) {
      return NextResponse.json({ 
        message: 'Anda sudah mengajukan diri untuk proyek ini.', 
        status: existingApp.status 
      }, { status: 400 });
    }

    // Buat pengajuan baru
    const { error: insertError } = await supabaseAdmin
      .from('project_applications')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'pending',
        role: 'collaborator'
      });

    if (insertError) {
      console.error('[PROJECT_APPLY] Error inserting application:', insertError.message);
      return NextResponse.json({ error: 'Gagal mengirimkan pengajuan kolaborasi.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Pengajuan kolaborasi berhasil dikirim!' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
