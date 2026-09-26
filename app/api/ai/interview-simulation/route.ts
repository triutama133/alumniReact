// app/api/ai/interview-simulation/route.ts
// POST: Proxies to the AI engine's /interview_simulation endpoint. Stateless — the
// client sends the running conversation history each call, and this route just
// authenticates the user and forwards it, matching the FastAPI backend's own design.
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface InterviewTurn {
  role: 'ai' | 'user';
  content: string;
}

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

    const body = await req.json();
    const targetRole = typeof body?.targetRole === 'string' ? body.targetRole.trim() : '';
    if (!targetRole) {
      return NextResponse.json({ error: 'Target peran wajib ditentukan.' }, { status: 400 });
    }
    const conversationHistory: InterviewTurn[] = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing INTERNAL_API_KEY.' }, { status: 500 });
    }

    const apiBaseUrl = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const fastApiUrl = `${apiBaseUrl.replace(/\/$/, '')}/interview_simulation`;

    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': internalApiKey,
      },
      body: JSON.stringify({
        user_id: userId,
        target_role: targetRole,
        conversation_history: conversationHistory.map((t) => ({ role: t.role, content: t.content })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Gagal memproses simulasi wawancara dari AI Engine.' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
