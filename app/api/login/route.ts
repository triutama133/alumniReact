// app/api/login/route.ts
// Ini adalah kode sisi server yang TIDAK AKAN PERNAH dijalankan di browser.
// Kunci Supabase Service Role dan JWT_SECRET disimpan di sini dengan aman.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Mendapatkan variabel lingkungan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

if (!supabaseUrl || !supabaseServiceRoleKey || !jwtSecret) {
  console.error('ERROR: Variabel lingkungan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, atau JWT_SECRET tidak ditemukan.');
  throw new Error('Missing environment variables for API route.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function POST(req: NextRequest) {
  console.log('--- Memulai Permintaan Login API ---');
  try {
    const { email, password } = await req.json();
    console.log(`[LOG] Menerima permintaan login untuk email: ${email}`);

    if (!email || !password) {
      console.log('[LOG] Email atau password tidak ada.');
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const { data: userFromPublic, error: userFetchError } = await supabaseAdmin
      .from('user')
      .select('id, email, password_hash, username, role')
      .eq('email', email)
      .single();

    if (userFetchError || !userFromPublic) {
      console.error('Error fetching user from public.user or user not found:', userFetchError?.message || 'User not found');
      return NextResponse.json({ error: 'Kredensial tidak valid.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, userFromPublic.password_hash || '');

    if (!isPasswordValid) {
      console.warn(`[LOG] PERINGATAN: Password tidak cocok untuk email: ${email}`);
      return NextResponse.json({ error: 'Kredensial tidak valid.' }, { status: 401 });
    }

    console.log('[LOG] Password berhasil diverifikasi!');

    const payload = {
      sub: userFromPublic.id,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // Token valid selama 1 jam
      iat: Math.floor(Date.now() / 1000),
      email: userFromPublic.email,
      username: userFromPublic.username,
      role: userFromPublic.role,
    };

    const customToken = jwt.sign(payload, jwtSecret);
    console.log(`[LOG] Custom JWT berhasil dibuat. Token dimulai dengan: ${customToken.substring(0, 30)}...`);

    // --- BAGIAN PENTING: Melakukan Redirect dari Server ---
    const redirectUrl = new URL('/', req.url); // Alihkan ke halaman beranda
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookie sebelum redirect
    response.cookies.set('auth_token', customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true di produksi (HTTPS), false di pengembangan (HTTP)
      path: '/',
      maxAge: 60 * 60, // 1 jam dalam detik
      sameSite: 'lax',
    });

    console.log('[LOG] Custom JWT berhasil disimpan di HTTP-Only Cookie dan mengalihkan ke beranda. --- Permintaan Login API Selesai ---');
    return response;

  } catch (error: any) {
    console.error('[LOG] ERROR FATAL di Login API Route:', error.message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
