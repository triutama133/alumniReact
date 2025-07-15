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

  // --- Konversi ID dan Field Multi-select dari String ke Array ---
  const profileIdAsString = String(profile.id);
  
  const convertStringToArray = (field: string | null | undefined): string[] => {
    return (typeof field === 'string' ? field.split(',').map(s => s.trim()).filter(Boolean) : []);
  };

  const currentAktivitas: AktivitasPekerjaan[] = Array.isArray(profile.aktivitas) 
    ? profile.aktivitas 
    : (typeof profile.aktivitas === 'string' 
      ? (profile.aktivitas.split(',').map((s: string) => s.trim()).filter(Boolean) as AktivitasPekerjaan[])
      : []);

  const skills = convertStringToArray(profile.skill_gabungan);
  const bahasaDikuasai = convertStringToArray(profile.bahasa_dikuasai);
  const jenisDukungan = convertStringToArray(profile.jenis_dukungan_dibutuhkan);
  const bidangKontribusi = convertStringToArray(profile.bidang_kontribusi_minat);
  // --- END Konversi ---

  // --- Helper untuk mengonversi relevant_skills di dalam objek relasi ---
  const getRelevantSkillsArray = (relevantSkillsField: string | null | undefined): string[] => {
    return convertStringToArray(relevantSkillsField);
  };

  // --- DEBUGGING ID ---
  console.log('--- DEBUGGING PROFILE PAGE IDs ---');
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
              <CardTitle className="text-3xl font-bold">{profile.nama_lengkap || 'Nama Lengkap Tidak Tersedia'}</CardTitle>
              <CardDescription className="text-lg">
                {profile.nama_panggilan || 'Tidak ada nama panggilan'} • Tahun Lulus {profile.tahun_kelulusan || 'Tidak diketahui'}
              </CardDescription>
              <p className="text-muted-foreground mt-1">{profile.nama_institusi_pendidikan_terakhir || 'Tidak diketahui'}</p>
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
          <div className="space-y-4">
            {/* Informasi Dasar Tambahan */}
            <h4 className="font-semibold mb-2">Informasi Dasar</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>Tahun Lahir:</strong> {profile.tahun_lahir || 'Tidak diketahui'}</p>
              <p><strong>Jenis Kelamin:</strong> {profile.jenis_kelamin || 'Tidak diketahui'}</p>
              <p><strong>Domisili:</strong> {profile.kota_domisili || 'Tidak diketahui'}</p>
              {/* Nomor Handphone di-exclude sesuai permintaan */}
            </div>

            {/* Pendidikan Tambahan */}
            <h4 className="font-semibold mb-2 mt-4">Pendidikan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>Pendidikan Terakhir:</strong> {profile.pendidikan_terakhir || 'Tidak diketahui'}</p>
              <p><strong>Institusi:</strong> {profile.nama_institusi_pendidikan_terakhir || 'Tidak diketahui'}</p>
              <p><strong>Jurusan:</strong> {profile.jurusan_studi || 'Tidak diketahui'}</p>
            </div>

            {/* Keahlian & Portofolio */}
            <h4 className="font-semibold mb-2 mt-4">Keahlian & Portofolio</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Keahlian:</strong></p>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                )) : <p className="text-muted-foreground">Belum ada keahlian.</p>}
              </div>
              <p><strong>Bahasa Dikuasai:</strong> {bahasaDikuasai.length > 0 ? bahasaDikuasai.join(', ') : 'Tidak disebutkan'}</p>
              <p><strong>Sertifikasi:</strong> {profile.sertifikasi || 'Tidak ada'}</p>
              <p><strong>Instagram:</strong> {profile.instagram_link ? <Link href={profile.instagram_link} target="_blank" className="text-blue-500 hover:underline">{profile.instagram_link}</Link> : 'Tidak ada'}</p>
              <p><strong>LinkedIn:</strong> {profile.linkedin_link ? <Link href={profile.linkedin_link} target="_blank" className="text-blue-500 hover:underline">{profile.linkedin_link}</Link> : 'Tidak ada'}</p>
              <p><strong>Portofolio:</strong> {profile.portofolio_link ? <Link href={profile.portofolio_link} target="_blank" className="text-blue-500 hover:underline">{profile.portofolio_link}</Link> : 'Tidak ada'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Saat Ini: {profile.aktivitas || 'Tidak disebutkan'}</CardTitle>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold mb-2">Aktivitas Utama:</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentAktivitas.length > 0 ? currentAktivitas.map((aktivitas: AktivitasPekerjaan, index: number) => (
              <Badge key={index} variant="default">{aktivitas}</Badge>
            )) : <p className="text-muted-foreground">Belum ada aktivitas.</p>}
          </div>

          {currentAktivitas.includes('Profesional Institusi') && profile.alumni_pekerja?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Profesional Institusi</h5>
              <p><strong>Instansi:</strong> {profile.alumni_pekerja[0].nama_instansi || 'Tidak disebutkan'}</p>
              <p><strong>Posisi:</strong> {profile.alumni_pekerja[0].posisi || 'Tidak disebutkan'}</p>
              <p><strong>Pengalaman Proyek:</strong> {profile.alumni_pekerja[0].pengalaman_proyek || 'Tidak disebutkan'}</p>
              <p><strong>Akses Jejaring:</strong> {profile.alumni_pekerja[0].akses_jejaring ? 'Ya' : 'Tidak'}</p>
              <p><strong>Pengalaman Bermitra:</strong> {profile.alumni_pekerja[0].pengalaman_bermitra ? 'Ya' : 'Tidak'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_pekerja[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Entrepreneur/Wirausaha') && profile.alumni_bisnis?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Entrepreneur/Wirausaha</h5>
              <p><strong>Nama Usaha:</strong> {profile.alumni_bisnis[0].nama_usaha || 'Tidak disebutkan'}</p>
              <p><strong>Produk/Layanan:</strong> {profile.alumni_bisnis[0].produk_layanan_utama || 'Tidak disebutkan'}</p>
              <p><strong>Skala Usaha:</strong> {profile.alumni_bisnis[0].skala_usaha || 'Tidak disebutkan'}</p>
              <p><strong>Kendala Bisnis:</strong> {profile.alumni_bisnis[0].kendala_bisnis || 'Tidak disebutkan'}</p>
              <p><strong>Target Pasar:</strong> {profile.alumni_bisnis[0].target_pasar || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_bisnis[0].keahlian_wirausahaan || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_bisnis[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Pekerja Sosial/NGO') && profile.alumni_sosial?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Pekerja Sosial/NGO</h5>
              <p><strong>Nama Organisasi:</strong> {profile.alumni_sosial[0].nama_organisasi || 'Tidak disebutkan'}</p>
              <p><strong>Isu Fokus:</strong> {profile.alumni_sosial[0].isu_fokus || 'Tidak disebutkan'}</p>
              <p><strong>Pengalaman Proyek:</strong> {profile.alumni_sosial[0].pengalaman_proyek_sosial || 'Tidak disebutkan'}</p>
              <p><strong>Pengalaman Bermitra:</strong> {profile.alumni_sosial[0].pengalaman_bermitra_sosial ? 'Ya' : 'Tidak'}</p>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_sosial[0].keahlian_sosial || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_sosial[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Content Creator/Pekerja Kreatif Digital') && profile.alumni_kreatif?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Content Creator/Pekerja Kreatif Digital</h5>
              <p><strong>Platform Utama:</strong> {profile.alumni_kreatif[0].platform_digital_utama || 'Tidak disebutkan'}</p>
              <p><strong>Jenis Konten:</strong> {profile.alumni_kreatif[0].jenis_konten || 'Tidak disebutkan'}</p>
              <p><strong>Total Jangkauan:</strong> {profile.alumni_kreatif[0].total_jangkauan || 'Tidak disebutkan'}</p>
              <p><strong>Kisaran Rate-Card:</strong> {profile.alumni_kreatif[0].kisaran_rate_card || 'Tidak disebutkan'}</p>
              <p><strong>Demografi Followers:</strong> {profile.alumni_kreatif[0].demografi_followers || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_kreatif[0].keahlian_kreatif || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_kreatif[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Ibu Rumah Tangga') && profile.alumni_rumah_tangga?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Ibu Rumah Tangga</h5>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_rumah_tangga[0].keahlian_irt || 'Tidak disebutkan'}</p>
              <p><strong>Kegiatan/Organisasi:</strong> {profile.alumni_rumah_tangga[0].kegiatan_organisasi_irt || 'Tidak disebutkan'}</p>
              <p><strong>Pengalaman Tim:</strong> {profile.alumni_rumah_tangga[0].pengalaman_tim_irt ? 'Ya' : 'Tidak'}</p>
              <p><strong>Mencari Pekerjaan/Kolaborasi:</strong> {profile.alumni_rumah_tangga[0].mencari_pekerjaan_kolaborasi_irt ? 'Ya' : 'Tidak'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_rumah_tangga[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Mahasiswa dan FG') && profile.alumni_mahasiswa?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Mahasiswa & Fresh Graduate</h5>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_mahasiswa[0].keahlian_mahasiswa || 'Tidak disebutkan'}</p>
              <p><strong>Kegiatan/Organisasi:</strong> {profile.alumni_mahasiswa[0].kegiatan_organisasi_mahasiswa || 'Tidak disebutkan'}</p>
              <p><strong>Pengalaman Tim:</strong> {profile.alumni_mahasiswa[0].pengalaman_tim_mahasiswa ? 'Ya' : 'Tidak'}</p>
              <p><strong>Mencari Pekerjaan/Kolaborasi:</strong> {profile.alumni_mahasiswa[0].mencari_pekerjaan_kolaborasi_mahasiswa ? 'Ya' : 'Tidak'}</p>
              <p><strong>Pengalaman Magang:</strong> {profile.alumni_mahasiswa[0].pengalaman_magang || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_mahasiswa[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Pekerja Informal/Freelance/Harian') && profile.alumni_informal?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Pekerja Informal/Freelance/Harian</h5>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_informal[0].keahlian_informal || 'Tidak disebutkan'}</p>
              <p><strong>Pengalaman Tim:</strong> {profile.alumni_informal[0].pengalaman_tim_informal ? 'Ya' : 'Tidak'}</p>
              <p><strong>Pernah Rekrut/Memimpin:</strong> {profile.alumni_informal[0].pernah_rekrut_memimpin ? 'Ya' : 'Tidak'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_informal[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Petani/Nelayan/Peternak') && profile.alumni_agri?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Petani/Nelayan/Peternak</h5>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_agri[0].keahlian_agri || 'Tidak disebutkan'}</p>
              <p><strong>Komoditas Utama:</strong> {profile.alumni_agri[0].komoditas_utama || 'Tidak disebutkan'}</p>
              <p><strong>Tergabung Kelompok:</strong> {profile.alumni_agri[0].tergabung_kelompok ? 'Ya' : 'Tidak'}</p>
              <p><strong>Skala Usaha:</strong> {profile.alumni_agri[0].skala_usaha_agri || 'Tidak disebutkan'}</p>
              <p><strong>Nilai Tambah Diterapkan:</strong> {profile.alumni_agri[0].nilai_tambah_diterapkan || 'Tidak disebutkan'}</p>
              <p><strong>Kendala Dihadapi:</strong> {profile.alumni_agri[0].kendala_dihadapi_agri || 'Tidak disebutkan'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_agri[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}
          {currentAktivitas.includes('Guru/Tenaga Pendidik') && profile.alumni_pendidik?.[0] && (
            <div className="space-y-2 border p-3 rounded-md mb-2">
              <h5 className="font-semibold text-base">Detail Guru/Tenaga Pendidik</h5>
              <p><strong>Keahlian Utama:</strong> {profile.alumni_pendidik[0].keahlian_pendidik || 'Tidak disebutkan'}</p>
              <p><strong>Jenjang Pendidikan:</strong> {profile.alumni_pendidik[0].jenjang_pendidikan || 'Tidak disebutkan'}</p>
              <p><strong>Mata Pelajaran:</strong> {profile.alumni_pendidik[0].mata_pelajaran || 'Tidak disebutkan'}</p>
              <p><strong>Inovasi Pembelajaran:</strong> {profile.alumni_pendidik[0].inovasi_pembelajaran || 'Tidak disebutkan'}</p>
              <p><strong>Mengajar Bimbel:</strong> {profile.alumni_pendidik[0].mengajar_bimbel ? 'Ya' : 'Tidak'}</p>
              <p><strong>Keahlian Relevan:</strong> {getRelevantSkillsArray(profile.alumni_pendidik[0].relevant_skills).join(', ') || 'Tidak disebutkan'}</p>
            </div>
          )}

          {/* Jenis Dukungan Dibutuhkan */}
          <h4 className="font-semibold mb-2 mt-4">Jenis Dukungan yang Dibutuhkan</h4>
          <div className="flex flex-wrap gap-2">
            {jenisDukungan.length > 0 ? jenisDukungan.map((dukungan: string, index: number) => (
              <Badge key={index} variant="secondary">{dukungan}</Badge>
            )) : <p className="text-muted-foreground">Belum ada jenis dukungan.</p>}
          </div>

          {/* Bidang Kontribusi/Minat */}
          <h4 className="font-semibold mb-2 mt-4">Bidang Kontribusi/Minat</h4>
          <div className="flex flex-wrap gap-2">
            {bidangKontribusi.length > 0 ? bidangKontribusi.map((bidang: string, index: number) => (
              <Badge key={index} variant="secondary">{bidang}</Badge>
            )) : <p className="text-muted-foreground">Belum ada bidang kontribusi.</p>}
          </div>
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
