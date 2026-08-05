// app/api/notifications/read-all/route.ts
// POST: Tandai semua notifikasi user sebagai sudah dibaca
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export async function POST() {
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

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('[NOTIFICATIONS_READ_ALL] Error marking all read:', error.message);
            return NextResponse.json({ error: 'Gagal menandai semua notifikasi.' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}