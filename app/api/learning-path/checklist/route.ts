// app/api/learning-path/checklist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// GET handler to fetch the list of completed tasks
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

    const { searchParams } = new URL(req.url);
    const targetRole = searchParams.get('targetRole');

    if (!targetRole || !targetRole.trim()) {
      return NextResponse.json({ error: 'Target peran wajib ditentukan.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabaseAdmin
      .from('user_checklists')
      .select('completed_tasks')
      .eq('user_id', userId)
      .eq('target_role', targetRole.trim())
      .maybeSingle();

    if (error) {
      console.error('[CHECKLIST_GET_API] Error fetching checklist:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Default to empty array if no record exists yet
    const completedTasks = data ? data.completed_tasks : [];
    return NextResponse.json({ completedTasks }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST handler to upsert completed tasks
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

    const { targetRole, completedTasks } = await req.json();

    if (!targetRole || !targetRole.trim()) {
      return NextResponse.json({ error: 'Target peran wajib ditentukan.' }, { status: 400 });
    }

    if (!Array.isArray(completedTasks)) {
      return NextResponse.json({ error: 'completedTasks harus berupa array string.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Upsert into user_checklists table
    const { error } = await supabaseAdmin
      .from('user_checklists')
      .upsert({
        user_id: userId,
        target_role: targetRole.trim(),
        completed_tasks: completedTasks,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,target_role' });

    if (error) {
      console.error('[CHECKLIST_POST_API] Error saving checklist:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Progres checklist berhasil disinkronkan ke database.' }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
