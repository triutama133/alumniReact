// app/(main)/profile/[userId]/page.tsx
// PENTING: Pastikan TIDAK ADA 'use client' di atas baris ini.
// File ini adalah Server Component.

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CollaborationRecommendationButton from '@/components/profile/CollaborationRecommendationButton';
import { AlumniProfileType, CustomUserForProjectCard } from '@/lib/types';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const cookieStore = await cookies();

  const headersList = await headers();
  const loggedInUserId = headersList.get('x-user-id');
  const loggedInUserEmail = headersList.get('x-user-email');
  const loggedInUserRole = headersList.get('x-user-role');

  const currentUser: CustomUserForProjectCard | null = loggedInUserId && loggedInUserEmail
    ? { id: loggedInUserId, email: loggedInUserEmail, role: loggedInUserRole || null }
    : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  );

  const { data: profile, error } = await supabase
    .from('alumni_db')
    .select(`
      *,
      alumni_pekerja(*),
      alumni_bisnis(*),
      alumni_rumah_tangga(*)
    `)
    .eq('id', params.userId)
    .single() as { data: AlumniProfileType | null, error: unknown }; // Perbaikan: Ganti 'any' dengan 'unknown'

  if (error || !profile) {
    console.error("Error fetching profile:", (error as Error)?.message || "Profile not found."); // Perbaikan: Type assertion
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Profil Tidak Ditemukan</h2>
        <p>Pengguna ini mungkin belum melengkapi profilnya atau tidak ada.</p>
        <Button asChild className="mt-4">
          <Link href="/">Kembali ke Home</Link>
        </Button>
      </div>
    );
  }

  const profileIdAsString = String(profile.id);

  const skills = profile.skill_gabungan?.split(',').map((skill: string) => skill.trim()).filter(Boolean) || [];

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{profile.nama_lengkap}</CardTitle>
              <CardDescription className="text-lg">
                {profile.nama_panggilan} • Angkatan {profile.angkatan}
              </CardDescription>
              <p className="text-muted-foreground mt-1">{profile.fakultas_jurusan}</p>
            </div>
            {currentUser?.id === profileIdAsString && (
              <Button asChild variant="outline">
                <Link href={`/profile/edit/${profileIdAsString}`}>Edit Profil</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Saat Ini: {profile.aktivitas}</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.aktivitas === 'Pekerja' && profile.alumni_pekerja?.[0] && (
            <div className="space-y-2">
              <p><strong>Instansi:</strong> {profile.alumni_pekerja[0].nama_instansi}</p>
              <p><strong>Posisi:</strong> {profile.alumni_pekerja[0].posisi}</p>
            </div>
          )}
          {profile.aktivitas === 'Bisnis' && profile.alumni_bisnis?.[0] && (
            <div className="space-y-2">
              <p><strong>Nama Usaha:</strong> {profile.alumni_bisnis[0].nama_usaha}</p>
              <p><strong>Bidang Usaha:</strong> {profile.alumni_bisnis[0].bidang_usaha}</p>
            </div>
          )}
          {profile.aktivitas === 'Rumah Tangga' && profile.alumni_rumah_tangga?.[0] && (
            <div className="space-y-2">
              <p><strong>Bidang Minat:</strong> {profile.alumni_rumah_tangga[0].bidang_minat}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {currentUser && currentUser.id === profileIdAsString ? (
        <CollaborationRecommendationButton profile={profile} currentUser={currentUser} />
      ) : (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <CardTitle>Analisis & Wawasan Profil</CardTitle>
            <CardDescription>Wawasan umum berdasarkan profil ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              Rekomendasi kolaborasi khusus hanya tersedia di profil Anda sendiri.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
