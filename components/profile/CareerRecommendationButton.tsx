// components/profile/CareerRecommendationButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { AlumniProfileType, CustomUserForProjectCard } from '@/lib/types';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CareerRecommendationButtonProps {
  profile: AlumniProfileType;
  currentUser: CustomUserForProjectCard;
}

export default function CareerRecommendationButton({
  profile,
  currentUser,
}: CareerRecommendationButtonProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecommendation = async () => {
    setIsLoading(true);
    setRecommendation(null);
    setError(null);

    try {
      const response = await fetch('/api/collaboration-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: currentUser.id,
          source: 'karir'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Gagal mendapatkan rekomendasi pengembangan karir.');
        console.error('API Karir Error:', data.error);
        setRecommendation(null);
      } else {
        setRecommendation(data.recommendation);
        console.log('Rekomendasi karir berhasil diterima:', data.recommendation);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError('Terjadi kesalahan jaringan atau yang tidak terduga saat memuat rekomendasi karir.');
      console.error('Unexpected error loading career recommendation:', msg);
      setRecommendation(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="premium-light-card liquid-glass-border shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <TrendingUp className="h-4.5 w-4.5 text-primary" />
          Rekomendasi Pengembangan Karir AI
        </CardTitle>
        <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">
          Analisis upskilling, sertifikasi, rencana aksi, dan proyeksi karir masa depan Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {recommendation ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {recommendation}
            </ReactMarkdown>
          </div>
        ) : error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
            Klik tombol di bawah untuk menganalisis profil Anda dan menghasilkan rekomendasi pengembangan karir personal yang didukung AI.
          </p>
        )}
        
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
          <Button onClick={handleGenerateRecommendation} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-6 rounded-full shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-1.5">
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Menganalisis Profil & Karir...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Dapatkan Rekomendasi Karir AI
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
