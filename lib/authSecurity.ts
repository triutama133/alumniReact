import { createHash } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

type Scope = 'login' | 'register' | 'forgot_password' | 'reset_password';

type SecurityStateRow = {
  scope: Scope;
  attempt_key: string;
  failed_count: number;
  first_failed_at: string;
  lock_until: string | null;
};

type PersistEventPayload = {
  scope: Scope;
  eventType: string;
  identifier?: string;
  ipAddress?: string;
  userId?: number | null;
  metadata?: Record<string, unknown>;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Server misconfigured: missing Supabase credentials.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getPepper() {
  return process.env.JWT_SECRET || process.env.INTERNAL_API_KEY || 'auth-security-pepper';
}

export function hashIdentifier(identifier: string) {
  return createHash('sha256').update(`${identifier}|${getPepper()}`).digest('hex');
}

export function extractClientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

export async function getPersistentBlockState(scope: Scope, attemptKey: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('auth_security_state')
      .select('scope, attempt_key, failed_count, first_failed_at, lock_until')
      .eq('scope', scope)
      .eq('attempt_key', attemptKey)
      .maybeSingle<SecurityStateRow>();

    if (error || !data || !data.lock_until) {
      return { blocked: false, retryAfterSeconds: 0 } as const;
    }

    const lockUntilMs = Date.parse(data.lock_until);
    if (Number.isNaN(lockUntilMs) || lockUntilMs <= Date.now()) {
      return { blocked: false, retryAfterSeconds: 0 } as const;
    }

    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((lockUntilMs - Date.now()) / 1000)),
    } as const;
  } catch {
    return { blocked: false, retryAfterSeconds: 0 } as const;
  }
}

export async function registerPersistentFailure(params: {
  scope: Scope;
  attemptKey: string;
  windowMs: number;
  maxAttempts: number;
  lockMs: number;
}) {
  const nowMs = Date.now();

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing } = await supabaseAdmin
      .from('auth_security_state')
      .select('scope, attempt_key, failed_count, first_failed_at, lock_until')
      .eq('scope', params.scope)
      .eq('attempt_key', params.attemptKey)
      .maybeSingle<SecurityStateRow>();

    let failedCount = 1;
    let firstFailedAtIso = new Date(nowMs).toISOString();

    if (existing) {
      const firstMs = Date.parse(existing.first_failed_at);
      const isWindowExpired = Number.isNaN(firstMs) || nowMs - firstMs > params.windowMs;
      if (!isWindowExpired) {
        failedCount = (existing.failed_count || 0) + 1;
        firstFailedAtIso = existing.first_failed_at;
      }
    }

    const lockUntilIso = failedCount >= params.maxAttempts ? new Date(nowMs + params.lockMs).toISOString() : null;

    const { error: upsertError } = await supabaseAdmin.from('auth_security_state').upsert(
      {
        scope: params.scope,
        attempt_key: params.attemptKey,
        failed_count: failedCount,
        first_failed_at: firstFailedAtIso,
        lock_until: lockUntilIso,
        updated_at: new Date(nowMs).toISOString(),
      },
      {
        onConflict: 'scope,attempt_key',
      }
    );

    if (upsertError || !lockUntilIso) {
      return { blocked: false, retryAfterSeconds: 0 } as const;
    }

    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(params.lockMs / 1000)),
    } as const;
  } catch {
    return { blocked: false, retryAfterSeconds: 0 } as const;
  }
}

export async function clearPersistentFailures(scope: Scope, attemptKey: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from('auth_security_state')
      .delete()
      .eq('scope', scope)
      .eq('attempt_key', attemptKey);
  } catch {
    // no-op
  }
}

export async function persistAuthSecurityEvent(payload: PersistEventPayload) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const identifierHash = payload.identifier ? hashIdentifier(payload.identifier) : null;

    await supabaseAdmin.from('auth_security_events').insert({
      user_id: payload.userId ?? null,
      scope: payload.scope,
      event_type: payload.eventType,
      identifier_hash: identifierHash,
      ip_address: payload.ipAddress ?? null,
      event_metadata: payload.metadata ?? {},
    });
  } catch (error) {
    console.error('[AUTH_SECURITY_EVENT] failed to persist:', error);
  }
}
