import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, signAuthToken } from '@/lib/auth';
import {
  clearPersistentFailures,
  extractClientIp,
  getPersistentBlockState,
  hashIdentifier,
  persistAuthSecurityEvent,
  registerPersistentFailure,
} from '@/lib/authSecurity';
import { getAuthSessionVersionByUserId } from '@/lib/authSessionVersion';
import { verifyTurnstileToken } from '@/lib/turnstile';

type LoginUserRow = {
  id: number | string;
  email: string;
  username: string | null;
  role: string | null;
  password_hash: string | null;
  must_change_password: boolean | null;
};

type LoginAttemptState = {
  count: number;
  firstAttemptAt: number;
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const loginAttemptMap = new Map<string, LoginAttemptState>();

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
  turnstileToken: z.string().min(1, 'Captcha wajib diselesaikan.'),
});

function getLoginAttemptKey(email: string, ip: string) {
  return `${ip}:${email}`;
}

function getAttemptState(key: string) {
  const now = Date.now();
  const existing = loginAttemptMap.get(key);
  if (!existing) {
    return { count: 0, firstAttemptAt: now };
  }

  if (now - existing.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttemptMap.delete(key);
    return { count: 0, firstAttemptAt: now };
  }

  return existing;
}

function recordFailedAttempt(key: string) {
  const state = getAttemptState(key);
  loginAttemptMap.set(key, {
    count: state.count + 1,
    firstAttemptAt: state.firstAttemptAt,
  });
}

function clearAttempts(key: string) {
  loginAttemptMap.delete(key);
}

function getBlockState(key: string) {
  const state = getAttemptState(key);
  if (state.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterMs = LOGIN_ATTEMPT_WINDOW_MS - (Date.now() - state.firstAttemptAt);
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export async function POST(req: NextRequest) {
  try {
    const requestIp = extractClientIp(req.headers);
    const parsed = loginSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload login tidak valid.' }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const normalizedPassword = parsed.data.password;
    const turnstileToken = parsed.data.turnstileToken;
    const loginAttemptKey = getLoginAttemptKey(normalizedEmail, requestIp);
    const persistentAttemptKey = hashIdentifier(`login:${normalizedEmail}:${requestIp}`);

    const localBlockState = getBlockState(loginAttemptKey);
    const persistentBlockState = await getPersistentBlockState('login', persistentAttemptKey);
    const retryAfterSeconds = Math.max(localBlockState.retryAfterSeconds, persistentBlockState.retryAfterSeconds);

    if (localBlockState.blocked || persistentBlockState.blocked) {
      await persistAuthSecurityEvent({
        scope: 'login',
        eventType: 'login_blocked',
        identifier: normalizedEmail,
        ipAddress: requestIp,
        metadata: {
          retryAfterSeconds,
          localBlocked: localBlockState.blocked,
          persistentBlocked: persistentBlockState.blocked,
        },
      });

      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    const captchaResult = await verifyTurnstileToken({ token: turnstileToken, remoteIp: requestIp });
    if (!captchaResult.ok) {
      await persistAuthSecurityEvent({
        scope: 'login',
        eventType: 'captcha_failed',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: captchaResult.error }, { status: captchaResult.status });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing environment variables.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data: user, error: userError } = await supabaseAdmin
      .from('user')
      .select('id, email, username, role, password_hash, must_change_password')
      .eq('email', normalizedEmail)
      .maybeSingle<LoginUserRow>();

    if (userError) {
      console.error('[LOGIN_API] Error fetching user:', userError.message);
      return NextResponse.json({ error: 'Terjadi kesalahan saat login.' }, { status: 500 });
    }

    if (!user || !user.password_hash) {
      recordFailedAttempt(loginAttemptKey);
      await registerPersistentFailure({
        scope: 'login',
        attemptKey: persistentAttemptKey,
        windowMs: LOGIN_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        lockMs: LOGIN_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'login',
        eventType: 'invalid_credentials',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password_hash);
    if (!isPasswordValid) {
      recordFailedAttempt(loginAttemptKey);
      await registerPersistentFailure({
        scope: 'login',
        attemptKey: persistentAttemptKey,
        windowMs: LOGIN_ATTEMPT_WINDOW_MS,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        lockMs: LOGIN_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'login',
        eventType: 'invalid_credentials',
        identifier: normalizedEmail,
        ipAddress: requestIp,
        userId: Number(user.id),
      });
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    clearAttempts(loginAttemptKey);
    await clearPersistentFailures('login', persistentAttemptKey);

    const userId = String(user.id);

    const { data: alumniProfile, error: profileError } = await supabaseAdmin
      .from('alumni_db')
      .select('id, nama_lengkap')
      .eq('id', user.id)
      .maybeSingle<{ id: number; nama_lengkap: string | null }>();

    if (profileError) {
      console.error('[LOGIN_API] Error checking alumni profile:', profileError.message);
      return NextResponse.json({ error: 'Terjadi kesalahan saat login.' }, { status: 500 });
    }

    const profileCompleted = Boolean(alumniProfile?.nama_lengkap && alumniProfile.nama_lengkap.trim().length > 0);
    const authVersion = await getAuthSessionVersionByUserId(supabaseAdmin, Number(user.id));

    const authToken = await signAuthToken({
      sub: userId,
      email: user.email,
      role: user.role ?? 'alumni',
      username: user.username ?? undefined,
      profile_completed: profileCompleted,
      must_change_password: Boolean(user.must_change_password),
      auth_version: authVersion,
    });

    await persistAuthSecurityEvent({
      scope: 'login',
      eventType: 'login_success',
      identifier: normalizedEmail,
      ipAddress: requestIp,
      userId: Number(user.id),
      metadata: {
        profileCompleted,
      },
    });

    const response = NextResponse.json(
      {
        message: 'Login berhasil.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile_completed: profileCompleted,
          must_change_password: Boolean(user.must_change_password),
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
    console.error('[LOGIN_API] FATAL:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
