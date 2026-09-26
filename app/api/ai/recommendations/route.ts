// app/api/ai/recommendations/route.ts
// GET/POST: Save and reload the latest AI recommendation snapshot for a given context
// (e.g. "collaboration" for the viewer's own profile, "project_scout" for a specific
// project, "job_match" for the viewer's job-fit ranking) — one row per user+context,
// upserted, so a result survives leaving the page instead of vanishing until re-run.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const contextType = searchParams.get('contextType');
    const contextId = searchParams.get('contextId') || '_self';
    if (!contextType) return NextResponse.json({ error: 'contextType wajib diisi.' }, { status: 400 });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('recommendation_text, candidates, updated_at')
      .eq('user_id', userId)
      .eq('context_type', contextType)
      .eq('context_id', contextId)
      .maybeSingle();

    if (error) {
      console.error('[AI_RECOMMENDATIONS_GET] Error:', error.message);
      return NextResponse.json({ error: 'Gagal memuat rekomendasi tersimpan.' }, { status: 500 });
    }

    return NextResponse.json(data || null, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const body = await req.json();
    const { contextType, contextId, recommendationText, candidates } = body;
    if (!contextType) return NextResponse.json({ error: 'contextType wajib diisi.' }, { status: 400 });

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('ai_recommendations')
      .upsert({
        user_id: userId,
        context_type: contextType,
        context_id: contextId || '_self',
        recommendation_text: recommendationText ?? null,
        candidates: candidates ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,context_type,context_id' });

    if (error) {
      console.error('[AI_RECOMMENDATIONS_POST] Error:', error.message);
      return NextResponse.json({ error: 'Gagal menyimpan rekomendasi.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rekomendasi tersimpan.' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
