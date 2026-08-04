import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { AUTH_COOKIE_NAME } from '@/lib/auth';
import {
  clearPersistentFailures,
  extractClientIp,
  getPersistentBlockState,
  hashIdentifier,
  persistAuthSecurityEvent,
  registerPersistentFailure,
} from '@/lib/authSecurity';
import { bumpAuthSessionVersionByUserId } from '@/lib/authSessionVersion';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token reset wajib diisi.'),
    newPassword: z
      .string()
      .min(10, 'Password minimal 10 karakter.')
      .regex(/[A-Z]/, 'Password harus memiliki minimal 1 huruf besar.')
      .regex(/[a-z]/, 'Password harus memiliki minimal 1 huruf kecil.')
      .regex(/[0-9]/, 'Password harus memiliki minimal 1 angka.')
      .regex(/[^A-Za-z0-9]/, 'Password harus memiliki minimal 1 simbol.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama.',
    path: ['confirmPassword'],
  });

type PasswordResetTokenRow = {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used_at: string | null;
};

type ResetAttemptState = {
  count: number;
  firstAttemptAt: number;
};

const MAX_RESET_ATTEMPTS = 5;
const RESET_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const RESET_LOCK_MS = 20 * 60 * 1000;
const resetAttemptMap = new Map<string, ResetAttemptState>();

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

function getResetAttemptState(key: string) {
  const now = Date.now();
  const existing = resetAttemptMap.get(key);
  if (!existing) {
    return { count: 0, firstAttemptAt: now };
  }

  if (now - existing.firstAttemptAt > RESET_ATTEMPT_WINDOW_MS) {
    resetAttemptMap.delete(key);
    return { count: 0, firstAttemptAt: now };
  }

  return existing;
}

function getResetBlockState(key: string) {
  const state = getResetAttemptState(key);
  if (state.count >= MAX_RESET_ATTEMPTS) {
    const retryAfterMs = RESET_ATTEMPT_WINDOW_MS - (Date.now() - state.firstAttemptAt);
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function recordResetFailure(key: string) {
  const state = getResetAttemptState(key);
  resetAttemptMap.set(key, {
    count: state.count + 1,
    firstAttemptAt: state.firstAttemptAt,
  });
}

function clearResetFailures(key: string) {
  resetAttemptMap.delete(key);
}

export async function POST(req: NextRequest) {
  try {
    const requestIp = extractClientIp(req.headers);
    const localAttemptKey = `reset:${requestIp}`;
    const persistentAttemptKey = hashIdentifier(`reset:${requestIp}`);

    const localBlockState = getResetBlockState(localAttemptKey);
    const persistentBlockState = await getPersistentBlockState('reset_password', persistentAttemptKey);
    const retryAfterSeconds = Math.max(localBlockState.retryAfterSeconds, persistentBlockState.retryAfterSeconds);

    if (localBlockState.blocked || persistentBlockState.blocked) {
      await persistAuthSecurityEvent({
        scope: 'reset_password',
        eventType: 'reset_password_blocked',
        ipAddress: requestIp,
        metadata: {
          retryAfterSeconds,
          localBlocked: localBlockState.blocked,
          persistentBlocked: persistentBlockState.blocked,
        },
      });

      return NextResponse.json(
        { error: `Terlalu banyak percobaan reset password. Coba lagi dalam ${retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    const parsed = resetPasswordSchema.safeParse(await req.json());

    if (!parsed.success) {
      recordResetFailure(localAttemptKey);
      await registerPersistentFailure({
        scope: 'reset_password',
        attemptKey: persistentAttemptKey,
        windowMs: RESET_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_RESET_ATTEMPTS,
        lockMs: RESET_LOCK_MS,
      });
      return NextResponse.json({ error: 'Data reset password tidak valid.', details: parsed.error.errors }, { status: 400 });
    }

    const token = parsed.data.token.trim();
    const newPassword = parsed.data.newPassword;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, user_id, token, expires_at, used_at')
      .eq('token', token)
      .maybeSingle<PasswordResetTokenRow>();

    if (tokenError) {
      console.error('[RESET_PASSWORD] token query error:', tokenError.message);
      return NextResponse.json({ error: 'Gagal memproses reset password.' }, { status: 500 });
    }

    if (!tokenRow || tokenRow.used_at) {
      recordResetFailure(localAttemptKey);
      await registerPersistentFailure({
        scope: 'reset_password',
        attemptKey: persistentAttemptKey,
        windowMs: RESET_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_RESET_ATTEMPTS,
        lockMs: RESET_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'reset_password',
        eventType: 'reset_password_invalid_token',
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: 'Token reset tidak valid atau sudah digunakan.' }, { status: 400 });
    }

    const expiresAtMs = Date.parse(tokenRow.expires_at);
    if (Number.isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
      recordResetFailure(localAttemptKey);
      await registerPersistentFailure({
        scope: 'reset_password',
        attemptKey: persistentAttemptKey,
        windowMs: RESET_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_RESET_ATTEMPTS,
        lockMs: RESET_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'reset_password',
        eventType: 'reset_password_expired_token',
        ipAddress: requestIp,
        userId: tokenRow.user_id,
      });
      return NextResponse.json({ error: 'Token reset telah kedaluwarsa.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateUserError } = await supabaseAdmin
      .from('user')
      .update({
        password_hash: hashedPassword,
        must_change_password: false,
      })
      .eq('id', tokenRow.user_id);

    if (updateUserError) {
      recordResetFailure(localAttemptKey);
      await registerPersistentFailure({
        scope: 'reset_password',
        attemptKey: persistentAttemptKey,
        windowMs: RESET_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_RESET_ATTEMPTS,
        lockMs: RESET_LOCK_MS,
      });
      console.error('[RESET_PASSWORD] user update error:', updateUserError.message);
      return NextResponse.json({ error: 'Gagal memperbarui password.' }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: nowIso })
      .eq('user_id', tokenRow.user_id)
      .is('used_at', null);

    const newAuthVersion = await bumpAuthSessionVersionByUserId(supabaseAdmin, tokenRow.user_id);
    clearResetFailures(localAttemptKey);
    await clearPersistentFailures('reset_password', persistentAttemptKey);

    await persistAuthSecurityEvent({
      scope: 'reset_password',
      eventType: 'reset_password_success',
      ipAddress: requestIp,
      userId: tokenRow.user_id,
      metadata: {
        authVersion: newAuthVersion,
      },
    });

    const response = NextResponse.json({ message: 'Password berhasil diperbarui.' }, { status: 200 });
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[RESET_PASSWORD] fatal:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
