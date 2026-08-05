// app/api/posts/[id]/like/route.ts
// Toggle like pada postingan + buat notifikasi ke pemilik post
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { createNotification } from '@/lib/notifications';

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

        const supabase = getAdminClient();

        // Fetch post untuk validasi & hitung ulang likes_count
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('id, user_id, likes_count')
            .eq('id', postId)
            .maybeSingle();

        if (postError) {
            console.error('[LIKE_API] Error fetching post:', postError.message);
            return NextResponse.json({ error: 'Gagal memuat postingan.' }, { status: 500 });
        }

        if (!post) {
            return NextResponse.json({ error: 'Postingan tidak ditemukan.' }, { status: 404 });
        }

        // Cek apakah user sudah like
        const { data: existingLike, error: likeFetchError } = await supabase
            .from('post_likes')
            .select('id, post_id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (likeFetchError) {
            console.error('[LIKE_API] Error fetching like:', likeFetchError.message);
            return NextResponse.json({ error: 'Gagal memproses like.' }, { status: 500 });
        }

        const nextLikesCount = Math.max(0, Number(post.likes_count ?? 0) + (existingLike ? -1 : 1));

        if (existingLike) {
            // Unlike
            const { error: deleteError } = await supabase
                .from('post_likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) {
                console.error('[LIKE_API] Error deleting like:', deleteError.message);
                return NextResponse.json({ error: 'Gagal membatalkan like.' }, { status: 500 });
            }
        } else {
            // Like
            const { error: insertError } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: userId });

            if (insertError) {
                console.error('[LIKE_API] Error inserting like:', insertError.message);
                return NextResponse.json({ error: 'Gagal menyukai postingan.' }, { status: 500 });
            }

            // Notifikasi ke pemilik post (jika bukan dirinya sendiri)
            if (Number(post.user_id) !== userId) {
                await createNotification({
                    userId: Number(post.user_id),
                    title: 'Postingan Anda Disukai',
                    content: 'Seseorang menyukai postingan Anda.',
                    type: 'post_like',
                    relatedId: postId,
                });
            }
        }

        // Update counter likes_count di tabel posts
        const { error: updateError } = await supabase
            .from('posts')
            .update({ likes_count: nextLikesCount })
            .eq('id', postId);

        if (updateError) {
            console.error('[LIKE_API] Error updating likes_count:', updateError.message);
            return NextResponse.json({ error: 'Gagal memperbarui jumlah like.' }, { status: 500 });
        }

        return NextResponse.json({ liked: !existingLike, likes_count: nextLikesCount }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[LIKE_API] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}