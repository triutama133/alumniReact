// app/api/test-db/route.ts
// Ini adalah API Route sisi server untuk menguji koneksi ke database Supabase.

import { createClient } from '@supabase/supabase-js'; // Mengimpor Supabase client
import { NextRequest, NextResponse } from 'next/server'; // Mengimpor utilitas server Next.js

export async function GET() {
  console.log('--- Memulai Pengujian Konfigurasi Database ---');

  // Ambil variabel lingkungan
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`[TEST_DB] NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  console.log(`[TEST_DB] NEXT_PUBLIC_SUPABASE_ANON_KEY (awal): ${supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'Tidak Ditemukan'}`);

  // Periksa apakah variabel lingkungan ada
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[TEST_DB] ERROR: Variabel lingkungan Supabase (URL atau ANON_KEY) tidak ditemukan.');
    return NextResponse.json(
      {
        status: 'error',
        message: 'Variabel lingkungan Supabase (NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY) tidak ditemukan. Mohon periksa file .env.local Anda.',
      },
      { status: 500 }
    );
  }

  try {
    // Inisialisasi Supabase client dengan public (anon) key
    // Kita gunakan public client karena ini hanya untuk read-only test
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('[TEST_DB] Klien Supabase berhasil diinisialisasi.');
    console.log('[TEST_DB] Mencoba mengambil 1 data dari tabel public.user...');

    // Coba ambil satu baris dari tabel 'user'
    // Menggunakan select().limit(1) adalah cara yang aman untuk menguji konektivitas
    // tanpa perlu hak akses yang luas atau khawatir tentang data kosong.
    const { data, error } = await supabase.from('user').select('*').limit(1);

    if (error) {
      console.error('[TEST_DB] ERROR saat mengambil data dari tabel user:', error.message);
      // Jika ada error, itu bisa jadi masalah RLS (Row Level Security) atau tabel tidak ada
      if (error.code === '42501') { // RLS violation
        console.error('[TEST_DB] Ini kemungkinan besar masalah Row Level Security (RLS).');
        return NextResponse.json(
          {
            status: 'error',
            message: `Koneksi database berhasil, tetapi gagal mengambil data: ${error.message}. Periksa Row Level Security (RLS) pada tabel 'user'.`,
            details: error,
          },
          { status: 403 } // Forbidden
        );
      }
      return NextResponse.json(
        {
          status: 'error',
          message: `Gagal mengambil data dari database: ${error.message}`,
          details: error,
        },
        { status: 500 }
      );
    }

    if (data && data.length > 0) {
      console.log('[TEST_DB] Berhasil mengambil 1 data dari tabel user. Koneksi BERHASIL!');
      console.log('[TEST_DB] Data yang diambil (hanya untuk verifikasi):', data[0]); // Jangan log data sensitif
      return NextResponse.json(
        {
          status: 'success',
          message: 'Koneksi database Supabase berhasil! Data dari tabel user berhasil diambil (1 baris).',
          data: data[0], // Kirimkan data pertama sebagai konfirmasi
        },
        { status: 200 }
      );
    } else {
      console.log('[TEST_DB] Koneksi database Supabase berhasil, tetapi tabel user kosong atau tidak ada data.');
      return NextResponse.json(
        {
          status: 'success',
          message: 'Koneksi database Supabase berhasil, tetapi tabel user kosong atau tidak ada data. Ini bukan masalah koneksi.',
        },
        { status: 200 }
      );
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[TEST_DB] Terjadi kesalahan fatal selama pengujian koneksi:', msg);
    return NextResponse.json(
      {
        status: 'error',
        message: `Terjadi kesalahan tidak terduga saat mencoba terhubung ke Supabase: ${msg}`,
      },
      { status: 500 }
    );
  } finally {
    console.log('--- Pengujian Konfigurasi Database Selesai ---');
  }
}
