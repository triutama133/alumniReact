// app/api/jobs/smart-match/route.ts
// GET: Rank the top 10 active job postings by fit against the viewer's own profile.
// This is a deterministic keyword-overlap sort (same scoring approach the AI engine
// uses for candidate matching, ported to TS) — no LLM call, since ranking a list is not
// something worth an extra Gemini round-trip for. "How do I get hired for this" is a
// separate, deliberate hand-off to the existing Learning Path generator instead of a
// second, duplicate gap-analysis feature.
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/adminClient';
import { tokenizeText, computeMatchScore, extractMatchedTerms } from '@/lib/textMatch';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    const userId = Number(userIdString);
    if (Number.isNaN(userId)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });

    const supabase = getAdminClient();

    const { data: profile, error: profileErr } = await supabase
      .from('alumni_db')
      .select('skill_gabungan, gabungan_data, aktivitas')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profil Anda belum ditemukan. Lengkapi profil terlebih dahulu.' }, { status: 404 });
    }

    const profileText = `${profile.skill_gabungan || ''} ${profile.gabungan_data || ''}`.trim();
    if (!profileText) {
      return NextResponse.json({ error: 'Lengkapi keahlian pada profil Anda agar AI dapat mencocokkan lowongan.' }, { status: 400 });
    }
    const profileTokens = tokenizeText(profileText);

    const { data: jobs, error: jobsErr } = await supabase
      .from('jobs')
      .select('id, job_title, company, category, salary, description, job_desk, requirements')
      .eq('is_active', true);

    if (jobsErr) {
      console.error('[JOBS_SMART_MATCH] Error fetching jobs:', jobsErr.message);
      return NextResponse.json({ error: 'Gagal memuat daftar lowongan.' }, { status: 500 });
    }

    const scored = (jobs || []).map((job) => {
      const jobText = [
        job.job_title,
        job.category,
        job.description,
        ...(Array.isArray(job.job_desk) ? job.job_desk : []),
        ...(Array.isArray(job.requirements) ? job.requirements : []),
      ].filter(Boolean).join(' ');

      return {
        id: job.id,
        job_title: job.job_title,
        company: job.company,
        category: job.category,
        salary: job.salary,
        match_score: computeMatchScore(profileTokens, jobText),
        matched_terms: extractMatchedTerms(profileTokens, jobText),
      };
    }).filter((j) => j.match_score > 0);

    scored.sort((a, b) => b.match_score - a.match_score);
    const top10 = scored.slice(0, 10);
    const maxScore = top10[0]?.match_score || 1;

    const ranked = top10.map((job) => {
      const strength = Math.round((job.match_score / maxScore) * 1000) / 10;
      const tier = strength >= 70 ? 'kuat' : strength >= 40 ? 'sedang' : 'lemah';
      return {
        id: job.id,
        job_title: job.job_title,
        company: job.company,
        category: job.category,
        salary: job.salary,
        matched_skills: job.matched_terms,
        match_score: job.match_score,
        match_strength: strength,
        tier,
      };
    });

    return NextResponse.json({ jobs: ranked }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
