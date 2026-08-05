// app/api/posts/[id]/comments/route.ts
// GET: Ambil daftar komentar postingan
// POST: Tambah komentar baru + update counter + notifikasi ke pemilik post
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { createNotification } from '@/lib/notifications';
import { sanitizeContent } from '@/lib/sanitize';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const postId = Number(id);
        if (Number.isNaN(postId)) {
            return NextResponse.json({ error: 'ID postingan tidak valid.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        const { data: comments, error } = await supabase
            .from('post_comments')
            .select(`
                id,
                post_id,
                user_id,
                content,
                created_at,
                alumni_db ( nama_lengkap, nama_panggilan, aktivitas )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            console.error('[COMMENTS_API] Error fetching comments:', error.message);
            return NextResponse.json({ error: 'Gagal memuat komentar.' }, { status: 500 });
        }

        return NextResponse.json(comments || [], { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const postId = Number(id);
        if (Number.isNaN(postId)) {
            return NextResponse.json({ error: 'ID postingan tidak valid.' }, { status: 400 });
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
        const rawContent = typeof body?.content === 'string' ? body.content : '';
        const content = sanitizeContent(rawContent, 2000);
        if (!content) {
            return NextResponse.json({ error: 'Komentar tidak boleh kosong.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Validasi post ada
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('id, user_id, comments_count')
            .eq('id', postId)
            .maybeSingle();

        if (postError) {
            console.error('[COMMENTS_API] Error fetching post:', postError.message);
            return NextResponse.json({ error: 'Gagal memuat postingan.' }, { status: 500 });
        }

        if (!post) {
            return NextResponse.json({ error: 'Postingan tidak ditemukan.' }, { status: 404 });
        }

        // Insert komentar
        const { data: newComment, error: insertError } = await supabase
            .from('post_comments')
            .insert({ post_id: postId, user_id: userId, content })
            .select(`
                id,
                post_id,
                user_id,
                content,
                created_at,
                alumni_db ( nama_lengkap, nama_panggilan, aktivitas )
            `)
            .single();

        if (insertError) {
            console.error('[COMMENTS_API] Error inserting comment:', insertError.message);
            return NextResponse.json({ error: 'Gagal menambahkan komentar.' }, { status: 500 });
        }

        // Update counter
        const nextCount = Number(post.comments_count ?? 0) + 1;
        const { error: updateError } = await supabase
            .from('posts')
            .update({ comments_count: nextCount })
            .eq('id', postId);

        if (updateError) {
            console.error('[COMMENTS_API] Error updating comments_count:', updateError.message);
        }

        // Notifikasi ke pemilik post (jika bukan dirinya sendiri)
        if (Number(post.user_id) !== userId) {
            await createNotification({
                userId: Number(post.user_id),
                title: 'Komentar Baru pada Postingan Anda',
                content: content.slice(0, 120),
                type: 'post_comment',
                relatedId: postId,
            });
        }

        return NextResponse.json({ comment: newComment, comments_count: nextCount }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}