'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Users, CheckCircle, Clock, Compass, Loader2, KeyRound, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { playClickSound } from '@/lib/audio';

interface DiscoverableCohort {
  id: number;
  name: string;
  description: string | null;
  join_mode: 'auto' | 'approval';
  member_count: number;
  viewer_status: 'member' | 'pending' | null;
}

interface CodeSearchResult extends DiscoverableCohort {
  visibility: 'public' | 'private';
}

function ViewerStatusBadge({ status }: { status: 'member' | 'pending' }) {
  if (status === 'member') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 gap-1.5">
        <CheckCircle className="h-3.5 w-3.5" /> Anda Sudah Bergabung
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 gap-1.5">
      <Clock className="h-3.5 w-3.5" /> Menunggu Persetujuan
    </Badge>
  );
}

export default function DiscoverCommunitiesPage() {
  const [search, setSearch] = useState('');
  const [cohorts, setCohorts] = useState<DiscoverableCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // "Punya kode undangan?" — two independent secrets: find_key locates the cohort and
  // reveals its preview; join_key (entered separately, only once the preview is shown)
  // is the actual gate required to become a member.
  const [findCodeInput, setFindCodeInput] = useState('');
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeResult, setCodeResult] = useState<CodeSearchResult | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const fetchCohorts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cohorts/discover?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Gagal memuat daftar komunitas.');
      const data = await res.json();
      setCohorts(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat daftar komunitas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCohorts('');
  }, [fetchCohorts]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCohorts(search.trim()), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Joining a public cohort from the grid needs no code at all.
  const handleJoinPublic = async (cohortId: number) => {
    playClickSound();
    setJoiningId(cohortId);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal bergabung ke komunitas.');

      toast.success(data.message);
      const newStatus = data.status === 'joined' ? 'member' : 'pending';
      setCohorts((prev) => prev.map((c) => (c.id === cohortId ? { ...c, viewer_status: newStatus } : c)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal bergabung ke komunitas.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleSearchByFindCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findCodeInput.trim()) return;

    playClickSound();
    setIsSearchingCode(true);
    setCodeError(null);
    setCodeResult(null);
    setJoinCodeInput('');
    try {
      const res = await fetch(`/api/cohorts/resolve-key?findKey=${encodeURIComponent(findCodeInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kode pencarian tidak ditemukan.');
      setCodeResult(data);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Kode pencarian tidak ditemukan.');
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!codeResult) return;
    if (codeResult.visibility === 'private' && !joinCodeInput.trim()) return;

    playClickSound();
    setJoiningId(codeResult.id);
    try {
      const res = await fetch(`/api/cohorts/${codeResult.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeResult.visibility === 'private' ? { joinKey: joinCodeInput.trim() } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal bergabung ke komunitas.');

      toast.success(data.message);
      setCodeResult({ ...codeResult, viewer_status: data.status === 'joined' ? 'member' : 'pending' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal bergabung ke komunitas.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6 stagger-children">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center">
          <Compass className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Jelajahi Komunitas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Temukan dan bergabung dengan komunitas publik lainnya di HubTalent.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Cari nama komunitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
        />
      </div>

      {/* Private cohort lookup by find code — this is the only way to locate a private
          cohort someone was only told the code for. Finding it only shows the preview;
          a separate join code is still required to actually become a member. */}
      <Card className="premium-light-card liquid-glass-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-sm font-bold">Punya Kode Undangan?</CardTitle>
          </div>
          <CardDescription className="text-xs">Komunitas privat tidak muncul di daftar di atas. Masukkan kode pencarian untuk melihat pratinjaunya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchByFindCode} className="flex gap-2">
            <div className="relative flex-grow">
              <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Masukkan kode pencarian..."
                value={findCodeInput}
                onChange={(e) => { setFindCodeInput(e.target.value); setCodeError(null); }}
                className="pl-8 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-mono"
              />
            </div>
            <Button type="submit" disabled={isSearchingCode || !findCodeInput.trim()} size="sm" className="h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-xs font-bold rounded-md px-4 gap-1.5">
              {isSearchingCode && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Cari
            </Button>
          </form>

          {codeError && <p className="text-xs text-rose-500 mt-2">{codeError}</p>}

          {codeResult && (
            <Card className="relative mt-3 bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5">
              {joiningId === codeResult.id && <LoadingOverlay message="Memproses..." />}
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">{codeResult.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{codeResult.description || 'Belum ada deskripsi komunitas.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {codeResult.member_count} anggota</span>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                    {codeResult.join_mode === 'auto' ? 'Gabung Otomatis' : 'Perlu Persetujuan'}
                  </Badge>
                </div>

                {codeResult.viewer_status === 'member' || codeResult.viewer_status === 'pending' ? (
                  <ViewerStatusBadge status={codeResult.viewer_status} />
                ) : codeResult.visibility === 'private' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Masukkan kode gabung..."
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        className="pl-8 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-mono"
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={joiningId === codeResult.id || !joinCodeInput.trim()}
                      onClick={handleJoinWithCode}
                      className="w-full h-8 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-md"
                    >
                      {codeResult.join_mode === 'auto' ? 'Gabung Sekarang' : 'Ajukan Bergabung'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    disabled={joiningId === codeResult.id}
                    onClick={handleJoinWithCode}
                    className="w-full h-8 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-md"
                  >
                    {codeResult.join_mode === 'auto' ? 'Gabung Sekarang' : 'Ajukan Bergabung'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs">Memuat daftar komunitas...</p>
        </div>
      ) : cohorts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {cohorts.map((cohort) => (
            <Card key={cohort.id} className="premium-light-card liquid-glass-border relative">
              {joiningId === cohort.id && <LoadingOverlay message="Memproses..." />}
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">{cohort.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{cohort.description || 'Belum ada deskripsi komunitas.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cohort.member_count} anggota</span>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                    {cohort.join_mode === 'auto' ? 'Gabung Otomatis' : 'Perlu Persetujuan'}
                  </Badge>
                </div>
                {cohort.viewer_status === 'member' || cohort.viewer_status === 'pending' ? (
                  <ViewerStatusBadge status={cohort.viewer_status} />
                ) : (
                  <Button
                    size="sm"
                    disabled={joiningId === cohort.id}
                    onClick={() => handleJoinPublic(cohort.id)}
                    className="w-full h-8 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-md"
                  >
                    {cohort.join_mode === 'auto' ? 'Gabung Sekarang' : 'Ajukan Bergabung'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="premium-light-card liquid-glass-border p-8 text-center text-slate-500">
          <Compass className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Belum ada komunitas publik</h4>
          <p className="text-xs mt-1">Coba kata kunci lain, atau tunggu admin komunitas membuka aksesnya ke publik.</p>
        </Card>
      )}
    </div>
  );
}
