// app/api/ai/cv-suggest/route.ts
// 🛡️ 4-LAYER PROTECTION:
//   1. Auth gate         — wajib x-user-id dari middleware
//   2. Per-user rate limit — 5 req / menit / user
//   3. Daily cap          — 30 req / hari / user (tracked via Supabase)
//   4. API key via header — tidak di URL query param
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/adminClient';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// ── In-memory rate limit (short-lived, per-user, 1 menit window) ──
const userRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_WINDOW_MS = 60_000;
const DAILY_CAP = 30;

// ── Helpers ──

function extractUserId(req: NextRequest): number | null {
  const raw = req.headers.get('x-user-id');
  return raw ? Number(raw) : null;
}

function checkPerMinuteRate(userId: number): boolean {
  const now = Date.now();
  const key = String(userId);
  const record = userRateMap.get(key);
  if (!record || now > record.resetAt) {
    userRateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

async function checkDailyCap(userId: number): Promise<{ allowed: boolean; used: number }> {
  const supabase = getAdminClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from('ai_daily_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle<{ request_count: number }>();

  if (error) {
    console.error('[CV_SUGGEST] Failed to check daily cap:', error.message);
    // Fail open tapi log — jangan blokir user kalau DB down, tapi tetap batasi via in-memory rate
    return { allowed: true, used: 0 };
  }

  const used = data?.request_count ?? 0;
  return { allowed: used < DAILY_CAP, used };
}

async function incrementDailyUsage(userId: number): Promise<void> {
  const supabase = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.rpc('increment_ai_daily_usage', {
    p_user_id: userId,
    p_date: today,
  });

  if (error) {
    // Fallback: upsert manual
    const { data: existing } = await supabase
      .from('ai_daily_usage')
      .select('id, request_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle<{ id: number; request_count: number }>();

    if (existing) {
      await supabase
        .from('ai_daily_usage')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('ai_daily_usage')
        .insert({ user_id: userId, usage_date: today, request_count: 1 });
    }
  }
}

// ── LLM Callers (API key via header, NOT query param) ──

async function callGemini(prompt: string) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('Missing GEMINI_API_KEY.');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errorText}`);
  }

  const responseData = await res.json();
  return responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── MAIN HANDLER ──

export async function POST(req: NextRequest) {
  try {
    // ═══ LAYER 1: Auth gate ═══
    const userId = extractUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan untuk mengakses fitur AI.' },
        { status: 401 }
      );
    }

    // ═══ LAYER 2: Per-minute rate limit (in-memory) ═══
    if (!checkPerMinuteRate(userId)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );
    }

    // ═══ LAYER 3: Daily cap (Supabase-tracked) ═══
    const daily = await checkDailyCap(userId);
    if (!daily.allowed) {
      return NextResponse.json(
        {
          error: `Batas harian tercapai (${DAILY_CAP} permintaan/hari). Silakan coba lagi besok.`,
          dailyUsed: daily.used,
          dailyCap: DAILY_CAP,
        },
        { status: 429 }
      );
    }

    // Parse input
    const { role, description } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Deskripsi pekerjaan kosong.' }, { status: 400 });
    }

    // Build prompt
    const prompt = `Anda adalah pakar penulisan CV ATS profesional berstandar internasional. 
Tugas Anda adalah memodifikasi deskripsi pekerjaan agar berfokus pada hasil/dampak nyata (impact-based) dengan menggunakan formula STAR/XYZ (Accomplished [X] as measured by [Y], by doing [Z]).
Ubah kalimat pasif atau yang sekadar menyebutkan daftar tugas harian menjadi berorientasi hasil yang bisa diukur dengan metrik atau efisiensi (gunakan persentase/angka ilustratif yang masuk akal jika diperlukan).

Peran / Posisi: ${role || 'Profesional'}
Deskripsi Asli: "${description}"

Berikan saran hasil revisi deskripsi dalam format poin-poin (bullet points) yang kuat, dalam Bahasa Indonesia. Kembalikan HANYA teks poin-poin hasil revisinya saja (biasanya 2-3 poin), tanpa kalimat pengantar, tanpa penjelasan, dan tanpa markdown block code.`;

    // Call LLM
    const suggestedText = await callGemini(prompt);

    // ═══ LAYER 4: Track daily usage (only after successful call) ═══
    await incrementDailyUsage(userId);

    return NextResponse.json({
      suggestion: suggestedText.trim(),
      dailyRemaining: DAILY_CAP - daily.used - 1,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CV_SUGGEST] Handler error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}