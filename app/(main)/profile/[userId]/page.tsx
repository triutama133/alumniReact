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
import CareerRecommendationButton from '@/components/profile/CareerRecommendationButton';
import { CustomUserForProjectCard } from '@/lib/types';
import { 
  Briefcase, 
  Store, 
  Users, 
  Paintbrush, 
  Home, 
  GraduationCap, 
  Wrench, 
  Sprout, 
  BookOpen, 
  Instagram, 
  Linkedin, 
  Globe, 
  Phone, 
  MapPin, 
  Mail, 
  Calendar, 
  CheckCircle,
  Award,
  Book,
  Clock,
  ArrowRight,
  Shield,
  MapPinned,
  Sparkles
} from 'lucide-react';

interface ExtendedAlumniProfile {
  id: number;
  created_at: string;
  email: string;
  username: string | null;
  role: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  angkatan: number | null;
  fakultas_jurusan: string | null;
  aktivitas: string | string[] | null;
  skill_gabungan: string | null;
  bahasa_dikuasai: string | null;
  sertifikasi: string | null;
  instagram_link: string | null;
  linkedin_link: string | null;
  portofolio_link: string | null;
  nomor_handphone: string | null;
  kota_domisili: string | null;
  domisili_provinsi: string | null;
  domisili_kota_kabupaten: string | null;
  pendidikan_terakhir: string | null;
  nama_institusi_pendidikan_terakhir: string | null;
  jurusan_studi: string | null;
  tahun_kelulusan: number | null;
  jenis_dukungan_dibutuhkan: string | string[] | null;
  bidang_kontribusi_minat: string | string[] | null;

  alumni_pekerja?: Array<{
    status_keaktifan?: string;
    keahlian_pekerja: string;
    nama_instansi: string;
    posisi: string;
    pengalaman_proyek: string;
    akses_jejaring: boolean;
    pengalaman_bermitra: boolean;
  }>;
  alumni_bisnis?: Array<{
    status_keaktifan?: string;
    keahlian_wirausahaan: string;
    produk_layanan_utama: string;
    nama_usaha: string;
    skala_usaha: string;
    kendala_bisnis: string;
    target_pasar: string;
  }>;
  alumni_sosial?: Array<{
    status_keaktifan?: string;
    keahlian_sosial: string;
    pengalaman_proyek_sosial: string;
    isu_fokus: string;
    nama_organisasi: string;
    pengalaman_bermitra_sosial: boolean;
  }>;
  alumni_kreatif?: Array<{
    status_keaktifan?: string;
    keahlian_kreatif: string;
    platform_digital_utama: string;
    jenis_konten: string;
    total_jangkauan: string;
    kisaran_rate_card: string;
    demografi_followers: string;
  }>;
  alumni_rumah_tangga?: Array<{
    status_keaktifan?: string;
    keahlian_irt: string;
    kegiatan_organisasi_irt: string;
    pengalaman_tim_irt: boolean;
    mencari_pekerjaan_kolaborasi_irt: boolean;
  }>;
  alumni_mahasiswa?: Array<{
    status_keaktifan?: string;
    keahlian_mahasiswa: string;
    kegiatan_organisasi_mahasiswa: string;
    pengalaman_tim_mahasiswa: boolean;
    mencari_pekerjaan_kolaborasi_mahasiswa: boolean;
    pengalaman_magang: string;
  }>;
  alumni_informal?: Array<{
    status_keaktifan?: string;
    keahlian_informal: string;
    pengalaman_tim_informal: boolean;
    pernah_rekrut_memimpin: boolean;
  }>;
  alumni_agri?: Array<{
    status_keaktifan?: string;
    keahlian_agri: string;
    komoditas_utama: string;
    tergabung_kelompok: boolean;
    skala_usaha_agri: string;
    nilai_tambah_diterapkan: string;
    kendala_dihadapi_agri: string;
  }>;
  alumni_pendidik?: Array<{
    status_keaktifan?: string;
    keahlian_pendidik: string;
    jenjang_pendidikan: string;
    mata_pelajaran: string;
    inovasi_pembelajaran: string;
    mengajar_bimbel: boolean;
  }>;
  alumni_education_histories?: Array<{
    id: number;
    level: string;
    institution_name: string;
    major_program: string;
    start_year: number | null;
    end_year: number | null;
    is_current: boolean;
  }>;
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();

  const headersList = await headers();
  const loggedInUserId = headersList.get('x-user-id');
  const loggedInUserEmail = headersList.get('x-user-email');
  const loggedInUserRole = headersList.get('x-user-role');
  const loggedInUserIdNumber = loggedInUserId ? parseInt(loggedInUserId, 10) : null;

  const currentUser: CustomUserForProjectCard | null = loggedInUserIdNumber && loggedInUserEmail
    ? { id: loggedInUserIdNumber, email: loggedInUserEmail, role: loggedInUserRole || null }
    : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: profile, error } = await supabase
    .from('alumni_db')
    .select(`
      *,
      alumni_education_histories(*),
      alumni_pekerja(*),
      alumni_bisnis(*),
      alumni_sosial(*),
      alumni_kreatif(*),
      alumni_rumah_tangga(*),
      alumni_mahasiswa(*),
      alumni_informal(*),
      alumni_agri(*),
      alumni_pendidik(*)
    `)
    .eq('id', resolvedParams.userId)
    .single() as { data: ExtendedAlumniProfile | null, error: unknown };

  if (error || !profile) {
    console.error("Error fetching profile:", (error as Error)?.message || "Profile not found.");
    return (
      <div className="text-center py-20 max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Profil Tidak Ditemukan</h2>
        <p className="text-slate-400 text-sm mb-6">Pengguna ini mungkin belum melengkapi profilnya atau data tidak tersedia di sistem.</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-500 rounded-full px-6">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  const profileIdAsString = String(profile.id);
  const isOwnProfile = currentUser?.id === profile.id;

  // Helper parsing list-like strings from DB (comma, semicolon, or newline separated)
  const parseList = (field: string | string[] | null | undefined): string[] => {
    if (typeof field === 'string') {
      return field
        .split(/[;,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(field)) {
      return field;
    }
    return [];
  };

  const skills = parseList(profile.skill_gabungan);
  const languages = parseList(profile.bahasa_dikuasai);
  const userActivities = parseList(profile.aktivitas);
  const supportNeeded = parseList(profile.jenis_dukungan_dibutuhkan);
  const contributionInterests = parseList(profile.bidang_kontribusi_minat);
  const domicileLabel = profile.domisili_kota_kabupaten && profile.domisili_provinsi
    ? `${profile.domisili_kota_kabupaten}, ${profile.domisili_provinsi}`
    : profile.kota_domisili;

  const educationHistories = [...(profile.alumni_education_histories || [])].sort((a, b) => {
    const aCurrent = a.is_current ? 1 : 0;
    const bCurrent = b.is_current ? 1 : 0;
    if (aCurrent !== bCurrent) {
      return bCurrent - aCurrent;
    }
    const aEnd = a.end_year || 0;
    const bEnd = b.end_year || 0;
    if (aEnd !== bEnd) {
      return bEnd - aEnd;
    }
    return (b.start_year || 0) - (a.start_year || 0);
  });

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TT';
  };

  const renderStatusLabel = (status?: string) => {
    if (!status || status === 'Aktif saat ini') return 'Aktif';
    return status;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 stagger-children">
      
      {/* 1. HEADER CARD (Premium Banner & Avatar) */}
      <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200 overflow-hidden relative shadow-[0_0_50px_rgba(99,102,241,0.05)]">
        <div className="h-28 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-slate-100 dark:border-white/5 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_14px]" />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-indigo-50/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 text-[10px]">
              Alumni
            </Badge>
          </div>
        </div>
        
        <CardContent className="pt-0 pb-6 px-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="h-24 w-24 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] z-10">
              {getInitials(profile.nama_lengkap)}
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{profile.nama_lengkap}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-650 dark:text-slate-300 font-medium">
                {profile.nama_panggilan && (
                  <span className="text-indigo-600 dark:text-indigo-400">"{profile.nama_panggilan}"</span>
                )}
                {profile.angkatan && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Angkatan {profile.angkatan}
                  </span>
                )}
                {profile.fakultas_jurusan && (
                  <span className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-3">
                    <Book className="h-3.5 w-3.5 text-slate-500" />
                    {profile.fakultas_jurusan}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                {domicileLabel && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-550" />
                    {domicileLabel}
                  </span>
                )}
                {isOwnProfile && profile.nomor_handphone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-555" />
                    +{profile.nomor_handphone}
                  </span>
                )}
                {isOwnProfile && profile.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-555" />
                    {profile.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch md:items-center">
            {/* Social Links */}
            <div className="flex items-center gap-1.5 mr-2 justify-center">
              {profile.linkedin_link && (
                <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-indigo-650/10 dark:hover:bg-indigo-600/20 text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-white/5">
                  <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /></a>
                </Button>
              )}
              {profile.instagram_link && (
                <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-pink-650/10 dark:hover:bg-pink-600/20 text-slate-600 dark:text-slate-400 hover:text-pink-750 dark:hover:text-pink-400 transition-all border border-slate-200 dark:border-white/5">
                  <a href={profile.instagram_link} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /></a>
                </Button>
              )}
              {profile.portofolio_link && (
                <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-emerald-650/10 dark:hover:bg-emerald-600/20 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all border border-slate-200 dark:border-white/5">
                  <a href={profile.portofolio_link} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
            
            {isOwnProfile && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="text-xs py-2 px-5 rounded-full border-slate-300 dark:border-white/10">
                  <Link href="/settings">Pengaturan Akun</Link>
                </Button>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-6 rounded-full shadow-lg hover:shadow-indigo-500/20 transition-all">
                  <Link href={`/profile/edit/${profileIdAsString}`}>Pengaturan Profil</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (Personal Attributes, Education, Skills) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Keahlian & Bahasa */}
          <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Keahlian & Bahasa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Utama:</span>
                <div className="flex flex-wrap items-start gap-1.5">
                  {skills.length > 0 ? (
                    skills.map((skill, index) => (
                      <Badge key={index} className="max-w-full whitespace-normal break-words text-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-150 dark:border-indigo-500/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 py-0.5 px-2.5 rounded-full text-[10px]">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Belum mengisi keahlian.</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Bahasa Dikuasai:</span>
                <div className="flex flex-wrap gap-1.5">
                  {languages.length > 0 ? (
                    languages.map((lang, index) => (
                      <Badge key={index} className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-150 dark:border-purple-500/20 hover:bg-purple-100/50 dark:hover:bg-purple-500/20 py-0.5 px-2.5 rounded-full text-[10px]">
                        {lang}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Belum mengisi bahasa.</span>
                  )}
                </div>
              </div>

              {profile.sertifikasi && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <span className="text-slate-550 dark:text-slate-400 block font-semibold">Sertifikasi:</span>
                  <p className="text-slate-700 dark:text-slate-350 leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
                    {profile.sertifikasi}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Riwayat Pendidikan */}
          <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                Riwayat Pendidikan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              {educationHistories.length > 0 ? (
                <div className="space-y-2">
                  {educationHistories.map((edu) => (
                    <div key={edu.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Book className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {edu.level} - {edu.major_program}
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300">{edu.institution_name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {edu.start_year ? `${edu.start_year} - ` : ''}
                          {edu.is_current ? 'Sekarang' : edu.end_year ? String(edu.end_year) : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : profile.pendidikan_terakhir ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Book className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {profile.pendidikan_terakhir} - {profile.jurusan_studi || 'Jurusan N/A'}
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300">{profile.nama_institusi_pendidikan_terakhir}</p>
                      {profile.tahun_kelulusan && (
                        <p className="text-[10px] text-slate-500 mt-0.5">Lulus Tahun: {profile.tahun_kelulusan}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">Belum mengisi riwayat pendidikan.</p>
              )}
            </CardContent>
          </Card>

        </div>
        
        {/* RIGHT COLUMN (Activities Details & Collaboration Needs) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detail Aktivitas Komprehensif */}
          <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Aktivitas & Karir Saat Ini
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">
                Pekerjaan, bisnis, atau proyek aktif yang ditekuni alumni
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {userActivities.length > 0 ? (
                userActivities.map((act) => {
                  if (act === 'Pekerja' && profile.alumni_pekerja?.length) {
                    return profile.alumni_pekerja.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10 bg-indigo-50/40 dark:bg-indigo-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Briefcase className="h-4 w-4 text-indigo-650 dark:text-indigo-450" />
                            Pekerja / Profesional
                          </span>
                          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Nama Instansi / Perusahaan:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.nama_instansi || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Posisi / Jabatan:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.posisi || '-'}</span>
                          </div>
                          {data.keahlian_pekerja && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Utama:</span>
                              <span className="text-slate-700 dark:text-slate-300 leading-normal">{data.keahlian_pekerja}</span>
                            </div>
                          )}
                          {data.pengalaman_proyek && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Pengalaman Proyek Unggulan:</span>
                              <span className="text-slate-700 dark:text-slate-300 leading-normal">{data.pengalaman_proyek}</span>
                            </div>
                          )}
                          <div className="md:col-span-2 flex flex-wrap gap-2 pt-1.5">
                            {data.akses_jejaring && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] font-semibold py-0.5 px-2 rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Memiliki Akses Jejaring Kerja
                              </Badge>
                            )}
                            {data.pengalaman_bermitra && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] font-semibold py-0.5 px-2 rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Berpengalaman Bermitra Kerja
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Bisnis' && profile.alumni_bisnis?.length) {
                    return profile.alumni_bisnis.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/40 dark:bg-emerald-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Store className="h-4 w-4 text-emerald-650 dark:text-emerald-450" />
                            Wirausaha / Entrepreneur
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Nama Usaha:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.nama_usaha || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Skala Usaha:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.skala_usaha || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Target Pasar:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.target_pasar || '-'}</span>
                          </div>
                          {data.produk_layanan_utama && (
                            <div className="md:col-span-2">
                              <span className="text-slate-550 dark:text-slate-400 block font-semibold">Produk / Layanan Utama:</span>
                              <span className="text-slate-700 dark:text-slate-300">{data.produk_layanan_utama}</span>
                            </div>
                          )}
                          {data.keahlian_wirausahaan && (
                            <div className="md:col-span-2">
                              <span className="text-slate-550 dark:text-slate-400 block font-semibold">Keahlian Wirausaha:</span>
                              <span className="text-slate-700 dark:text-slate-300">{data.keahlian_wirausahaan}</span>
                            </div>
                          )}
                          {data.kendala_bisnis && (
                            <div className="md:col-span-2">
                              <span className="text-slate-550 dark:text-slate-400 block font-semibold">Tantangan Bisnis Saat Ini:</span>
                              <span className="text-slate-700 dark:text-slate-300 leading-normal">{data.kendala_bisnis}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Sosial' && profile.alumni_sosial?.length) {
                    return profile.alumni_sosial.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-rose-100 dark:border-rose-500/10 bg-rose-50/40 dark:bg-rose-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Users className="h-4 w-4 text-rose-650 dark:text-rose-455" />
                            Aktivis Sosial / Pemberdayaan
                          </span>
                          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold px-2 py-0.5 bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Nama Organisasi / Komunitas:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.nama_organisasi || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Fokus Isu Utama:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.isu_fokus || '-'}</span>
                          </div>
                          {data.keahlian_sosial && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Bidang Sosial:</span>
                              <span className="text-slate-700 dark:text-slate-300">{data.keahlian_sosial}</span>
                            </div>
                          )}
                          {data.pengalaman_proyek_sosial && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Proyek Pemberdayaan Sukses:</span>
                              <span className="text-slate-700 dark:text-slate-300">{data.pengalaman_proyek_sosial}</span>
                            </div>
                          )}
                          <div className="md:col-span-2 pt-1.5">
                            {data.pengalaman_bermitra_sosial && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] font-semibold py-0.5 px-2 rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Berpengalaman Kemitraan Multipihak
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Kreatif' && profile.alumni_kreatif?.length) {
                    return profile.alumni_kreatif.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-purple-100 dark:border-purple-500/10 bg-purple-50/40 dark:bg-purple-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Paintbrush className="h-4 w-4 text-purple-650 dark:text-purple-450" />
                            Kreator Konten / Freelancer Kreatif
                          </span>
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Utama:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.keahlian_kreatif || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Platform Digital Utama:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.platform_digital_utama || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Jenis Konten:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.jenis_konten || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Jangkauan / Followers:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.total_jangkauan || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Kisaran Rate Card:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.kisaran_rate_card || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Demografi Followers:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.demografi_followers || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Rumah Tangga' && profile.alumni_rumah_tangga?.length) {
                    return profile.alumni_rumah_tangga.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-amber-100 dark:border-amber-500/10 bg-amber-50/45 dark:bg-amber-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Home className="h-4 w-4 text-amber-650 dark:text-amber-450" />
                            Ibu Rumah Tangga / Domestik
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="md:col-span-2">
                            <span className="text-slate-505 dark:text-slate-400 block font-semibold">Keahlian Mandiri / Produktif:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.keahlian_irt || '-'}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-505 dark:text-slate-400 block font-semibold">Kegiatan Organisasi / Komunitas:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.kegiatan_organisasi_irt || '-'}</span>
                          </div>
                          <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
                            {data.pengalaman_tim_irt && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Memiliki Pengalaman Kerja Tim
                              </Badge>
                            )}
                            {data.mencari_pekerjaan_kolaborasi_irt && (
                              <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-150 dark:border-indigo-500/20 text-[9px] rounded hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20">
                                ✓ Terbuka untuk Kolaborasi / Freelance
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Mahasiswa' && profile.alumni_mahasiswa?.length) {
                    return profile.alumni_mahasiswa.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-cyan-100 dark:border-cyan-500/10 bg-cyan-50/40 dark:bg-cyan-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <GraduationCap className="h-4 w-4 text-cyan-650 dark:text-cyan-455" />
                            Mahasiswa Aktif / Studi Lanjutan
                          </span>
                          <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-semibold px-2 py-0.5 bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Utama:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.keahlian_mahasiswa || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Organisasi yang Diikuti:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.kegiatan_organisasi_mahasiswa || '-'}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Pengalaman Magang:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.pengalaman_magang || '-'}</span>
                          </div>
                          <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
                            {data.pengalaman_tim_mahasiswa && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Pengalaman Proyek Berkelompok
                              </Badge>
                            )}
                            {data.mencari_pekerjaan_kolaborasi_mahasiswa && (
                              <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-150 dark:border-indigo-500/20 text-[9px] rounded hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20">
                                ✓ Mencari Magang / Kolaborasi Proyek
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Informal' && profile.alumni_informal?.length) {
                    return profile.alumni_informal.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-orange-100 dark:border-orange-500/10 bg-orange-50/40 dark:bg-orange-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Wrench className="h-4 w-4 text-orange-650 dark:text-orange-450" />
                            Pekerja Sektor Informal
                          </span>
                          <span className="text-[10px] text-orange-700 dark:text-orange-300 font-semibold px-2 py-0.5 bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Mandiri:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.keahlian_informal || '-'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {data.pengalaman_tim_informal && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Berpengalaman Kerja Tim
                              </Badge>
                            )}
                            {data.pernah_rekrut_memimpin && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Pernah Merekrut & Memimpin Orang
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Agri' && profile.alumni_agri?.length) {
                    return profile.alumni_agri.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-green-100 dark:border-green-500/10 bg-green-50/40 dark:bg-green-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <Sprout className="h-4 w-4 text-green-650 dark:text-green-450" />
                            Agribisnis / Pertanian / Peternakan
                          </span>
                          <span className="text-[10px] text-green-700 dark:text-green-300 font-semibold px-2 py-0.5 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Agribisnis:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.keahlian_agri || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Komoditas Utama:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.komoditas_utama || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Skala Usaha Agribisnis:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.skala_usaha_agri || '-'}</span>
                          </div>
                          {data.nilai_tambah_diterapkan && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Nilai Tambah / Teknologi Diterapkan:</span>
                              <span className="text-slate-700 dark:text-slate-300">{data.nilai_tambah_diterapkan}</span>
                            </div>
                          )}
                          {data.kendala_dihadapi_agri && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Kendala Bisnis Pertanian:</span>
                              <span className="text-slate-700 dark:text-slate-300">{data.kendala_dihadapi_agri}</span>
                            </div>
                          )}
                          <div className="md:col-span-2 pt-1">
                            {data.tergabung_kelompok && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Tergabung dalam Kelompok Tani / Koperasi
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  if (act === 'Pendidik' && profile.alumni_pendidik?.length) {
                    return profile.alumni_pendidik.map((data, index) => (
                      <div key={`${act}-${index}`} className="p-4 rounded-xl border border-teal-100 dark:border-teal-500/10 bg-teal-50/40 dark:bg-teal-950/10 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                          <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                            <BookOpen className="h-4 w-4 text-teal-650 dark:text-teal-450" />
                            Pendidik / Dosen / Guru
                          </span>
                          <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold px-2 py-0.5 bg-teal-100 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-full">
                            {renderStatusLabel(data.status_keaktifan)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keahlian Mengajar:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.keahlian_pendidik || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Jenjang Mengajar:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.jenjang_pendidikan || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Mata Pelajaran / Bidang Studi:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{data.mata_pelajaran || '-'}</span>
                          </div>
                          {data.inovasi_pembelajaran && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Inovasi / Metode Pembelajaran Baru:</span>
                              <span className="text-slate-700 dark:text-slate-300 leading-normal">{data.inovasi_pembelajaran}</span>
                            </div>
                          )}
                          <div className="md:col-span-2 pt-1">
                            {data.mengajar_bimbel && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-500/20 text-[9px] rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20">
                                ✓ Mengajar Bimbingan Belajar / Les Privat
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  return null;
                })
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                  <p className="text-slate-500 dark:text-slate-400 text-xs italic">Alumni belum menambahkan aktivitas saat ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Kolaborasi & Dukungan */}
          <Card className="premium-light-card liquid-glass-border text-slate-800 dark:text-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                Kebutuhan & Rencana Kolaborasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              <div className="space-y-3 p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/25">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400" />
                  Dukungan yang Dibutuhkan:
                </span>
                <ul className="space-y-1.5 pl-1.5">
                  {supportNeeded.length > 0 ? (
                    supportNeeded.map((sup, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-normal">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{sup}</span>
                      </li>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Belum mengisi dukungan.</span>
                  )}
                </ul>
              </div>
              
              <div className="space-y-3 p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/25">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-655 dark:text-indigo-400" />
                  Minat Bidang Kontribusi:
                </span>
                <ul className="space-y-1.5 pl-1.5">
                  {contributionInterests.length > 0 ? (
                    contributionInterests.map((interest, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-normal">
                        <CheckCircle className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>{interest}</span>
                      </li>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Belum mengisi kontribusi minat.</span>
                  )}
                </ul>
              </div>

            </CardContent>
          </Card>

        </div>
        
      </div>

      {/* 4. AI INSIGHTS WIDGET */}
      {isOwnProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 stagger-children">
          <CollaborationRecommendationButton profile={profile as any} currentUser={currentUser} />
          <CareerRecommendationButton profile={profile as any} currentUser={currentUser} />
        </div>
      )}
      
    </div>
  );
}
