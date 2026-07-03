// components/projects/ProjectDetailClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Sparkles, 
  User, 
  Calendar, 
  ArrowLeft, 
  Cpu, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Briefcase,
  Share2,
  Bookmark
} from 'lucide-react';
import { JarvisScanHUD } from '@/components/ui/JarvisScanHUD';
import { TypewriterReveal } from '@/components/ui/TypewriterReveal';
import { playClickSound, playScanSound, playSuccessSound } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  created_at: string;
  title: string;
  description: string;
  required_skills: string[] | null;
  status: string;
  owner_id: number;
  owner: Array<{ id: number; nama_lengkap: string }>;
}

interface Application {
  id: number | string;
  status: string;
  role: string;
}

interface ProjectDetailClientProps {
  project: Project;
  userId: number;
  isOwner: boolean;
  initialApplication: Application | null;
}

export function ProjectDetailClient({ project, userId, isOwner, initialApplication }: ProjectDetailClientProps) {
  const [application, setApplication] = useState<Application | null>(initialApplication);
  const [isApplying, setIsApplying] = useState(false);
  
  // States for AI Search/Rec
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await fetch('/api/projects/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengajukan kolaborasi.');
      }

      setApplication({ id: 'temp', status: 'pending', role: 'collaborator' });
      toast.success('Pengajuan kolaborasi Anda berhasil dikirim!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim pengajuan.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleOwnerAISearch = async () => {
    playClickSound();
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);

    const scanSound = playScanSound(8.0);

    const prompt = `Pencarian talenta untuk proyek: ${project.title}. 
Kebutuhan Keahlian: ${project.required_skills?.join(', ') || 'Semua keahlian'}. 
Deskripsi Proyek: ${project.description}`;

    try {
      const res = await fetch('/api/ai/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencari talenta.');
      }

      setAiReport(data.rekomendasi_proyek);
      playSuccessSound();
      toast.success("Rekomendasi AI berhasil didapatkan!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Koneksi ke AI Engine terputus.';
      setAiError(msg);
      toast.error("AI Scout Error", { description: msg });
    } finally {
      setAiLoading(false);
      if (scanSound) scanSound.stop();
    }
  };

  const handleUserAIMatch = async () => {
    playClickSound();
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);

    const scanSound = playScanSound(8.0);

    try {
      // Step 1: Fetch user's own profile details
      const profileRes = await fetch('/api/get-profile');
      if (!profileRes.ok) {
        throw new Error('Gagal memuat profil Anda untuk analisis.');
      }
      const myProfile = await profileRes.json();

      if (!myProfile || !myProfile.nama_lengkap) {
        throw new Error('Profil Anda belum lengkap. Silakan lengkapi profil onboarding Anda.');
      }

      // Step 2: Compare user profile with project details
      const myProfileText = `Nama: ${myProfile.nama_lengkap}.
Keahlian: ${myProfile.skill_gabungan || 'N/A'}.
Aktivitas: ${myProfile.aktivitas || 'N/A'}.
Detail Profil: ${myProfile.gabungan_data || 'N/A'}`;

      const matchPrompt = `Bandingkan profil saya berikut ini dengan kebutuhan proyek "${project.title}" yang membutuhkan keahlian: ${project.required_skills?.join(', ') || 'N/A'} dan memiliki deskripsi: ${project.description}.
PROFIL SAYA:
${myProfileText}

Berikan analisis dalam format rapi:
1. **Skor Kecocokan**: Berikan penilaian dalam bentuk persentase (contoh: 85%).
2. **Kekuatan Anda**: Jelaskan keahlian atau pengalaman dari profil saya yang paling cocok untuk proyek ini.
3. **Hal yang Perlu Ditingkatkan/Ditambahkan**: Sarankan keahlian atau pengetahuan apa yang perlu saya pelajari atau siapkan agar bisa berkontribusi maksimal pada proyek ini.
4. **Kesimpulan**: Rekomendasi akhir apakah saya cocok untuk mengajukan diri ke proyek ini.`;

      const res = await fetch('/api/ai/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: matchPrompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan analisis kecocokan.');
      }

      setAiReport(data.rekomendasi_proyek);
      playSuccessSound();
      toast.success("Analisis Kecocokan AI berhasil!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Koneksi ke AI Engine terputus.';
      setAiError(msg);
      toast.error("AI Match Error", { description: msg });
    } finally {
      setAiLoading(false);
      if (scanSound) scanSound.stop();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'accepted':
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Menunggu Persetujuan';
      case 'accepted': return 'Diterima';
      case 'active': return 'Kolaborator Aktif';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 stagger-children">
      {/* Back link */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 font-medium">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Hub Proyek
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Project Information */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      Oleh: <strong className="text-slate-800 dark:text-slate-300 font-semibold">{project.owner?.[0]?.nama_lengkap || 'Anonim'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Dibuat: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs px-3 py-1 font-semibold rounded-full capitalize">
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              {/* Project Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm border-l-2 border-indigo-500 pl-2">
                  Deskripsi Proyek
                </h4>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap pl-2.5">
                  {project.description}
                </p>
              </div>

              {/* Required Skills */}
              {project.required_skills && project.required_skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm border-l-2 border-indigo-500 pl-2">
                    Skill yang Dibutuhkan
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pl-2.5">
                    {project.required_skills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900/50 dark:text-slate-300 text-xs py-1 px-3 rounded-full border border-slate-200 dark:border-white/5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-slate-200 dark:border-white/5 py-4 bg-slate-50 dark:bg-slate-950/20 flex flex-wrap items-center justify-between gap-4">
              {/* Application CTA */}
              {isOwner ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">Anda adalah pemilik proyek ini.</p>
              ) : application ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-550 dark:text-slate-400">Status Pengajuan Anda:</span>
                  <Badge className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(application.status)}`}>
                    {getStatusText(application.status)}
                  </Badge>
                </div>
              ) : (
                <Button 
                  onClick={handleApply} 
                  disabled={isApplying}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-2 rounded-full shadow-lg transition-all"
                >
                  {isApplying ? 'Mengajukan Lamaran...' : 'Ajukan Diri sebagai Kolaborator'}
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5">
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN: AI Widget Side panel */}
        <div className="lg:col-span-4 space-y-6">
          {isOwner ? (
            <Card className="premium-light-card liquid-glass-border border-indigo-500/20 text-slate-800 dark:text-slate-200 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
              <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Scout Talenta AI</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Pencocokan kandidat otomatis</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                  Temukan kandidat alumni terbaik dari database yang memiliki keahlian dan minat yang cocok untuk menyukseskan proyek ini.
                </p>
                <Button 
                  onClick={handleOwnerAISearch}
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-2 rounded-full shadow-lg transition-all gap-1.5"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  Cari Talenta via AI
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-light-card liquid-glass-border border-indigo-500/20 text-slate-800 dark:text-slate-200 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
              <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
                <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Analisis Kecocokan AI</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Pencocokan profil cerdas</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                  Gunakan AI Engine untuk menganalisis kecocokan profil, keahlian, dan aktivitas Anda dengan kebutuhan spesifik proyek ini.
                </p>
                <Button 
                  onClick={handleUserAIMatch}
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-2 rounded-full shadow-lg transition-all gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Apakah Saya Cocok?
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Result Card */}
          {aiLoading && (
            <JarvisScanHUD />
          )}

          {aiError && (
            <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">AI Scout Terputus</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400/90 leading-normal">{aiError}</p>
              </div>
            </div>
          )}

          {aiReport && !aiLoading && (
            <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200 shadow-md dark:shadow-xl max-h-[500px] overflow-y-auto">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-white/5 flex flex-row items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-xs font-bold text-slate-900 dark:text-white">Analisis AI Scout</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs">
                <TypewriterReveal text={aiReport} speed={30} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
