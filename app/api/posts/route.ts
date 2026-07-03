// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import * as z from 'zod';

const postSchema = z.object({
  content: z.string().min(1, 'Postingan tidak boleh kosong.').max(5000, 'Postingan terlalu panjang.'),
  media_url: z.string().url().or(z.literal('')).optional().nullable(),
  cohortId: z.number().int().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const url = new URL(req.url);
    const cohortIdStr = url.searchParams.get('cohortId');
    const cohortId = cohortIdStr ? Number(cohortIdStr) : null;

    let dbQuery = supabaseAdmin.from('posts_feed').select('*');

    if (cohortId && !Number.isNaN(cohortId)) {
      dbQuery = dbQuery.eq('cohort_id', cohortId);
    } else {
      dbQuery = dbQuery.is('cohort_id', null);
    }

    // Ambil feed postingan teratas
    const { data: posts, error } = await dbQuery
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[POSTS_API] Error fetching posts:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(posts || [], { status: 200 });
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
    const validationResult = postSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Konten postingan tidak valid.', details: validationResult.error.errors },
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

    const { data: newPost, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        content: validationResult.data.content,
        media_url: validationResult.data.media_url || null,
        cohort_id: validationResult.data.cohortId || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[POSTS_API] Error inserting post:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Postingan berhasil dibagikan!', post: newPost }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

