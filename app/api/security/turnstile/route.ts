import { NextResponse } from 'next/server';

import { getTurnstileSiteKey } from '@/lib/turnstile';

export async function GET() {
  const siteKey = getTurnstileSiteKey();

  if (!siteKey) {
    return NextResponse.json({ error: 'Turnstile site key belum dikonfigurasi.' }, { status: 500 });
  }

  return NextResponse.json({ siteKey }, { status: 200 });
}
