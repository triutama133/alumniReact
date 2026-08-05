// lib/notifications.ts
// Helper untuk membuat notifikasi in-app ke tabel notifications

type NotificationType = 'post_like' | 'post_comment' | 'project_apply' | 'project_status' | 'chat' | 'system';

interface CreateNotificationInput {
    userId: number;
    title: string;
    content: string;
    type: NotificationType;
    relatedId?: number | null;
}

/**
 * Membuat notifikasi in-app. Return true jika sukses.
 * Fail-safe: jika tabel belum ada, kembalikan false tanpa throw.
 */
export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error('[NOTIFICATION] Server misconfigured.');
            return false;
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        });

        const { error } = await supabaseAdmin.from('notifications').insert({
            user_id: input.userId,
            title: input.title,
            content: input.content,
            type: input.type,
            related_id: input.relatedId ?? null,
        });

        if (error) {
            console.error('[NOTIFICATION] Error inserting notification:', error.message);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[NOTIFICATION] Unexpected error:', err);
        return false;
    }
}