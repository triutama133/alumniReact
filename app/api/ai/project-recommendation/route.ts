// app/api/ai/project-recommendation/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, nama_lengkap, prompt_tambahan } = await req.json();

    if (!userId && !nama_lengkap) {
      return NextResponse.json({ error: 'userId atau nama_lengkap wajib diisi.' }, { status: 400 });
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
    const apiKey = process.env.INTERNAL_API_KEY || '';

    console.log(`[PROJECT_REC_API] Mengirim request ke FastAPI di: ${fastApiUrl}/rekomendasi`);

    const response = await fetch(`${fastApiUrl}/rekomendasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ 
        user_id: userId ? Number(userId) : null,
        nama_lengkap: nama_lengkap || null,
        language: 'id',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PROJECT_REC_API] FastAPI Error:", errorText);
      return NextResponse.json({ error: 'Gagal mendapatkan respons dari AI Engine (FastAPI).' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PROJECT_REC_API] API AI Route Error:", message);
    return NextResponse.json({ error: 'Internal server error saat menghubungi AI Engine.' }, { status: 500 });
  }
}
