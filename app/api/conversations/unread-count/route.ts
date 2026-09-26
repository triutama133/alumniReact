// app/api/conversations/unread-count/route.ts
// GET: Just the total unread message count across all of the user's conversations —
// used for the floating chat widget's badge, which polls in the background on every
// page the whole time a user is logged in. The full GET /api/conversations list does
// 2 extra queries PER conversation (last message + unread count) to build the sidebar
// list; polling that every 15s just to update a badge number does 2N unnecessary
// queries per poll per active user. This does 2 queries total regardless of how many
// conversations the user has.
import { NextResponse } from 'next/server';
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

        const { data: participantRows, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, last_read_at')
            .eq('user_id', userId);

        if (partError) {
            console.error('[UNREAD_COUNT] Error fetching participants:', partError.message);
            return NextResponse.json({ error: 'Gagal memuat jumlah pesan belum dibaca.' }, { status: 500 });
        }

        if (!participantRows || participantRows.length === 0) {
            return NextResponse.json({ unread_count: 0 }, { status: 200 });
        }

        const lastReadByConversation = new Map(
            participantRows.map((r) => [r.conversation_id, r.last_read_at || new Date(0).toISOString()])
        );
        const conversationIds = participantRows.map((r) => r.conversation_id);
        const earliestLastRead = participantRows.reduce(
            (min, r) => ((r.last_read_at || new Date(0).toISOString()) < min ? (r.last_read_at || new Date(0).toISOString()) : min),
            new Date().toISOString()
        );

        const { data: recentMessages, error: msgError } = await supabase
            .from('messages')
            .select('conversation_id, created_at, sender_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .gt('created_at', earliestLastRead)
            .order('created_at', { ascending: false })
            .limit(500);

        if (msgError) {
            console.error('[UNREAD_COUNT] Error fetching messages:', msgError.message);
            return NextResponse.json({ error: 'Gagal memuat jumlah pesan belum dibaca.' }, { status: 500 });
        }

        const unreadCount = (recentMessages || []).filter((m) => {
            const lastRead = lastReadByConversation.get(m.conversation_id);
            return lastRead ? m.created_at > lastRead : true;
        }).length;

        return NextResponse.json({ unread_count: unreadCount }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
