// app/api/register/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // Perbaikan: uuidv4 sekarang digunakan

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERROR: Variabel lingkungan Supabase (URL atau Service Role Key) tidak ditemukan untuk route register.');
  throw new Error('Missing environment variables for register API route.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function POST(req: NextRequest) {
  console.log('--- Memulai Permintaan Register API ---');
  try {
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      console.log('[LOG] Email, password, atau username tidak ada.');
      return NextResponse.json({ error: 'Email, password, dan username wajib diisi.' }, { status: 400 });
    }

    console.log(`[LOG] Memeriksa ketersediaan email: ${email} dan username: ${username}`);
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('user')
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`);

    if (checkError) {
      console.error('[LOG] ERROR saat memeriksa pengguna yang sudah ada:', checkError.message);
      return NextResponse.json({ error: 'Terjadi kesalahan saat memeriksa pengguna.' }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      if (existingUsers.some(u => u.email === email)) {
        console.log(`[LOG] Pendaftaran gagal: Email ${email} sudah terdaftar.`);
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
      }
      if (existingUsers.some(u => u.username === username)) {
        console.log(`[LOG] Pendaftaran gagal: Username ${username} sudah digunakan.`);
        return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });
      }
    }

    console.log('[LOG] Menghash password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('[LOG] Password berhasil dihash.');

    const newUser = {
      // id: uuidv4(), // Gunakan ini jika 'id' adalah UUID dan Anda perlu membuatnya manual
      email: email,
      password_hash: hashedPassword,
      username: username,
      role: 'alumni',
    };

    console.log('[LOG] Menyisipkan pengguna baru ke public.user...');
    const { error: insertError } = await supabaseAdmin
      .from('user')
      .insert([newUser]);

    if (insertError) {
      console.error('[LOG] ERROR saat menyisipkan pengguna baru ke public.user:', insertError.message);
      return NextResponse.json({ error: 'Gagal mendaftar pengguna.' }, { status: 500 });
    }

    console.log(`[LOG] Pengguna ${email} berhasil didaftarkan di public.user.`);
    console.log('--- Permintaan Register API Selesai ---');
    return NextResponse.json({ message: 'Pendaftaran berhasil!' }, { status: 201 });

  } catch (error: unknown) { // Perbaikan: Ganti 'any' dengan 'unknown'
    console.error('[LOG] ERROR FATAL di Register API Route:', (error as Error).message); // Perbaikan: Type assertion
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
