// app/api/learning-path/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const { targetRole } = await req.json();
    if (!targetRole || !targetRole.trim()) {
      return NextResponse.json({ error: 'Target peran wajib ditentukan.' }, { status: 400 });
    }

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing INTERNAL_API_KEY.' }, { status: 500 });
    }

    const apiBaseUrl = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const fastApiUrl = `${apiBaseUrl.replace(/\/$/, '')}/learning_path`;
    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': internalApiKey,
      },
      body: JSON.stringify({
        user_id: userId,
        target_role: targetRole.trim(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Gagal memproses data analisis dari AI Engine.' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
