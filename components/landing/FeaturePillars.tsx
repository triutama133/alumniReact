// components/landing/FeaturePillars.tsx
'use client';

import Link from 'next/link';
import { Rocket, Bot, Briefcase, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const pillars = [
    {
        icon: Rocket,
        title: 'Matchmaking Projek & Talenta',
        tagline: 'Jangan Biarkan Ide Kerenmu Berhenti di Catatan.',
        desc: 'Cari co-founder, developer, atau designer yang punya visi sama. Mulai proyek dari nol atau gabung ke tim yang sedang bergerak.',
        points: [
            'Matchmaking Presisi — Temukan rekan tim berdasarkan keahlian dan minat proyek',
            'Pitching Ide — Publikasikan ide dan tarik talenta terbaik untuk bergabung',
            'Showcase Portfolio — Pamerkan proyek untuk menarik kolaborator baru',
        ],
        cta: 'Lihat Proyek Aktif',
        href: '/preview/projects',
    },
    {
        icon: Bot,
        title: 'AI Career Preparation',
        tagline: 'Asah Kesiapan Kerja Bersama Personal AI Career Coach.',
        desc: 'Jangan masuk ruang wawancara tanpa persiapan. Manfaatkan simulasi cerdas untuk menguji kesiapan teknis dan soft skill-mu.',
        points: [
            'Simulasi Interview Interaktif — Latihan menjawab pertanyaan HR & teknis',
            'CV & ATS Optimization — Evaluasi dan poles resume agar lolos ATS',
            'Career Roadmap — Panduan belajar dan analisis skill gap pribadi',
        ],
        cta: 'Lihat Fitur Karir',
        href: '/preview/jobs',
    },
    {
        icon: Briefcase,
        title: 'Smart Job Aggregator',
        tagline: 'Ribuan Peluang Karir Terkurasi dalam Satu Pintu.',
        desc: 'Kami mengkurasi lowongan dari berbagai platform ternama agar kamu tidak perlu membuka puluhan tab portal kerja.',
        points: [
            'Update Real-time — Informasi lowongan terpercaya yang selalu diperbarui',
            'Filter Spesifik — Filter cepat berdasarkan peran hingga opsi remote work',
        ],
        cta: 'Lihat Lowongan',
        href: '/preview/jobs',
        comingSoon: true,
    },
];

export function FeaturePillars() {
    return (
        <section className="relative z-10 px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white">3 Pilar Utama HubTalent</h2>
                    <p className="mt-3 text-white/70 max-w-2xl mx-auto text-sm sm:text-base">
                        Semua yang kamu butuhkan untuk berkembang — kolaborasi, persiapan karir, dan akses peluang — dalam satu platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillars.map((p) => (
                        <div
                            key={p.title}
                            className="relative rounded-2xl border border-white/15 bg-white/8 backdrop-blur-sm p-6 hover:bg-white/12 transition-all duration-300 hover:-translate-y-1"
                        >
                            {p.comingSoon && (
                                <Badge className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                                    Segera Hadir
                                </Badge>
                            )}
                            <div className="inline-flex p-3 rounded-xl bg-white/10 text-white mb-4">
                                <p.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                            <p className="text-xs font-semibold text-white/85 mb-2">{p.tagline}</p>
                            <p className="text-xs text-white/65 leading-relaxed mb-4">{p.desc}</p>
                            <ul className="space-y-2 mb-6">
                                {p.points.map((point) => (
                                    <li key={point} className="text-[11px] text-white/70 leading-relaxed">
                                        {point}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={p.href}
                                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 transition-colors"
                            >
                                {p.cta}
                                <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}