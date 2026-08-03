// app/api/ai/cv-suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { role, description } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Deskripsi pekerjaan kosong.' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing GEMINI_API_KEY.' }, { status: 500 });
    }

    // Use gemini-1.5-flash for fast content generation
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const prompt = `Anda adalah pakar penulisan CV ATS profesional berstandar internasional. 
Tugas Anda adalah memodifikasi deskripsi pekerjaan agar berfokus pada hasil/dampak nyata (impact-based) dengan menggunakan formula STAR/XYZ (Accomplished [X] as measured by [Y], by doing [Z]).
Ubah kalimat pasif atau yang sekadar menyebutkan daftar tugas harian menjadi berorientasi hasil yang bisa diukur dengan metrik atau efisiensi (gunakan persentase/angka ilustratif yang masuk akal jika diperlukan).

Peran / Posisi: ${role || 'Profesional'}
Deskripsi Asli: "${description}"

Berikan saran hasil revisi deskripsi dalam format poin-poin (bullet points) yang kuat, dalam Bahasa Indonesia. Kembalikan HANYA teks poin-poin hasil revisinya saja (biasanya 2-3 poin), tanpa kalimat pengantar, tanpa penjelasan, dan tanpa markdown block code.`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[CV_SUGGEST_API] Gemini error:', errorText);
      return NextResponse.json({ error: 'Gagal mendapatkan saran dari AI.' }, { status: res.status });
    }

    const responseData = await res.json();
    const suggestedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ suggestion: suggestedText.trim() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
