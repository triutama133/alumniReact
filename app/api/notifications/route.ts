// app/api/notifications/route.ts
// GET: Ambil 20 notifikasi terbaru + unread_count
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

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[NOTIFICATIONS_API] Error fetching notifications:', error.message);
            return NextResponse.json({ error: 'Gagal memuat notifikasi.' }, { status: 500 });
        }

        const { count: unreadCount, error: countError } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (countError) {
            console.error('[NOTIFICATIONS_API] Error counting unread:', countError.message);
        }

        return NextResponse.json({
            notifications: notifications || [],
            unread_count: unreadCount ?? 0,
        }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}