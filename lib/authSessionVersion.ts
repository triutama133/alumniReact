import type { SupabaseClient } from '@supabase/supabase-js';

type SessionVersionRow = {
  user_id: number;
  version: number;
};

const DEFAULT_AUTH_VERSION = 1;

export async function getAuthSessionVersionByUserId(
  supabaseAdmin: SupabaseClient,
  userId: number
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('auth_session_versions')
    .select('user_id, version')
    .eq('user_id', userId)
    .maybeSingle<SessionVersionRow>();

  if (error) {
    console.error('[AUTH_SESSION_VERSION] read error:', error.message);
    return DEFAULT_AUTH_VERSION;
  }

  return data?.version ?? DEFAULT_AUTH_VERSION;
}

export async function bumpAuthSessionVersionByUserId(
  supabaseAdmin: SupabaseClient,
  userId: number
): Promise<number> {
  const current = await getAuthSessionVersionByUserId(supabaseAdmin, userId);
  const next = current + 1;

  const { error } = await supabaseAdmin.from('auth_session_versions').upsert(
    {
      user_id: userId,
      version: next,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    console.error('[AUTH_SESSION_VERSION] bump error:', error.message);
    return current;
  }

  return next;
}

export async function getAuthSessionVersionForMiddleware(userId: string): Promise<number | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !userId) {
    return null;
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/auth_session_versions?user_id=eq.${encodeURIComponent(userId)}&select=version&limit=1`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as Array<{ version: number }>;
  if (!rows.length) {
    return DEFAULT_AUTH_VERSION;
  }

  return rows[0]?.version ?? DEFAULT_AUTH_VERSION;
}
