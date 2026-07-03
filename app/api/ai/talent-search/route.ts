// app/api/ai/talent-search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, cohortId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt pencarian wajib diisi.' }, { status: 400 });
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
    const apiKey = process.env.INTERNAL_API_KEY || '';

    console.log(`[TALENT_SEARCH_API] Mengirim request ke FastAPI di: ${fastApiUrl}/proyek_rekomendasi, cohortId: ${cohortId}`);

    const response = await fetch(`${fastApiUrl}/proyek_rekomendasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ 
        ide_proyek: prompt,
        cohort_id: cohortId ? Number(cohortId) : null,
        language: 'id',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TALENT_SEARCH_API] FastAPI Error:", errorText);
      return NextResponse.json({ error: 'Gagal mendapatkan hasil pencarian dari AI Engine (FastAPI).' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[TALENT_SEARCH_API] API AI Route Error:", message);
    return NextResponse.json({ error: 'Internal server error saat menghubungi AI Engine.' }, { status: 500 });
  }
}
