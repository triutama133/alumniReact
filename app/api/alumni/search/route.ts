// app/api/alumni/search/route.ts
// GET: Cari alumni berdasarkan nama (untuk typeahead, misal saat mengundang anggota komunitas)
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('alumni_db')
      .select('id, nama_lengkap, nama_panggilan, email')
      .ilike('nama_lengkap', `%${q}%`)
      .not('email', 'is', null)
      .order('nama_lengkap', { ascending: true })
      .limit(8);

    if (error) {
      console.error('[ALUMNI_SEARCH] Error:', error.message);
      return NextResponse.json({ error: 'Gagal mencari alumni.' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
