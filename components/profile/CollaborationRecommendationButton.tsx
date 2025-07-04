// components/profile/CollaborationRecommendationButton.tsx
'use client'; // Ini adalah Client Component

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react'; // Untuk ikon loading
import { AlumniProfileType, CustomUserForProjectCard } from '@/lib/types'; // Import tipe dari lib/types

import ReactMarkdown from 'react-markdown'; // <-- Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // <-- Import remarkGfm untuk GitHub Flavored Markdown

interface CollaborationRecommendationButtonProps {
  profile: AlumniProfileType; // Profil yang sedang dilihat
  currentUser: CustomUserForProjectCard; // User yang sedang login
}

export default function CollaborationRecommendationButton({
  profile,
  currentUser,
}: CollaborationRecommendationButtonProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecommendation = async () => {
    setIsLoading(true);
    setRecommendation(null);
    setError(null);

    try {
      // Panggil API Route baru untuk mendapatkan rekomendasi
      const response = await fetch('/api/collaboration-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }), // Kirim ID user yang login
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Gagal mendapatkan rekomendasi.');
        console.error('API Rekomendasi Error:', data.error);
        setRecommendation(null); // Clear previous recommendation on error
      } else {
        setRecommendation(data.recommendation);
        console.log('Rekomendasi berhasil diterima:', data.recommendation);
      }
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan atau yang tidak terduga saat memuat rekomendasi.');
      console.error('Unexpected error loading recommendation:', err);
      setRecommendation(null); // Clear previous recommendation on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
      <CardHeader>
        <CardTitle>Rekomendasi Kolaborasi</CardTitle>
        <CardDescription>Dapatkan ide kolaborasi inovatif untuk profil Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        {recommendation ? (
          // Perbaikan: Gunakan ReactMarkdown untuk merender rekomendasi
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {recommendation}
            </ReactMarkdown>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Klik tombol di bawah untuk mendapatkan rekomendasi kolaborasi.</p>
        )}
      </CardContent>
      <CardHeader> {/* Menggunakan CardHeader di bawah untuk tombol */}
        <Button onClick={handleGenerateRecommendation} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat Rekomendasi...
            </>
          ) : (
            'Dapatkan Rekomendasi Kolaborasi'
          )}
        </Button>
      </CardHeader>
    </Card>
  );
}
