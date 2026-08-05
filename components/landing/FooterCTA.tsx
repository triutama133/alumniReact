// components/landing/FooterCTA.tsx
'use client';

import Link from 'next/link';

export function FooterCTA() {
    return (
        <section className="relative z-10 px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-4xl">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-sm p-10 sm:p-14 text-center">

                    <div className="relative">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white">
                            Siap Eksekusi Ide dan Lompati Karirmu?
                        </h2>
                        <p className="mt-4 text-white/85 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                            Gabung dengan komunitas talenta, kreator, dan profesional muda yang
                            saling mendukung di <strong>HubTalent</strong>.
                        </p>
                        <Link
                            href="/register"
                            className="mt-8 inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-8 py-3.5 text-sm font-bold no-underline hover:bg-white/90 transition-colors shadow-xl"
                        >
                            Buat Akun Sekarang — 100% Gratis
                        </Link>
                        <p className="mt-4 text-[11px] text-white/60">
                            Tanpa kartu kredit • Setup dalam 2 menit
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}