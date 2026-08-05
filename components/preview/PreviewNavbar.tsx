// components/preview/PreviewNavbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

export function PreviewNavbar() {
    return (
        <nav className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
                <Link href="/landing">
                    <Image src="/logo.png" alt="HubTalent" width={120} height={34} className="h-7 w-auto" />
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        Masuk
                    </Link>
                    <Link href="/register" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 transition-colors">
                        Daftar Gratis
                    </Link>
                </div>
            </div>
        </nav>
    );
}