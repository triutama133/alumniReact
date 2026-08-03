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
  Bookmark,
  Lock,
  Globe,
  Edit,
  CheckSquare,
  Plus,
  Trash2,
  FileText,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { JarvisScanHUD } from '@/components/ui/JarvisScanHUD';
import { TypewriterReveal } from '@/components/ui/TypewriterReveal';
import { playClickSound, playScanSound, playSuccessSound } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Milestone {
  title: string;
  done: boolean;
}

interface ProjectUpdate {
  id: number;
  created_at: string;
  title: string;
  content: string;
  author_id: number;
  author: { id: number; nama_lengkap: string } | null;
}

interface Project {
  id: string;
  created_at: string;
  title: string;
  description: string;
  required_skills: string[] | null;
  status: string;
  owner_id: number;
  owner: Array<{ id: number; nama_lengkap: string }>;
  plan: string;
  milestones: Milestone[];
  is_public: boolean;
  updates: ProjectUpdate[];
}

interface Application {
  id: number | string;
  status: string;
  role: string;
}

interface ProjectDetailClientProps {
  project: Project;
  userId: number | null; // Nullable to support guest public view
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

  // States for Project Details tabs
  const [activeTab, setActiveTab] = useState<'details' | 'plan' | 'milestones' | 'updates'>('details');

  // Owner dashboard state updates
  const [isPublic, setIsPublic] = useState(project.is_public);
  const [planText, setPlanText] = useState(project.plan || '');
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Milestones local state
  const [milestones, setMilestones] = useState<Milestone[]>(project.milestones || []);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [savingMilestones, setSavingMilestones] = useState(false);

  // Daily updates local state
  const [updates, setUpdates] = useState<ProjectUpdate[]>(project.updates || []);
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // Handle Project Application
  const handleApply = async () => {
    if (!userId) {
      toast.info('Silakan masuk ke akun Anda terlebih dahulu untuk mengajukan kolaborasi.');
      return;
    }
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

  // Toggle Project Visibility (is_public)
  const toggleVisibility = async () => {
    playClickSound();
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    try {
      const res = await fetch('/api/projects/update-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, isPublic: nextPublic }),
      });
      if (!res.ok) {
        throw new Error('Gagal memperbarui visibilitas.');
      }
      toast.success(`Visibilitas proyek diubah menjadi ${nextPublic ? 'Publik' : 'Privat'}`);
    } catch (err: any) {
      setIsPublic(!nextPublic);
      toast.error('Gagal memperbarui visibilitas', { description: err.message });
    }
  };

  // Save Plan Details
  const savePlan = async () => {
    playClickSound();
    setSavingPlan(true);
    try {
      const res = await fetch('/api/projects/update-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, plan: planText }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan rencana kerja.');
      setIsEditingPlan(false);
      toast.success('Rencana kerja berhasil disimpan!');
    } catch (err: any) {
      toast.error('Gagal menyimpan', { description: err.message });
    } finally {
      setSavingPlan(false);
    }
  };

  // Save Milestones
  const saveMilestonesList = async (updatedMilestones: Milestone[]) => {
    setSavingMilestones(true);
    try {
      const res = await fetch('/api/projects/update-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, milestones: updatedMilestones }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan milestones.');
    } catch (err: any) {
      toast.error('Gagal memperbarui milestone', { description: err.message });
    } finally {
      setSavingMilestones(false);
    }
  };

  // Toggle Milestone Done
  const toggleMilestone = async (index: number) => {
    playClickSound();
    if (!isOwner) return;
    const updated = [...milestones];
    updated[index].done = !updated[index].done;
    setMilestones(updated);
    await saveMilestonesList(updated);
  };

  // Add Milestone
  const addMilestone = async () => {
    playClickSound();
    if (!newMilestoneTitle.trim()) return;
    const updated = [...milestones, { title: newMilestoneTitle.trim(), done: false }];
    setMilestones(updated);
    setNewMilestoneTitle('');
    await saveMilestonesList(updated);
    toast.success('Milestone berhasil ditambahkan!');
  };

  // Remove Milestone
  const removeMilestone = async (index: number) => {
    playClickSound();
    const updated = [...milestones];
    updated.splice(index, 1);
    setMilestones(updated);
    await saveMilestonesList(updated);
    toast.success('Milestone berhasil dihapus!');
  };

  // Post Daily Update log
  const postDailyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!newUpdateTitle.trim() || !newUpdateContent.trim()) {
      toast.info('Mohon isi judul dan konten perkembangan harian.');
      return;
    }

    setPostingUpdate(true);
    try {
      const res = await fetch('/api/projects/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: newUpdateTitle.trim(),
          content: newUpdateContent.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengirim update harian.');
      }

      const data = await res.json();
      setUpdates([data, ...updates]);
      setNewUpdateTitle('');
      setNewUpdateContent('');
      setShowUpdateForm(false);
      playSuccessSound();
      toast.success('Log harian berhasil diposting!');
    } catch (err: any) {
      toast.error('Gagal memposting log', { description: err.message });
    } finally {
      setPostingUpdate(false);
    }
  };

  // AI Scout / Search
  const handleOwnerAISearch = async () => {
    playClickSound();
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);

    const scanSound = playScanSound(8.0);
    const prompt = `Pencarian talenta untuk proyek: ${project.title}. Kebutuhan Keahlian: ${project.required_skills?.join(', ') || 'Semua keahlian'}. Deskripsi Proyek: ${project.description}`;

    try {
      const res = await fetch('/api/ai/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencari talenta.');

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
      const profileRes = await fetch('/api/get-profile');
      if (!profileRes.ok) throw new Error('Gagal memuat profil Anda untuk analisis.');
      const myProfile = await profileRes.json();

      if (!myProfile || !myProfile.nama_lengkap) {
        throw new Error('Profil Anda belum lengkap. Silakan lengkapi profil onboarding Anda.');
      }

      const myProfileText = `Nama: ${myProfile.nama_lengkap}. Keahlian: ${myProfile.skill_gabungan || 'N/A'}. Aktivitas: ${myProfile.aktivitas || 'N/A'}. Detail Profil: ${myProfile.gabungan_data || 'N/A'}`;
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
      if (!res.ok) throw new Error(data.error || 'Gagal melakukan analisis kecocokan.');

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
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'accepted':
      case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
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
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-6 font-bold">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Hub Proyek
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Project Information */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {project.title}
                    </CardTitle>
                    {isPublic ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 text-[9px] uppercase tracking-wider font-bold rounded-md flex items-center gap-1">
                        <Globe className="h-2.5 w-2.5" /> Publik
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[9px] uppercase tracking-wider font-bold rounded-md flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Privat
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      Oleh: <strong className="text-slate-800 dark:text-slate-350 font-semibold">{project.owner?.[0]?.nama_lengkap || 'Anonim'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Dibuat: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs px-3 py-1 font-semibold rounded-md capitalize">
                  {project.status}
                </Badge>
              </div>
            </CardHeader>

            {/* TAB SELECTORS */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
              <button 
                onClick={() => { playClickSound(); setActiveTab('details'); }}
                className={`py-3 text-xs font-bold border-b-2 px-3 transition-all ${
                  activeTab === 'details' 
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Deskripsi & Kebutuhan
              </button>
              <button 
                onClick={() => { playClickSound(); setActiveTab('plan'); }}
                className={`py-3 text-xs font-bold border-b-2 px-3 transition-all ${
                  activeTab === 'plan' 
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Rencana Kerja (Roadmap)
              </button>
              <button 
                onClick={() => { playClickSound(); setActiveTab('milestones'); }}
                className={`py-3 text-xs font-bold border-b-2 px-3 transition-all ${
                  activeTab === 'milestones' 
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Milestones ({milestones.filter(m => m.done).length}/{milestones.length})
              </button>
              <button 
                onClick={() => { playClickSound(); setActiveTab('updates'); }}
                className={`py-3 text-xs font-bold border-b-2 px-3 transition-all ${
                  activeTab === 'updates' 
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Log Harian ({updates.length})
              </button>
            </div>

            <CardContent className="space-y-6 pt-6 pb-6 min-h-[250px]">
              
              {/* TAB 1: DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm border-l-2 border-primary pl-2">
                      Deskripsi Proyek
                    </h4>
                    <p className="text-slate-700 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-wrap pl-2.5">
                      {project.description}
                    </p>
                  </div>

                  {project.required_skills && project.required_skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm border-l-2 border-primary pl-2">
                        Skill yang Dibutuhkan
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pl-2.5">
                        {project.required_skills.map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="secondary"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900/50 dark:text-slate-350 text-[10px] py-1 px-3 rounded-md border border-slate-250 dark:border-white/5"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ROADMAP PLAN */}
              {activeTab === 'plan' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Rencana Kerja Proyek
                    </h4>
                    {isOwner && !isEditingPlan && (
                      <Button onClick={() => setIsEditingPlan(true)} variant="outline" size="sm" className="h-8 text-[10px] font-bold border-slate-200 dark:border-slate-800">
                        <Edit className="h-3 w-3 mr-1" /> Edit Rencana
                      </Button>
                    )}
                  </div>

                  {isEditingPlan ? (
                    <div className="space-y-3">
                      <Textarea 
                        value={planText} 
                        onChange={(e) => setPlanText(e.target.value)}
                        placeholder="Tuliskan detail rencana pelaksanaan proyek, deadline utama, dan cara eksekusi proyek..."
                        className="min-h-[160px] bg-slate-50 dark:bg-slate-900 text-xs border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button onClick={savePlan} disabled={savingPlan} className="bg-primary hover:bg-primary/95 text-white text-xs font-bold h-8 px-4 rounded-md">
                          {savingPlan ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button onClick={() => { setIsEditingPlan(false); setPlanText(project.plan || ''); }} variant="ghost" className="text-xs h-8">
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-wrap pl-1">
                      {planText || 'Rencana kerja proyek belum ditentukan oleh pemilik proyek.'}
                    </p>
                  )}
                </div>
              )}

              {/* TAB 3: MILESTONES */}
              {activeTab === 'milestones' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-primary" /> Milestones Proyek
                    </h4>
                  </div>

                  {/* Add Milestone input (Owner only) */}
                  {isOwner && (
                    <div className="flex gap-2 max-w-md">
                      <Input 
                        value={newMilestoneTitle} 
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        placeholder="Judul milestone baru..." 
                        onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
                        className="h-9 bg-slate-50 dark:bg-slate-900 text-xs border-slate-200 dark:border-slate-800"
                      />
                      <Button onClick={addMilestone} className="bg-primary hover:bg-primary/95 text-white text-xs font-bold h-9 px-4 rounded-md">
                        Tambah
                      </Button>
                    </div>
                  )}

                  {/* Milestones List */}
                  <div className="space-y-2 pt-2">
                    {milestones.map((m, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 border rounded-md flex justify-between items-center transition-all ${
                          m.done 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-500 dark:text-slate-400' 
                            : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/30 dark:hover:bg-slate-950/55 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={m.done}
                            onChange={() => toggleMilestone(idx)}
                            disabled={!isOwner}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-default"
                          />
                          <span className={`text-xs font-bold ${m.done ? 'line-through opacity-80' : ''}`}>
                            {m.title}
                          </span>
                        </div>
                        {isOwner && (
                          <Button onClick={() => removeMilestone(idx)} variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {milestones.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">Belum ada milestone proyek yang ditentukan.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: DAILY UPDATES LOG */}
              {activeTab === 'updates' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Log & Perkembangan Harian
                    </h4>
                    {isOwner && !showUpdateForm && (
                      <Button onClick={() => setShowUpdateForm(true)} className="bg-primary hover:bg-primary/95 text-white text-xs font-bold h-8 px-4 rounded-md">
                        Tulis Log Baru
                      </Button>
                    )}
                  </div>

                  {/* Add Update log form (Owner only) */}
                  {showUpdateForm && (
                    <form onSubmit={postDailyUpdate} className="p-4 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50/50 dark:bg-slate-950/30 space-y-3 max-w-xl">
                      <h5 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider">Tulis Log Harian</h5>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Perkembangan</label>
                        <Input 
                          value={newUpdateTitle} 
                          onChange={(e) => setNewUpdateTitle(e.target.value)}
                          placeholder="Contoh: Integrasi database & API" 
                          className="h-9 bg-white dark:bg-slate-900 text-xs border-slate-200 dark:border-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Konten Perkembangan</label>
                        <Textarea 
                          value={newUpdateContent} 
                          onChange={(e) => setNewUpdateContent(e.target.value)}
                          placeholder="Tuliskan apa saja perkembangan, tantangan, atau langkah berikutnya..." 
                          className="bg-white dark:bg-slate-900 text-xs border-slate-200 dark:border-slate-800 min-h-[90px]"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="submit" disabled={postingUpdate} className="bg-primary hover:bg-primary/95 text-white text-xs font-bold h-8 px-4 rounded-md">
                          {postingUpdate ? 'Memposting...' : 'Posting Log'}
                        </Button>
                        <Button onClick={() => setShowUpdateForm(false)} variant="ghost" type="button" className="text-xs h-8">
                          Batal
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Updates list timeline */}
                  <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 ml-3 py-2">
                    {updates.map((update) => (
                      <div key={update.id} className="relative space-y-1.5">
                        <span className="absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-2 border-primary bg-white dark:bg-[#1b1f23] flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{update.title}</h5>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(update.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed whitespace-pre-line pl-1.5 border-l border-slate-100 dark:border-slate-900/50 py-0.5">
                          {update.content}
                        </p>
                      </div>
                    ))}
                    {updates.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4 pr-6">Belum ada catatan log harian.</p>
                    )}
                  </div>
                </div>
              )}

            </CardContent>
            
            {/* FOOTER ACTION */}
            <CardFooter className="border-t border-slate-200 dark:border-white/5 py-4 bg-slate-50 dark:bg-slate-950/20 flex flex-wrap items-center justify-between gap-4">
              {userId === null ? (
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs text-slate-500 italic">Anda melihat halaman ini sebagai tamu publik.</p>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                    <Link href="/login">Masuk untuk Berkolaborasi</Link>
                  </Button>
                </div>
              ) : isOwner ? (
                <p className="text-xs text-slate-550 dark:text-slate-400 italic font-semibold">Anda adalah pemilik proyek ini.</p>
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
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-2 rounded-md shadow-sm transition-all"
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

        {/* RIGHT COLUMN: Controls Panel & AI scout */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Owner Dashboard Control (Visibilitas) */}
          {isOwner && (
            <Card className="bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Pengaturan Proyek</CardTitle>
                <CardDescription className="text-[10px] text-slate-500">Kontrol pemilik proyek</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Visibilitas Publik</div>
                    <div className="text-[10px] text-slate-500 leading-snug">Izinkan diakses tanpa akun</div>
                  </div>
                  <Button 
                    onClick={toggleVisibility}
                    variant={isPublic ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 text-xs font-bold rounded-md ${
                      isPublic 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isPublic ? 'Publik' : 'Privat'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Scouts */}
          {userId !== null && (
            <>
              {isOwner ? (
                <Card className="bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Scout Talenta AI</CardTitle>
                      <CardDescription className="text-[10px] text-slate-500">Pencocokan kandidat otomatis</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-normal">
                      Temukan kandidat alumni terbaik dari database yang memiliki keahlian dan minat yang cocok untuk menyukseskan proyek ini.
                    </p>
                    <Button 
                      onClick={handleOwnerAISearch}
                      disabled={aiLoading}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 rounded-md shadow-sm transition-all gap-1.5"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      Cari Talenta via AI
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
                    <Cpu className="h-4 w-4 text-primary animate-pulse" />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Analisis Kecocokan AI</CardTitle>
                      <CardDescription className="text-[10px] text-slate-500">Pencocokan profil cerdas</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-normal">
                      Gunakan AI Engine untuk menganalisis kecocokan profil, keahlian, dan aktivitas Anda dengan kebutuhan spesifik proyek ini.
                    </p>
                    <Button 
                      onClick={handleUserAIMatch}
                      disabled={aiLoading}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 rounded-md shadow-sm transition-all gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Apakah Saya Cocok?
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
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
            <Card className="bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800 shadow-sm max-h-[500px] overflow-y-auto">
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
