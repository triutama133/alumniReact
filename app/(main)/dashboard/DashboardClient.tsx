// app/(main)/dashboard/DashboardClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Rocket, 
  Home, 
  MapPin, 
  TrendingUp, 
  Lightbulb, 
  Sparkles,
  RefreshCw,
  Globe,
  Lock,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { playClickSound } from '@/lib/audio';

interface Cohort {
  id: number;
  name: string;
  description: string | null;
}

interface DashboardClientProps {
  userCohorts: Cohort[];
}

interface AnalyticsData {
  totalAlumni: number;
  activityDistribution: {
    pekerja: number;
    bisnis: number;
    irt: number;
    campuran: number;
  };
  angkatanDistribution: { year: number; count: number }[];
  kotaDistribution: { name: string; count: number }[];
  topSkills: { name: string; count: number }[];
  topMajors: { name: string; count: number }[];
  insight: string;
}

export default function DashboardClient({ userCohorts }: DashboardClientProps) {
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const fetchAnalytics = async (cohortId: number | null) => {
    if (!cohortId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/analytics?cohortId=${cohortId}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Gagal mengambil data statistik komunitas.');
      }
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  // Read active_cohort_id cookie on mount to align with global portal choice
  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const activeId = getCookie('active_cohort_id');
    if (activeId && activeId !== 'global') {
      const active = userCohorts.find((c: any) => String(c.id) === activeId);
      if (active) {
        setSelectedCohort(active);
      }
    } else {
      setSelectedCohort(null);
    }
  }, [userCohorts]);

  useEffect(() => {
    if (selectedCohort) {
      fetchAnalytics(selectedCohort.id);
    } else {
      setData(null);
      setIsLoading(false);
    }
  }, [selectedCohort]);

  const handleCohortChange = (cohort: Cohort | null) => {
    playClickSound();
    setSelectedCohort(cohort);
  };

  // Helper values for Donut Circle segment calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  const pekerja = data?.activityDistribution.pekerja || 0;
  const bisnis = data?.activityDistribution.bisnis || 0;
  const irt = data?.activityDistribution.irt || 0;
  const campuran = data?.activityDistribution.campuran || 0;
  const totalAct = pekerja + bisnis + irt + campuran;

  const pPct = totalAct > 0 ? (pekerja / totalAct) * 100 : 0;
  const bPct = totalAct > 0 ? (bisnis / totalAct) * 100 : 0;
  const iPct = totalAct > 0 ? (irt / totalAct) * 100 : 0;
  const cPct = totalAct > 0 ? (campuran / totalAct) * 100 : 0;

  const pOffset = circumference;
  const bOffset = circumference - (pPct / 100) * circumference;
  const iOffset = bOffset - (bPct / 100) * circumference;
  const cOffset = iOffset - (iPct / 100) * circumference;

  // Donut label helpers
  const getDonutLabel = () => {
    if (hoveredSegment === 'pekerja') return `${pPct.toFixed(1)}% Pekerja`;
    if (hoveredSegment === 'bisnis') return `${bPct.toFixed(1)}% Pebisnis`;
    if (hoveredSegment === 'irt') return `${iPct.toFixed(1)}% IRT`;
    if (hoveredSegment === 'campuran') return `${cPct.toFixed(1)}% Campuran`;
    return `${data?.totalAlumni || 0} Anggota`;
  };

  // SVG Area/Line Chart Calculations for Angkatan
  const getAreaChartPaths = () => {
    if (!data || data.angkatanDistribution.length === 0) return { linePath: '', areaPath: '', points: [] };
    const chartWidth = 500;
    const chartHeight = 150;
    const paddingLeft = 30;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 20;

    const items = data.angkatanDistribution;
    const years = items.map(d => d.year);
    const counts = items.map(d => d.count);

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const maxCount = Math.max(...counts, 1);

    const widthRange = chartWidth - paddingLeft - paddingRight;
    const heightRange = chartHeight - paddingTop - paddingBottom;

    const points = items.map(item => {
      const x = items.length > 1 
        ? ((item.year - minYear) / (maxYear - minYear)) * widthRange + paddingLeft
        : chartWidth / 2;
      const y = chartHeight - (((item.count / maxCount) * heightRange) + paddingBottom);
      return { x, y, year: item.year, count: item.count };
    });

    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M 30 ${p.y} L ${chartWidth - 30} ${p.y}`,
        areaPath: `M 30 ${p.y} L ${chartWidth - 30} ${p.y} L ${chartWidth - 30} 130 L 30 130 Z`,
        points
      };
    }

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return { linePath, areaPath, points };
  };

  const { linePath, areaPath, points: chartPoints } = getAreaChartPaths();

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-6 stagger-children">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Analisis Jejaring & Sinergi Komunitas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi data karir, keahlian, demografi, dan potensi kolaborasi antar-anggota.
          </p>
        </div>

        {/* Cohort Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 dark:bg-slate-900/60 p-1 rounded-md border border-slate-200 dark:border-white/5 shadow-sm">
          <button
            onClick={() => handleCohortChange(null)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              selectedCohort === null
                ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Portal Global</span>
          </button>
          {userCohorts.map(c => (
            <button
              key={c.id}
              onClick={() => handleCohortChange(c)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                selectedCohort?.id === c.id
                  ? 'bg-slate-900 text-white border border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedCohort === null ? (
        <Card className="premium-light-card liquid-glass-border p-8 text-center max-w-xl mx-auto shadow-sm bg-white dark:bg-[#1b1f23] border border-slate-200 dark:border-slate-800">
          <Globe className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pilih Komunitas untuk Melihat Insight</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Analisis Jejaring & Sinergi Insight hanya tersedia untuk ruang lingkup Komunitas/Himpunan eksklusif. Silakan pilih Komunitas Anda pada tombol pemilih di sebelah kanan atas, atau buat komunitas baru di menu header.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs">Memuat visualisasi dashboard...</p>
        </div>
      ) : error || !data ? (
        <Card className="liquid-glass liquid-glass-border p-8 text-center text-rose-400 max-w-md mx-auto">
          <p className="font-semibold">Gagal Memuat Dashboard</p>
          <p className="text-xs mt-1 text-rose-500">{error || 'Gagal memproses data statistik.'}</p>
          <Button onClick={() => fetchAnalytics(selectedCohort?.id || null)} size="sm" className="mt-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900">
            Coba Lagi
          </Button>
        </Card>
      ) : (
        <>
          {/* KEY METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="premium-light-card liquid-glass-border">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Anggota</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{data.totalAlumni}</h3>
                </div>
                <div className="h-10 w-10 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-primary dark:text-primary border border-slate-200 dark:border-slate-800">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="premium-light-card liquid-glass-border">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Profesional/Bekerja</p>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{data.activityDistribution.pekerja}</h3>
                </div>
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <Briefcase className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="premium-light-card liquid-glass-border">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Pebisnis/Wirausaha</p>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{data.activityDistribution.bisnis}</h3>
                </div>
                <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-650 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  <Rocket className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="premium-light-card liquid-glass-border">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Ibu Rumah Tangga</p>
                  <h3 className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-1">{data.activityDistribution.irt}</h3>
                </div>
                <div className="h-10 w-10 bg-pink-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20">
                  <Home className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MAIN CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SVG Donut Chart for Activities */}
            <Card className="premium-light-card liquid-glass-border lg:col-span-4 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                  Proporsi Aktivitas
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Komparasi peran utama alumni jejaring</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center">
                {totalAct > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90">
                      <circle cx="70" cy="70" r="50" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="12" />
                      {/* Pekerja Segment */}
                      {pPct > 0 && (
                        <circle
                          cx="70" cy="70" r="50" fill="transparent"
                          stroke="#3f51b5" strokeWidth="12"
                          strokeDasharray={`${(pPct / 100) * circumference} ${circumference}`}
                          strokeDashoffset={pOffset}
                          onMouseEnter={() => setHoveredSegment('pekerja')}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className="transition-all duration-300 hover:stroke-[15px] cursor-pointer"
                          strokeLinecap="round"
                        />
                      )}
                      {/* Bisnis Segment */}
                      {bPct > 0 && (
                        <circle
                          cx="70" cy="70" r="50" fill="transparent"
                          stroke="#10b981" strokeWidth="12"
                          strokeDasharray={`${(bPct / 100) * circumference} ${circumference}`}
                          strokeDashoffset={bOffset}
                          onMouseEnter={() => setHoveredSegment('bisnis')}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className="transition-all duration-300 hover:stroke-[15px] cursor-pointer"
                          strokeLinecap="round"
                        />
                      )}
                      {/* IRT Segment */}
                      {iPct > 0 && (
                        <circle
                          cx="70" cy="70" r="50" fill="transparent"
                          stroke="#f59e0b" strokeWidth="12"
                          strokeDasharray={`${(iPct / 100) * circumference} ${circumference}`}
                          strokeDashoffset={iOffset}
                          onMouseEnter={() => setHoveredSegment('irt')}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className="transition-all duration-300 hover:stroke-[15px] cursor-pointer"
                          strokeLinecap="round"
                        />
                      )}
                      {/* Campuran Segment */}
                      {cPct > 0 && (
                        <circle
                          cx="70" cy="70" r="50" fill="transparent"
                          stroke="#ec4899" strokeWidth="12"
                          strokeDasharray={`${(cPct / 100) * circumference} ${circumference}`}
                          strokeDashoffset={cOffset}
                          onMouseEnter={() => setHoveredSegment('campuran')}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className="transition-all duration-300 hover:stroke-[15px] cursor-pointer"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    {/* Inner Center Label */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-white transition-all duration-300">
                        {getDonutLabel()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-12">Tidak ada data aktivitas.</p>
                )}

                {/* Legend list */}
                <div className="w-full grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200 dark:border-white/5 pt-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#3f51b5]" />
                    <span className="text-slate-600 dark:text-slate-400">Pekerja ({pekerja})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                    <span className="text-slate-600 dark:text-slate-400">Bisnis ({bisnis})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-slate-600 dark:text-slate-400">IRT ({irt})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#ec4899]" />
                    <span className="text-slate-600 dark:text-slate-400">Campuran ({campuran})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Skills Popularity Bar Chart */}
            <Card className="premium-light-card liquid-glass-border lg:col-span-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-primary" />
                  Keahlian Terpopuler
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Frekuensi kemunculan kata kunci skill di profil anggota</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {data.topSkills.length > 0 ? (
                  data.topSkills.map((skill, index) => {
                    const maxCount = Math.max(...data.topSkills.map(s => s.count), 1);
                    const percent = (skill.count / maxCount) * 100;
                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-medium">
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{skill.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">{skill.count} Anggota</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-950/40 rounded-full h-2 overflow-hidden border border-slate-250 dark:border-white/5">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-700" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-12 text-center">Tidak ada data keahlian.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* LOWER SECTION: MAJORS & DENSITY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bidang Studi & Jurusan Terbanyak Widget */}
            <Card className="premium-light-card liquid-glass-border lg:col-span-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Rumpun Keilmuan & Jurusan Terbanyak
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Distribusi bidang studi dan fakultas asal anggota di dalam kelompok</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {data.topMajors && data.topMajors.length > 0 ? (
                  data.topMajors.map((major, index) => {
                    const maxMajor = Math.max(...data.topMajors.map(m => m.count), 1);
                    const percent = (major.count / maxMajor) * 100;
                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{major.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">{major.count} Anggota</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-950/40 rounded-full h-2 overflow-hidden border border-slate-250 dark:border-white/5">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-700" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-12 text-center">Tidak ada data bidang studi.</p>
                )}
              </CardContent>
            </Card>

            {/* City Demographics Panel */}
            <Card className="premium-light-card liquid-glass-border lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Kota Domisili Teratas
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Peta sebaran geografi wilayah anggota</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {data.kotaDistribution.length > 0 ? (
                  data.kotaDistribution.map((city, index) => {
                    const maxCity = Math.max(...data.kotaDistribution.map(c => c.count), 1);
                    const percent = (city.count / maxCity) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{city.name}</span>
                          <span className="text-slate-550 dark:text-slate-400">{city.count} Anggota</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-900/60 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-700" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-12 text-center">Tidak ada data kota domisili.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* DYNAMIC NETWORK INSIGHT ANALYSIS */}
          <Card className="premium-light-card liquid-glass-border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary flex-shrink-0 border border-slate-200 dark:border-slate-800">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 text-sm">
                <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  💡 Analisis Sinergi Jejaring Cerdas
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-[8px] font-bold border border-slate-200 dark:border-slate-700 uppercase tracking-widest px-2 py-0.5">
                    AI Insight
                  </Badge>
                </h4>
                <p 
                  className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ 
                     __html: data.insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>') 
                  }}
                />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
