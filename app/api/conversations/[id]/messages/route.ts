// app/api/conversations/[id]/messages/route.ts
// GET: Riwayat pesan + update last_read_at
// POST: Kirim pesan baru
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { sanitizeContent } from '@/lib/sanitize';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const conversationId = Number(id);
        if (Number.isNaN(conversationId)) {
            return NextResponse.json({ error: 'ID percakapan tidak valid.' }, { status: 400 });
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

        // Validasi user adalah peserta percakapan
        const { data: participant, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .maybeSingle();

        if (partError) {
            console.error('[MESSAGES_GET] Error validating participant:', partError.message);
            return NextResponse.json({ error: 'Gagal memvalidasi akses.' }, { status: 500 });
        }

        if (!participant) {
            return NextResponse.json({ error: 'Anda bukan peserta percakapan ini.' }, { status: 403 });
        }

        const url = new URL(req.url);
        const limitStr = url.searchParams.get('limit') || '50';
        const limit = Math.min(Math.max(Number(limitStr) || 50, 1), 100);

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                id,
                conversation_id,
                sender_id,
                content,
                content_type,
                created_at,
                alumni_db ( id, nama_lengkap, nama_panggilan )
            `)
            .eq('conversation_id', conversationId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('[MESSAGES_GET] Error fetching messages:', error.message);
            return NextResponse.json({ error: 'Gagal memuat pesan.' }, { status: 500 });
        }

        // Update last_read_at user
        await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        return NextResponse.json(messages || [], { status: 200 });
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
        const conversationId = Number(id);
        if (Number.isNaN(conversationId)) {
            return NextResponse.json({ error: 'ID percakapan tidak valid.' }, { status: 400 });
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
        const content = sanitizeContent(rawContent, 5000);
        if (!content) {
            return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Validasi user adalah peserta percakapan
        const { data: participant, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .maybeSingle();

        if (partError) {
            console.error('[MESSAGES_POST] Error validating participant:', partError.message);
            return NextResponse.json({ error: 'Gagal memvalidasi akses.' }, { status: 500 });
        }

        if (!participant) {
            return NextResponse.json({ error: 'Anda bukan peserta percakapan ini.' }, { status: 403 });
        }

        // Simpan pesan
        const { data: newMessage, error: insertError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content,
                content_type: 'text',
            })
            .select(`
                id,
                conversation_id,
                sender_id,
                content,
                content_type,
                created_at,
                alumni_db ( id, nama_lengkap, nama_panggilan )
            `)
            .single();

        if (insertError) {
            console.error('[MESSAGES_POST] Error inserting message:', insertError.message);
            return NextResponse.json({ error: 'Gagal mengirim pesan.' }, { status: 500 });
        }

        // Notifikasi ke peserta lain (jika ada)
        const { data: otherParticipants, error: otherPartError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', userId);

        if (!otherPartError && otherParticipants) {
            for (const other of otherParticipants) {
                await createNotification({
                    userId: Number(other.user_id),
                    title: 'Pesan Baru',
                    content: content.slice(0, 120),
                    type: 'chat',
                    relatedId: conversationId,
                });
            }
        }

        return NextResponse.json({ message: newMessage }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}