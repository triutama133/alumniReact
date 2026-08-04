// app/api/ai/cv-suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function callGemini(prompt: string) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('Missing GEMINI_API_KEY.');
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  const res = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errorText}`);
  }

  const responseData = await res.json();
  return responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callDeepseek(prompt: string) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) {
    throw new Error('Missing DEEPSEEK_API_KEY.');
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${errorText}`);
  }

  const responseData = await res.json();
  return responseData.choices?.[0]?.message?.content || '';
}

async function callLLMWithFallback(prompt: string) {
  const primary = LLM_PROVIDER === 'deepseek' ? 'deepseek' : 'gemini';
  const secondary = primary === 'gemini' ? 'deepseek' : 'gemini';

  try {
    return primary === 'gemini' ? await callGemini(prompt) : await callDeepseek(prompt);
  } catch (primaryErr) {
    console.warn('[CV_SUGGEST_API] Primary LLM failed:', primary, primaryErr);
    return secondary === 'gemini' ? await callGemini(prompt) : await callDeepseek(prompt);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { role, description } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Deskripsi pekerjaan kosong.' }, { status: 400 });
    }

    const prompt = `Anda adalah pakar penulisan CV ATS profesional berstandar internasional. 
Tugas Anda adalah memodifikasi deskripsi pekerjaan agar berfokus pada hasil/dampak nyata (impact-based) dengan menggunakan formula STAR/XYZ (Accomplished [X] as measured by [Y], by doing [Z]).
Ubah kalimat pasif atau yang sekadar menyebutkan daftar tugas harian menjadi berorientasi hasil yang bisa diukur dengan metrik atau efisiensi (gunakan persentase/angka ilustratif yang masuk akal jika diperlukan).

Peran / Posisi: ${role || 'Profesional'}
Deskripsi Asli: "${description}"

Berikan saran hasil revisi deskripsi dalam format poin-poin (bullet points) yang kuat, dalam Bahasa Indonesia. Kembalikan HANYA teks poin-poin hasil revisinya saja (biasanya 2-3 poin), tanpa kalimat pengantar, tanpa penjelasan, dan tanpa markdown block code.`;
    const suggestedText = await callLLMWithFallback(prompt);

    return NextResponse.json({ suggestion: suggestedText.trim() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
