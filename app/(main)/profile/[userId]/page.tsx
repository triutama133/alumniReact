// app/(main)/profile/[userId]/page.tsx
// PENTING: Pastikan TIDAK ADA 'use client' di atas baris ini.
// File ini adalah Server Component.

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers'; // Import headers
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CollaborationRecommendationButton from '@/components/profile/CollaborationRecommendationButton'; // Import Client Component baru
import { AlumniProfileType, CustomUserForProjectCard } from '@/lib/types'; // Import tipe yang benar

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const cookieStore = await cookies();

  // MENGAMBIL INFORMASI PENGGUNA YANG SEDANG LOGIN DARI HEADER
  const headersList = await headers(); // Pastikan ada await
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

  // Fetch data profil dari alumni_db
  const { data: profile, error } = await supabase
    .from('alumni_db') // Pastikan nama tabel benar
    .select(`
      *,
      alumni_pekerja(*),
      alumni_bisnis(*),
      alumni_rumah_tangga(*)
    `)
    .eq('id', params.userId) // Gunakan params.userId (string) untuk kueri
    .single() as { data: AlumniProfileType | null, error: any }; // Type assertion

  if (error || !profile) {
    console.error("Error fetching profile:", error?.message || "Profile not found.");
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

  // --- DEBUGGING ID (Perbaikan) ---
  const profileIdAsString = String(profile.id); // Konversi profile.id ke string
  console.log('--- DEBUGGING PROFILE PAGE IDs (Perbaikan) ---');
  console.log(`currentUser.id: ${currentUser?.id} (tipe: ${typeof currentUser?.id})`);
  console.log(`profile.id: ${profile.id} (tipe: ${typeof profile.id})`);
  console.log(`profileIdAsString: ${profileIdAsString} (tipe: ${typeof profileIdAsString})`);
  console.log(`params.userId: ${params.userId} (tipe: ${typeof params.userId})`);
  console.log(`Perbandingan: currentUser?.id === profileIdAsString -> ${currentUser?.id === profileIdAsString}`);
  console.log(`Perbandingan: params.userId === profileIdAsString -> ${params.userId === profileIdAsString}`);
  console.log(`Perbandingan: currentUser?.id === params.userId -> ${currentUser?.id === params.userId}`);
  console.log('---------------------------------');
  // --- END DEBUGGING ID ---

  const skills = profile.skill_gabungan?.split(',').map((skill: string) => skill.trim()).filter(Boolean) || [];

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start w-full"> {/* Tambahkan w-full untuk layout */}
            <div className="flex-grow"> {/* Gunakan flex-grow agar div ini mengambil ruang */}
              <CardTitle className="text-3xl font-bold">{profile.nama_lengkap}</CardTitle>
              <CardDescription className="text-lg">
                {profile.nama_panggilan} • Angkatan {profile.angkatan}
              </CardDescription>
              <p className="text-muted-foreground mt-1">{profile.fakultas_jurusan}</p>
            </div>
            {/* Tampilkan tombol edit jika user yang login adalah pemilik profil */}
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

      {/* Tampilkan Komponen Rekomendasi Kolaborasi hanya jika user yang login adalah pemilik profil */}
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
