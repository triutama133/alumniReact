'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Search, User, Terminal, BookOpen, AlertCircle, Cpu, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JarvisScanHUD } from '@/components/ui/JarvisScanHUD';
import { TypewriterReveal } from '@/components/ui/TypewriterReveal';
import { playClickSound, playScanSound, playSuccessSound } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabaseClient';
import { AlumniSearchResult } from '@/lib/types';
import { AlumniCard } from '@/components/search/AlumniCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'standard'>('ai');
  
  // States for Standard Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AlumniSearchResult[]>([]);
  const [standardLoading, setStandardLoading] = useState(false);
  const [hasSearchedStandard, setHasSearchedStandard] = useState(false);

  // States for AI Search
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const supabase = createClient();

  const promptStarters = [
    "Cari desainer UI/UX domisili Bogor yang ahli Figma dan prototyping",
    "Butuh developer mobile app Flutter/React Native di Bandung untuk kerja sama tim",
    "Cari ahli riset pasar dengan keahlian analisis data statistik",
    "Butuh alumni yang bisa bantu produksi konten video kreatif untuk bisnis fashion"
  ];

  // Handler for Standard Search
  const handleStandardSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (searchTerm.trim().length < 3) {
      toast.info("Kata kunci pencarian minimal 3 karakter.");
      return;
    }

    setStandardLoading(true);
    setHasSearchedStandard(true);
    setSearchResults([]);

    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const activeCohortId = getCookie('active_cohort_id');

    try {
      let memberIds: number[] = [];
      if (activeCohortId && activeCohortId !== 'global') {
        const { data: memberRows, error: memberErr } = await supabase
          .from('cohort_members')
          .select('user_id')
          .eq('cohort_id', Number(activeCohortId));
        if (!memberErr && memberRows) {
          memberIds = memberRows.map(r => Number(r.user_id));
        }
      }

      let dbQuery = supabase
        .from('alumni_db')
        .select('id, nama_lengkap, nama_panggilan, aktivitas, skill_gabungan, fakultas_jurusan');
      
      if (activeCohortId && activeCohortId !== 'global') {
        dbQuery = dbQuery.in('id', memberIds);
      }

      const { data, error } = await dbQuery.or(`nama_lengkap.ilike.%${searchTerm}%,skill_gabungan.ilike.%${searchTerm}%`);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Gagal melakukan pencarian standar", { description: message });
    } finally {
      setStandardLoading(false);
    }
  };

  // Handler for AI Semantic Search
  const handleAISearch = async (e: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const finalPrompt = promptOverride || aiPrompt;

    if (!finalPrompt.trim()) {
      toast.info("Tuliskan kebutuhan pencarian Anda terlebih dahulu.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    const scanSound = playScanSound(8.0);

    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const activeCohortId = getCookie('active_cohort_id');

    try {
      const res = await fetch('/api/ai/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: finalPrompt,
          cohortId: activeCohortId && activeCohortId !== 'global' ? Number(activeCohortId) : null
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencari talenta.');
      }

      setAiResult(data.rekomendasi_proyek);
      playSuccessSound();
      toast.success("Rekomendasi AI berhasil didapatkan!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Koneksi ke AI Engine terputus.';
      setAiError(msg);
      toast.error("AI Search Error", { description: msg });
    } finally {
      setAiLoading(false);
      if (scanSound) scanSound.stop();
    }
  };

  const handlePromptStarterClick = (starter: string) => {
    setAiPrompt(starter);
    handleAISearch(null as any, starter);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl stagger-children">
      {/* Header section with ambient glow */}
      <div className="text-center mb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cari Talenta Terbaik
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto text-sm">
          Hubungkan ide, proyek, dan kolaborasi Anda dengan talenta yang tepat menggunakan pencarian standar atau asisten pencocokan cerdas AI.
        </p>
      </div>

      {/* Glassmorphic Tabs Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-full border border-slate-200 dark:border-white/5 shadow-md relative">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              activeTab === 'ai' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pencarian Cerdas AI</span>
          </button>
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              activeTab === 'standard' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Pencarian Standar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="stagger-children min-h-[400px]">
        {activeTab === 'ai' ? (
          <div className="space-y-6">
            {/* AI Search Card */}
            <Card className="premium-light-card liquid-glass-border shadow-sm text-slate-800 dark:text-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary animate-pulse" />
                  <CardTitle className="text-slate-900 dark:text-white text-base">Asisten Pencocokan Semantik AI</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Masukkan deskripsi proyek, kebutuhan tim, atau kriteria peran Anda. AI akan menganalisis profil dan mencarikan hingga 10 talenta yang paling sesuai dengan justifikasinya.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => handleAISearch(e)} className="space-y-4">
                  <div className="relative">
                    <Textarea
                       value={aiPrompt}
                       onChange={(e) => setAiPrompt(e.target.value)}
                       placeholder="Jelaskan kebutuhan Anda secara detail (Contoh: Saya butuh talenta yang menguasai desain grafis, mahir menggunakan Canva/Photoshop, dan memiliki minat di bidang sosial kemasyarakatan)..."
                       className="min-h-[100px] bg-slate-50 border-slate-200 focus:border-primary text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-101 dark:placeholder:text-slate-500 rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={aiLoading} 
                      className="bg-primary hover:bg-primary/95 text-white font-medium text-xs rounded-full px-6 py-2 shadow-sm transition-all gap-2 border border-transparent"
                    >
                      {aiLoading ? (
                        <>
                          <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Mencari & Menganalisis...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Cari via AI
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Prompt Starters */}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" /> Rekomendasi Contoh Prompt:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {promptStarters.map((starter, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePromptStarterClick(starter)}
                        disabled={aiLoading}
                        className="text-left text-xs bg-slate-100/80 hover:bg-slate-150 hover:border-slate-300/85 text-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 dark:hover:border-slate-700/80 dark:text-slate-300 p-2.5 rounded-lg border border-slate-200 dark:border-white/5 transition-all truncate"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Results Output */}
            {aiLoading && (
              <JarvisScanHUD />
            )}

            {aiError && (
              <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl text-rose-700 dark:text-rose-300 max-w-3xl mx-auto">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold">Gagal Menghubungi AI Engine</p>
                  <p className="text-xs text-rose-650 dark:text-rose-400/90 leading-relaxed">{aiError}</p>
                </div>
              </div>
            )}

            {aiResult && !aiLoading && (
              <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200 shadow-xl">
                <CardHeader className="border-b border-slate-200 dark:border-white/5 flex flex-row items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <CardTitle className="text-slate-900 dark:text-white text-base">Hasil Rekomendasi Pencarian AI</CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Saran talenta & analisis kebutuhan berdasarkan prompt Anda</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <TypewriterReveal text={aiResult} speed={35} />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Standard Search Card */}
            <Card className="premium-light-card liquid-glass-border p-4 text-slate-850 dark:text-slate-200">
              <form onSubmit={handleStandardSearch} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="search"
                  placeholder="Masukkan nama lengkap atau skill (misal: Budi, Desain Grafis, React)..."
                  className="flex-grow bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/40 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500 rounded-lg text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  type="submit" 
                  disabled={standardLoading}
                  className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-semibold px-6 border border-transparent"
                >
                  {standardLoading ? 'Mencari...' : 'Cari Talenta'}
                </Button>
              </form>
            </Card>

            {/* Standard Results List */}
            <div className="stagger-children">
              {standardLoading && (
                <div className="text-center py-12 text-slate-400">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-xs">Mencari di database...</p>
                </div>
              )}

              {!standardLoading && hasSearchedStandard && searchResults.length === 0 && (
                <Card className="premium-light-card liquid-glass-border p-8 text-center text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  <AlertCircle className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">Tidak Ada Hasil</h4>
                  <p className="text-xs mt-1">Tidak ada talenta yang sesuai dengan kata kunci "{searchTerm}".</p>
                </Card>
              )}
              
              {!standardLoading && searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((alumni) => (
                    <div key={alumni.id} className="transform transition-transform hover:scale-[1.02] duration-300">
                      <AlumniCard alumni={alumni} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}