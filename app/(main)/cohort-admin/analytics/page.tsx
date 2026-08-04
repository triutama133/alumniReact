"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ActivityDistribution {
    pekerja: number;
    bisnis: number;
    irt: number;
    campuran: number;
}

interface AnalyticsData {
    totalAlumni: number;
    activityDistribution: ActivityDistribution;
    angkatanDistribution: Array<{ year: number; count: number }>;
    kotaDistribution: Array<{ name: string; count: number }>;
    topSkills: Array<{ name: string; count: number }>;
    topMajors: Array<{ name: string; count: number }>;
    insight: string;
}

export default function CohortAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/analytics');
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.error || 'Gagal memuat analitik.');
                }
                setAnalytics(await res.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Gagal memuat analitik.');
            } finally {
                setIsLoading(false);
            }
        };
        loadAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Memuat analitik cohort...</p>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gagal Memuat Data</h1>
                <p className="text-sm text-rose-500 mt-2">{error || 'Tidak ada data.'}</p>
                <Link href="/cohort-admin" className="mt-4 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                    Kembali ke Kelola Komunitas
                </Link>
            </div>
        );
    }

    const activityData: Array<{ label: string; value: number; color: string }> = [
        { label: 'Pekerja', value: analytics.activityDistribution.pekerja, color: 'bg-indigo-500' },
        { label: 'Bisnis', value: analytics.activityDistribution.bisnis, color: 'bg-emerald-500' },
        { label: 'IRT', value: analytics.activityDistribution.irt, color: 'bg-violet-500' },
        { label: 'Campuran', value: analytics.activityDistribution.campuran, color: 'bg-amber-500' },
    ];
    const maxActivity = Math.max(...activityData.map(a => a.value), 1);

    const maxCity = Math.max(...analytics.kotaDistribution.map(c => c.count), 1);
    const maxSkill = Math.max(...analytics.topSkills.map(s => s.count), 1);

    return (
        <div className="max-w-6xl mx-auto px-4 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">📊 Analitik Cohort</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Distribusi anggota, domisili, keahlian, dan tren proyek.
                    </p>
                </div>
                <Link
                    href="/cohort-admin"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    &larr; Kembali ke Kelola Komunitas
                </Link>
            </div>

            {/* Kartu Statistik Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Talenta</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{analytics.totalAlumni}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kota Terbanyak</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate">
                        {analytics.kotaDistribution[0]?.name ?? '-'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{analytics.kotaDistribution[0]?.count ?? 0} anggota</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Keahlian</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate">
                        {analytics.topSkills[0]?.name ?? '-'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{analytics.topSkills[0]?.count ?? 0} anggota</p>
                </div>
            </div>

            {/* Insight */}
            {analytics.insight && (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 p-5">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {analytics.insight}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribusi Aktivitas */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Distribusi Aktivitas Anggota</h3>
                    <div className="space-y-3">
                        {activityData.map((a) => (
                            <div key={a.label}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{a.label}</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{a.value}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${a.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${(a.value / maxActivity) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribusi Domisili */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Distribusi Domisili</h3>
                    {analytics.kotaDistribution.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Belum ada data domisili.</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.kotaDistribution.map((city) => (
                                <div key={city.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{city.name}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{city.count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${(city.count / maxCity) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Skills */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Top Keahlian</h3>
                    {analytics.topSkills.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Belum ada data keahlian.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {analytics.topSkills.map((skill) => (
                                <div
                                    key={skill.name}
                                    className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full pl-2 pr-3 py-1"
                                >
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{skill.name}</span>
                                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full px-1.5 py-0.5">
                                        {skill.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Angkatan Distribution */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Distribusi Angkatan</h3>
                    {analytics.angkatanDistribution.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Belum ada data angkatan.</p>
                    ) : (
                        <div className="flex items-end gap-3 h-40">
                            {analytics.angkatanDistribution.map((item) => {
                                const maxYear = Math.max(...analytics.angkatanDistribution.map(a => a.count), 1);
                                const height = Math.round((item.count / maxYear) * 100);
                                return (
                                    <div key={item.year} className="flex-1 flex flex-col items-center justify-end gap-1">
                                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{item.count}</span>
                                        <div
                                            className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                                            style={{ height: `${height}px` }}
                                        />
                                        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-500">{item.year}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}