"use client";

import Link from 'next/link';
import { Globe, Instagram, Twitter } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black font-sans text-white">

      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
        style={{ opacity: 0.15, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        className="pointer-events-none"
        muted
        playsInline
        autoPlay
        loop
      />

      <div 
        style={{ 
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.93) 0%, rgba(0, 0, 0, 0.78) 50%, rgba(0, 0, 0, 0.95) 100%)',
          position: 'absolute',
          inset: 0,
          zIndex: 5
        }} 
        aria-hidden="true" 
      />

      {/* Top Navbar */}
      <nav className="relative z-20 w-full px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold text-white sm:text-base">HubTalent</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/projects" className="text-sm font-medium text-white/80 no-underline hover:text-white">Kolaborasi Projek</Link>
            <Link href="/jobs" className="text-sm font-medium text-white/80 no-underline hover:text-white">AI Career Prep</Link>
            <Link href="/jobs" className="text-sm font-medium text-white/80 no-underline hover:text-white">Lowongan Kerja</Link>
            <Link href="/search" className="text-sm font-medium text-white/80 no-underline hover:text-white">Cari Talenta</Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/register" className="text-xs font-medium text-white/90 no-underline hover:text-white sm:text-sm">Sign Up</Link>
            <Link href="/login" className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white no-underline hover:bg-white/20 sm:px-5 sm:text-sm">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Body */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="mb-5 max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Where Ideas Meet Talent & Opportunity.
        </h1>
        <div className="w-full max-w-2xl space-y-6">
          <p className="mx-auto max-w-2xl px-4 text-sm leading-relaxed text-white/85 md:text-lg">
            Ubah ide jadi proyek nyata dan raih karir impianmu. <strong>HubTalent</strong> menghubungkanmu dengan partner kolaborasi, mempersiapkan wawancara kerja bersama AI, dan membuka akses ke ribuan lowongan terpilih—semua di satu tempat.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-3 text-sm font-semibold no-underline hover:bg-white/90 transition-colors shadow-lg hover:shadow-white/10"
            >
              Mulai Kolaborasi — Gratis
            </Link>
            <Link 
              href="/jobs" 
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white px-8 py-3 text-sm font-semibold no-underline hover:bg-white/15 transition-colors"
            >
              Eksplorasi Lowongan
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex justify-center gap-4 pb-12">
        <button aria-label="Instagram" className="rounded-full border border-white/20 bg-black/25 p-3 text-white/85 backdrop-blur-sm hover:bg-white/10 hover:text-white"><Instagram className="h-5 w-5" /></button>
        <button aria-label="Twitter" className="rounded-full border border-white/20 bg-black/25 p-3 text-white/85 backdrop-blur-sm hover:bg-white/10 hover:text-white"><Twitter className="h-5 w-5" /></button>
        <button aria-label="Globe" className="rounded-full border border-white/20 bg-black/25 p-3 text-white/85 backdrop-blur-sm hover:bg-white/10 hover:text-white"><Globe className="h-5 w-5" /></button>
      </footer>
    </div>
  );
}
