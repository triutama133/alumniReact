'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Users, CheckCircle, Clock, Compass, Loader2 } from 'lucide-react';
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

export default function DiscoverCommunitiesPage() {
  const [search, setSearch] = useState('');
  const [cohorts, setCohorts] = useState<DiscoverableCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);

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

  const handleJoin = async (cohort: DiscoverableCohort) => {
    playClickSound();
    setJoiningId(cohort.id);
    try {
      const res = await fetch(`/api/cohorts/${cohort.id}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal bergabung ke komunitas.');

      toast.success(data.message);
      setCohorts((prev) => prev.map((c) => (c.id === cohort.id ? { ...c, viewer_status: data.status === 'joined' ? 'member' : 'pending' } : c)));
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

                {cohort.viewer_status === 'member' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Anda Sudah Bergabung
                  </Badge>
                ) : cohort.viewer_status === 'pending' ? (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Menunggu Persetujuan
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={joiningId === cohort.id}
                    onClick={() => handleJoin(cohort)}
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
