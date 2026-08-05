// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/adminClient';
import { headers } from 'next/headers';
import * as z from 'zod';
import { sanitizeContent } from '@/lib/sanitize';

const postSchema = z.object({
  content: z.string().min(1, 'Postingan tidak boleh kosong.').max(5000, 'Postingan terlalu panjang.'),
  media_url: z.string().url().or(z.literal('')).optional().nullable(),
  cohortId: z.number().int().optional().nullable(),
});

interface FeedPost {
  id: number;
  user_id: number;
  content: string;
  media_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  cohort_id: number | null;
  nama_lengkap: string | null;
  nama_panggilan: string | null;
  aktivitas: string | null;
  is_liked?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();

    // Dapatkan userId dari header (di-set middleware) jika ada
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    const userId = userIdString ? Number(userIdString) : null;

    const url = new URL(req.url);
    const cohortIdStr = url.searchParams.get('cohortId');
    const cohortId = cohortIdStr ? Number(cohortIdStr) : null;

    let dbQuery = supabase.from('posts').select(`
            id,
            user_id,
            content,
            media_url,
            likes_count,
            comments_count,
            created_at,
            cohort_id,
            alumni_db ( nama_lengkap, nama_panggilan, aktivitas )
        `);

    if (cohortId && !Number.isNaN(cohortId)) {
      dbQuery = dbQuery.eq('cohort_id', cohortId);
    } else {
      dbQuery = dbQuery.is('cohort_id', null);
    }

    const { data: posts, error } = await dbQuery
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[POSTS_API] Error fetching posts:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ambil daftar post yang sudah di-like user (jika login)
    let likedPostIds = new Set<number>();
    if (userId && !Number.isNaN(userId) && posts && posts.length > 0) {
      const postIds = posts.map((p: { id: number }) => p.id);
      const { data: likedRows, error: likeError } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', userId);

      if (likeError) {
        console.error('[POSTS_API] Error fetching likes:', likeError.message);
      } else {
        likedPostIds = new Set((likedRows || []).map((r: { post_id: number }) => r.post_id));
      }
    }

    const normalizedPosts: FeedPost[] = (posts || []).map((p) => {
      const alumni = p.alumni_db as unknown as {
        nama_lengkap?: string | null;
        nama_panggilan?: string | null;
        aktivitas?: string | null;
      } | null;

      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        media_url: p.media_url,
        likes_count: p.likes_count ?? 0,
        comments_count: p.comments_count ?? 0,
        created_at: p.created_at,
        cohort_id: p.cohort_id,
        nama_lengkap: alumni?.nama_lengkap ?? null,
        nama_panggilan: alumni?.nama_panggilan ?? null,
        aktivitas: alumni?.aktivitas ?? null,
        is_liked: likedPostIds.has(p.id),
      };
    });

    return NextResponse.json(normalizedPosts, { status: 200 });
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

    // Sanitasi konten dari HTML berbahaya
    const cleanContent = sanitizeContent(validationResult.data.content, 5000);

    const supabase = getAdminClient();

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: cleanContent,
        media_url: validationResult.data.media_url || null,
        cohort_id: validationResult.data.cohortId || null,
      })
      .select(`
                id,
                user_id,
                content,
                media_url,
                likes_count,
                comments_count,
                created_at,
                cohort_id,
                alumni_db ( nama_lengkap, nama_panggilan, aktivitas )
            `)
      .single();

    if (error) {
      console.error('[POSTS_API] Error inserting post:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alumni = newPost.alumni_db as unknown as {
      nama_lengkap?: string | null;
      nama_panggilan?: string | null;
      aktivitas?: string | null;
    } | null;

    return NextResponse.json(
      {
        message: 'Postingan berhasil dibagikan!',
        post: {
          id: newPost.id,
          user_id: newPost.user_id,
          content: newPost.content,
          media_url: newPost.media_url,
          likes_count: newPost.likes_count ?? 0,
          comments_count: newPost.comments_count ?? 0,
          created_at: newPost.created_at,
          cohort_id: newPost.cohort_id,
          nama_lengkap: alumni?.nama_lengkap ?? null,
          nama_panggilan: alumni?.nama_panggilan ?? null,
          aktivitas: alumni?.aktivitas ?? null,
          is_liked: false,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}