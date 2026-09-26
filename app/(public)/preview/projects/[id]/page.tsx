// app/(public)/preview/projects/[id]/page.tsx
// Server Component: Public project detail page — no login required. Gives each
// public project a real, shareable, indexable URL instead of only being visible
// buried inside the authenticated app or the teaser grid on /preview/projects.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminClient } from '@/lib/adminClient';
import { PreviewNavbar } from '@/components/preview/PreviewNavbar';
import { Briefcase, User, Calendar, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProjectDetailRow {
    id: string;
    title: string;
    description: string;
    required_skills: string[] | null;
    status: string;
    created_at: string;
    owner: { id: number; nama_lengkap: string } | null;
}

export default async function PublicProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = getAdminClient();

    // Only genuinely public, non-community-scoped projects are servable here — the
    // same visibility rule the /preview/projects list already uses. A private or
    // community-scoped project's id simply 404s rather than leaking that it exists.
    const { data: project, error } = await supabase
        .from('projects')
        .select('id, title, description, required_skills, status, created_at, owner:alumni_db ( id, nama_lengkap )')
        .eq('id', id)
        .eq('is_public', true)
        .is('cohort_id', null)
        .maybeSingle();

    if (error || !project) {
        notFound();
    }

    const p = project as unknown as ProjectDetailRow;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PreviewNavbar />

            <div className="mx-auto max-w-3xl px-6 py-10">
                <Link href="/preview/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Hub Proyek
                </Link>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-full px-2.5 py-1 capitalize">
                            {p.status}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{p.title}</h1>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            Oleh {p.owner?.nama_lengkap || 'Anonim'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mt-6">
                        {p.description}
                    </p>

                    {p.required_skills && p.required_skills.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5" />
                                Skill yang Dibutuhkan
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {p.required_skills.map((skill) => (
                                    <span key={skill} className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Tertarik berkolaborasi di proyek ini? Daftar untuk melamar.
                        </p>
                        <Link
                            href="/register?from=preview-project-detail"
                            className="w-full sm:w-auto text-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 transition-colors flex-shrink-0"
                        >
                            Daftar & Lamar Proyek
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
