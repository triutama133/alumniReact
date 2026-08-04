import { randomUUID } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  clearPersistentFailures,
  extractClientIp,
  getPersistentBlockState,
  hashIdentifier,
  persistAuthSecurityEvent,
  registerPersistentFailure,
} from '@/lib/authSecurity';
import { sendPasswordResetEmail } from '@/lib/email';
import { verifyTurnstileToken } from '@/lib/turnstile';

type ForgotAttemptState = {
  count: number;
  firstAttemptAt: number;
};

const MAX_FORGOT_ATTEMPTS = 3;
const FORGOT_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_LOCK_MS = 20 * 60 * 1000;
const forgotAttemptMap = new Map<string, ForgotAttemptState>();

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  turnstileToken: z.string().min(1, 'Captcha wajib diselesaikan.'),
});

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

function getForgotAttemptState(key: string) {
  const now = Date.now();
  const existing = forgotAttemptMap.get(key);
  if (!existing) {
    return { count: 0, firstAttemptAt: now };
  }

  if (now - existing.firstAttemptAt > FORGOT_ATTEMPT_WINDOW_MS) {
    forgotAttemptMap.delete(key);
    return { count: 0, firstAttemptAt: now };
  }

  return existing;
}

function getForgotBlockState(key: string) {
  const state = getForgotAttemptState(key);
  if (state.count >= MAX_FORGOT_ATTEMPTS) {
    const retryAfterMs = FORGOT_ATTEMPT_WINDOW_MS - (Date.now() - state.firstAttemptAt);
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function recordForgotFailure(key: string) {
  const state = getForgotAttemptState(key);
  forgotAttemptMap.set(key, {
    count: state.count + 1,
    firstAttemptAt: state.firstAttemptAt,
  });
}

function clearForgotFailures(key: string) {
  forgotAttemptMap.delete(key);
}

export async function POST(req: NextRequest) {
  const genericOkResponse = NextResponse.json(
    { message: 'Jika email terdaftar, tautan reset telah dikirimkan.' },
    { status: 200 }
  );

  try {
    const requestIp = extractClientIp(req.headers);
    const parsed = forgotPasswordSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Data request tidak valid.' }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const localAttemptKey = `forgot:${requestIp}`;
    const persistentAttemptKey = hashIdentifier(`forgot:${requestIp}`);

    const localBlockState = getForgotBlockState(localAttemptKey);
    const persistentBlockState = await getPersistentBlockState('forgot_password', persistentAttemptKey);
    const retryAfterSeconds = Math.max(localBlockState.retryAfterSeconds, persistentBlockState.retryAfterSeconds);

    if (localBlockState.blocked || persistentBlockState.blocked) {
      await persistAuthSecurityEvent({
        scope: 'forgot_password',
        eventType: 'forgot_password_blocked',
        identifier: normalizedEmail,
        ipAddress: requestIp,
        metadata: {
          retryAfterSeconds,
          localBlocked: localBlockState.blocked,
          persistentBlocked: persistentBlockState.blocked,
        },
      });

      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    const captchaResult = await verifyTurnstileToken({
      token: parsed.data.turnstileToken,
      remoteIp: requestIp,
    });

    if (!captchaResult.ok) {
      recordForgotFailure(localAttemptKey);
      await registerPersistentFailure({
        scope: 'forgot_password',
        attemptKey: persistentAttemptKey,
        windowMs: FORGOT_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_FORGOT_ATTEMPTS,
        lockMs: FORGOT_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'forgot_password',
        eventType: 'forgot_password_captcha_failed',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: captchaResult.error }, { status: captchaResult.status });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: user } = await supabaseAdmin
      .from('user')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle<{ id: number; email: string }>();

    // Always return generic 200 to prevent user enumeration.
    if (!user) {
      await persistAuthSecurityEvent({
        scope: 'forgot_password',
        eventType: 'forgot_password_unknown_email',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return genericOkResponse;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from('password_reset_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    if (insertError) {
      recordForgotFailure(localAttemptKey);
      await registerPersistentFailure({
        scope: 'forgot_password',
        attemptKey: persistentAttemptKey,
        windowMs: FORGOT_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_FORGOT_ATTEMPTS,
        lockMs: FORGOT_LOCK_MS,
      });
      console.error('[FORGOT_PASSWORD] token insert error:', insertError.message);
      return NextResponse.json({ error: 'Gagal memproses permintaan reset password.' }, { status: 500 });
    }

    await sendPasswordResetEmail(user.email, token);
    clearForgotFailures(localAttemptKey);
    await clearPersistentFailures('forgot_password', persistentAttemptKey);

    await persistAuthSecurityEvent({
      scope: 'forgot_password',
      eventType: 'forgot_password_requested',
      identifier: normalizedEmail,
      ipAddress: requestIp,
      userId: user.id,
    });

    return genericOkResponse;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[FORGOT_PASSWORD] fatal:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
