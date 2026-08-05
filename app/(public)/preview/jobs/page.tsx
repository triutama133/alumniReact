"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PreviewNavbar } from '@/components/preview/PreviewNavbar';

interface Job {
    id: number;
    job_title: string;
    company: string;
    platform: string;
    category: string | null;
    description: string | null;
    job_desk: string[] | null;
    requirements: string[] | null;
    job_url: string | null;
}

export default function PreviewJobsPage() {
    const [activeTab, setActiveTab] = useState<'jobs' | 'ai'>('jobs');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedJob, setExpandedJob] = useState<number | null>(null);

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const res = await fetch('/api/jobs');
                if (res.ok) {
                    const data: Job[] = await res.json();
                    // Hanya yang is_active = true
                    setJobs(data.filter(j => (j as any).is_active !== false));
                }
            } catch (err) {
                console.error('Error loading jobs:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadJobs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PreviewNavbar />

            {/* Banner */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portal Karir</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Login untuk mengakses Learning Path & CV Creator AI.
                        </p>
                    </div>
                    <Link
                        href="/register"
                        className="inline-flex items-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 transition-colors shadow-sm"
                    >
                        Daftar Gratis
                    </Link>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-6xl px-6 w-full">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'jobs'
                                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Lowongan
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ai'
                                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Fitur AI
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-6xl px-6 py-10">
                {activeTab === 'jobs' && (
                    <>
                        {isLoading ? (
                            <p className="text-center text-sm text-slate-400 py-12">Memuat lowongan...</p>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-20">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum ada lowongan tersedia</h3>
                                <p className="text-sm text-slate-500 mt-2">Lowongan akan muncul di sini saat sudah tersedia.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {jobs.slice(0, 8).map((job) => (
                                    <div
                                        key={job.id}
                                        className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                                                    {job.job_title}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{job.company}</p>
                                            </div>
                                            {job.platform && (
                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 flex-shrink-0 uppercase">
                                                    {job.platform}
                                                </span>
                                            )}
                                        </div>

                                        {job.category && (
                                            <span className="text-[10px] text-slate-500 mb-2">{job.category}</span>
                                        )}

                                        {/* Expand/Collapse Detail */}
                                        {expandedJob === job.id && (
                                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 mb-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                                                {job.description && (
                                                    <p className="leading-relaxed">{job.description}</p>
                                                )}
                                                {job.job_desk && job.job_desk.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Job Desk:</p>
                                                        <ul className="list-disc list-inside space-y-0.5">
                                                            {job.job_desk.slice(0, 6).map((d, i) => <li key={i}>{d}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {job.requirements && job.requirements.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Requirements:</p>
                                                        <ul className="list-disc list-inside space-y-0.5">
                                                            {job.requirements.slice(0, 6).map((r, i) => <li key={i}>{r}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                                                className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                {expandedJob === job.id ? 'Sembunyikan Detail' : 'Lihat Detail'}
                                            </button>

                                            {job.job_url && (
                                                <a
                                                    href={job.job_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-auto text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Lamar di Platform &rarr;
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card Learning Path AI (Locked) */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 relative overflow-hidden">
                            <div className="opacity-20 pointer-events-none select-none space-y-3">
                                <h3 className="font-bold text-sm">Roadmap Frontend Developer</h3>
                                <div className="space-y-2">
                                    <p className="text-xs">Fase 1: HTML, CSS & JavaScript Fundamentals</p>
                                    <p className="text-xs">Fase 2: React JS & State Management</p>
                                    <p className="text-xs">Fase 3: Next.js & Deployment</p>
                                    <p className="text-xs">Fase 4: Testing & Performance Optimization</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 z-10">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Learning Path AI</p>
                                <p className="text-xs text-slate-500 mt-1">Login untuk akses fitur ini</p>
                                <div className="flex gap-2 mt-4">
                                    <Link href="/register" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5">
                                        Daftar Gratis
                                    </Link>
                                    <Link href="/login" className="rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold px-4 py-1.5 text-slate-600 dark:text-slate-300">
                                        Masuk
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Card CV Creator AI (Locked) */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 relative overflow-hidden">
                            <div className="opacity-20 pointer-events-none select-none space-y-2">
                                <h3 className="font-bold text-sm">CV Bullet Point Suggestions</h3>
                                <ul className="space-y-1 text-xs">
                                    <li>• Memimpin tim 5 orang dalam pengembangan produk SaaS</li>
                                    <li>• Mengurangi bug produksi sebesar 30% melalui automated testing</li>
                                    <li>• Meningkatkan konversi landing page sebesar 45%</li>
                                    <li>• Mengelola budget marketing Rp 200jt+ per kuartal</li>
                                </ul>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 z-10">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">CV Creator AI</p>
                                <p className="text-xs text-slate-500 mt-1">Login untuk akses fitur ini</p>
                                <div className="flex gap-2 mt-4">
                                    <Link href="/register" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5">
                                        Daftar Gratis
                                    </Link>
                                    <Link href="/login" className="rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold px-4 py-1.5 text-slate-600 dark:text-slate-300">
                                        Masuk
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Siap tingkatkan karirmu?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daftar sekarang dan akses semua fitur AI HubTalent.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/register" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 transition-colors">
                            Daftar Gratis
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