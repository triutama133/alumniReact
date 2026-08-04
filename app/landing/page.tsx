"use client";

import Link from 'next/link';
import { Globe, Sparkles, Code, Brain, Briefcase, ChevronRight, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div 
      style={{ backgroundColor: '#07080a', color: '#f1f5f9' }}
      className="relative min-h-screen font-sans overflow-x-hidden scroll-smooth selection:bg-blue-600/30 selection:text-white"
    >

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
          {/* Explicit inline gradient overlay to guarantee darkness & contrast */}
          <div 
            style={{ 
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(7, 8, 10, 0.6) 50%, #07080a 100%)',
              position: 'absolute',
              inset: 0
            }} 
          />
        </div>

        {/* Top Navbar */}
        <nav className="relative z-20 w-full px-6 py-6 max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div 
              style={{ backgroundColor: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <Globe className="h-4.5 w-4.5 text-white" />
            </div>
            <span style={{ color: '#ffffff' }} className="text-base font-extrabold tracking-tight">HubTalent</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold" style={{ color: '#94a3b8' }}>
            <Link href="/projects" className="no-underline hover:text-white transition-colors">Kolaborasi Projek</Link>
            <Link href="/jobs" className="no-underline hover:text-white transition-colors">AI Career Prep</Link>
            <Link href="/jobs" className="no-underline hover:text-white transition-colors">Lowongan Kerja</Link>
            <Link href="/search" className="no-underline hover:text-white transition-colors">Cari Talenta</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" style={{ color: '#cbd5e1' }} className="text-xs font-semibold no-underline hover:text-white transition-colors">
              Login
            </Link>
            <Link 
              href="/register" 
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="rounded-full px-5 py-2 text-xs font-bold no-underline hover:opacity-90 transition-all shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Hero Body */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto py-16">
          <div 
            style={{ borderColor: 'rgba(59, 130, 246, 0.2)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Where Ideas Meet Talent & Opportunity
          </div>

          <h1 style={{ color: '#ffffff' }} className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-[1.1]">
            Where Ideas Meet <br className="hidden sm:inline"/>
            <span style={{ color: '#60a5fa' }}>Talent</span> & Opportunity.
          </h1>

          <p style={{ color: '#cbd5e1' }} className="max-w-xl text-sm md:text-base leading-relaxed mb-10">
            Ubah ide jadi proyek nyata dan raih karir impianmu. <strong style={{ color: '#ffffff' }} className="font-semibold">HubTalent</strong> menghubungkanmu dengan partner kolaborasi, mempersiapkan wawancara kerja bersama AI, dan membuka akses ke ribuan lowongan terpilih—semua di satu tempat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
            <Link 
              href="/register" 
              style={{ backgroundColor: '#2563eb', color: '#ffffff', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
              className="w-full sm:w-auto text-center rounded-full font-bold text-sm px-8 py-3.5 transition-all"
            >
              Mulai Kolaborasi — Gratis
            </Link>
            <Link 
              href="/jobs" 
              style={{ border: '1px solid #334155', backgroundColor: 'rgba(15, 23, 42, 0.45)', color: '#ffffff' }}
              className="w-full sm:w-auto text-center rounded-full font-semibold text-sm px-8 py-3.5 transition-all backdrop-blur-sm hover:bg-slate-900/80"
            >
              Eksplorasi Lowongan
            </Link>
          </div>
        </div>

        {/* Dummy bottom padding to center hero layout */}
        <div className="h-16" />
      </div>


      {/* --- SECTION: THE 3 PILLARS (Clean grid layout, no video background) --- */}
      <section style={{ backgroundColor: '#07080a', borderTop: '1px solid #1e293b' }} className="relative z-20 py-24">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 style={{ color: '#3b82f6' }} className="text-xs font-bold uppercase tracking-widest">Fitur Utama</h2>
            <h3 style={{ color: '#ffffff' }} className="text-3xl font-extrabold sm:text-4xl">Satu Ekosistem, Tiga Pilar</h3>
            <p style={{ color: '#94a3b8' }} className="text-xs sm:text-sm mt-2">Segala hal yang Anda butuhkan untuk mempercepat perkembangan portofolio dan kesiapan karir.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pilar 1 */}
            <div 
              style={{ backgroundColor: '#0b0d10', borderColor: '#1e293b' }} 
              className="p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:border-blue-500/35"
            >
              <div className="space-y-6">
                <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.2)' }} className="h-12 w-12 rounded-xl border flex items-center justify-center text-blue-400">
                  <Code className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-2.5">
                  <span style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase tracking-wider">Pilar 01</span>
                  <h4 style={{ color: '#ffffff' }} className="text-lg font-bold">Jangan Biarkan Ide Kerenmu Berhenti di Catatan.</h4>
                  <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
                    Cari co-founder, developer, atau designer yang punya visi sama. Mulai proyek dari nol atau gabung ke tim yang sedang bergerak.
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1e293b' }} className="mt-8 pt-6 space-y-2.5 text-[11px]" role="list">
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Matchmaking Presisi:</strong> Berdasarkan skill & minat.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Pitching Ide:</strong> Tarik talenta terbaik bergabung.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Showcase Portfolio:</strong> Pamerkan progress proyek.</span>
                </div>
              </div>
            </div>

            {/* Pilar 2 */}
            <div 
              style={{ backgroundColor: '#0b0d10', borderColor: '#1e293b' }} 
              className="p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:border-blue-500/35"
            >
              <div className="space-y-6">
                <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.2)' }} className="h-12 w-12 rounded-xl border flex items-center justify-center text-blue-400">
                  <Brain className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-2.5">
                  <span style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase tracking-wider">Pilar 02</span>
                  <h4 style={{ color: '#ffffff' }} className="text-lg font-bold">Asah Kesiapan Kerja Bersama Personal AI Career Coach.</h4>
                  <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
                    Jangan masuk ruang wawancara tanpa persiapan. Uji kesiapan teknis dan soft skill-mu bersama kecerdasan buatan sebelum menghadapi interviewer sungguhan.
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1e293b' }} className="mt-8 pt-6 space-y-2.5 text-[11px]" role="list">
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Simulasi Interview:</strong> Latihan HR & teknis interaktif.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>CV & ATS Optimization:</strong> Evaluasi resume instan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Career Roadmap:</strong> Analisis skill gap berbasis lowongan.</span>
                </div>
              </div>
            </div>

            {/* Pilar 3 */}
            <div 
              style={{ backgroundColor: '#0b0d10', borderColor: '#1e293b' }} 
              className="p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:border-blue-500/35"
            >
              <div className="space-y-6">
                <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.2)' }} className="h-12 w-12 rounded-xl border flex items-center justify-center text-blue-400">
                  <Briefcase className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-2.5">
                  <span style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase tracking-wider">Pilar 03</span>
                  <h4 style={{ color: '#ffffff' }} className="text-lg font-bold">Ribuan Peluang Karir Terkurasi dalam Satu Pintu.</h4>
                  <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
                    Tidak perlu membuang waktu membuka puluhan tab portal kerja. Kami mengumpulkan dan mengkurasi lowongan kerja dari berbagai platform ternama secara terpusat.
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1e293b' }} className="mt-8 pt-6 space-y-2.5 text-[11px]" role="list">
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Update Real-time:</strong> Data terpercaya & selalu terbarui.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="h-4 w-4 rounded-full flex items-center justify-center mt-0.5"><Check className="h-3 w-3 text-emerald-400" /></div>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#ffffff' }}>Filter Spesifik:</strong> Saring cepat berdasarkan peran & tipe kerja.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION: HOW IT WORKS --- */}
      <section style={{ backgroundColor: '#07080a', borderTop: '1px solid #1e293b' }} className="relative z-20 py-24">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 style={{ color: '#3b82f6' }} className="text-xs font-bold uppercase tracking-widest">Cara Kerja</h2>
            <h3 style={{ color: '#ffffff' }} className="text-3xl font-extrabold sm:text-4xl">3 Langkah Mudah Memulai di HubTalent</h3>
            <div className="w-12 h-1 bg-blue-650 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            
            {/* Step 1 */}
            <div style={{ backgroundColor: '#0b0d10', borderColor: '#1e293b' }} className="p-8 rounded-2xl border relative overflow-hidden space-y-3">
              <span style={{ color: 'rgba(59, 130, 246, 0.05)' }} className="absolute right-4 top-2 text-6xl font-black select-none">01</span>
              <h4 style={{ color: '#ffffff' }} className="font-extrabold text-sm">1. Connect & Pitch</h4>
              <p style={{ color: '#cbd5e1' }} className="text-xs leading-relaxed">
                Buat profil, pamerkan keahlianmu, atau publikasikan ide proyek yang ingin kamu bangun untuk menarik kolaborator.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ backgroundColor: '#0b0d10', borderColor: '#1e293b' }} className="p-8 rounded-2xl border relative overflow-hidden space-y-3">
              <span style={{ color: 'rgba(59, 130, 246, 0.05)' }} className="absolute right-4 top-2 text-6xl font-black select-none">02</span>
              <h4 style={{ color: '#ffffff' }} className="font-extrabold text-sm">2. Prepare with AI</h4>
              <p style={{ color: '#cbd5e1' }} className="text-xs leading-relaxed">
                Simulasi wawancara dan optimalkan CV kamu dengan asisten AI pribadi yang dicocokkan dengan data loker aktif.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ backgroundColor: '#0b0d10', borderColor: '#1e293b' }} className="p-8 rounded-2xl border relative overflow-hidden space-y-3">
              <span style={{ color: 'rgba(59, 130, 246, 0.05)' }} className="absolute right-4 top-2 text-6xl font-black select-none">03</span>
              <h4 style={{ color: '#ffffff' }} className="font-extrabold text-sm">3. Launch & Get Hired</h4>
              <p style={{ color: '#cbd5e1' }} className="text-xs leading-relaxed">
                Eksekusi proyek bersama tim barumu atau melamar langsung ke lowongan impian Anda secara efisien.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION: BOTTOM CTA (Footer Banner) --- */}
      <section style={{ background: 'linear-gradient(to bottom, #07080a, #0b0d10)', borderTop: '1px solid #1e293b' }} className="relative z-20 py-24 text-center px-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h3 style={{ color: '#ffffff' }} className="text-3xl font-extrabold sm:text-4xl leading-tight">Siap Eksekusi Ide dan Lompati Karirmu?</h3>
          <p style={{ color: '#94a3b8' }} className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Gabung dengan komunitas talenta, kreator, dan profesional muda yang saling mendukung di <span style={{ color: '#60a5fa' }} className="font-semibold">HubTalent</span>.
          </p>
          <div className="pt-4 flex justify-center">
            <Link 
              href="/register" 
              style={{ backgroundColor: '#2563eb', color: '#ffffff', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
              className="inline-flex items-center gap-1.5 rounded-full font-extrabold text-xs sm:text-sm px-8 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Buat Akun Sekarang — 100% Gratis
              <ChevronRight className="h-4 w-4 stroke-[3px]" />
            </Link>
          </div>
        </div>
      </section>


      {/* --- FOOTER --- */}
      <footer style={{ backgroundColor: '#07080a', borderTop: '1px solid #1e293b' }} className="relative z-20 flex flex-col items-center gap-4 pb-12 pt-6 text-[10px] md:text-xs">
        <div className="flex gap-4">
          <button aria-label="Instagram" style={{ borderColor: '#334155', backgroundColor: '#0b0d10' }} className="rounded-full border p-2.5 text-slate-400 hover:text-white transition-all"><Instagram className="h-4 w-4" /></button>
          <button aria-label="Twitter" style={{ borderColor: '#334155', backgroundColor: '#0b0d10' }} className="rounded-full border p-2.5 text-slate-400 hover:text-white transition-all"><Twitter className="h-4 w-4" /></button>
          <button aria-label="Globe" style={{ borderColor: '#334155', backgroundColor: '#0b0d10' }} className="rounded-full border p-2.5 text-slate-400 hover:text-white transition-all"><Globe className="h-4 w-4" /></button>
        </div>
        <p style={{ color: '#475569' }} className="mt-2">&copy; {new Date().getFullYear()} HubTalent.id. All rights reserved.</p>
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

// Custom simple Twitter path
function Twitter({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  );
}
