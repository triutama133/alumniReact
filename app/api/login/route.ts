import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, signAuthToken } from '@/lib/auth';

type LoginUserRow = {
  id: number | string;
  email: string;
  username: string | null;
  role: string | null;
  password_hash: string | null;
  must_change_password: boolean | null;
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

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

    const authToken = await signAuthToken({
      sub: userId,
      email: user.email,
      role: user.role ?? 'alumni',
      username: user.username ?? undefined,
      profile_completed: profileCompleted,
      must_change_password: Boolean(user.must_change_password),
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
