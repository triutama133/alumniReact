// app/(main)/jobs/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Award,
  BookOpen,
  CheckSquare,
  Cpu,
  MapPin,
  Play,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Square,
  Briefcase,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Wallet,
  Target,
  MessageSquare
} from 'lucide-react';
import { CVCreatorTab } from '@/components/jobs/CVCreatorTab';
import PostJobModal, { PostedJob } from '@/components/jobs/PostJobModal';
import ApplyJobModal from '@/components/jobs/ApplyJobModal';
import JobApplicantsModal from '@/components/jobs/JobApplicantsModal';
import { JobCandidateScout } from '@/components/jobs/JobCandidateScout';
import { SmartJobAggregatorTab } from '@/components/jobs/SmartJobAggregatorTab';
import { InterviewSimulationTab } from '@/components/jobs/InterviewSimulationTab';
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

interface SavedLearningPath {
  target_role: string;
  path_data: AnalysisResult;
  updated_at: string;
}

interface Job {
  id: number;
  job_title: string;
  company: string;
  platform: string;
  job_url: string;
  description: string;
  job_desk: string[];
  requirements: string[];
  is_active: boolean;
  status_reason: string;
  category: string;
  salary: string | null;
  owner_id: number | null;
  source: 'database' | 'user';
  applied_status: 'pending' | 'accepted' | 'rejected' | null;
}

const VALID_TABS = ['jobs', 'learning-path', 'cv-creator', 'smart-match', 'interview'] as const;
type JobsTab = (typeof VALID_TABS)[number];

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<JobsTab>('jobs');

  // Deep-link support, e.g. the Home feed's "Latihan Interview AI" card links to
  // /jobs?tab=interview so it actually opens the right tab instead of just /jobs.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (VALID_TABS as readonly string[]).includes(tabParam)) {
      setActiveTab(tabParam as JobsTab);
    }
  }, [searchParams]);

  // --- JOBS TAB STATE ---
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'database' | 'user'>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [togglingJobId, setTogglingJobId] = useState<number | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<{ id: number; title: string } | null>(null);
  const [applicantsModalJob, setApplicantsModalJob] = useState<{ id: number; title: string } | null>(null);

  // --- LEARNING PATH TAB STATE ---
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [customRole, setCustomRole] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Fetch current user id (used to gate the active/inactive toggle on own job postings)
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.userId ? Number(data.userId) : null);
        }
      } catch {
        // Not critical — the toggle simply won't render if this fails.
      }
    };
    fetchMe();
  }, []);

  // Loading messages rotation for AI analysis
  useEffect(() => {
    if (!loadingAnalysis) return;
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
  }, [loadingAnalysis]);

  // Fetch Saved Checklist from Database
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
    if (!analysisResult) return;
    const target = selectedRole === 'custom' ? customRole : selectedRole;
    fetchSavedChecklist(target);
  }, [analysisResult, selectedRole, customRole]);

  // Load saved learning paths on page mount — up to 5 can exist per user now.
  const loadSavedPaths = useCallback(async () => {
    try {
      const res = await fetch('/api/learning-path');
      if (res.ok) {
        const data = await res.json();
        const paths: SavedLearningPath[] = data.paths || [];
        setSavedPaths(paths);
        if (paths.length > 0) {
          applySavedPath(paths[0]);
        }
      }
    } catch (err) {
      console.error('Error loading saved learning paths:', err);
    }
  }, []);

  useEffect(() => {
    loadSavedPaths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySavedPath = (path: SavedLearningPath) => {
    if (POPULAR_ROLES.includes(path.target_role)) {
      setSelectedRole(path.target_role);
    } else {
      setSelectedRole('custom');
      setCustomRole(path.target_role);
    }
    setAnalysisResult(path.path_data);
  };

  // Toggle Task Checklist
  const handleToggleTask = async (task: string) => {
    playClickSound();
    const nextVal = !checkedTasks[task];
    const newChecked = { ...checkedTasks, [task]: nextVal };
    setCheckedTasks(newChecked);

    const target = selectedRole === 'custom' ? customRole : selectedRole;
    const completedArray = Object.keys(newChecked).filter(k => newChecked[k]);

    const storageKey = `lp_checklist_${target}`;
    localStorage.setItem(storageKey, JSON.stringify(newChecked));

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

    const total = analysisResult?.checklist.length || 0;
    const completed = analysisResult?.checklist.filter(t => newChecked[t]).length || 0;
    if (total > 0 && completed === total) {
      playSuccessSound();
      toast.success('Luar biasa! Persiapan kerja Anda telah lengkap 100%!');
    }
  };

  // Start AI Analysis
  const startAnalysis = async (roleOverride?: string) => {
    const finalRole = roleOverride || (selectedRole === 'custom' ? customRole : selectedRole);
    if (!finalRole || !finalRole.trim()) {
      toast.info('Tentukan target peran karir terlebih dahulu.');
      return;
    }

    playClickSound();
    setLoadingAnalysis(true);
    setAnalysisResult(null);

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

      setAnalysisResult(data);
      playSuccessSound();
      toast.success('Learning Path Persiapan Kerja Berhasil Dibuat!');
      loadSavedPaths(); // Refresh the saved-paths list (server enforces the 5-path cap).
    } catch (err: any) {
      toast.error('Gagal memproses analisis', { description: err.message });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Smart Job Aggregator "improve your fit" hand-off: feeds a job's category straight
  // into the existing Learning Path generator instead of building a second, separate
  // gap-analysis feature.
  const handleUseRoleForLearningPath = (role: string) => {
    setSelectedRole(POPULAR_ROLES.includes(role) ? role : 'custom');
    setCustomRole(role);
    setActiveTab('learning-path');
    startAnalysis(role);
  };

  // --- FETCH JOBS ---
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const ownerParam = mineOnly && currentUserId ? `&ownerId=${currentUserId}` : '';
      const url = `/api/jobs?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&source=${sourceFilter}${ownerParam}&page=${page}&limit=${pageSize}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil lowongan kerja.');
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalJobs(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      toast.error('Kesalahan Sistem', { description: err.message || 'Gagal terhubung ke server.' });
    } finally {
      setLoadingJobs(false);
    }
  }, [search, category, sourceFilter, mineOnly, currentUserId, page, pageSize]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab, page, pageSize, category, sourceFilter, mineOnly, fetchJobs]);

  const handlePageSizeChange = (value: string) => {
    playClickSound();
    setPageSize(Number(value));
    setPage(1);
  };

  const handleSourceFilterChange = (value: 'all' | 'database' | 'user') => {
    playClickSound();
    setSourceFilter(value);
    if (value !== 'user') setMineOnly(false);
    setPage(1);
  };

  const handleToggleMineOnly = () => {
    playClickSound();
    setMineOnly((prev) => !prev);
    setPage(1);
  };

  const handleSearch = () => {
    playClickSound();
    setPage(1);
    fetchJobs();
  };

  const handleJobPosted = (job: PostedJob) => {
    // Show the newly posted job immediately without waiting for a refetch.
    setJobs((prev) => [{ ...job, applied_status: null } as unknown as Job, ...prev]);
    setTotalJobs((prev) => prev + 1);
  };

  const handleJobUpdated = (job: PostedJob) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...job } as unknown as Job : j)));
    setEditingJob(null);
  };

  const handleJobApplied = (jobId: number) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, applied_status: 'pending' } : j)));
  };

  const handleToggleActive = async (job: Job) => {
    const nextActive = !job.is_active;
    setTogglingJobId(job.id);
    // Optimistic update
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_active: nextActive } : j)));

    try {
      const res = await fetch(`/api/jobs/${job.id}/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengubah status lowongan.');
      }
      toast.success(nextActive ? 'Lowongan diaktifkan kembali.' : 'Lowongan dinonaktifkan.');
    } catch (err) {
      // Revert on failure
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_active: !nextActive } : j)));
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status lowongan.');
    } finally {
      setTogglingJobId(null);
    }
  };

  // Calculate LP completeness percentage
  const totalChecklistCount = analysisResult?.checklist.length || 0;
  const completedChecklistCount = analysisResult?.checklist.filter(t => checkedTasks[t]).length || 0;
  const percentCompleted = totalChecklistCount > 0 
    ? Math.round((completedChecklistCount / totalChecklistCount) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8 stagger-children">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-6 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Portal Jobs & Kesiapan Kerja</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Temukan pekerjaan impian dan sesuaikan keahlian Anda secara real-time</p>
          </div>
        </div>

        {/* Tab Switcher — scrolls horizontally instead of squishing/clipping tabs off-screen
            once there are more of them than a narrow viewport can show at once. */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-md border border-slate-200 dark:border-white/5 shadow-sm w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => { playClickSound(); setActiveTab('jobs'); }}
            className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'jobs'
                ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Lowongan Pekerjaan</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('smart-match'); }}
            className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'smart-match'
                ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Smart Job Agregator</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('learning-path'); }}
            className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'learning-path'
                ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Learning Path Persiapan Kerja</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('cv-creator'); }}
            className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'cv-creator'
                ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>CV CREATOR</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('interview'); }}
            className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'interview'
                ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Latihan Interview AI</span>
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT: JOBS LIST --- */}
      {activeTab === 'jobs' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Search & Filter Bar */}
          <Card className="premium-light-card liquid-glass-border shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari posisi atau nama perusahaan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm focus:border-primary"
                />
              </div>
              <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-56 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={loadingJobs} className="h-10 bg-primary hover:bg-primary/95 text-white font-bold text-sm px-6 gap-1.5">
                {loadingJobs && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Cari
              </Button>
              {currentUserId && (
                <Button
                  onClick={() => { playClickSound(); setEditingJob(null); setShowPostJobModal(true); }}
                  variant="outline"
                  className="h-10 border-primary/30 text-primary hover:bg-primary/5 font-bold text-sm px-6"
                >
                  Pasang Lowongan
                </Button>
              )}
            </div>
          </Card>

          {/* Source Filter — keeps community-posted jobs visually separate from database listings */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sumber:</span>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-md border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleSourceFilterChange('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  sourceFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleSourceFilterChange('database')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  sourceFilter === 'database'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Lowongan Umum
              </button>
              <button
                onClick={() => handleSourceFilterChange('user')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  sourceFilter === 'user'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                HubTalent Original
              </button>
            </div>

            {sourceFilter === 'user' && currentUserId && (
              <button
                onClick={handleToggleMineOnly}
                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                  mineOnly
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Lowongan Saya
              </button>
            )}
          </div>

          {/* Jobs List Grid */}
          {loadingJobs ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs">Memuat daftar lowongan kerja...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <Card key={job.id} className="premium-light-card liquid-glass-border hover:border-primary/20 transition-all duration-300 shadow-sm bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 flex flex-row justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{job.job_title}</h3>
                        <p className="text-xs font-semibold text-slate-550 dark:text-slate-400">{job.company}</p>
                        {job.salary && (
                          <p className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Wallet className="h-3.5 w-3.5" /> {job.salary}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[8px] font-bold border border-slate-250 dark:border-slate-750 uppercase tracking-wider">
                            {job.platform}
                          </Badge>
                          <Badge className="bg-primary/5 text-primary text-[8px] font-bold border border-primary/10 uppercase tracking-wider">
                            {job.category}
                          </Badge>
                          {job.source === 'user' && (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold border border-emerald-500/20 uppercase tracking-wider">
                              HubTalent Original
                            </Badge>
                          )}
                          {job.owner_id === currentUserId && !job.is_active && (
                            <Badge className="bg-slate-300/40 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 text-[8px] font-bold border border-slate-300 dark:border-slate-600 uppercase tracking-wider">
                              Nonaktif
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { playClickSound(); setExpandedJobId(isExpanded ? null : job.id); }}
                          className="h-8 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                          {isExpanded ? (
                            <>Sembunyikan <ChevronUp className="ml-1 h-3.5 w-3.5" /></>
                          ) : (
                            <>Detail <ChevronDown className="ml-1 h-3.5 w-3.5" /></>
                          )}
                        </Button>
                        {job.job_url && (
                          <Button asChild size="sm" className="h-8 bg-primary hover:bg-primary/95 text-white font-bold text-xs gap-1">
                            <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                              Lamar <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {job.source === 'user' && job.owner_id === currentUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setApplicantsModalJob({ id: job.id, title: job.job_title })}
                            className="h-8 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5"
                          >
                            Lihat Pelamar
                          </Button>
                        )}
                        {job.source === 'user' && job.owner_id !== currentUserId && currentUserId && (
                          job.applied_status ? (
                            <Badge className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md ${
                              job.applied_status === 'accepted'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : job.applied_status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {job.applied_status === 'accepted' ? 'Lamaran Diterima' : job.applied_status === 'rejected' ? 'Lamaran Ditolak' : 'Sudah Melamar'}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setApplyModalJob({ id: job.id, title: job.job_title })}
                              className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Ajukan Diri
                            </Button>
                          )
                        )}
                        {job.source === 'user' && job.owner_id === currentUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingJob(job); setShowPostJobModal(true); }}
                            className="h-8 text-xs font-bold border-slate-200 dark:border-slate-800"
                          >
                            Edit
                          </Button>
                        )}
                        {job.owner_id === currentUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={togglingJobId === job.id}
                            onClick={() => handleToggleActive(job)}
                            className="h-8 text-xs font-bold border-slate-200 dark:border-slate-800"
                          >
                            {job.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-2 pb-5 border-t border-slate-100 dark:border-white/5 space-y-4 animate-fadeIn">
                        {/* Job Description */}
                        {job.description && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Deskripsi Ringkas:</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                              {job.description}
                            </p>
                          </div>
                        )}

                        {/* Job Desk (Tugas & Tanggung Jawab) */}
                        {job.job_desk && job.job_desk.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Tugas & Tanggung Jawab (Job Desk):</h4>
                            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              {job.job_desk.map((task, i) => (
                                <li key={i}>{task}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Job Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Persyaratan / Keahlian yang Dibutuhkan:</h4>
                            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              {job.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.source === 'user' && job.owner_id === currentUserId && (
                          <JobCandidateScout
                            jobId={job.id}
                            jobTitle={job.job_title}
                            description={job.description}
                            jobDesk={job.job_desk || []}
                            requirements={job.requirements || []}
                          />
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tampilkan:</span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-20 h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                      {[5, 10, 25, 100].map((size) => (
                        <SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => { playClickSound(); setPage(page - 1); }}
                    className="text-xs font-bold rounded-md border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-xs text-slate-500 font-medium">Halaman {page} dari {totalPages} ({totalJobs} Lowongan)</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => { playClickSound(); setPage(page + 1); }}
                    className="text-xs font-bold rounded-md border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="premium-light-card liquid-glass-border p-8 text-center text-slate-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23]">
              <Briefcase className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tidak ada lowongan ditemukan</h4>
              <p className="text-xs mt-1">Coba gunakan kata kunci pencarian atau kategori filter lainnya.</p>
            </Card>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: LEARNING PATH PREPARATION --- */}
      {activeTab === 'learning-path' && (
        <div className="space-y-6 animate-fadeIn">

          {/* Saved Learning Paths (up to 5) */}
          {savedPaths.length > 0 && (
            <div className="max-w-xl mx-auto flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rencana Tersimpan:</span>
              {savedPaths.map((path) => {
                const isActive = (selectedRole === 'custom' ? customRole : selectedRole) === path.target_role;
                return (
                  <button
                    key={path.target_role}
                    onClick={() => { playClickSound(); applySavedPath(path); }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                      isActive
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-primary/40'
                    }`}
                  >
                    {path.target_role}
                  </button>
                );
              })}
              <button
                onClick={() => { playClickSound(); setAnalysisResult(null); setSelectedRole(''); setCustomRole(''); }}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-primary/40 hover:text-primary transition-all"
                title={savedPaths.length >= 5 ? 'Rencana tersimpan sudah mencapai batas 5 — rencana lama akan digantikan.' : undefined}
              >
                + Rencana Baru
              </button>
            </div>
          )}

          {/* Role Selection Form */}
          {!loadingAnalysis && !analysisResult && (
            <Card className="premium-light-card liquid-glass-border max-w-xl mx-auto shadow-sm bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Pilih Target Karir Anda</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Pilih peran target Anda untuk memicu komparasi semantik AI terhadap data ribuan loker aktif.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Target Pekerjaan / Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-md text-sm text-slate-900 dark:text-white">
                      <SelectValue placeholder="Pilih target peran..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                      {POPULAR_ROLES.map((role) => (
                        <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-xs text-primary font-semibold">Tulis Peran Kustom...</SelectItem>
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
                      className="h-10 bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-md focus:border-primary"
                    />
                  </div>
                )}

                <Button
                  onClick={() => startAnalysis()}
                  className="w-full h-10 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-md mt-2 flex gap-2 items-center justify-center shadow-sm"
                >
                  <Cpu className="h-4 w-4" />
                  Mulai Analisis Semantik
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State: Elegant rotating network sphere */}
          {loadingAnalysis && (
            <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-fadeIn">
              <div className="relative h-44 w-44">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_25s_linear_infinite] opacity-80 text-primary">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" className="opacity-30" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 5" className="opacity-40 animate-[spin_12s_linear_infinite_reverse]" />
                  <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-20" />
                  <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.3" className="opacity-30" />
                  <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="0.3" className="opacity-30" />
                  <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="0.3" className="opacity-20" />
                  <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="0.3" className="opacity-20" />
                  
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
          {analysisResult && !loadingAnalysis && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Result Overview Header Card */}
              <Card className="premium-light-card liquid-glass-border overflow-hidden bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
                <div className="h-2 bg-primary" />
                <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <Badge className="bg-primary text-white uppercase text-[9px] font-bold rounded-md px-2 py-0.5">HASIL ANALISIS AI</Badge>
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
                    onClick={() => { playClickSound(); setAnalysisResult(null); }}
                    className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded-md flex gap-1.5 text-slate-700 dark:text-slate-350"
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
                  <Card className="premium-light-card liquid-glass-border bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-4.5 w-4.5 text-primary" />
                        Kalkulasi Selisih Skill (Gap Analysis)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Keahlian penting yang wajib Anda pelajari karena sangat diminati pasar kerja saat ini.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResult.gap_analysis.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5 rounded-md hover:border-primary/20 transition-all duration-300 group"
                        >
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                            {item.skill}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Card 2: Learning Path Timeline */}
                  <Card className="premium-light-card liquid-glass-border bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-4.5 w-4.5 text-primary" />
                        Rekomendasi Jalur Belajar (Learning Path)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Kurikulum mandiri berurutan untuk menjembatani selisih keahlian Anda.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative pl-6 border-l border-slate-200 dark:border-white/5 space-y-6 ml-3 py-2">
                      {analysisResult.learning_path.map((step, idx) => (
                        <div key={idx} className="relative space-y-2">
                          <span className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-primary bg-white dark:bg-slate-950 flex items-center justify-center text-[10px] font-bold text-primary">
                            {step.step}
                          </span>
                          
                          <div className="font-bold text-sm text-slate-900 dark:text-white">{step.topic}</div>
                          
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {step.courses_certs.map((c, i) => (
                              <Badge 
                                key={i} 
                                variant="outline" 
                                className="text-[9px] uppercase tracking-wider font-semibold border-primary/20 text-primary bg-primary/5 flex items-center gap-1"
                              >
                                <Award className="h-2.5 w-2.5" />
                                {c}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed pl-1.5 border-l-2 border-slate-100 dark:border-white/5 py-0.5">
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
                  <Card className="premium-light-card liquid-glass-border bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-sm font-bold uppercase text-slate-400 tracking-wider">Persentase Kesiapan Kerja</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-2">
                      <div className="relative h-32 w-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-900" />
                          <circle 
                            cx="64" 
                            cy="64" 
                            r="50" 
                            fill="transparent" 
                            stroke="currentColor" 
                            strokeWidth="8" 
                            strokeDasharray={2 * Math.PI * 50}
                            strokeDashoffset={2 * Math.PI * 50 * (1 - percentCompleted / 100)}
                            className="text-primary transition-all duration-700 ease-out" 
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
                  <Card className="premium-light-card liquid-glass-border bg-white dark:bg-[#1b1f23] border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckSquare className="h-4.5 w-4.5 text-primary" />
                        Checklist Persiapan Kerja
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Aksi konkret lamaran/portfolio berdasarkan analisis kebutuhan loker aktual.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysisResult.checklist.map((task, idx) => {
                        const isChecked = !!checkedTasks[task];
                        return (
                          <button
                            key={idx}
                            onClick={() => handleToggleTask(task)}
                            className={`w-full text-left p-3 flex items-start gap-3 border rounded-md transition-all duration-300 ${
                              isChecked 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-500 dark:text-slate-400' 
                                : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/30 dark:hover:bg-slate-950/55 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200'
                            }`}
                          >
                            {isChecked ? (
                              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
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
      )}

      {/* --- TAB CONTENT: ATS CV CREATOR --- */}
      {activeTab === 'cv-creator' && (
        <div className="animate-fadeIn">
          <CVCreatorTab />
        </div>
      )}

      {/* --- TAB CONTENT: SMART JOB AGGREGATOR --- */}
      {activeTab === 'smart-match' && (
        <div className="animate-fadeIn">
          <SmartJobAggregatorTab onImproveFit={handleUseRoleForLearningPath} />
        </div>
      )}

      {/* --- TAB CONTENT: AI INTERVIEW SIMULATION --- */}
      {activeTab === 'interview' && (
        <div className="animate-fadeIn">
          <InterviewSimulationTab savedRoles={savedPaths.map((p) => p.target_role)} />
        </div>
      )}

      <PostJobModal
        open={showPostJobModal}
        onOpenChange={(open) => { setShowPostJobModal(open); if (!open) setEditingJob(null); }}
        onCreated={handleJobPosted}
        editingJob={editingJob as unknown as PostedJob | null}
        onUpdated={handleJobUpdated}
      />

      {applyModalJob && (
        <ApplyJobModal
          open={Boolean(applyModalJob)}
          onOpenChange={(open) => { if (!open) setApplyModalJob(null); }}
          jobId={applyModalJob.id}
          jobTitle={applyModalJob.title}
          onApplied={() => handleJobApplied(applyModalJob.id)}
        />
      )}

      {applicantsModalJob && (
        <JobApplicantsModal
          open={Boolean(applicantsModalJob)}
          onOpenChange={(open) => { if (!open) setApplicantsModalJob(null); }}
          jobId={applicantsModalJob.id}
          jobTitle={applicantsModalJob.title}
        />
      )}
    </div>
  );
}
