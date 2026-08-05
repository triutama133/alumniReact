// app/api/conversations/route.ts
// GET: Daftar percakapan aktif + unread count
// POST: Mulai percakapan baru (direct) { targetUserId }
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET() {
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

        const supabase = getAdminClient();

        // Ambil semua conversation_id milik user
        const { data: participantRows, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, last_read_at, user_id')
            .eq('user_id', userId);

        if (partError) {
            console.error('[CONVERSATIONS] Error fetching participants:', partError.message);
            return NextResponse.json({ error: 'Gagal memuat percakapan.' }, { status: 500 });
        }

        if (!participantRows || participantRows.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        const conversationIds = participantRows.map((r) => r.conversation_id);

        // Ambil detail conversations + peserta
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select(`
                id,
                type,
                name,
                created_at,
                conversation_participants (
                    user_id,
                    last_read_at,
                    alumni_db ( id, nama_lengkap, nama_panggilan )
                )
            `)
            .in('id', conversationIds)
            .order('created_at', { ascending: false });

        if (convError) {
            console.error('[CONVERSATIONS] Error fetching conversations:', convError.message);
            return NextResponse.json({ error: 'Gagal memuat percakapan.' }, { status: 500 });
        }

        // Ambil pesan terakhir per percakapan + unread count
        const results = await Promise.all((conversations || []).map(async (conv) => {
            const { data: lastMessage } = await supabase
                .from('messages')
                .select('content, created_at, sender_id')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const myParticipant = (conv.conversation_participants || []).find(
                (p: any) => Number(p.user_id) === userId
            );
            const lastReadAt = myParticipant?.last_read_at || new Date(0).toISOString();

            const { count: unreadCount } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .neq('sender_id', userId)
                .gt('created_at', lastReadAt);

            // Nama lawan bicara (untuk direct)
            const otherParticipant = (conv.conversation_participants || []).find(
                (p: any) => Number(p.user_id) !== userId
            );
            const otherAlumni = otherParticipant?.alumni_db as unknown as {
                nama_lengkap?: string | null;
                nama_panggilan?: string | null;
            } | null;

            return {
                id: conv.id,
                type: conv.type,
                name: conv.type === 'direct' ? (otherAlumni?.nama_lengkap || 'Talent') : conv.name,
                other_user_id: otherParticipant?.user_id ?? null,
                last_message: lastMessage?.content ?? null,
                last_message_at: lastMessage?.created_at ?? null,
                unread_count: unreadCount ?? 0,
            };
        }));

        return NextResponse.json(results, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
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
        const targetUserId = Number(body?.targetUserId);
        if (!targetUserId || Number.isNaN(targetUserId)) {
            return NextResponse.json({ error: 'Target user ID tidak valid.' }, { status: 400 });
        }

        if (targetUserId === userId) {
            return NextResponse.json({ error: 'Tidak dapat mengirim pesan ke diri sendiri.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Cari percakapan direct yang sudah ada antara kedua user
        const { data: myConvs, error: myConvsError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (myConvsError) {
            console.error('[CONVERSATIONS_POST] Error fetching my convs:', myConvsError.message);
            return NextResponse.json({ error: 'Gagal memeriksa percakapan.' }, { status: 500 });
        }

        const myConvIds = (myConvs || []).map((r) => r.conversation_id);

        let existingConversationId: number | null = null;
        if (myConvIds.length > 0) {
            const { data: targetConv, error: targetConvError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .in('conversation_id', myConvIds)
                .eq('user_id', targetUserId)
                .maybeSingle();

            if (targetConvError) {
                console.error('[CONVERSATIONS_POST] Error checking target conv:', targetConvError.message);
            } else if (targetConv) {
                existingConversationId = targetConv.conversation_id;
            }
        }

        if (existingConversationId) {
            return NextResponse.json({ conversationId: existingConversationId }, { status: 200 });
        }

        // Buat percakapan baru
        const { data: newConv, error: insertConvError } = await supabase
            .from('conversations')
            .insert({ type: 'direct' })
            .select('id')
            .single();

        if (insertConvError) {
            console.error('[CONVERSATIONS_POST] Error creating conversation:', insertConvError.message);
            return NextResponse.json({ error: 'Gagal membuat percakapan.' }, { status: 500 });
        }

        // Tambah 2 peserta
        const { error: insertParticipantsError } = await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: newConv.id, user_id: userId },
                { conversation_id: newConv.id, user_id: targetUserId },
            ]);

        if (insertParticipantsError) {
            console.error('[CONVERSATIONS_POST] Error adding participants:', insertParticipantsError.message);
            return NextResponse.json({ error: 'Gagal menambahkan peserta.' }, { status: 500 });
        }

        return NextResponse.json({ conversationId: newConv.id }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}