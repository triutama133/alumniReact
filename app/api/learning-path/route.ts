// app/api/learning-path/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// The AI engine runs on Render's free tier and can take 15-30s+ to respond on a cold
// start (observed live) on top of Gemini's own response time — raise the serverless
// timeout ceiling as far as the hosting plan allows (a no-op on plans that cap lower).
export const maxDuration = 60;

// GET handler to retrieve the user's active/saved learning path
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Up to 5 saved paths per user (see migration 023) — return the full list, most
    // recently updated first, so the UI can offer a picker instead of just one path.
    const { data, error } = await supabaseAdmin
      .from('user_learning_paths')
      .select('target_role, path_data, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[LEARNING_PATH_GET] Error fetching saved paths:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paths: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST handler to trigger AI analysis and save generated learning path to DB
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

    const { targetRole } = await req.json();
    if (!targetRole || !targetRole.trim()) {
      return NextResponse.json({ error: 'Target peran wajib ditentukan.' }, { status: 400 });
    }

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing INTERNAL_API_KEY.' }, { status: 500 });
    }

    const apiBaseUrl = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const fastApiUrl = `${apiBaseUrl.replace(/\/$/, '')}/learning_path`;
    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': internalApiKey,
      },
      body: JSON.stringify({
        user_id: userId,
        target_role: targetRole.trim(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Gagal memproses data analisis dari AI Engine.' }, { status: response.status });
    }

    // Save/persist the generated learning path to the database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });

      // Cap at 5 saved paths per user (migration 023 dropped the old user_id-only PK
      // specifically to allow this) — if this is a new role and the user is already at
      // the cap, evict the least-recently-updated one first.
      const { data: existing } = await supabaseAdmin
        .from('user_learning_paths')
        .select('id, target_role, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true });

      const isNewRole = !(existing || []).some((p) => p.target_role === targetRole.trim());
      if (isNewRole && (existing || []).length >= 5) {
        const oldest = existing![0];
        await supabaseAdmin.from('user_learning_paths').delete().eq('id', oldest.id);
      }

      const { error: saveError } = await supabaseAdmin
        .from('user_learning_paths')
        .upsert({
          user_id: userId,
          target_role: targetRole.trim(),
          path_data: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,target_role' });

      if (saveError) {
        console.error('[LEARNING_PATH_POST] Error saving path to DB:', saveError.message);
      }
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
