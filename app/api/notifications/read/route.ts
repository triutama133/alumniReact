// app/api/notifications/read/route.ts
// POST: Tandai satu notifikasi sebagai sudah dibaca
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

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
        const notificationId = Number(body?.notificationId);
        if (!notificationId || Number.isNaN(notificationId)) {
            return NextResponse.json({ error: 'ID notifikasi tidak valid.' }, { status: 400 });
        }

        const supabase = getAdminClient();

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) {
            console.error('[NOTIFICATIONS_READ] Error marking read:', error.message);
            return NextResponse.json({ error: 'Gagal menandai notifikasi.' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}