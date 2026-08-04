"use client";

import Link from 'next/link';
import { Globe, Sparkles, Code, Brain, Briefcase, ChevronRight, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden scroll-smooth selection:bg-blue-600/30 selection:text-white">

      {/* --- HERO AREA (Header + Hero Content) --- */}
      <div className="relative w-full min-h-screen flex flex-col justify-between z-10">
        
        {/* Background Video with Rich Dark Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
            className="w-full h-full object-cover opacity-35 scale-105"
            muted
            playsInline
            autoPlay
            loop
          />
          {/* Standard Tailwind gradients to avoid arbitrary syntax compile failures */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-slate-950" />
        </div>

        {/* Top Navbar */}
        <nav className="relative z-20 w-full px-6 py-6 max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20">
              <Globe className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">HubTalent</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <Link href="/projects" className="no-underline hover:text-white transition-colors">Kolaborasi Projek</Link>
            <Link href="/jobs" className="no-underline hover:text-white transition-colors">AI Career Prep</Link>
            <Link href="/jobs" className="no-underline hover:text-white transition-colors">Lowongan Kerja</Link>
            <Link href="/search" className="no-underline hover:text-white transition-colors">Cari Talenta</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold text-slate-350 no-underline hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white no-underline hover:bg-blue-500 transition-all shadow-sm">
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Hero Body */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto py-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-950/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-8 animate-fadeIn">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Where Ideas Meet Talent & Opportunity
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.1] animate-fadeIn">
            Where Ideas Meet <br className="hidden sm:inline"/>
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Talent</span> & Opportunity.
          </h1>

          <p className="max-w-xl text-slate-350 text-sm md:text-base leading-relaxed mb-10 animate-fadeIn delay-100">
            Ubah ide jadi proyek nyata dan raih karir impianmu. <strong className="text-white font-semibold">HubTalent</strong> menghubungkanmu dengan partner kolaborasi, mempersiapkan wawancara kerja bersama AI, dan membuka akses ke ribuan lowongan terpilih—semua di satu tempat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center animate-fadeIn delay-200">
            <Link href="/register" className="w-full sm:w-auto text-center rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-8 py-3.5 transition-all shadow-lg shadow-blue-600/20">
              Mulai Kolaborasi — Gratis
            </Link>
            <Link href="/jobs" className="w-full sm:w-auto text-center rounded-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 text-white font-semibold text-sm px-8 py-3.5 transition-all backdrop-blur-sm">
              Eksplorasi Lowongan
            </Link>
          </div>
        </div>

        {/* Dummy bottom padding to center hero layout */}
        <div className="h-16" />
      </div>


      {/* --- SECTION: THE 3 PILLARS (Clean grid layout, no video background) --- */}
      <section className="relative z-20 py-24 bg-slate-950 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Fitur Utama</h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">Satu Ekosistem, Tiga Pilar</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">Segala hal yang Anda butuhkan untuk mempercepat perkembangan portofolio dan kesiapan karir.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pilar 1 */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800/85 hover:border-blue-500/25 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Code className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilar 01</span>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Jangan Biarkan Ide Kerenmu Berhenti di Catatan.</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cari co-founder, developer, atau designer yang punya visi sama. Mulai proyek dari nol atau gabung ke tim yang sedang bergerak.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-2.5 text-[11px] text-slate-350">
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Matchmaking Presisi:</strong> Berdasarkan skill & minat.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Pitching Ide:</strong> Tarik talenta terbaik bergabung.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Showcase Portfolio:</strong> Pamerkan progress proyek.</span>
                </div>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800/85 hover:border-blue-500/25 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Brain className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilar 02</span>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Asah Kesiapan Kerja Bersama Personal AI Career Coach.</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jangan masuk ruang wawancara tanpa persiapan. Uji kesiapan teknis dan soft skill-mu bersama kecerdasan buatan sebelum menghadapi interviewer sungguhan.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-2.5 text-[11px] text-slate-350">
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Simulasi Interview:</strong> Latihan HR & teknis interaktif.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>CV & ATS Optimization:</strong> Evaluasi resume instan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Career Roadmap:</strong> Analisis skill gap berbasis lowongan.</span>
                </div>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800/85 hover:border-blue-500/25 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilar 03</span>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Ribuan Peluang Karir Terkurasi dalam Satu Pintu.</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tidak perlu membuang waktu membuka puluhan tab portal kerja. Kami mengumpulkan dan mengkurasi lowongan kerja dari berbagai platform ternama secara terpusat.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-2.5 text-[11px] text-slate-350">
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Update Real-time:</strong> Data terpercaya & selalu terbarui.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-950/40 flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span><strong>Filter Spesifik:</strong> Saring cepat berdasarkan peran & tipe kerja.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION: HOW IT WORKS --- */}
      <section className="relative z-20 py-24 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Cara Kerja</h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">3 Langkah Mudah Memulai di HubTalent</h3>
            <div className="w-12 h-1 bg-blue-600 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden space-y-3">
              <span className="absolute right-4 top-2 text-6xl font-black text-slate-800/10 select-none">01</span>
              <h4 className="font-extrabold text-sm text-white">1. Connect & Pitch</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buat profil, pamerkan keahlianmu, atau publikasikan ide proyek yang ingin kamu bangun untuk menarik kolaborator.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden space-y-3">
              <span className="absolute right-4 top-2 text-6xl font-black text-slate-800/10 select-none">02</span>
              <h4 className="font-extrabold text-sm text-white">2. Prepare with AI</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulasi wawancara dan optimalkan CV kamu dengan asisten AI pribadi yang dicocokkan dengan data loker aktif.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden space-y-3">
              <span className="absolute right-4 top-2 text-6xl font-black text-slate-800/10 select-none">03</span>
              <h4 className="font-extrabold text-sm text-white">3. Launch & Get Hired</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eksekusi proyek bersama tim barumu atau melamar langsung ke lowongan impian Anda secara efisien.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION: BOTTOM CTA (Footer Banner) --- */}
      <section className="relative z-20 py-24 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-900 text-center px-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h3 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">Siap Eksekusi Ide dan Lompati Karirmu?</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Gabung dengan komunitas talenta, kreator, dan profesional muda yang saling mendukung di <span className="text-blue-500 font-semibold">HubTalent</span>.
          </p>
          <div className="pt-4 flex justify-center">
            <Link 
              href="/register" 
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Buat Akun Sekarang — 100% Gratis
              <ChevronRight className="h-4 w-4 stroke-[3px]" />
            </Link>
          </div>
        </div>
      </section>


      {/* --- FOOTER --- */}
      <footer className="relative z-20 flex flex-col items-center gap-4 pb-12 pt-6 border-t border-slate-900 bg-slate-950 text-slate-500 text-[10px] md:text-xs">
        <div className="flex gap-4">
          <button aria-label="Instagram" className="rounded-full border border-slate-800 bg-[#07080a] p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Instagram className="h-4 w-4" /></button>
          <button aria-label="Twitter" className="rounded-full border border-slate-800 bg-[#07080a] p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Twitter className="h-4 w-4" /></button>
          <button aria-label="Globe" className="rounded-full border border-slate-800 bg-[#07080a] p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"><Globe className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-slate-650">&copy; {new Date().getFullYear()} HubTalent.id. All rights reserved.</p>
      </footer>

    </div>
  );
}

// Dummy social icons placeholders
function Instagram({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/>
    </svg>
  );
}

function Twitter({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  );
}
