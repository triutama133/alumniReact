'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Lock, Loader2, CheckCircle, Clock, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { playClickSound } from '@/lib/audio';

interface CohortPreview {
  id: number;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  join_mode: 'auto' | 'approval';
  member_count: number;
  viewer_status: 'member' | 'pending' | null;
}

export default function JoinCommunityPage() {
  const params = useParams<{ cohortId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const findKey = searchParams.get('key') || '';

  const [cohort, setCohort] = useState<CohortPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cohorts/${params.cohortId}/join?key=${encodeURIComponent(findKey)}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setCohort(await res.json());
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [params.cohortId, findKey]);

  const handleJoin = async () => {
    if (!cohort) return;
    if (cohort.visibility === 'private' && !joinCodeInput.trim()) return;

    playClickSound();
    setIsJoining(true);
    try {
      const res = await fetch(`/api/cohorts/${cohort.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cohort.visibility === 'private' ? { joinKey: joinCodeInput.trim() } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal bergabung ke komunitas.');

      toast.success(data.message);
      if (data.status === 'joined') {
        router.push(`/community/${cohort.id}`);
      } else {
        setCohort({ ...cohort, viewer_status: 'pending' });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal bergabung ke komunitas.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-md py-24 text-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
        <p className="text-sm">Memuat undangan komunitas...</p>
      </div>
    );
  }

  if (notFound || !cohort) {
    return (
      <div className="container mx-auto max-w-md py-24 text-center space-y-3">
        <Lock className="h-10 w-10 mx-auto text-rose-500" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tautan Tidak Valid</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tautan undangan ini salah, kedaluwarsa, atau komunitas tersebut sudah tidak tersedia. Minta tautan undangan terbaru dari admin komunitas.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-16 px-4">
      <Card className="premium-light-card liquid-glass-border">
        <CardHeader className="text-center">
          <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Lock className="h-6 w-6 text-indigo-500" />
          </div>
          <CardTitle className="text-xl font-bold">{cohort.name}</CardTitle>
          <CardDescription className="text-xs">{cohort.description || 'Komunitas privat di HubTalent.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cohort.member_count} anggota</span>
            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
              {cohort.join_mode === 'auto' ? 'Gabung Otomatis' : 'Perlu Persetujuan'}
            </Badge>
          </div>

          {cohort.viewer_status === 'member' ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Anda Sudah Bergabung
            </Badge>
          ) : cohort.viewer_status === 'pending' ? (
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Menunggu Persetujuan Admin
            </Badge>
          ) : (
            <div className="space-y-2 text-left">
              {cohort.visibility === 'private' && (
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Masukkan kode gabung..."
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="pl-8 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Kode ini berbeda dari tautan undangan — minta secara terpisah dari admin komunitas.</p>
                </div>
              )}
              <Button
                onClick={handleJoin}
                disabled={isJoining || (cohort.visibility === 'private' && !joinCodeInput.trim())}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-md gap-1.5"
              >
                {isJoining && <Loader2 className="h-4 w-4 animate-spin" />}
                {cohort.join_mode === 'auto' ? 'Gabung Sekarang' : 'Ajukan Bergabung'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
