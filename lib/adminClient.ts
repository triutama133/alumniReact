// lib/adminClient.ts
// Helper untuk membuat Supabase admin client (service role) satu kali

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

/**
 * Membuat (atau mengambil cache) Supabase admin client dengan service role key.
 * Hanya boleh dipakai di server-side (API routes / server components).
 */
export function getAdminClient(): SupabaseClient {
    if (cachedClient) return cachedClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Server misconfigured: missing Supabase URL or SERVICE_ROLE_KEY.');
    }

    cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });

    return cachedClient;
}