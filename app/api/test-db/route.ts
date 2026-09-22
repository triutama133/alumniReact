// app/api/test-db/route.ts
// API Route untuk menguji koneksi Supabase + performance monitoring.

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 🚀 Supabase client dibuat di MODULE LEVEL (di luar handler)
// Ini mencegah cold start berulang — client di-cache oleh Vercel serverless function
// dan koneksi pool digunakan kembali antar request.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    // Gunakan connection pool yang persisten
    db: { schema: 'public' },
  })
  : null;

export async function GET() {
  const startTime = performance.now();
  console.log('--- [TEST_DB] Memulai Pengujian Database ---');

  if (!supabase) {
    console.error('[TEST_DB] ERROR: Supabase client gagal diinisialisasi — ENV missing.');
    return NextResponse.json(
      {
        status: 'error',
        message: 'Supabase URL atau ANON_KEY tidak ditemukan. Periksa environment variables.',
      },
      { status: 500 }
    );
  }

  try {
    const queryStart = performance.now();
    const { data, error } = await supabase.from('user').select('*').limit(1);
    const queryTime = (performance.now() - queryStart).toFixed(1);

    if (error) {
      console.error(`[TEST_DB] ERROR (query ${queryTime}ms):`, error.message);
      if (error.code === '42501') {
        return NextResponse.json(
          {
            status: 'error',
            message: `Koneksi berhasil, namun RLS memblokir akses: ${error.message}`,
            timing: { queryTimeMs: queryTime, totalTimeMs: (performance.now() - startTime).toFixed(1) },
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          status: 'error',
          message: `Gagal mengambil data: ${error.message}`,
          timing: { queryTimeMs: queryTime, totalTimeMs: (performance.now() - startTime).toFixed(1) },
          details: error,
        },
        { status: 500 }
      );
    }

    const totalTime = (performance.now() - startTime).toFixed(1);
    const hasData = data && data.length > 0;

    console.log(`[TEST_DB] ${hasData ? 'BERHASIL' : 'OK (tabel kosong)'} — Query: ${queryTime}ms, Total: ${totalTime}ms`);

    return NextResponse.json(
      {
        status: 'success',
        message: hasData
          ? 'Koneksi database Supabase berhasil! Data dari tabel user berhasil diambil.'
          : 'Koneksi database Supabase berhasil, namun tabel user kosong.',
        ...(hasData && { data: data[0] }),
        timing: { queryTimeMs: queryTime, totalTimeMs: totalTime },
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[TEST_DB] Fatal error:', msg);
    return NextResponse.json(
      {
        status: 'error',
        message: `Kesalahan fatal: ${msg}`,
        timing: { totalTimeMs: (performance.now() - startTime).toFixed(1) },
      },
      { status: 500 }
    );
  }
}
