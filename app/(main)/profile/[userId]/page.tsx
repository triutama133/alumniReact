// app/(main)/profile/[userId]/page.tsx
// PENTING: Pastikan TIDAK ADA 'use client' di atas baris ini.
// File ini adalah Server Component.

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers'; // Import headers
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CollaborationRecommendationButton from '@/components/profile/CollaborationRecommendationButton';
import { AlumniProfileType, CustomUserForProjectCard, AktivitasPekerjaan } from '@/lib/types'; // Import AktivitasPekerjaan

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const cookieStore = await cookies();

  // MENGAMBIL INFORMASI PENGGUNA YANG SEDANG LOGIN DARI HEADER
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

  // Fetch data profil dari alumni_db
  const { data: profile, error } = await supabase
    .from('alumni_db')
    .select(`
      *,
      user(*),
      alumni_pekerja(*),
      alumni_bisnis(*),
      alumni_rumah_tangga(*),
      alumni_sosial(*),
      alumni_kreatif(*),
      alumni_mahasiswa(*),
      alumni_informal(*),
      alumni_agri(*),
      alumni_pendidik(*)
    `)
    .eq('id', params.userId)
    .single() as { data: AlumniProfileType | null, error: unknown };

  if (error || !profile) {
    console.error("Error fetching profile:", (error as Error)?.message || "Profile not found.");
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

  // --- Perbaikan: Konversi ID dan Aktivitas/Multiselect dari String ke Array ---
  const profileIdAsString = String(profile.id); // Konversi profile.id ke string untuk perbandingan
  
  // Konversi aktivitas dari string comma-separated ke array
  const currentAktivitas: AktivitasPekerjaan[] = Array.isArray(profile.aktivitas) 
    ? profile.aktivitas // Jika sudah array (misal dari default value)
    : (typeof profile.aktivitas === 'string' 
      ? (profile.aktivitas.split(',').map((s: string) => s.trim()).filter(Boolean) as AktivitasPekerjaan[])
      : []);

  // Perbaikan: Pastikan skill_gabungan adalah string sebelum split dan berikan tipe eksplisit
  const skills = (typeof profile.skill_gabungan === 'string' ? profile.skill_gabungan : '')
    .split(',')
    .map((s: string) => s.trim()) // Perbaikan: Berikan tipe 's' secara eksplisit
    .filter(Boolean);

  // --- DEBUGGING ID ---
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

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start w-full">
            <div className="flex-grow">
              <CardTitle className="text-3xl font-bold">{profile.nama_lengkap}</CardTitle>
              <CardDescription className="text-lg">
                {profile.nama_panggilan || 'Tidak ada nama panggilan'} • Tahun Lulus {profile.tahun_kelulusan || 'Tidak diketahui'}
              </CardDescription>
              <p className="text-muted-foreground mt-1">{profile.jurusan_studi || 'Tidak diketahui'}</p>
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
          <CardTitle>Aktivitas Saat Ini: {profile.aktivitas || 'Tidak disebutkan'}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentAktivitas.includes('Profesional Institusi') && profile.alumni_pekerja?.[0] && (
            <div className="space-y-2">
              <p><strong>Instansi:</strong> {profile.alumni_pekerja[0].nama_instansi || 'Tidak disebutkan'}</p>
              <p><strong>Posisi:</strong> {profile.alumni_pekerja[0].posisi || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Entrepreneur/Wirausaha') && profile.alumni_bisnis?.[0] && (
            <div className="space-y-2">
              <p><strong>Nama Usaha:</strong> {profile.alumni_bisnis[0].nama_usaha || 'Tidak disebutkan'}</p>
              <p><strong>Bidang Usaha:</strong> {profile.alumni_bisnis[0].produk_layanan_utama || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Pekerja Sosial/NGO') && profile.alumni_sosial?.[0] && (
            <div className="space-y-2">
              <p><strong>Nama Organisasi:</strong> {profile.alumni_sosial[0].nama_organisasi || 'Tidak disebutkan'}</p>
              <p><strong>Isu Fokus:</strong> {profile.alumni_sosial[0].isu_fokus || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Content Creator/Pekerja Kreatif Digital') && profile.alumni_kreatif?.[0] && (
            <div className="space-y-2">
              <p><strong>Platform Utama:</strong> {profile.alumni_kreatif[0].platform_digital_utama || 'Tidak disebutkan'}</p>
              <p><strong>Jenis Konten:</strong> {profile.alumni_kreatif[0].jenis_konten || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Ibu Rumah Tangga') && profile.alumni_rumah_tangga?.[0] && (
            <div className="space-y-2">
              <p><strong>Bidang Minat:</strong> {profile.alumni_rumah_tangga[0].keahlian_irt || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Mahasiswa dan FG') && profile.alumni_mahasiswa?.[0] && (
            <div className="space-y-2">
              <p><strong>Pengalaman Magang:</strong> {profile.alumni_mahasiswa[0].pengalaman_magang || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Pekerja Informal/Freelance/Harian') && profile.alumni_informal?.[0] && (
            <div className="space-y-2">
              <p><strong>Keahlian Utama:</strong> {profile.alumni_informal[0].keahlian_informal || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Petani/Nelayan/Peternak') && profile.alumni_agri?.[0] && (
            <div className="space-y-2">
              <p><strong>Komoditas Utama:</strong> {profile.alumni_agri[0].komoditas_utama || 'Tidak disebutkan'}</p>
              <p><strong>Skala Usaha:</strong> {profile.alumni_agri[0].skala_usaha_agri || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Guru/Tenaga Pendidik') && profile.alumni_pendidik?.[0] && (
            <div className="space-y-2">
              <p><strong>Jenjang Pendidikan:</strong> {profile.alumni_pendidik[0].jenjang_pendidikan || 'Tidak disebutkan'}</p>
              <p><strong>Mata Pelajaran:</strong> {profile.alumni_pendidik[0].mata_pelajaran || 'Tidak disebutkan'}</p>
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
