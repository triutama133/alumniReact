// app/api/register/route.ts
// Ini adalah API Route sisi server untuk pendaftaran pengguna kustom.

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import {
  clearPersistentFailures,
  extractClientIp,
  getPersistentBlockState,
  hashIdentifier,
  persistAuthSecurityEvent,
  registerPersistentFailure,
} from '@/lib/authSecurity';
import { verifyTurnstileToken } from '@/lib/turnstile';

type RegisterAttemptState = {
  count: number;
  firstAttemptAt: number;
};

const MAX_REGISTER_ATTEMPTS = 5;
const REGISTER_WINDOW_MS = 15 * 60 * 1000;
const REGISTER_LOCK_MS = 20 * 60 * 1000;
const registerAttemptMap = new Map<string, RegisterAttemptState>();

const registerSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter.')
    .max(30, 'Username maksimal 30 karakter.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore.'),
  password: z
    .string()
    .min(10, 'Password minimal 10 karakter.')
    .regex(/[A-Z]/, 'Password harus memiliki minimal 1 huruf besar.')
    .regex(/[a-z]/, 'Password harus memiliki minimal 1 huruf kecil.')
    .regex(/[0-9]/, 'Password harus memiliki minimal 1 angka.')
    .regex(/[^A-Za-z0-9]/, 'Password harus memiliki minimal 1 simbol.'),
  turnstileToken: z.string().min(1, 'Captcha wajib diselesaikan.'),
});

function getRegisterState(ip: string) {
  const now = Date.now();
  const existing = registerAttemptMap.get(ip);
  if (!existing) {
    return { count: 0, firstAttemptAt: now };
  }

  if (now - existing.firstAttemptAt > REGISTER_WINDOW_MS) {
    registerAttemptMap.delete(ip);
    return { count: 0, firstAttemptAt: now };
  }

  return existing;
}

function recordRegisterAttempt(ip: string) {
  const state = getRegisterState(ip);
  registerAttemptMap.set(ip, {
    count: state.count + 1,
    firstAttemptAt: state.firstAttemptAt,
  });
}

function isRegisterBlocked(ip: string) {
  const state = getRegisterState(ip);
  if (state.count >= MAX_REGISTER_ATTEMPTS) {
    const retryAfterMs = REGISTER_WINDOW_MS - (Date.now() - state.firstAttemptAt);
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

// Mendapatkan variabel lingkungan
// Create Supabase client at runtime inside handler to avoid build-time throws
// when environment variables are not available during static analysis.

export async function POST(req: NextRequest) {
  try {
    const requestIp = extractClientIp(req.headers);
    const persistentAttemptKey = hashIdentifier(`register:${requestIp}`);

    const localBlockedState = isRegisterBlocked(requestIp);
    const persistentBlockedState = await getPersistentBlockState('register', persistentAttemptKey);
    const retryAfterSeconds = Math.max(localBlockedState.retryAfterSeconds, persistentBlockedState.retryAfterSeconds);

    if (localBlockedState.blocked || persistentBlockedState.blocked) {
      await persistAuthSecurityEvent({
        scope: 'register',
        eventType: 'register_blocked',
        ipAddress: requestIp,
        metadata: {
          retryAfterSeconds,
          localBlocked: localBlockedState.blocked,
          persistentBlocked: persistentBlockedState.blocked,
        },
      });

      return NextResponse.json(
        { error: `Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      recordRegisterAttempt(requestIp);
      await registerPersistentFailure({
        scope: 'register',
        attemptKey: persistentAttemptKey,
        windowMs: REGISTER_WINDOW_MS,
        maxAttempts: MAX_REGISTER_ATTEMPTS,
        lockMs: REGISTER_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'register',
        eventType: 'invalid_payload',
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: 'Data pendaftaran tidak valid.', details: parsed.error.errors }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const normalizedUsername = parsed.data.username.trim();
    const password = parsed.data.password;
    const turnstileToken = parsed.data.turnstileToken;

    const captchaResult = await verifyTurnstileToken({ token: turnstileToken, remoteIp: requestIp });
    if (!captchaResult.ok) {
      recordRegisterAttempt(requestIp);
      await registerPersistentFailure({
        scope: 'register',
        attemptKey: persistentAttemptKey,
        windowMs: REGISTER_WINDOW_MS,
        maxAttempts: MAX_REGISTER_ATTEMPTS,
        lockMs: REGISTER_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'register',
        eventType: 'captcha_failed',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: captchaResult.error }, { status: captchaResult.status });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing environment variables.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // 1. Periksa apakah email atau username sudah ada di public.user
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('user')
      .select('id, email, username')
      .or(`email.eq.${normalizedEmail},username.eq.${normalizedUsername}`);

    if (checkError) {
      await persistAuthSecurityEvent({
        scope: 'register',
        eventType: 'register_check_error',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: 'Terjadi kesalahan saat memeriksa pengguna.' }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      recordRegisterAttempt(requestIp);
      await registerPersistentFailure({
        scope: 'register',
        attemptKey: persistentAttemptKey,
        windowMs: REGISTER_WINDOW_MS,
        maxAttempts: MAX_REGISTER_ATTEMPTS,
        lockMs: REGISTER_LOCK_MS,
      });
      if (existingUsers.some(u => u.email === normalizedEmail)) {
        await persistAuthSecurityEvent({
          scope: 'register',
          eventType: 'email_conflict',
          identifier: normalizedEmail,
          ipAddress: requestIp,
        });
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 }); // Conflict
      }
      if (existingUsers.some(u => u.username === normalizedUsername)) {
        await persistAuthSecurityEvent({
          scope: 'register',
          eventType: 'username_conflict',
          identifier: normalizedEmail,
          ipAddress: requestIp,
        });
        return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 }); // Conflict
      }
    }

    // 2. Hash password
    const saltRounds = 10; // Jumlah putaran salt untuk bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Sisipkan pengguna baru ke tabel public.user
    // Catatan: Jika 'id' di public.user adalah BIGINT GENERATED BY DEFAULT AS IDENTITY,
    // maka Anda TIDAK perlu menyediakan 'id' di sini; Supabase akan mengaturnya.
    // Jika 'id' adalah UUID, Anda mungkin perlu membuat satu di sini (misal: uuidv4()).
    const newUser = {
      // id: uuidv4(), // Gunakan ini jika 'id' adalah UUID dan Anda perlu membuatnya manual
      email: normalizedEmail,
      password_hash: hashedPassword,
      username: normalizedUsername,
      role: 'alumni', // Set role default atau dari input pengguna
    };

    const { error: insertError } = await supabaseAdmin
      .from('user')
      .insert([newUser]);

    if (insertError) {
      recordRegisterAttempt(requestIp);
      await registerPersistentFailure({
        scope: 'register',
        attemptKey: persistentAttemptKey,
        windowMs: REGISTER_WINDOW_MS,
        maxAttempts: MAX_REGISTER_ATTEMPTS,
        lockMs: REGISTER_LOCK_MS,
      });
      await persistAuthSecurityEvent({
        scope: 'register',
        eventType: 'register_insert_error',
        identifier: normalizedEmail,
        ipAddress: requestIp,
      });
      return NextResponse.json({ error: 'Gagal mendaftar pengguna.' }, { status: 500 });
    }

    registerAttemptMap.delete(requestIp);
    await clearPersistentFailures('register', persistentAttemptKey);
    await persistAuthSecurityEvent({
      scope: 'register',
      eventType: 'register_success',
      identifier: normalizedEmail,
      ipAddress: requestIp,
      metadata: {
        username: normalizedUsername,
      },
    });
    return NextResponse.json({ message: 'Pendaftaran berhasil!' }, { status: 201 }); // Created

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[REGISTER_API] FATAL:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
