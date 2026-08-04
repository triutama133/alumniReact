"use client";

import Link from 'next/link';
import { Globe, Instagram, Twitter, Sparkles, PlusCircle, Briefcase, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black font-sans text-white overflow-x-hidden scroll-smooth">

      {/* Background Video for Hero */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
          className="w-full h-full object-cover opacity-60"
          muted
          playsInline
          autoPlay
          loop
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black" />
      </div>

      {/* 1. Top Navbar */}
      <nav className="relative z-20 w-full px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md sm:px-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90">
            <Globe className="h-5 w-5 text-indigo-500" />
            <span className="text-sm font-extrabold text-white tracking-wider sm:text-base">HubTalent</span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex text-xs font-semibold text-white/80">
            <Link href="/projects" className="no-underline hover:text-indigo-400 transition-colors">Kolaborasi Projek</Link>
            <Link href="/jobs" className="no-underline hover:text-indigo-400 transition-colors">AI Career Prep</Link>
            <Link href="/jobs" className="no-underline hover:text-indigo-400 transition-colors">Lowongan Kerja</Link>
            <Link href="/search" className="no-underline hover:text-indigo-400 transition-colors">Cari Talenta</Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/register" className="text-xs font-bold text-white/90 no-underline hover:text-indigo-400 transition-colors sm:text-sm">Sign Up</Link>
            <Link href="/login" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white no-underline hover:bg-white/20 sm:px-5 sm:text-sm transition-all shadow-sm">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/35 bg-indigo-500/10 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          Where Ideas Meet Talent & Opportunity
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
          Where Ideas Meet <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">Talent</span> & Opportunity.
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 md:text-lg mb-8">
          Ubah ide jadi proyek nyata dan raih karir impianmu. <strong className="text-white font-extrabold">HubTalent</strong> menghubungkanmu dengan partner kolaborasi, mempersiapkan wawancara kerja bersama AI, dan membuka akses ke ribuan lowongan terpilih—semua di satu tempat.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="rounded-full bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-sm px-8 py-6 shadow-xl shadow-indigo-500/20 transition-all border border-indigo-500/30">
            <Link href="/register">Mulai Kolaborasi — Gratis</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-bold text-sm px-8 py-6 transition-all">
            <Link href="/jobs">Eksplorasi Lowongan</Link>
          </Button>
        </div>
      </header>

      {/* 3. Section Fitur Utama (The 3 Pillars) */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-black via-[#0d0f12] to-black border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6 space-y-24">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Fitur Unggulan</h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">Satu Ekosistem, Tiga Pilar Kekuatan</h3>
            <div className="w-12 h-1 bg-indigo-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* Pilar 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilar 01 — Matchmaking & Team Building</span>
                <h4 className="text-2xl font-black text-white leading-tight">🚀 Jangan Biarkan Ide Kerenmu Berhenti di Catatan.</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cari <em>co-founder</em>, <em>developer</em>, atau <em>designer</em> yang punya visi sama. Mulai proyek dari nol atau gabung ke tim yang sedang bergerak.
              </p>
              <ul className="space-y-3 text-xs text-slate-350">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <strong>Matchmaking Presisi:</strong> Temukan rekan tim berdasarkan keahlian teknis dan minat proyek.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <strong>Pitching Ide:</strong> Publikasikan ide startup/projekmu dan tarik talenta terbaik untuk bergabung.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <strong>Showcase Portfolio:</strong> Pamerkan proyek yang sedang berjalan untuk menarik kolaborator baru.
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-slate-950/50 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
              <h5 className="font-extrabold text-sm text-white mb-4">Grup Kolaborasi Aktif</h5>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">E-Commerce Web App</p>
                    <p className="text-[10px] text-slate-500">Mencari: React Developer</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold rounded-full">Aktif</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">AI Health Diagnosis</p>
                    <p className="text-[10px] text-slate-500">Mencari: Python Specialist</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold rounded-full">Aktif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pilar 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="lg:order-2 space-y-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilar 02 — AI Prep & Coach</span>
                <h4 className="text-2xl font-black text-white leading-tight">🤖 Asah Kesiapan Kerja Bersama Personal AI Career Coach.</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Jangan masuk ruang wawancara tanpa persiapan. Manfaatkan simulasi cerdas berbasis AI untuk menguji kesiapan teknis dan <em>soft skill</em>-mu sebelum menghadapi <em>interviewer</em> sungguhan.
              </p>
              <ul className="space-y-3 text-xs text-slate-355">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-500" />
                  <strong>Simulasi Interview Interaktif:</strong> Latihan menjawab pertanyaan HR & teknis spesifik posisi target.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-500" />
                  <strong>CV & ATS Optimization:</strong> Evaluasi dan poles resume agar lolos pemindaian ATS perekrut.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-500" />
                  <strong>Career Roadmap (RAG):</strong> Dapatkan jalur belajar & analisis gap skill langsung dari data lowongan aktif.
                </li>
              </ul>
            </div>
            <div className="lg:order-1 p-8 rounded-2xl bg-slate-950/50 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-purple-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
              <h5 className="font-extrabold text-sm text-white mb-4">Simulasi AI Career Coach</h5>
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Saran Evaluasi AI:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  "CV Anda sudah memiliki struktur kokoh. Namun, untuk posisi <strong>Data Engineer</strong>, Anda disarankan menambahkan sertifikasi Cloud atau proyek pemrosesan pipeline data."
                </p>
              </div>
            </div>
          </div>

          {/* Pilar 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilar 03 — Smart Aggregator</span>
                <h4 className="text-2xl font-black text-white leading-tight">💼 Ribuan Peluang Karir Terkurasi dalam Satu Pintu.</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tidak perlu membuang waktu membuka puluhan tab portal kerja. Kami mengumpulkan dan mengkurasi lowongan dari berbagai platform ternama secara terpusat untuk memudahkan Anda mencari peluang terbaik.
              </p>
              <ul className="space-y-3 text-xs text-slate-350">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <strong>Update Real-time:</strong> Informasi lowongan kerja terpercaya yang selalu diperbarui otomatis.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <strong>Filter Spesifik:</strong> Filter cepat berdasarkan peran, tingkat gaji, hingga opsi remote work.
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-slate-950/50 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
              <h5 className="font-extrabold text-sm text-white mb-4">Lowongan Kerja Terkini</h5>
              <div className="space-y-2">
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-white">Senior Backend Engineer</p>
                    <span className="text-[10px] text-emerald-400 font-bold">Remote</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">PT. Teknologi Cerdas • Jakarta</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Section Alur Kerja (How It Works) */}
      <section className="relative z-10 py-24 bg-black border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Cara Kerja</h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">💡 3 Langkah Mudah Memulai di HubTalent</h3>
            <div className="w-12 h-1 bg-indigo-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#090b0d] border border-white/5 relative overflow-hidden space-y-3">
              <span className="absolute -right-4 -top-6 text-7xl font-black text-white/5 select-none">01</span>
              <h4 className="font-black text-base text-white flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-400 font-bold">1</span>
                Connect & Pitch
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buat profil lengkap, pamerkan keahlian teknismu, atau publikasikan ide proyek startup yang ingin kamu bangun.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#090b0d] border border-white/5 relative overflow-hidden space-y-3">
              <span className="absolute -right-4 -top-6 text-7xl font-black text-white/5 select-none">02</span>
              <h4 className="font-black text-base text-white flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/15 border border-purple-500/30 text-xs text-purple-400 font-bold">2</span>
                Prepare with AI
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulasi wawancara interaktif dan optimalkan struktur CV/Resume kamu bersama asisten karir AI pribadi.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#090b0d] border border-white/5 relative overflow-hidden space-y-3">
              <span className="absolute -right-4 -top-6 text-7xl font-black text-white/5 select-none">03</span>
              <h4 className="font-black text-base text-white flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-bold">3</span>
                Launch & Get Hired
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eksekusi ide proyek kolaboratif bersama tim barumu atau melamar langsung ke lowongan kerja impian di platform.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Bottom Call-To-Action (Footer Banner) */}
      <section className="relative z-10 py-24 bg-gradient-to-t from-indigo-950/20 to-black border-t border-slate-900 text-center px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-3xl font-black text-white sm:text-4xl leading-tight">Siap Eksekusi Ide dan Lompati Karirmu?</h3>
          <p className="text-sm text-slate-350 leading-relaxed max-w-xl mx-auto">
            Gabung dengan komunitas talenta, kreator, dan profesional muda yang saling mendukung di <strong className="text-indigo-400">HubTalent</strong>.
          </p>
          <div className="pt-4">
            <Button asChild size="lg" className="rounded-full bg-white hover:bg-slate-100 text-slate-950 font-black text-sm px-8 py-6 shadow-xl transition-all flex items-center gap-1.5 mx-auto w-full sm:w-auto">
              <Link href="/register">
                Buat Akun Sekarang — 100% Gratis
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Social Icons */}
      <footer className="relative z-10 flex flex-col items-center gap-4 pb-12 pt-6 border-t border-slate-950 text-slate-500 text-xs">
        <div className="flex gap-4">
          <button aria-label="Instagram" className="rounded-full border border-white/5 bg-slate-950/40 p-3 text-slate-400 hover:bg-white/10 hover:text-white transition-all"><Instagram className="h-5 w-5" /></button>
          <button aria-label="Twitter" className="rounded-full border border-white/5 bg-slate-950/40 p-3 text-slate-400 hover:bg-white/10 hover:text-white transition-all"><Twitter className="h-5 w-5" /></button>
          <button aria-label="Globe" className="rounded-full border border-white/5 bg-slate-950/40 p-3 text-slate-400 hover:bg-white/10 hover:text-white transition-all"><Globe className="h-5 w-5" /></button>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} HubTalent.id. All rights reserved.</p>
      </footer>

    </div>
  );
}
