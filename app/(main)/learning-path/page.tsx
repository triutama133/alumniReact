// app/(main)/learning-path/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Award, 
  BookOpen, 
  CheckSquare, 
  Cpu, 
  MapPin, 
  HelpCircle, 
  Play, 
  RefreshCw, 
  TrendingUp, 
  Layers, 
  CheckCircle,
  Square,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { playClickSound, playSuccessSound } from '@/lib/audio';

const POPULAR_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'Data Scientist',
  'UI/UX Designer',
  'Product Manager',
  'Mobile Developer',
  'DevOps Engineer',
  'QA Engineer',
];

interface GapItem {
  skill: string;
  description: string;
}

interface PathStep {
  step: number;
  topic: string;
  courses_certs: string[];
  action_plan: string;
}

interface AnalysisResult {
  gap_analysis: GapItem[];
  learning_path: PathStep[];
  checklist: string[];
}

export default function LearningPathPage() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Loading messages rotation
  useEffect(() => {
    if (!loading) return;
    const messages = [
      'Menghubungkan ke pangkalan data lowongan LinkedIn & Kalibrr...',
      'Membaca profil keahlian Anda dari database...',
      'Melakukan analisis semantik perbandingan skill gap...',
      'Merancang kurikulum jalur belajar optimal...',
      'Menyusun checklist persiapan kerja spesifik Anda...'
    ];
    let idx = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingMessage(messages[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch saved checklist from database
  const fetchSavedChecklist = async (role: string) => {
    try {
      const res = await fetch(`/api/learning-path/checklist?targetRole=${encodeURIComponent(role)}`);
      if (res.ok) {
        const data = await res.json();
        const loaded: Record<string, boolean> = {};
        (data.completedTasks || []).forEach((t: string) => {
          loaded[t] = true;
        });
        setCheckedTasks(loaded);
      }
    } catch (err) {
      console.error('Error fetching checklist from db:', err);
    }
  };

  // Read checklist status from database when result or role changes
  useEffect(() => {
    if (!result) return;
    const target = selectedRole === 'custom' ? customRole : selectedRole;
    fetchSavedChecklist(target);
  }, [result, selectedRole, customRole]);

  const handleToggleTask = async (task: string) => {
    playClickSound();
    const nextVal = !checkedTasks[task];
    const newChecked = { ...checkedTasks, [task]: nextVal };
    setCheckedTasks(newChecked);

    const target = selectedRole === 'custom' ? customRole : selectedRole;
    const completedArray = Object.keys(newChecked).filter(k => newChecked[k]);

    // Save to localStorage as fallback backup
    const storageKey = `lp_checklist_${target}`;
    localStorage.setItem(storageKey, JSON.stringify(newChecked));

    // Save to cloud database
    try {
      await fetch('/api/learning-path/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: target,
          completedTasks: completedArray,
        }),
      });
    } catch (err) {
      console.error('Error saving checklist to database:', err);
    }

    // Check if 100% completed to play success sound
    const total = result?.checklist.length || 0;
    const completed = result?.checklist.filter(t => newChecked[t]).length || 0;
    if (total > 0 && completed === total) {
      playSuccessSound();
      toast.success('Luar biasa! Persiapan kerja Anda telah lengkap 100%!');
    }
  };

  const startAnalysis = async () => {
    const finalRole = selectedRole === 'custom' ? customRole : selectedRole;
    if (!finalRole || !finalRole.trim()) {
      toast.info('Tentukan target peran karir terlebih dahulu.');
      return;
    }

    playClickSound();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: finalRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses data.');
      }

      setResult(data);
      playSuccessSound();
      toast.success('Analisis Gap & Jalur Belajar Berhasil Dibuat!');
    } catch (err: any) {
      toast.error('Gagal memproses analisis', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Calculate completeness percentage
  const totalChecklistCount = result?.checklist.length || 0;
  const completedChecklistCount = result?.checklist.filter(t => checkedTasks[t]).length || 0;
  const percentCompleted = totalChecklistCount > 0 
    ? Math.round((completedChecklistCount / totalChecklistCount) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8 stagger-children">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-6">
        <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Analisis Gap & Jalur Belajar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bandingkan skill Anda dengan kebutuhan pasar kerja real-time dari LinkedIn & Kalibrr</p>
        </div>
      </div>

      {/* Role Selection Form */}
      {!loading && !result && (
        <Card className="premium-light-card liquid-glass-border max-w-xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Pilih Target Karir Anda</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Pilih peran target Anda untuk memicu komparasi semantik AI terhadap data ribuan loker aktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Target Pekerjaan / Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-lg text-sm">
                  <SelectValue placeholder="Pilih target peran..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                  {POPULAR_ROLES.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-xs text-indigo-500 font-semibold">Tulis Peran Kustom...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'custom' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-semibold text-slate-500">Target Peran Kustom</label>
                <Input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Contoh: Blockchain Engineer / AI Engineer"
                  className="h-10 bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:border-indigo-500"
                />
              </div>
            )}

            <Button
              onClick={startAnalysis}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg mt-2 flex gap-2 items-center justify-center shadow-lg"
            >
              <Cpu className="h-4 w-4" />
              Mulai Analisis Semantik
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State: Elegant rotating network sphere */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-fadeIn">
          {/* Elegant rotating SVG network sphere */}
          <div className="relative h-44 w-44">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
            
            {/* SVG sphere model */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_25s_linear_infinite] opacity-80 text-indigo-500 dark:text-indigo-400">
              {/* Outer orbit circle */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" className="opacity-30" />
              {/* Middle orbit circle */}
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 5" className="opacity-40 animate-[spin_12s_linear_infinite_reverse]" />
              {/* Inner circle */}
              <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-20" />

              {/* Connecting lines */}
              <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.3" className="opacity-30" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="0.3" className="opacity-30" />
              <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="0.3" className="opacity-20" />
              <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="0.3" className="opacity-20" />
              
              {/* Glowing Nodes (concentric vertices) */}
              <circle cx="20" cy="20" r="2.5" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="20" cy="20" r="1.5" fill="currentColor" />
              
              <circle cx="80" cy="80" r="2.5" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="80" cy="80" r="1.5" fill="currentColor" />
              
              <circle cx="80" cy="20" r="2.5" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="80" cy="20" r="1.5" fill="currentColor" />

              <circle cx="20" cy="80" r="2.5" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="20" cy="80" r="1.5" fill="currentColor" />
              
              <circle cx="50" cy="8" r="2.5" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="50" cy="8" r="1.5" fill="currentColor" />

              <circle cx="50" cy="92" r="2.5" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="50" cy="92" r="1.5" fill="currentColor" />

              {/* Center glow core */}
              <circle cx="50" cy="50" r="5" fill="currentColor" className="animate-pulse" />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Menyusun Analisis Karir Anda</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Analysis Result Dashboard */}
      {result && !loading && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Result Overview Header Card */}
          <Card className="premium-light-card liquid-glass-border overflow-hidden">
            <div className="h-2 bg-indigo-600" />
            <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <Badge className="bg-indigo-600 text-white uppercase text-[9px] font-bold rounded-md px-2 py-0.5">HASIL ANALISIS AI</Badge>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                  Jalur Karir: {selectedRole === 'custom' ? customRole : selectedRole}
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan semantik disinkronkan dengan lowongan kerja aktif dari pangkalan data industri.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { playClickSound(); setResult(null); }}
                className="h-9 text-xs border-slate-200 dark:border-white/10 rounded-full flex gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Analisis Ulang / Peran Lain</span>
              </Button>
            </CardContent>
          </Card>

          {/* Grid Layout: Gap Analysis (Left) & Readiness Checklist (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left side: Gap Analysis & Timeline */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card 1: Skill Gap */}
              <Card className="premium-light-card liquid-glass-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                    Kalkulasi Selisih Skill (Gap Analysis)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-550">
                    Keahlian penting yang wajib Anda pelajari karena sangat diminati pasar kerja saat ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.gap_analysis.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5 rounded-xl hover:border-indigo-500/20 transition-all duration-300 group"
                    >
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                        {item.skill}
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Card 2: Learning Path Timeline */}
              <Card className="premium-light-card liquid-glass-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                    Rekomendasi Jalur Belajar (Learning Path)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-550">
                    Kurikulum mandiri berurutan untuk menjembatani selisih keahlian Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative pl-6 border-l border-slate-200 dark:border-white/5 space-y-6 ml-3 py-2">
                  {result.learning_path.map((step, idx) => (
                    <div key={idx} className="relative space-y-2">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-950 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                        {step.step}
                      </span>
                      
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{step.topic}</div>
                      
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {step.courses_certs.map((c, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-[9px] uppercase tracking-wider font-semibold border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 flex items-center gap-1"
                          >
                            <Award className="h-2.5 w-2.5" />
                            {c}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed pl-1.5 border-l-2 border-slate-100 dark:border-white/5 py-0.5">
                        {step.action_plan}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>

            {/* Right side: Readiness Checklist */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Job Readiness Percentage Ring */}
              <Card className="premium-light-card liquid-glass-border">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm font-bold uppercase text-slate-400 tracking-wider">Persentase Kesiapan Kerja</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  {/* Progress ring/circle visualization */}
                  <div className="relative h-32 w-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-900" />
                      {/* Foreground circle */}
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="50" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 * (1 - percentCompleted / 100)}
                        className="text-indigo-600 dark:text-indigo-500 transition-all duration-700 ease-out" 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{percentCompleted}%</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ready</span>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-slate-500 mt-4 leading-relaxed max-w-[240px]">
                    Selesaikan daftar tugas di bawah ini untuk meningkatkan persentase kesiapan lamaran kerja Anda.
                  </div>
                </CardContent>
              </Card>

              {/* Checklist Tasks */}
              <Card className="premium-light-card liquid-glass-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
                    Checklist Persiapan Kerja
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-550">
                    Aksi konkret lamaran/portfolio berdasarkan analisis kebutuhan loker aktual.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.checklist.map((task, idx) => {
                    const isChecked = !!checkedTasks[task];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleTask(task)}
                        className={`w-full text-left p-3 flex items-start gap-3 border rounded-xl transition-all duration-300 ${
                          isChecked 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-500 dark:text-slate-400' 
                            : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/30 dark:hover:bg-slate-950/55 border-slate-250 dark:border-white/5 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5 animate-bounce" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs leading-relaxed ${isChecked ? 'line-through opacity-85' : 'font-medium'}`}>{task}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
