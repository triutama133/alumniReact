// app/(public)/preview/projects/page.tsx
// Server Component: Preview Hub Proyek (publik, tanpa login)
import Link from 'next/link';
import { getAdminClient } from '@/lib/adminClient';
import { PreviewNavbar } from '@/components/preview/PreviewNavbar';

export const dynamic = 'force-dynamic';

interface ProjectRow {
    id: string;
    title: string;
    description: string;
    required_skills: string[] | null;
    status: string;
    owner_id: number;
    owner: Array<{ id: number; nama_lengkap: string }> | null;
    created_at: string;
}

export default async function PreviewProjectsPage() {
    const supabase = getAdminClient();
    const { data: projects } = await supabase
        .from('projects')
        .select('id, title, description, required_skills, status, owner_id, owner:alumni_db(nama_lengkap), created_at')
        .eq('is_public', true)
        .is('cohort_id', null)
        .order('created_at', { ascending: false })
        .limit(12);

    const projectList = (projects || []) as unknown as ProjectRow[];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PreviewNavbar />

            {/* Banner */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hub Proyek</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Jelajahi proyek kolaborasi dari komunitas HubTalent.
                        </p>
                    </div>
                    <Link
                        href="/register"
                        className="inline-flex items-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 transition-colors shadow-sm"
                    >
                        Daftar Gratis untuk Melamar
                    </Link>
                </div>
            </div>

            {/* Grid Proyek */}
            <div className="mx-auto max-w-6xl px-6 py-10">
                {projectList.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum ada proyek publik</h3>
                        <p className="text-sm text-slate-500 mt-2">Jadilah yang pertama membuat proyek di HubTalent.</p>
                        <Link href="/register" className="mt-6 inline-flex items-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5">
                            Daftar & Mulai Proyek
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projectList.map((project) => (
                            <div
                                key={project.id}
                                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                                            {project.title}
                                        </h3>
                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 flex-shrink-0 capitalize">
                                            {project.status}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3">
                                        {project.description}
                                    </p>

                                    {project.required_skills && project.required_skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {project.required_skills.slice(0, 4).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {project.required_skills.length > 4 && (
                                                <span className="text-[10px] text-slate-400">+{project.required_skills.length - 4}</span>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                        Oleh: <span className="font-medium text-slate-600 dark:text-slate-300">
                                            {project.owner?.[0]?.nama_lengkap || 'Anonim'}
                                        </span>
                                    </p>
                                </div>

                                <Link
                                    href={`/register?from=preview-projects`}
                                    className="mt-4 w-full text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Lamar Proyek
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Punya ide proyek?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daftar dan mulai kolaborasi dengan talenta terbaik.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/register" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 transition-colors">
                            Buat Akun
                        </Link>
                        <Link href="/login" className="rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold px-6 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Masuk
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}