// app/api/ai/talent-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

// The AI engine runs on Render's free tier and can take 15-30s+ to respond on a cold
// start (observed live) on top of Gemini's own response time — raise the serverless
// timeout ceiling as far as the hosting plan allows (a no-op on plans that cap lower).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt, cohortId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt pencarian wajib diisi.' }, { status: 400 });
    }

    // cohortId scopes the AI search to one community's members — verify the
    // requester actually belongs to it before forwarding to the AI engine,
    // since a client could otherwise request any community's roster.
    if (cohortId) {
      const headersList = await headers();
      const userIdString = headersList.get('x-user-id');
      const userId = userIdString ? Number(userIdString) : null;
      if (!userId || Number.isNaN(userId)) {
        return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
      }
      const supabase = getAdminClient();
      const { data: membership } = await supabase
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', userId)
        .eq('cohort_id', Number(cohortId))
        .maybeSingle();
      if (!membership) {
        return NextResponse.json({ error: 'Anda bukan anggota komunitas ini.' }, { status: 403 });
      }
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
