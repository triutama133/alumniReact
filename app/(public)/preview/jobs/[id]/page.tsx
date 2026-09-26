// app/(public)/preview/jobs/[id]/page.tsx
// Server Component: Public job detail page — no login required. Matters most for
// "HubTalent Original" (user-submitted) postings, which have no external job_url to
// link out to, so this is the only place their full listing has a real, shareable URL.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminClient } from '@/lib/adminClient';
import { PreviewNavbar } from '@/components/preview/PreviewNavbar';
import { Building2, Calendar, ArrowLeft, ArrowUpRight, Wallet } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface JobDetailRow {
    id: number;
    job_title: string;
    company: string;
    platform: string | null;
    category: string | null;
    description: string | null;
    job_desk: string[] | null;
    requirements: string[] | null;
    job_url: string | null;
    salary: string | null;
    source: string;
    owner_id: number | null;
    created_at: string | null;
}

export default async function PublicJobDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const jobId = Number(id);
    if (Number.isNaN(jobId)) {
        notFound();
    }

    const supabase = getAdminClient();

    // Only currently-active listings are servable — a toggled-off or removed job's id
    // simply 404s, matching what the public jobs list already shows.
    const { data: job, error } = await supabase
        .from('jobs')
        .select('id, job_title, company, platform, category, description, job_desk, requirements, job_url, salary, source, owner_id, created_at')
        .eq('id', jobId)
        .eq('is_active', true)
        .maybeSingle();

    if (error || !job) {
        notFound();
    }

    const j = job as unknown as JobDetailRow;

    let posterName: string | null = null;
    if (j.source === 'user' && j.owner_id) {
        const { data: owner } = await supabase.from('alumni_db').select('nama_lengkap').eq('id', j.owner_id).maybeSingle();
        posterName = owner?.nama_lengkap || null;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PreviewNavbar />

            <div className="mx-auto max-w-3xl px-6 py-10">
                <Link href="/preview/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Portal Karir
                </Link>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-full px-2.5 py-1">
                            {j.source === 'user' ? 'HubTalent Original' : (j.platform || 'Lowongan')}
                        </span>
                        {j.category && (
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{j.category}</span>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{j.job_title}</h1>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {j.company}
                        </span>
                        {j.salary && (
                            <span className="flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5" />
                                {j.salary}
                            </span>
                        )}
                        {j.created_at && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(j.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        )}
                    </div>

                    {posterName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Dipasang oleh <span className="font-semibold text-slate-700 dark:text-slate-300">{posterName}</span>
                        </p>
                    )}

                    {j.description && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mt-6">
                            {j.description}
                        </p>
                    )}

                    {j.job_desk && j.job_desk.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                Tugas & Tanggung Jawab
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                {j.job_desk.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    )}

                    {j.requirements && j.requirements.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                Persyaratan
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                {j.requirements.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {j.job_url
                                ? 'Lamar melalui platform eksternal, atau daftar untuk fitur AI HubTalent.'
                                : 'Daftar untuk melamar lowongan ini melalui HubTalent.'}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                            {j.job_url && (
                                <a
                                    href={j.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none text-center rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-1.5"
                                >
                                    Lamar di Platform
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            )}
                            <Link
                                href="/register?from=preview-job-detail"
                                className="flex-1 sm:flex-none text-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
                            >
                                Daftar & Lamar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
