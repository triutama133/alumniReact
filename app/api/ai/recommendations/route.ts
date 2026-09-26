// app/api/ai/recommendations/route.ts
// GET/POST: Save and reload AI recommendation snapshots.
// Most contexts ("collaboration", "project_scout", "job_scout") keep one row per
// user+context, upserted, so a result survives leaving the page instead of vanishing
// until re-run. "job_match" (Smart Job Agregator) instead keeps a short history —
// each run is a new row (capped at 10) — since the user asked to be able to save and
// revisit multiple past analyses rather than only ever the latest one.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';

export const dynamic = 'force-dynamic';

const HISTORY_CAP = 10;

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const contextType = searchParams.get('contextType');
    const list = searchParams.get('list') === 'true';
    if (!contextType) return NextResponse.json({ error: 'contextType wajib diisi.' }, { status: 400 });

    const supabase = getAdminClient();

    if (list) {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('id, recommendation_text, candidates, created_at, updated_at')
        .eq('user_id', userId)
        .eq('context_type', contextType)
        .order('created_at', { ascending: false })
        .limit(HISTORY_CAP);

      if (error) {
        console.error('[AI_RECOMMENDATIONS_GET_LIST] Error:', error.message);
        return NextResponse.json({ error: 'Gagal memuat riwayat rekomendasi.' }, { status: 500 });
      }
      return NextResponse.json({ items: data || [] }, { status: 200 });
    }

    const contextId = searchParams.get('contextId') || '_self';
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
    const { contextType, contextId, recommendationText, candidates, append } = body;
    if (!contextType) return NextResponse.json({ error: 'contextType wajib diisi.' }, { status: 400 });

    const supabase = getAdminClient();

    if (append) {
      // Always insert a new row (a fresh, server-generated context_id keeps each run
      // distinct) rather than upsert, then trim anything beyond the history cap.
      const { error: insertErr } = await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          context_type: contextType,
          context_id: `run_${Date.now()}`,
          recommendation_text: recommendationText ?? null,
          candidates: candidates ?? null,
        });

      if (insertErr) {
        console.error('[AI_RECOMMENDATIONS_POST_APPEND] Error:', insertErr.message);
        return NextResponse.json({ error: 'Gagal menyimpan rekomendasi.' }, { status: 500 });
      }

      const { data: all } = await supabase
        .from('ai_recommendations')
        .select('id')
        .eq('user_id', userId)
        .eq('context_type', contextType)
        .order('created_at', { ascending: false });

      const excess = (all || []).slice(HISTORY_CAP);
      if (excess.length > 0) {
        await supabase.from('ai_recommendations').delete().in('id', excess.map((r) => r.id));
      }

      return NextResponse.json({ message: 'Rekomendasi tersimpan.' }, { status: 200 });
    }

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
