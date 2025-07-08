// app/(auth)/complete-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { AlumniProfileType, PendidikanTerakhir, AktivitasPekerjaan, JenisDukungan, BidangKontribusi } from '@/lib/types';

// --- Zod Schema untuk Validasi Form ---
const formSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi.'),
  nama_panggilan: z.string().min(1, 'Nama panggilan wajib diisi.'),
  tahun_lahir: z.number().int().min(1900, 'Tahun lahir tidak valid.').max(new Date().getFullYear(), 'Tahun lahir tidak boleh di masa depan.'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], { message: 'Jenis kelamin wajib dipilih.' }),
  kota_domisili: z.string().min(1, 'Kota/kabupaten domisili wajib diisi.'),
  nomor_handphone: z.string().regex(/^62\d{9,12}$/, 'Nomor handphone tidak valid (diawali 62, 10-13 digit).'),
  pendidikan_terakhir: z.enum(['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'], { message: 'Pendidikan terakhir wajib dipilih.' }),
  nama_institusi_pendidikan_terakhir: z.string().min(1, 'Nama institusi wajib diisi.'),
  jurusan_studi: z.string().min(1, 'Jurusan/program studi wajib diisi.'),
  tahun_kelulusan: z.number().int().min(1900, 'Tahun kelulusan tidak valid.').max(new Date().getFullYear() + 5, 'Tahun kelulusan tidak boleh terlalu jauh di masa depan.'),
  skill_gabungan: z.string().min(1, 'Keahlian wajib diisi (pisahkan dengan koma).'),
  bahasa_dikuasai: z.string().min(1, 'Bahasa yang dikuasai wajib diisi (pisahkan dengan koma).'),
  sertifikasi: z.string().optional().nullable(),
  instagram_link: z.string().url('Format URL Instagram tidak valid.').or(z.literal('')).optional().nullable(),
  linkedin_link: z.string().url('Format URL LinkedIn tidak valid.').or(z.literal('')).optional().nullable(),
  portofolio_link: z.string().url('Format URL portofolio tidak valid.').or(z.literal('')).optional().nullable(),

  aktivitas: z.array(z.enum([
    'Profesional Institusi', 'Entrepreneur/Wirausaha', 'Pekerja Sosial/NGO', 'Content Creator/Pekerja Kreatif Digital',
    'Belum Bekerja', 'Pekerja Informal/Freelance/Harian', 'Petani/Nelayan/Peternak', 'Guru/Tenaga Pendidik',
    'Ibu Rumah Tangga', 'Mahasiswa dan FG'
  ])).min(1, 'Pilih minimal satu aktivitas/pekerjaan.'),

  jenis_dukungan_dibutuhkan: z.array(z.enum([
    'Peluang kerja', 'Kolaborasi proyek', 'Mentor', 'Pendamping usaha', 'Relasi profesional', 'Akses pasar', 'Lainnya'
  ])).min(1, 'Pilih minimal satu jenis dukungan.'),

  bidang_kontribusi_minat: z.array(z.enum([
    'Pendidikan', 'Lingkungan', 'Ekonomi', 'Teknologi', 'Kesehatan', 'Komunitas', 'Kreatif',
    'Pertanian/Pangan', 'Perikanan', 'Peternakan'
  ])).min(1, 'Pilih minimal satu bidang kontribusi.'),

  alumni_pekerja: z.array(z.object({
    nama_instansi: z.string().min(1, 'Nama instansi wajib diisi.'),
    posisi: z.string().min(1, 'Posisi wajib diisi.'),
    pengalaman_proyek: z.string().min(1, 'Pengalaman proyek wajib diisi.'),
    akses_jejaring: z.boolean(),
    pengalaman_bermitra: z.boolean(),
  })).optional(),
  alumni_bisnis: z.array(z.object({
    keahlian_wirausahaan: z.string().min(1, 'Keahlian kewirausahaan wajib diisi.'),
    produk_layanan_utama: z.string().min(1, 'Produk/layanan utama wajib diisi.'),
    nama_usaha: z.string().min(1, 'Nama usaha wajib diisi.'),
    skala_usaha: z.string().min(1, 'Skala usaha wajib diisi.'),
    kendala_bisnis: z.string().min(1, 'Kendala bisnis wajib diisi.'),
    target_pasar: z.enum(['B2C', 'B2B', 'B2C dan B2B'], { message: 'Target pasar wajib dipilih.' }),
  })).optional(),
  alumni_sosial: z.array(z.object({
    keahlian_sosial: z.string().min(1, 'Keahlian sosial wajib diisi.'),
    pengalaman_proyek_sosial: z.string().min(1, 'Pengalaman proyek sosial wajib diisi.'),
    isu_fokus: z.string().min(1, 'Isu sosial/lingkungan fokus wajib diisi.'),
    nama_organisasi: z.string().min(1, 'Nama organisasi wajib diisi.'),
    pengalaman_bermitra_sosial: z.boolean(),
  })).optional(),
  alumni_kreatif: z.array(z.object({
    keahlian_kreatif: z.string().min(1, 'Keahlian kreatif wajib diisi.'),
    platform_digital_utama: z.string().min(1, 'Platform digital utama wajib diisi.'),
    jenis_konten: z.string().min(1, 'Jenis konten wajib diisi.'),
    total_jangkauan: z.string().min(1, 'Total jangkauan wajib diisi.'),
    kisaran_rate_card: z.string().min(1, 'Kisaran rate-card wajib diisi.'),
    demografi_followers: z.string().min(1),
  })).optional(),
  alumni_rumah_tangga: z.array(z.object({
    keahlian_irt: z.string().min(1),
    kegiatan_organisasi_irt: z.string().min(1),
    pengalaman_tim_irt: z.boolean(),
    mencari_pekerjaan_kolaborasi_irt: z.boolean(),
  })).optional(),
  alumni_mahasiswa: z.array(z.object({
    keahlian_mahasiswa: z.string().min(1),
    kegiatan_organisasi_mahasiswa: z.string().min(1),
    pengalaman_tim_mahasiswa: z.boolean(),
    mencari_pekerjaan_kolaborasi_mahasiswa: z.boolean(),
    pengalaman_magang: z.string().min(1),
  })).optional(),
  alumni_informal: z.array(z.object({
    keahlian_informal: z.string().min(1),
    pengalaman_tim_informal: z.boolean(),
    pernah_rekrut_memimpin: z.boolean(),
  })).optional(),
  alumni_agri: z.array(z.object({
    keahlian_agri: z.string().min(1),
    komoditas_utama: z.string().min(1),
    tergabung_kelompok: z.boolean(),
    skala_usaha_agri: z.string().min(1),
    nilai_tambah_diterapkan: z.string().min(1),
    kendala_dihadapi_agri: z.string().min(1),
  })).optional(),
  alumni_pendidik: z.array(z.object({
    keahlian_pendidik: z.string().min(1),
    jenjang_pendidikan: z.string().min(1),
    mata_pelajaran: z.string().min(1),
    inovasi_pembelajaran: z.string().min(1),
    mengajar_bimbel: z.boolean(),
  })).optional(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  nama_lengkap: '',
  nama_panggilan: '',
  tahun_lahir: undefined,
  jenis_kelamin: undefined,
  kota_domisili: '',
  nomor_handphone: '',
  pendidikan_terakhir: undefined,
  nama_institusi_pendidikan_terakhir: '',
  jurusan_studi: '',
  tahun_kelulusan: undefined,
  skill_gabungan: '',
  bahasa_dikuasai: '',
  sertifikasi: '',
  instagram_link: '',
  linkedin_link: '',
  portofolio_link: '',
  aktivitas: [],
  jenis_dukungan_dibutuhkan: [],
  bidang_kontribusi_minat: [],
  alumni_pekerja: [],
  alumni_bisnis: [],
  alumni_sosial: [],
  alumni_kreatif: [],
  alumni_rumah_tangga: [],
  alumni_mahasiswa: [],
  alumni_informal: [],
  alumni_agri: [],
  alumni_pendidik: [],
};


export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, register, control, watch, setValue, formState: { errors, isSubmitting } } = form;

  const selectedAktivitas = watch('aktivitas');

  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      try {
        const response = await fetch('/api/get-profile');
        if (!response.ok) {
          throw new Error('Gagal memuat data profil.');
        }
        const data: AlumniProfileType = await response.json();
        
        Object.keys(data).forEach(key => {
          if (key in defaultValues) {
            if (Array.isArray(defaultValues[key as keyof typeof defaultValues]) && typeof (data as any)[key] === 'string') {
              setValue(key as keyof ProfileFormValues, ((data as any)[key] as string).split(',').map(s => s.trim()).filter(Boolean) as any);
            } else {
              setValue(key as keyof ProfileFormValues, (data as any)[key] as any);
            }
          }
        });

      } catch (error: unknown) {
        console.error('Error fetching profile data:', error);
        setSubmitError('Gagal memuat data profil awal.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [setValue]);


  const onSubmit = async (data: ProfileFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);
    console.log('Form Data:', data);

    // --- Transformasi data sebelum dikirim ke API ---
    // Buat objek baru untuk menghindari masalah 'delete' pada properti wajib
    const {
      aktivitas,
      jenis_dukungan_dibutuhkan,
      bidang_kontribusi_minat,
      ...restOfData
    } = data;

    const transformedData: Record<string, any> = {
      ...restOfData,
      aktivitas_db: aktivitas.join(','),
      jenis_dukungan_dibutuhkan_db: jenis_dukungan_dibutuhkan.join(','),
      bidang_kontribusi_minat_db: bidang_kontribusi_minat.join(','),
    };

    // Pastikan properti relasi juga disalin dengan benar
    if (data.alumni_pekerja) transformedData.alumni_pekerja = data.alumni_pekerja;
    if (data.alumni_bisnis) transformedData.alumni_bisnis = data.alumni_bisnis;
    if (data.alumni_sosial) transformedData.alumni_sosial = data.alumni_sosial;
    if (data.alumni_kreatif) transformedData.alumni_kreatif = data.alumni_kreatif;
    if (data.alumni_rumah_tangga) transformedData.alumni_rumah_tangga = data.alumni_rumah_tangga;
    if (data.alumni_mahasiswa) transformedData.alumni_mahasiswa = data.alumni_mahasiswa;
    if (data.alumni_informal) transformedData.alumni_informal = data.alumni_informal;
    if (data.alumni_agri) transformedData.alumni_agri = data.alumni_agri;
    if (data.alumni_pendidik) transformedData.alumni_pendidik = data.alumni_pendidik;
    // --- Akhir transformasi data ---

    try {
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Gagal menyimpan profil.');
        console.error('API Error:', result.error);
      } else {
        setSuccessMessage('Profil berhasil disimpan!');
        router.push('/');
      }
    } catch (error: unknown) {
      setSubmitError('Terjadi kesalahan jaringan atau yang tidak terduga.');
      console.error('Submit Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Lengkapi Profil Anda</CardTitle>
          <CardDescription>
            Mohon lengkapi informasi profil Anda untuk membantu kami menghubungkan Anda dengan peluang yang relevan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Bagian 1: Informasi Umum */}
            <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                <Input id="nama_lengkap" {...register('nama_lengkap')} />
                {errors.nama_lengkap && <p className="text-red-500 text-sm">{errors.nama_lengkap.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_panggilan">Nama Panggilan</Label>
                <Input id="nama_panggilan" {...register('nama_panggilan')} />
                {errors.nama_panggilan && <p className="text-red-500 text-sm">{errors.nama_panggilan.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun_lahir">Tahun Lahir</Label>
                <Input id="tahun_lahir" type="number" {...register('tahun_lahir', { valueAsNumber: true })} />
                {errors.tahun_lahir && <p className="text-red-500 text-sm">{errors.tahun_lahir.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <RadioGroup onValueChange={(value) => setValue('jenis_kelamin', value as 'Laki-laki' | 'Perempuan')} value={watch('jenis_kelamin')}>
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="laki-laki" className="flex items-center space-x-2">
                      <RadioGroupItem value="Laki-laki" id="laki-laki" />
                      <span>Laki-laki</span>
                    </Label>
                    <Label htmlFor="perempuan" className="flex items-center space-x-2">
                      <RadioGroupItem value="Perempuan" id="perempuan" />
                      <span>Perempuan</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.jenis_kelamin && <p className="text-red-500 text-sm">{errors.jenis_kelamin.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kota_domisili">Kota/Kabupaten Domisili</Label>
                <Input id="kota_domisili" {...register('kota_domisili')} />
                {errors.kota_domisili && <p className="text-red-500 text-sm">{errors.kota_domisili.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor_handphone">Nomor Handphone (diawali 62)</Label>
                <Input id="nomor_handphone" type="tel" {...register('nomor_handphone')} />
                {errors.nomor_handphone && <p className="text-red-500 text-sm">{errors.nomor_handphone.message}</p>}
              </div>
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 mt-6">Pendidikan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pendidikan_terakhir">Pendidikan Terakhir</Label>
                <Select onValueChange={(value) => setValue('pendidikan_terakhir', value as PendidikanTerakhir)} value={watch('pendidikan_terakhir')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'].map(edu => (
                      <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pendidikan_terakhir && <p className="text-red-500 text-sm">{errors.pendidikan_terakhir.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_institusi_pendidikan_terakhir">Nama Institusi</Label>
                <Input id="nama_institusi_pendidikan_terakhir" {...register('nama_institusi_pendidikan_terakhir')} />
                {errors.nama_institusi_pendidikan_terakhir && <p className="text-red-500 text-sm">{errors.nama_institusi_pendidikan_terakhir.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurusan_studi">Jurusan/Program Studi</Label>
                <Input id="jurusan_studi" {...register('jurusan_studi')} />
                {errors.jurusan_studi && <p className="text-red-500 text-sm">{errors.jurusan_studi.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun_kelulusan">Tahun Kelulusan</Label>
                <Input id="tahun_kelulusan" type="number" {...register('tahun_kelulusan', { valueAsNumber: true })} />
                {errors.tahun_kelulusan && <p className="text-red-500 text-sm">{errors.tahun_kelulusan.message}</p>}
              </div>
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 mt-6">Keahlian & Portofolio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill_gabungan">Keahlian (pisahkan dengan koma)</Label>
                <Textarea id="skill_gabungan" {...register('skill_gabungan')} />
                {errors.skill_gabungan && <p className="text-red-500 text-sm">{errors.skill_gabungan.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bahasa_dikuasai">Bahasa yang Dikuasai (pisahkan dengan koma)</Label>
                <Textarea id="bahasa_dikuasai" {...register('bahasa_dikuasai')} />
                {errors.bahasa_dikuasai && <p className="text-red-500 text-sm">{errors.bahasa_dikuasai.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sertifikasi">Sertifikasi yang Dimiliki</Label>
                <Textarea id="sertifikasi" {...register('sertifikasi')} />
                {errors.sertifikasi && <p className="text-red-500 text-sm">{errors.sertifikasi.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_link">Tautan Instagram</Label>
                <Input id="instagram_link" type="url" {...register('instagram_link')} />
                {errors.instagram_link && <p className="text-red-500 text-sm">{errors.instagram_link.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin_link">Tautan LinkedIn</Label>
                <Input id="linkedin_link" type="url" {...register('linkedin_link')} />
                {errors.linkedin_link && <p className="text-red-500 text-sm">{errors.linkedin_link.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="portofolio_link">Tautan Portofolio/Karya</Label>
                <Input id="portofolio_link" type="url" {...register('portofolio_link')} />
                {errors.portofolio_link && <p className="text-red-500 text-sm">{errors.portofolio_link.message}</p>}
              </div>
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 mt-6">Aktivitas & Kebutuhan</h3>
            <div className="space-y-2">
              <Label>Apa saja aktivitas atau pekerjaan yang sedang Anda jalani saat ini?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(['Profesional Institusi', 'Entrepreneur/Wirausaha', 'Pekerja Sosial/NGO', 'Content Creator/Pekerja Kreatif Digital',
                  'Belum Bekerja', 'Pekerja Informal/Freelance/Harian', 'Petani/Nelayan/Peternak', 'Guru/Tenaga Pendidik',
                  'Ibu Rumah Tangga', 'Mahasiswa dan FG'] as AktivitasPekerjaan[]).map((aktivitas) => (
                  <Label key={aktivitas} className="flex items-center space-x-2 font-normal">
                    <Checkbox
                      checked={selectedAktivitas.includes(aktivitas)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue('aktivitas', [...selectedAktivitas, aktivitas]);
                        } else {
                          setValue('aktivitas', selectedAktivitas.filter((item) => item !== aktivitas));
                        }
                      }}
                    />
                    <span>{aktivitas}</span>
                  </Label>
                ))}
              </div>
              {errors.aktivitas && <p className="text-red-500 text-sm">{errors.aktivitas.message}</p>}
            </div>

            {/* --- Conditional Fields berdasarkan Aktivitas --- */}
            {selectedAktivitas.includes('Profesional Institusi') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Profesional Institusi</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pekerja.0.nama_instansi">Nama Instansi</Label>
                  <Input id="alumni_pekerja.0.nama_instansi" {...register('alumni_pekerja.0.nama_instansi')} />
                  {errors.alumni_pekerja?.[0]?.nama_instansi && <p className="text-red-500 text-sm">{errors.alumni_pekerja[0].nama_instansi.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pekerja.0.posisi">Posisi</Label>
                  <Input id="alumni_pekerja.0.posisi" {...register('alumni_pekerja.0.posisi')} />
                  {errors.alumni_pekerja?.[0]?.posisi && <p className="text-red-500 text-sm">{errors.alumni_pekerja[0].posisi.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pekerja.0.pengalaman_proyek">Pengalaman Program/Proyek Kerja</Label>
                  <Textarea id="alumni_pekerja.0.pengalaman_proyek" {...register('alumni_pekerja.0.pengalaman_proyek')} />
                  {errors.alumni_pekerja?.[0]?.pengalaman_proyek && <p className="text-red-500 text-sm">{errors.alumni_pekerja[0].pengalaman_proyek.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_pekerja.0.akses_jejaring" {...register('alumni_pekerja.0.akses_jejaring')} />
                  <Label htmlFor="alumni_pekerja.0.akses_jejaring">Memiliki akses jejaring/koneksi strategis?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_pekerja.0.pengalaman_bermitra" {...register('alumni_pekerja.0.pengalaman_bermitra')} />
                  <Label htmlFor="alumni_pekerja.0.pengalaman_bermitra">Memiliki pengalaman bermitra dengan sektor lain?</Label>
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Entrepreneur/Wirausaha') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Entrepreneur/Wirausaha</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_bisnis.0.keahlian_wirausahaan">Keahlian Utama Kewirausahaan</Label>
                  <Textarea id="alumni_bisnis.0.keahlian_wirausahaan" {...register('alumni_bisnis.0.keahlian_wirausahaan')} />
                  {errors.alumni_bisnis?.[0]?.keahlian_wirausahaan && <p className="text-red-500 text-sm">{errors.alumni_bisnis[0].keahlian_wirausahaan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_bisnis.0.produk_layanan_utama">Produk/Layanan Utama</Label>
                  <Input id="alumni_bisnis.0.produk_layanan_utama" {...register('alumni_bisnis.0.produk_layanan_utama')} />
                  {errors.alumni_bisnis?.[0]?.produk_layanan_utama && <p className="text-red-500 text-sm">{errors.alumni_bisnis[0].produk_layanan_utama.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_bisnis.0.nama_usaha">Nama Entitas/Badan Usaha</Label>
                  <Input id="alumni_bisnis.0.nama_usaha" {...register('alumni_bisnis.0.nama_usaha')} />
                  {errors.alumni_bisnis?.[0]?.nama_usaha && <p className="text-red-500 text-sm">{errors.alumni_bisnis[0].nama_usaha.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_bisnis.0.skala_usaha">Skala Usaha (Cakupan Pasar & Omzet)</Label>
                  <Textarea id="alumni_bisnis.0.skala_usaha" {...register('alumni_bisnis.0.skala_usaha')} />
                  {errors.alumni_bisnis?.[0]?.skala_usaha && <p className="text-red-500 text-sm">{errors.alumni_bisnis[0].skala_usaha.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_bisnis.0.kendala_bisnis">Kendala yang Dihadapi</Label>
                  <Textarea id="alumni_bisnis.0.kendala_bisnis" {...register('alumni_bisnis.0.kendala_bisnis')} />
                  {errors.alumni_bisnis?.[0]?.kendala_bisnis && <p className="text-red-500 text-sm">{errors.alumni_bisnis[0].kendala_bisnis.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Target Pasar</Label>
                  <RadioGroup onValueChange={(value) => setValue('alumni_bisnis.0.target_pasar', value as 'B2C' | 'B2B' | 'B2C dan B2B')} value={watch('alumni_bisnis.0.target_pasar')}>
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="b2c" className="flex items-center space-x-2">
                        <RadioGroupItem value="B2C" id="b2c" />
                        <span>B2C</span>
                      </Label>
                      <Label htmlFor="b2b" className="flex items-center space-x-2">
                        <RadioGroupItem value="B2B" id="b2b" />
                        <span>B2B</span>
                      </Label>
                      <Label htmlFor="b2c-b2b" className="flex items-center space-x-2">
                        <RadioGroupItem value="B2C dan B2B" id="b2c-b2b" />
                        <span>B2C dan B2B</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.alumni_bisnis?.[0]?.target_pasar && <p className="text-red-500 text-sm">{errors.alumni_bisnis[0].target_pasar.message}</p>}
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Pekerja Sosial/NGO') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Pekerja Sosial/NGO</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_sosial.0.keahlian_sosial">Keahlian Utama</Label>
                  <Textarea id="alumni_sosial.0.keahlian_sosial" {...register('alumni_sosial.0.keahlian_sosial')} />
                  {errors.alumni_sosial?.[0]?.keahlian_sosial && <p className="text-red-500 text-sm">{errors.alumni_sosial[0].keahlian_sosial.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_sosial.0.pengalaman_proyek_sosial">Pengalaman Program/Proyek Kerja</Label>
                  <Textarea id="alumni_sosial.0.pengalaman_proyek_sosial" {...register('alumni_sosial.0.pengalaman_proyek_sosial')} />
                  {errors.alumni_sosial?.[0]?.pengalaman_proyek_sosial && <p className="text-red-500 text-sm">{errors.alumni_sosial[0].pengalaman_proyek_sosial.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_sosial.0.isu_fokus">Isu Sosial/Lingkungan Fokus Utama</Label>
                  <Input id="alumni_sosial.0.isu_fokus" {...register('alumni_sosial.0.isu_fokus')} />
                  {errors.alumni_sosial?.[0]?.isu_fokus && <p className="text-red-500 text-sm">{errors.alumni_sosial[0].isu_fokus.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_sosial.0.nama_organisasi">Nama Organisasi/Lembaga</Label>
                  <Input id="alumni_sosial.0.nama_organisasi" {...register('alumni_sosial.0.nama_organisasi')} />
                  {errors.alumni_sosial?.[0]?.nama_organisasi && <p className="text-red-500 text-sm">{errors.alumni_sosial[0].nama_organisasi.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_sosial.0.pengalaman_bermitra_sosial" {...register('alumni_sosial.0.pengalaman_bermitra_sosial')} />
                  <Label htmlFor="alumni_sosial.0.pengalaman_bermitra_sosial">Memiliki pengalaman bermitra dengan sektor lain?</Label>
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Content Creator/Pekerja Kreatif Digital') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Content Creator/Pekerja Kreatif Digital</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_kreatif.0.keahlian_kreatif">Keahlian Utama</Label>
                  <Textarea id="alumni_kreatif.0.keahlian_kreatif" {...register('alumni_kreatif.0.keahlian_kreatif')} />
                  {errors.alumni_kreatif?.[0]?.keahlian_kreatif && <p className="text-red-500 text-sm">{errors.alumni_kreatif[0].keahlian_kreatif.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_kreatif.0.platform_digital_utama">Platform Digital Utama</Label>
                  <Input id="alumni_kreatif.0.platform_digital_utama" {...register('alumni_kreatif.0.platform_digital_utama')} />
                  {errors.alumni_kreatif?.[0]?.platform_digital_utama && <p className="text-red-500 text-sm">{errors.alumni_kreatif[0].platform_digital_utama.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_kreatif.0.jenis_konten">Jenis Konten</Label>
                  <Input id="alumni_kreatif.0.jenis_konten" {...register('alumni_kreatif.0.jenis_konten')} />
                  {errors.alumni_kreatif?.[0]?.jenis_konten && <p className="text-red-500 text-sm">{errors.alumni_kreatif[0].jenis_konten.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_kreatif.0.total_jangkauan">Total Jangkauan (Followers/Subscribers)</Label>
                  <Input id="alumni_kreatif.0.total_jangkauan" {...register('alumni_kreatif.0.total_jangkauan')} />
                  {errors.alumni_kreatif?.[0]?.total_jangkauan && <p className="text-red-500 text-sm">{errors.alumni_kreatif[0].total_jangkauan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_kreatif.0.kisaran_rate_card">Kisaran Rate-Card</Label>
                  <Input id="alumni_kreatif.0.kisaran_rate_card" {...register('alumni_kreatif.0.kisaran_rate_card')} />
                  {errors.alumni_kreatif?.[0]?.kisaran_rate_card && <p className="text-red-500 text-sm">{errors.alumni_kreatif[0].kisaran_rate_card.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_kreatif.0.demografi_followers">Demografi Followers/Subscribers</Label>
                  <Textarea id="alumni_kreatif.0.demografi_followers" {...register('alumni_kreatif.0.demografi_followers')} />
                  {errors.alumni_kreatif?.[0]?.demografi_followers && <p className="text-red-500 text-sm">{errors.alumni_kreatif[0].demografi_followers.message}</p>}
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Ibu Rumah Tangga') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Ibu Rumah Tangga</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_rumah_tangga.0.keahlian_irt">Keahlian Utama</Label>
                  <Textarea id="alumni_rumah_tangga.0.keahlian_irt" {...register('alumni_rumah_tangga.0.keahlian_irt')} />
                  {errors.alumni_rumah_tangga?.[0]?.keahlian_irt && <p className="text-red-500 text-sm">{errors.alumni_rumah_tangga[0].keahlian_irt.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_rumah_tangga.0.kegiatan_organisasi_irt">Kegiatan/Organisasi yang Pernah Diikuti</Label>
                  <Textarea id="alumni_rumah_tangga.0.kegiatan_organisasi_irt" {...register('alumni_rumah_tangga.0.kegiatan_organisasi_irt')} />
                  {errors.alumni_rumah_tangga?.[0]?.kegiatan_organisasi_irt && <p className="text-red-500 text-sm">{errors.alumni_rumah_tangga[0].kegiatan_organisasi_irt.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_rumah_tangga.0.pengalaman_tim_irt" {...register('alumni_rumah_tangga.0.pengalaman_tim_irt')} />
                  <Label htmlFor="alumni_rumah_tangga.0.pengalaman_tim_irt">Pengalaman bekerja dalam tim?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_rumah_tangga.0.mencari_pekerjaan_kolaborasi_irt" {...register('alumni_rumah_tangga.0.mencari_pekerjaan_kolaborasi_irt')} />
                  <Label htmlFor="alumni_rumah_tangga.0.mencari_pekerjaan_kolaborasi_irt">Mencari pekerjaan atau peluang kolaborasi?</Label>
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Mahasiswa dan FG') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Mahasiswa & Fresh Graduate</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_mahasiswa.0.keahlian_mahasiswa">Keahlian Utama</Label>
                  <Textarea id="alumni_mahasiswa.0.keahlian_mahasiswa" {...register('alumni_mahasiswa.0.keahlian_mahasiswa')} />
                  {errors.alumni_mahasiswa?.[0]?.keahlian_mahasiswa && <p className="text-red-500 text-sm">{errors.alumni_mahasiswa[0].keahlian_mahasiswa.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_mahasiswa.0.kegiatan_organisasi_mahasiswa">Kegiatan/Organisasi yang Pernah Diikuti</Label>
                  <Textarea id="alumni_mahasiswa.0.kegiatan_organisasi_mahasiswa" {...register('alumni_mahasiswa.0.kegiatan_organisasi_mahasiswa')} />
                  {errors.alumni_mahasiswa?.[0]?.kegiatan_organisasi_mahasiswa && <p className="text-red-500 text-sm">{errors.alumni_mahasiswa[0].kegiatan_organisasi_mahasiswa.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_mahasiswa.0.pengalaman_tim_mahasiswa" {...register('alumni_mahasiswa.0.pengalaman_tim_mahasiswa')} />
                  <Label htmlFor="alumni_mahasiswa.0.pengalaman_tim_mahasiswa">Pengalaman bekerja dalam tim?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_mahasiswa.0.mencari_pekerjaan_kolaborasi_mahasiswa" {...register('alumni_mahasiswa.0.mencari_pekerjaan_kolaborasi_mahasiswa')} />
                  <Label htmlFor="alumni_mahasiswa.0.mencari_pekerjaan_kolaborasi_mahasiswa">Mencari pekerjaan atau peluang kolaborasi?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_mahasiswa.0.pengalaman_magang">Pengalaman Magang</Label>
                  <Textarea id="alumni_mahasiswa.0.pengalaman_magang" {...register('alumni_mahasiswa.0.pengalaman_magang')} />
                  {errors.alumni_mahasiswa?.[0]?.pengalaman_magang && <p className="text-red-500 text-sm">{errors.alumni_mahasiswa[0].pengalaman_magang.message}</p>}
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Pekerja Informal/Freelance/Harian') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Pekerja Informal/Freelance/Harian</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_informal.0.keahlian_informal">Keahlian Utama</Label>
                  <Textarea id="alumni_informal.0.keahlian_informal" {...register('alumni_informal.0.keahlian_informal')} />
                  {errors.alumni_informal?.[0]?.keahlian_informal && <p className="text-red-500 text-sm">{errors.alumni_informal[0].keahlian_informal.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_informal.0.pengalaman_tim_informal" {...register('alumni_informal.0.pengalaman_tim_informal')} />
                  <Label htmlFor="alumni_informal.0.pengalaman_tim_informal">Pengalaman bekerja dalam tim?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_informal.0.pernah_rekrut_memimpin" {...register('alumni_informal.0.pernah_rekrut_memimpin')} />
                  <Label htmlFor="alumni_informal.0.pernah_rekrut_memimpin">Pernah merekrut atau memimpin orang lain?</Label>
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Petani/Nelayan/Peternak') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Petani/Nelayan/Peternak</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_agri.0.keahlian_agri">Keahlian Utama</Label>
                  <Textarea id="alumni_agri.0.keahlian_agri" {...register('alumni_agri.0.keahlian_agri')} />
                  {errors.alumni_agri?.[0]?.keahlian_agri && <p className="text-red-500 text-sm">{errors.alumni_agri[0].keahlian_agri.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_agri.0.komoditas_utama">Komoditas Utama</Label>
                  <Input id="alumni_agri.0.komoditas_utama" {...register('alumni_agri.0.komoditas_utama')} />
                  {errors.alumni_agri?.[0]?.komoditas_utama && <p className="text-red-500 text-sm">{errors.alumni_agri[0].komoditas_utama.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_agri.0.tergabung_kelompok" {...register('alumni_agri.0.tergabung_kelompok')} />
                  <Label htmlFor="alumni_agri.0.tergabung_kelompok">Tergabung dalam kelompok tani/nelayan/peternak/koperasi?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_agri.0.skala_usaha_agri">Skala Usaha</Label>
                  <Textarea id="alumni_agri.0.skala_usaha_agri" {...register('alumni_agri.0.skala_usaha_agri')} />
                  {errors.alumni_agri?.[0]?.skala_usaha_agri && <p className="text-red-500 text-sm">{errors.alumni_agri[0].skala_usaha_agri.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_agri.0.nilai_tambah_diterapkan">Nilai Tambah yang Diterapkan</Label>
                  <Textarea id="alumni_agri.0.nilai_tambah_diterapkan" {...register('alumni_agri.0.nilai_tambah_diterapkan')} />
                  {errors.alumni_agri?.[0]?.nilai_tambah_diterapkan && <p className="text-red-500 text-sm">{errors.alumni_agri[0].nilai_tambah_diterapkan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_agri.0.kendala_dihadapi_agri">Kendala yang Dihadapi</Label>
                  <Textarea id="alumni_agri.0.kendala_dihadapi_agri" {...register('alumni_agri.0.kendala_dihadapi_agri')} />
                  {errors.alumni_agri?.[0]?.kendala_dihadapi_agri && <p className="text-red-500 text-sm">{errors.alumni_agri[0].kendala_dihadapi_agri.message}</p>}
                </div>
              </div>
            )}

            {selectedAktivitas.includes('Guru/Tenaga Pendidik') && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-semibold">Detail Guru/Tenaga Pendidik</h4>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pendidik.0.keahlian_pendidik">Keahlian Utama</Label>
                  <Textarea id="alumni_pendidik.0.keahlian_pendidik" {...register('alumni_pendidik.0.keahlian_pendidik')} />
                  {errors.alumni_pendidik?.[0]?.keahlian_pendidik && <p className="text-red-500 text-sm">{errors.alumni_pendidik[0].keahlian_pendidik.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pendidik.0.jenjang_pendidikan">Jenjang Pendidikan Mengajar</Label>
                  <Input id="alumni_pendidik.0.jenjang_pendidikan" {...register('alumni_pendidik.0.jenjang_pendidikan')} />
                  {errors.alumni_pendidik?.[0]?.jenjang_pendidikan && <p className="text-red-500 text-sm">{errors.alumni_pendidik[0].jenjang_pendidikan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pendidik.0.mata_pelajaran">Mata Pelajaran/Bidang Pendidikan</Label>
                  <Input id="alumni_pendidik.0.mata_pelajaran" {...register('alumni_pendidik.0.mata_pelajaran')} />
                  {errors.alumni_pendidik?.[0]?.mata_pelajaran && <p className="text-red-500 text-sm">{errors.alumni_pendidik[0].mata_pelajaran.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni_pendidik.0.inovasi_pembelajaran">Inovasi Pembelajaran yang Diterapkan</Label>
                  <Textarea id="alumni_pendidik.0.inovasi_pembelajaran" {...register('alumni_pendidik.0.inovasi_pembelajaran')} />
                  {errors.alumni_pendidik?.[0]?.inovasi_pembelajaran && <p className="text-red-500 text-sm">{errors.alumni_pendidik[0].inovasi_pembelajaran.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alumni_pendidik.0.mengajar_bimbel" {...register('alumni_pendidik.0.mengajar_bimbel')} />
                  <Label htmlFor="alumni_pendidik.0.mengajar_bimbel">Mengajar bimbel?</Label>
                </div>
              </div>
            )}
            {/* --- Akhir Conditional Fields --- */}

            <div className="space-y-2">
              <Label>Jenis dukungan apa yang paling Anda butuhkan saat ini?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(['Peluang kerja', 'Kolaborasi proyek', 'Mentor', 'Pendamping usaha', 'Relasi profesional', 'Akses pasar', 'Lainnya'] as JenisDukungan[]).map((dukungan) => (
                  <Label key={dukungan} className="flex items-center space-x-2 font-normal">
                    <Checkbox
                      checked={watch('jenis_dukungan_dibutuhkan').includes(dukungan)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue('jenis_dukungan_dibutuhkan', [...watch('jenis_dukungan_dibutuhkan'), dukungan]);
                        } else {
                          setValue('jenis_dukungan_dibutuhkan', watch('jenis_dukungan_dibutuhkan').filter((item) => item !== dukungan));
                        }
                      }}
                    />
                    <span>{dukungan}</span>
                  </Label>
                ))}
              </div>
              {errors.jenis_dukungan_dibutuhkan && <p className="text-red-500 text-sm">{errors.jenis_dukungan_dibutuhkan.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Bidang apa yang paling tertarik untuk berkontribusi? (minat pengembangan diri/karir)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(['Pendidikan', 'Lingkungan', 'Ekonomi', 'Teknologi', 'Kesehatan', 'Komunitas', 'Kreatif', 'Pertanian/Pangan', 'Perikanan', 'Peternakan'] as BidangKontribusi[]).map((bidang) => (
                  <Label key={bidang} className="flex items-center space-x-2 font-normal">
                    <Checkbox
                      checked={watch('bidang_kontribusi_minat').includes(bidang)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue('bidang_kontribusi_minat', [...watch('bidang_kontribusi_minat'), bidang]);
                        } else {
                          setValue('bidang_kontribusi_minat', watch('bidang_kontribusi_minat').filter((item) => item !== bidang));
                        }
                      }}
                    />
                    <span>{bidang}</span>
                  </Label>
                ))}
              </div>
              {errors.bidang_kontribusi_minat && <p className="text-red-500 text-sm">{errors.bidang_kontribusi_minat.message}</p>}
            </div>

            {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
            {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
