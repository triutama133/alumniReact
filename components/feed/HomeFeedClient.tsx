// components/feed/HomeFeedClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ThumbsUp,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle,
  FileText,
  MapPin,
  Calendar,
  AlertCircle,
  Plus,
  Users,
  Lock,
  Globe,
  Shield,
  CreditCard,
  X,
  PlusCircle,
  Info,
  Clock,
  Briefcase
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JarvisScanHUD } from '@/components/ui/JarvisScanHUD';
import { TypewriterReveal } from '@/components/ui/TypewriterReveal';
import { playClickSound, playScanSound, playSuccessSound } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: string | number;
  user_id: string | number;
  content: string;
  media_url?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  nama_lengkap: string | null;
  nama_panggilan: string | null;
  aktivitas: string | null;
  cohort_id?: number | null;
  is_liked?: boolean;
}

interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  alumni_db: {
    nama_lengkap: string | null;
    nama_panggilan: string | null;
    aktivitas: string | null;
  } | null;
}

interface UserProfile {
  id: number;
  nama_lengkap: string;
  nama_panggilan: string | null;
  email: string;
  angkatan: number | null;
  fakultas_jurusan: string | null;
  aktivitas: string | null;
  skill_gabungan: string | null;
  kota_domisili: string | null;
  jenis_kelamin: string | null;
  nomor_handphone: string | null;
  pendidikan_terakhir: string | null;
  bahasa_dikuasai: string | null;
}

interface Cohort {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  expires_at: string | null;
  role?: string; // 'admin' or 'member'
}

interface CohortMember {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  nama_lengkap: string;
  nama_panggilan: string;
  email: string;
  angkatan: number | null;
}

interface HomeFeedClientProps {
  initialPosts: Post[];
  userProfile: UserProfile;
}

export function HomeFeedClient({ initialPosts, userProfile }: HomeFeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Cohorts State
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeCohort, setActiveCohort] = useState<Cohort | null>(null);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(false);

  // Cohorts UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortDesc, setNewCohortDesc] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'enterprise'>('premium');
  const [isCreatingCohort, setIsCreatingCohort] = useState(false);

  // Cohort Members State
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // State for AI recommendations
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Calculate profile completeness
  const computeCompleteness = () => {
    const fields = [
      userProfile.nama_lengkap,
      userProfile.nama_panggilan,
      userProfile.angkatan,
      userProfile.fakultas_jurusan,
      userProfile.aktivitas,
      userProfile.skill_gabungan,
      userProfile.kota_domisili,
      userProfile.jenis_kelamin,
      userProfile.nomor_handphone,
      userProfile.pendidikan_terakhir,
      userProfile.bahasa_dikuasai
    ];
    const filled = fields.filter(f => f !== null && f !== undefined && String(f).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = computeCompleteness();

  // Load cohorts on mount
  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const activeId = getCookie('active_cohort_id') || 'global';

    const fetchCohorts = async () => {
      setIsLoadingCohorts(true);
      try {
        const res = await fetch('/api/cohorts');
        if (res.ok) {
          const data = await res.json();
          setCohorts(data);

          if (activeId !== 'global') {
            const active = data.find((c: any) => String(c.id) === activeId);
            if (active) {
              setActiveCohort(active);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching cohorts:', err);
      } finally {
        setIsLoadingCohorts(false);
      }
    };
    fetchCohorts();
  }, []);

  // Fetch feed and members when activeCohort changes
  useEffect(() => {
    const fetchFeed = async () => {
      setPosts([]);
      try {
        const url = activeCohort
          ? `/api/posts?cohortId=${activeCohort.id}`
          : '/api/posts';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        toast.error('Gagal memuat feed postingan.');
      }
    };

    const fetchMembers = async () => {
      if (!activeCohort) {
        setMembers([]);
        return;
      }
      setIsLoadingMembers(true);
      try {
        const res = await fetch(`/api/cohorts/${activeCohort.id}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (err) {
        console.error('Error fetching cohort members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    const fetchAIRecommendation = async () => {
      setIsLoadingAI(true);
      setAiRecommendation(null);
      setAiError(null);
      const scanSound = playScanSound(6.0);
      try {
        // AI Partner search is scoped to cohort if active
        const res = await fetch('/api/collaboration-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            cohortId: activeCohort?.id || null,
            source: 'home'
          }),
        });
        if (!res.ok) {
          throw new Error('Gagal memuat rekomendasi AI.');
        }
        const data = await res.json();
        setAiRecommendation(data.recommendation);
        playSuccessSound();
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'Koneksi AI Engine terputus.');
      } finally {
        setIsLoadingAI(false);
        if (scanSound) scanSound.stop();
      }
    };

    fetchFeed();
    fetchMembers();
    fetchAIRecommendation();
  }, [activeCohort, userProfile.id]);

  // Handle cohort creation
  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;

    setIsCreatingCohort(true);
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCohortName,
          description: newCohortDesc || null,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat kelompok.');
      }

      const createdCohort = {
        ...data.cohort,
        role: 'admin'
      };

      setCohorts([...cohorts, createdCohort]);
      setActiveCohort(createdCohort);
      setShowCreateModal(false);
      setNewCohortName('');
      setNewCohortDesc('');
      toast.success('Kelompok eksklusif berhasil dibuat & langganan aktif!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat kelompok.');
    } finally {
      setIsCreatingCohort(false);
    }
  };

  // Handle adding new member to cohort
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCohort || !newMemberInput.trim()) return;

    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/cohorts/${activeCohort.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: newMemberInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan anggota.');
      }

      // Refresh members list
      const membersRes = await fetch(`/api/cohorts/${activeCohort.id}/members`);
      if (membersRes.ok) {
        const freshMembers = await membersRes.json();
        setMembers(freshMembers);
      }

      setNewMemberInput('');
      toast.success('Anggota kelompok berhasil ditambahkan!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan anggota.');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle post creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          media_url: mediaUrl || null,
          cohortId: activeCohort?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim postingan.');
      }

      const newPost: Post = {
        ...data.post,
        nama_lengkap: userProfile.nama_lengkap,
        nama_panggilan: userProfile.nama_panggilan,
        aktivitas: userProfile.aktivitas,
      };

      setPosts([newPost, ...posts]);
      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);
      toast.success(activeCohort ? 'Postingan dibagikan ke kelompok!' : 'Postingan publik berhasil dibagikan!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membagikan postingan.');
    } finally {
      setIsPosting(false);
    }
  };

  // Persistent like toggle via API
  const [likedPosts, setLikedPosts] = useState<Record<string | number, boolean>>({});
  const [isLikingPost, setIsLikingPost] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    const initialLiked: Record<string | number, boolean> = {};
    for (const p of posts) {
      if (p.is_liked) initialLiked[p.id] = true;
    }
    setLikedPosts(initialLiked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosts]);

  const handleLike = async (postId: string | number) => {
    if (isLikingPost[postId]) return;

    const isLiked = likedPosts[postId];
    // Optimistic update
    setLikedPosts({ ...likedPosts, [postId]: !isLiked });
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          return { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) };
        }
        return p;
      })
    );

    setIsLikingPost({ ...isLikingPost, [postId]: true });
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) {
        // Rollback on error
        setLikedPosts({ ...likedPosts, [postId]: isLiked });
        setPosts(prevPosts =>
          prevPosts.map(p => {
            if (p.id === postId) {
              return { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? 1 : -1)) };
            }
            return p;
          })
        );
        throw new Error('Gagal menyukai postingan.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyukai postingan.');
    } finally {
      setIsLikingPost({ ...isLikingPost, [postId]: false });
    }
  };

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string | number, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string | number, PostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string | number, string>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string | number, boolean>>({});

  const toggleComments = async (postId: string | number) => {
    const willExpand = !expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: willExpand });

    if (willExpand && !commentsByPost[postId]) {
      setIsLoadingComments({ ...isLoadingComments, [postId]: true });
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setCommentsByPost({ ...commentsByPost, [postId]: data });
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setIsLoadingComments({ ...isLoadingComments, [postId]: false });
      }
    }
  };

  const handleAddComment = async (postId: string | number) => {
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan komentar.');
      }

      const newComment: PostComment = data.comment;
      setCommentsByPost({
        ...commentsByPost,
        [postId]: [...(commentsByPost[postId] || []), newComment],
      });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            return { ...p, comments_count: p.comments_count + 1 };
          }
          return p;
        })
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan komentar.');
    }
  };

  // Network stats (real-time dari API)
  const [networkStats, setNetworkStats] = useState<{
    total_talent: number;
    distribusi_aktivitas: Record<string, number>;
    total_proyek_aktif: number;
    top_talents: Array<{ id: number; nama_lengkap: string; total_proyek: number }>;
  } | null>(null);

  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        const res = await fetch('/api/stats/network');
        if (res.ok) {
          setNetworkStats(await res.json());
        }
      } catch (err) {
        console.error('Error fetching network stats:', err);
      }
    };
    fetchNetworkStats();
  }, []);

  // Hitung dominasi aktivitas teratas
  const topActivity = networkStats?.distribusi_aktivitas
    ? Object.entries(networkStats.distribusi_aktivitas).sort((a, b) => b[1] - a[1])[0]
    : null;
  const topActivityPercent = networkStats?.total_talent
    ? Math.round(((topActivity?.[1] ?? 0) / networkStats.total_talent) * 1000) / 10
    : 0;

  // Helper untuk badge "Baru" (postingan < 2 jam)
  const isNewPost = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return diffMs < 2 * 60 * 60 * 1000;
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHr < 24) return `${diffHr} jam yang lalu`;
    if (diffDays === 1) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysRemaining = (expiresAtStr: string | null) => {
    if (!expiresAtStr) return 0;
    const diffMs = new Date(expiresAtStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 max-w-6xl mx-auto px-4 stagger-children">
      {/* 1. Welcome Header (Dynamic Greeting) */}
      <div className="lg:col-span-12 mt-2">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 to-indigo-950/80 border border-indigo-500/20 text-white shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="h-32 w-32 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {new Date().getHours() < 18 ? `Halo, ${userProfile.nama_panggilan || userProfile.nama_lengkap}.` : `Lembur malam ini, ${userProfile.nama_panggilan || userProfile.nama_lengkap}?`}
          </h2>
          <p className="text-sm text-slate-350 mt-1 max-w-2xl leading-relaxed">
            {new Date().getHours() < 18
              ? "Cek respon proyekmu, lakukan simulasi wawancara AI, atau intip lowongan kerja terbaru yang relevan hari ini."
              : "Ide proyek terbaik sering lahir di jam tenang. Siap mencari rekan kolaborasi baru?"}
          </p>
        </div>
      </div>

      {/* 2. Quick Action Cards */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <Card className="premium-light-card liquid-glass-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-white dark:bg-[#1b1f23]">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <PlusCircle className="h-4.5 w-4.5 text-primary" />
              Buat Proyek Baru
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Publikasikan ide atau proyek berjalan milikmu dan temukan tim pertama.
            </p>
          </div>
          <Button asChild size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-md dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900">
            <Link href="/projects">Pitch Ide Proyek</Link>
          </Button>
        </Card>

        {/* Card 2 */}
        <Card className="premium-light-card liquid-glass-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-white dark:bg-[#1b1f23]">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
              Latihan Interview AI
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Simulasi wawancara kerja interaktif 5 menit untuk mengasah kesiapanmu.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full border-slate-200 text-slate-900 font-bold text-xs rounded-md dark:border-slate-800 dark:text-white">
            <Link href="/jobs">Mulai Latihan</Link>
          </Button>
        </Card>

        {/* Card 3 */}
        <Card className="premium-light-card liquid-glass-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-white dark:bg-[#1b1f23]">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-4.5 w-4.5 text-emerald-500" />
              Eksplorasi Lowongan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Cek lowongan kerja terkurasi yang sesuai dengan profil keahlianmu.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full border-slate-200 text-slate-900 font-bold text-xs rounded-md dark:border-slate-800 dark:text-white">
            <Link href="/jobs">Lihat Lowongan</Link>
          </Button>
        </Card>
      </div>

      {/* COLUMN LEFT: Profile Summary & Cohort Swapper */}
      <div className="lg:col-span-3 space-y-6">
        {/* Profile completeness card */}
        <Card className="premium-light-card liquid-glass-border overflow-hidden">
          <div className="h-16 bg-slate-350 dark:bg-slate-800" />
          <div className="flex flex-col items-center -mt-8 px-4 pb-6 text-center">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                {getInitials(userProfile.nama_lengkap)}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-slate-900 dark:text-white mt-3 text-base">{userProfile.nama_lengkap}</h3>
            {userProfile.fakultas_jurusan && (
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{userProfile.fakultas_jurusan}</p>
            )}

            <div className="w-full border-t border-slate-200 dark:border-white/5 my-4 pt-4 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Kelengkapan Profil</span>
                <span className="font-bold text-primary">{completeness}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950/40 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {completeness < 100 ? (
                <Link href={`/profile/edit/${userProfile.id}`} className="text-[11px] text-primary hover:text-primary/90 font-bold inline-block underline">
                  Lengkapi profil Anda &rarr;
                </Link>
              ) : (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> Profil Anda lengkap!
                </p>
              )}
            </div>

            <Button asChild size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-bold text-xs rounded-md dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900">
              <Link href={`/profile/${userProfile.id}`}>Lihat Profil Saya</Link>
            </Button>
          </div>
        </Card>

        {/* Network Analytics Teaser Widget */}
        <Card className="premium-light-card liquid-glass-border p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/5 pb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Sinergi Jejaring
            </span>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-[8px] font-bold">
              Real-time
            </Badge>
          </div>

          <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex justify-between items-center">
              <span>👥 Total Talent</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {networkStats ? `${networkStats.total_talent.toLocaleString('id-ID')} Terhubung` : 'Memuat...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>{topActivity ? `💼 ${topActivity[0]}` : '💼 Aktivitas Utama'}</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {networkStats ? `${topActivityPercent}% Dominasi` : 'Memuat...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>🚀 Proyek Aktif</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {networkStats ? `${networkStats.total_proyek_aktif} Proyek` : 'Memuat...'}
              </span>
            </div>
            {networkStats && networkStats.top_talents.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">🔥 3 Talenta Terpopuler</p>
                <div className="space-y-1">
                  {networkStats.top_talents.map((t, idx) => (
                    <Link key={t.id} href={`/profile/${t.id}`} className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 rounded-md px-1.5 py-0.5 transition-colors">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                        {idx + 1}. {t.nama_lengkap}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2">
                        {t.total_proyek} proyek
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            onClick={() => playClickSound()}
            className="w-full text-center text-[10px] h-8 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm font-bold rounded-md dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-white dark:border-slate-800 transition-all"
          >
            <Link href="/dashboard" className="flex items-center justify-center gap-1">
              Buka Dashboard Lengkap &rarr;
            </Link>
          </Button>
        </Card>

        {/* Cohort list card */}
        <Card className="premium-light-card liquid-glass-border">
          <CardHeader className="pb-3 border-b border-slate-200/80 dark:border-white/5 flex flex-row justify-between items-center">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Ruang Lingkup</CardTitle>
              <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Pilih komunitas eksklusif</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="h-6 w-6 p-0 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-3 px-2 space-y-1">
            {/* Public Option */}
            <button
              onClick={() => setActiveCohort(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all text-left ${activeCohort === null
                ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/10 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Bumi Publik (Umum)</span>
            </button>

            {/* Cohorts Options */}
            {cohorts.map((cohort) => (
              <button
                key={cohort.id}
                onClick={() => setActiveCohort(cohort)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition-all text-left ${activeCohort?.id === cohort.id
                  ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/10 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                  }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="truncate">{cohort.name}</span>
                </span>
                {cohort.role === 'admin' && (
                  <Badge className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[8px] font-bold border border-amber-500/20">
                    Admin
                  </Badge>
                )}
              </button>
            ))}

            {cohorts.length === 0 && !isLoadingCohorts && (
              <p className="text-[10px] text-slate-500 text-center py-4">Belum bergabung dengan kelompok berbayar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* COLUMN MIDDLE: Posting Composer & Social Feed */}
      <div className="lg:col-span-6 space-y-6">
        {/* Cohort Workspace (If active) */}
        {activeCohort && (
          <Card className="premium-light-card liquid-glass-border border-indigo-500/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 flex items-center gap-1 bg-indigo-600/10 dark:bg-indigo-500/10 rounded-bl-lg text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border-l border-b border-slate-200 dark:border-indigo-500/20">
              <Shield className="h-3 w-3" />
              <span>Eksklusif: {activeCohort.subscription_plan}</span>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeCohort.name}</h2>
                {activeCohort.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{activeCohort.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  {members.length} Anggota Terdaftar
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  {getDaysRemaining(activeCohort.expires_at)} Hari Sisa Langganan
                </span>
              </div>

              {/* Add member form (only for cohort admin) */}
              {activeCohort.role === 'admin' && (
                <form onSubmit={handleAddMember} className="flex gap-2 border-t border-slate-200 dark:border-white/5 pt-3">
                  <Input
                    value={newMemberInput}
                    onChange={(e) => setNewMemberInput(e.target.value)}
                    placeholder="Undang anggota (Email atau Username)..."
                    className="h-8 bg-slate-50 border-slate-200 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-200 dark:placeholder:text-slate-600 rounded-md"
                  />
                  <Button
                    type="submit"
                    disabled={isAddingMember || !newMemberInput.trim()}
                    size="sm"
                    className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-md px-3 flex gap-1"
                  >
                    {isAddingMember ? 'Mengundang...' : 'Undang'}
                    <PlusCircle className="h-3 w-3" />
                  </Button>
                </form>
              )}
            </div>
          </Card>
        )}

        {/* Posting Composer */}
        <Card className="premium-light-card liquid-glass-border p-4">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-slate-200 dark:border-indigo-500/30">
                <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
                  {getInitials(userProfile.nama_lengkap)}
                </AvatarFallback>
              </Avatar>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  activeCohort
                    ? `Bagikan ide eksklusif ke komunitas ${activeCohort.name}...`
                    : "Bagikan ide kolaborasi, info proyek, atau pembaruan status..."
                }
                className="flex-1 min-h-[70px] bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500 text-sm resize-none rounded-lg"
              />
            </div>

            {showMediaInput && (
              <div className="pl-13 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 bg-slate-55 p-2 rounded-lg border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
                  <LinkIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Masukkan URL foto/media (misal: https://image.com/photo.jpg)"
                    className="h-8 bg-transparent border-none focus-visible:ring-0 text-xs text-slate-900 placeholder:text-slate-450 dark:text-white dark:placeholder:text-slate-600 p-0"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-3 pl-13">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaInput(!showMediaInput)}
                  className={`text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 h-8 rounded-full px-3 text-xs gap-1.5 ${showMediaInput ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Media</span>
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isPosting || !content.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40 text-white text-xs h-8 px-4 rounded-full shadow-md gap-1.5 transition-all"
              >
                <span>Bagikan</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </Card>

        {/* Social Feed List */}
        <div className="space-y-4 stagger-children">
          {posts.length > 0 ? (
            posts.map((post) => {
              const hasLiked = likedPosts[post.id];
              return (
                <Card key={post.id} className="premium-light-card liquid-glass-border animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardHeader className="flex flex-row items-start gap-3 pb-3">
                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold">
                        {getInitials(post.nama_lengkap)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Link href={`/profile/${post.user_id}`} className="font-bold text-slate-900 dark:text-white text-sm hover:underline hover:text-indigo-650 dark:hover:text-indigo-300 truncate">
                            {post.nama_lengkap}
                          </Link>
                          {isNewPost(post.created_at) && (
                            <Badge className="bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold py-0.5 px-1.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                              Baru
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-550 flex-shrink-0">
                          {formatRelativeTime(post.created_at)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {post.aktivitas && (
                          <Badge className="bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[9px] font-semibold py-0.5 px-2 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                            {post.aktivitas}
                          </Badge>
                        )}
                        {post.cohort_id && (
                          <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold py-0.5 px-2 rounded-full border border-emerald-250 dark:border-emerald-500/20 flex gap-0.5 items-center">
                            <Lock className="h-2.5 w-2.5" />
                            Komunitas
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 text-sm text-slate-850 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                    {post.media_url && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
                        <img
                          src={post.media_url}
                          alt="Media postingan"
                          className="w-full h-auto max-h-[300px] object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t border-slate-200 dark:border-white/5 py-2 flex items-center gap-4 text-slate-500 dark:text-slate-450 text-xs">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 ${hasLiked ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likes_count}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 ${expandedComments[post.id] ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comments_count}</span>
                    </button>
                  </CardFooter>

                  {/* Komentar Section */}
                  {expandedComments[post.id] && (
                    <div className="border-t border-slate-200 dark:border-white/5 px-4 py-3 space-y-3">
                      {isLoadingComments[post.id] ? (
                        <p className="text-[10px] text-slate-500 text-center py-2">Memuat komentar...</p>
                      ) : (
                        <>
                          {(commentsByPost[post.id] || []).length > 0 ? (
                            <div className="space-y-2">
                              {(commentsByPost[post.id] || []).map((comment) => (
                                <div key={comment.id} className="flex items-start gap-2">
                                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                                    {getInitials(comment.alumni_db?.nama_lengkap)}
                                  </div>
                                  <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-white/5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {comment.alumni_db?.nama_lengkap}
                                      </span>
                                      <span className="text-[8px] text-slate-400 flex-shrink-0">
                                        {formatRelativeTime(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 text-center py-1">Belum ada komentar.</p>
                          )}

                          {/* Form komentar */}
                          <div className="flex items-center gap-2">
                            <Input
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                              placeholder="Tulis komentar..."
                              className="h-8 bg-slate-50 border-slate-200 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500 rounded-full px-3"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(post.id)}
                              disabled={!(commentInputs[post.id] || '').trim()}
                              className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-full px-3 flex-shrink-0 gap-1"
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="premium-light-card liquid-glass-border p-8 text-center text-slate-550 dark:text-slate-400">
              <FileText className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white">Belum ada postingan</h4>
              <p className="text-xs mt-1">Jadilah yang pertama untuk berbagi cerita di sini!</p>
            </Card>
          )}
        </div>
      </div>

      {/* COLUMN RIGHT: AI Collaboration Assistant Widget & Members Panel */}
      <div className="lg:col-span-3 space-y-6">

        {/* Cohort Members List Card (If active) */}
        {activeCohort ? (
          <Card className="premium-light-card liquid-glass-border">
            <CardHeader className="pb-2 border-b border-slate-200/80 dark:border-white/5">
              <CardTitle className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Anggota Kelompok</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 max-h-[300px] overflow-y-auto px-2 space-y-2">
              {isLoadingMembers ? (
                <p className="text-[10px] text-slate-500 text-center py-2">Memuat anggota...</p>
              ) : members.length > 0 ? (
                members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-200 dark:border-white/5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{m.nama_lengkap}</p>
                      <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
                    </div>
                    <Badge className={`text-[8px] px-2 py-0.5 rounded-full uppercase ${m.role === 'admin' ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350'}`}>
                      {m.role}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 text-center">Belum ada anggota terdaftar.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 4. Section AI Career Prep (Widget Asisten AI) */}
            <Card className="premium-light-card liquid-glass-border p-4 space-y-4 bg-white dark:bg-[#1b1f23] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="border-b border-slate-200/80 dark:border-white/5 pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Asisten Karir AI
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ringkasan evaluasi dan rekomendasi karirmu</p>
              </div>

              {/* Widget Skor CV */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800/85">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white">Skor Kesiapan CV</span>
                  <span className="font-black text-primary">82/100</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Struktur CV kamu sudah kuat. Tambahkan satu proyek kolaborasi aktif di HubTalent untuk meningkatkan daya tarik di mata perekrut.
                </p>
                <Button asChild size="sm" className="w-full h-7 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-md dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900">
                  <Link href="/jobs?tab=cv-creator">Optimalkan CV</Link>
                </Button>
              </div>

              {/* Widget Simulasi Wawancara */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800/85">
                <div className="text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Tantangan Hari Ini:</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">Data Engineer / Analyst</p>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Luangkan 5 menit untuk menjawab 3 pertanyaan simulasi berbasis AI hari ini.
                </p>
                <Button asChild size="sm" variant="outline" className="w-full h-7 border-slate-200 text-slate-900 font-bold text-[10px] rounded-md dark:border-slate-800 dark:text-white">
                  <Link href="/jobs">Mulai Simulasi</Link>
                </Button>
              </div>
            </Card>

            {/* 5. Section Job Aggregator (Rekomendasi Loker) */}
            <Card className="premium-light-card liquid-glass-border p-4 space-y-3 bg-white dark:bg-[#1b1f23] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="border-b border-slate-200/80 dark:border-white/5 pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-emerald-500" />
                  Lowongan Kerja Terpilih
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Kurasi otomatis berdasarkan keahlian Python, SQL pada profilmu.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Junior Data Engineer</h5>
                    <p className="text-[9px] text-slate-450 mt-0.5">Full-time • Remote • 2 hari lalu</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold border border-emerald-500/20">
                    95% Match
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1 h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-md">
                    <Link href="/jobs">Lamar Sekarang</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-slate-205 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-[10px] rounded-md">
                    Simpan
                  </Button>
                </div>
              </div>
            </Card>

            {/* 6. Community & Engagement Footer Widget */}
            <Card className="premium-light-card liquid-glass-border p-4 bg-gradient-to-br from-indigo-900/50 to-purple-950/40 border-indigo-500/20 text-white shadow-sm">
              <h4 className="font-extrabold text-xs text-indigo-300">Kolaborasi dimulai dari sapaan pertama.</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed mt-1.5 mb-3.5">
                Mulai jaringan barumu dengan menyapa talenta lain atau ajukan tawaran bergabung pada ide proyek yang menarik minatmu.
              </p>
              <Button asChild size="sm" className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-[10px] rounded-md">
                <Link href="/search">Jelajahi Direktori Talenta</Link>
              </Button>
            </Card>
          </>
        )}
      </div>

      {/* COHORT CREATION MODAL (Glassmorphic Custom UI) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-6 liquid-glass liquid-glass-border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-2xl text-slate-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white">Buat Ruang Kelompok Cerdas</h2>
            </div>

            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Nama Kelompok / Himpunan</label>
                <Input
                  required
                  value={newCohortName}
                  onChange={(e) => setNewCohortName(e.target.value)}
                  placeholder="Misal: Ikatan Alumni Paramadina Bogor"
                  className="bg-slate-950/40 border-slate-800 focus:border-indigo-500 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Deskripsi Kelompok</label>
                <Textarea
                  value={newCohortDesc}
                  onChange={(e) => setNewCohortDesc(e.target.value)}
                  placeholder="Penjelasan singkat tujuan komunitas eksklusif ini..."
                  className="bg-slate-950/40 border-slate-800 focus:border-indigo-500 text-sm text-slate-100 min-h-[70px] resize-none"
                />
              </div>

              {/* Subscription Plan Chooser */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                  Pilih Paket Langganan (SaaS Billing Mockup)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Premium plan option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('premium')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${selectedPlan === 'premium'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold shadow-md'
                      : 'border-white/5 bg-slate-900/30 text-slate-400 hover:border-slate-800'
                      }`}
                  >
                    <span className="text-xs">Premium</span>
                    <span className="text-[14px] text-white font-extrabold mt-1">Rp 150k</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">/ bulan</span>
                  </button>

                  {/* Enterprise plan option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('enterprise')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${selectedPlan === 'enterprise'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold shadow-md'
                      : 'border-white/5 bg-slate-900/30 text-slate-400 hover:border-slate-800'
                      }`}
                  >
                    <span className="text-xs">Enterprise</span>
                    <span className="text-[14px] text-white font-extrabold mt-1">Rp 500k</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">/ bulan</span>
                  </button>

                  {/* Free option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('free')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${selectedPlan === 'free'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold shadow-md'
                      : 'border-white/5 bg-slate-900/30 text-slate-400 hover:border-slate-800'
                      }`}
                  >
                    <span className="text-xs">Free trial</span>
                    <span className="text-[14px] text-white font-extrabold mt-1">Gratis</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">7 hari trial</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-1.5 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-300/95 leading-normal items-start">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-indigo-400" />
                <p>
                  Mekanisme cohort membatasi visibilitas postingan, pencarian AI, serta manajemen proyek agar terkelompok eksklusif dan aman bagi tim internal Anda. Pembayaran mockup akan langsung menyetujui transaksi Anda secara otomatis.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingCohort || !newCohortName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg px-6 rounded-full"
                >
                  {isCreatingCohort ? 'Memproses Langganan...' : 'Bayar & Buat Kelompok'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
