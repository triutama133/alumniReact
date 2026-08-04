import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import { headers } from 'next/headers';

import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, signAuthToken } from '@/lib/auth';
import { bumpAuthSessionVersionByUserId, getAuthSessionVersionByUserId } from '@/lib/authSessionVersion';

type UserRow = {
  id: number;
  email: string;
  username: string | null;
  role: string | null;
  password_hash: string | null;
  must_change_password: boolean;
};

type SecurityAuditRow = {
  id: number;
  user_id: number;
  event_type: string;
  event_metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

type PasswordAttemptState = {
  count: number;
  firstAttemptAt: number;
};

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const failedAttemptMap = new Map<number, PasswordAttemptState>();

const updateSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi.'),
  newEmail: z.string().email('Format email baru tidak valid.').optional(),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter.').optional(),
});

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Server misconfigured: missing environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getAttemptState(userId: number) {
  const now = Date.now();
  const existing = failedAttemptMap.get(userId);

  if (!existing) {
    return { count: 0, firstAttemptAt: now };
  }

  if (now - existing.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    failedAttemptMap.delete(userId);
    return { count: 0, firstAttemptAt: now };
  }

  return existing;
}

function recordFailedAttempt(userId: number) {
  const now = Date.now();
  const state = getAttemptState(userId);
  failedAttemptMap.set(userId, {
    count: state.count + 1,
    firstAttemptAt: state.firstAttemptAt || now,
  });
}

function clearFailedAttempts(userId: number) {
  failedAttemptMap.delete(userId);
}

function isBlocked(userId: number) {
  const state = getAttemptState(userId);
  if (state.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterMs = ATTEMPT_WINDOW_MS - (Date.now() - state.firstAttemptAt);
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function auditLog(event: string, meta: Record<string, unknown>) {
  console.log('[ACCOUNT_SETTINGS_AUDIT]', JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...meta,
  }));
}

async function persistAuditLog(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  payload: {
    userId: number;
    eventType: string;
    metadata: Record<string, unknown>;
    ipAddress: string;
  }
) {
  const { error } = await supabaseAdmin.from('account_security_audit_logs').insert({
    user_id: payload.userId,
    event_type: payload.eventType,
    event_metadata: payload.metadata,
    ip_address: payload.ipAddress,
  });

  if (error) {
    // Keep endpoint functional even when migration has not been applied yet.
    console.error('[ACCOUNT_SETTINGS_AUDIT_DB] insert failed:', error.message);
  }
}

export async function GET() {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: user, error } = await supabaseAdmin
      .from('user')
      .select('id, email, username, role, must_change_password')
      .eq('id', userId)
      .maybeSingle<{ id: number; email: string; username: string | null; role: string | null; must_change_password: boolean }>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const { data: latestSecurityEvent } = await supabaseAdmin
      .from('account_security_audit_logs')
      .select('id, user_id, event_type, event_metadata, ip_address, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<SecurityAuditRow>();

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        mustChangePassword: Boolean(user.must_change_password),
        lastSecurityEvent: latestSecurityEvent
          ? {
              eventType: latestSecurityEvent.event_type,
              createdAt: latestSecurityEvent.created_at,
              ipAddress: latestSecurityEvent.ip_address,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (!userIdString) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const blockState = isBlocked(userId);
    if (blockState.blocked) {
      auditLog('account_settings_blocked', {
        userId,
        ip: requestIp,
        retryAfterSeconds: blockState.retryAfterSeconds,
      });
      return NextResponse.json(
        { error: `Terlalu banyak percobaan password salah. Coba lagi dalam ${blockState.retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(blockState.retryAfterSeconds),
          },
        }
      );
    }

    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid.', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const currentPassword = parsed.data.currentPassword;
    const newEmail = parsed.data.newEmail?.trim().toLowerCase();
    const newPassword = parsed.data.newPassword;

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { error: 'Isi minimal salah satu perubahan: email baru atau password baru.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: user, error: userError } = await supabaseAdmin
      .from('user')
      .select('id, email, username, role, password_hash, must_change_password')
      .eq('id', userId)
      .maybeSingle<UserRow>();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      recordFailedAttempt(userId);
      const state = getAttemptState(userId);
      auditLog('account_settings_wrong_password', {
        userId,
        ip: requestIp,
        failedAttempts: state.count,
      });
      await persistAuditLog(supabaseAdmin, {
        userId,
        eventType: 'wrong_current_password',
        metadata: { failedAttempts: state.count },
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: 'Password saat ini tidak sesuai.' }, { status: 401 });
    }

    clearFailedAttempts(userId);

    if (newEmail && newEmail !== user.email) {
      const { data: existingEmail } = await supabaseAdmin
        .from('user')
        .select('id')
        .eq('email', newEmail)
        .neq('id', userId)
        .maybeSingle<{ id: number }>();

      if (existingEmail) {
        return NextResponse.json({ error: 'Email baru sudah digunakan akun lain.' }, { status: 409 });
      }
    }

    const updatePayload: { email?: string; password_hash?: string; must_change_password?: boolean } = {};

    if (newEmail && newEmail !== user.email) {
      updatePayload.email = newEmail;
    }

    if (newPassword) {
      updatePayload.password_hash = await bcrypt.hash(newPassword, 10);
      updatePayload.must_change_password = false;
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('user')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, username, role, must_change_password')
      .single<{ id: number; email: string; username: string | null; role: string | null; must_change_password: boolean }>();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    auditLog('account_settings_updated', {
      userId,
      ip: requestIp,
      emailChanged: Boolean(updatePayload.email),
      passwordChanged: Boolean(updatePayload.password_hash),
    });

    await persistAuditLog(supabaseAdmin, {
      userId,
      eventType: 'account_settings_updated',
      metadata: {
        emailChanged: Boolean(updatePayload.email),
        passwordChanged: Boolean(updatePayload.password_hash),
      },
      ipAddress: requestIp,
    });

    let authVersion = await getAuthSessionVersionByUserId(supabaseAdmin, updatedUser.id);
    if (Boolean(updatePayload.password_hash)) {
      authVersion = await bumpAuthSessionVersionByUserId(supabaseAdmin, updatedUser.id);
    }

    const profileCompleted = headersList.get('x-user-profile-completed') === 'true';
    const authToken = await signAuthToken({
      sub: String(updatedUser.id),
      email: updatedUser.email,
      role: updatedUser.role || 'alumni',
      username: updatedUser.username || undefined,
      profile_completed: profileCompleted,
      must_change_password: Boolean(updatedUser.must_change_password),
      auth_version: authVersion,
    });

    const response = NextResponse.json(
      {
        message: 'Pengaturan akun berhasil diperbarui.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          must_change_password: Boolean(updatedUser.must_change_password),
        },
      },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
