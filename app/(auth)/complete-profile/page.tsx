// app/(auth)/complete-profile/page.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const genderOptions = ['Laki-laki', 'Perempuan'] as const
const educationOptions = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'] as const

const aktivitasOptions = [
  { value: 'Pekerja', label: 'Pekerja / Profesional' },
  { value: 'Bisnis', label: 'Wirausaha / Entrepreneur' },
  { value: 'Sosial', label: 'Sosial / NGO / Komunitas' },
  { value: 'Kreatif', label: 'Content Creator / Industri Kreatif' },
  { value: 'Rumah Tangga', label: 'Ibu Rumah Tangga' },
  { value: 'Mahasiswa', label: 'Mahasiswa / Fresh Graduate' },
  { value: 'Informal', label: 'Freelancer / Pekerja Informal' },
  { value: 'Agri', label: 'Petani / Nelayan / Agribisnis' },
  { value: 'Pendidik', label: 'Guru / Pendidik' },
] as const

const dukunganOptions = [
  'Akses pekerjaan',
  'Partner kolaborasi',
  'Mentor / coaching',
  'Akses pasar',
  'Promosi / exposure',
  'Pendanaan',
  'Rekrutmen talent',
  'Belajar skill baru',
] as const

const kontribusiOptions = [
  'Pendidikan',
  'Teknologi',
  'Bisnis',
  'Sosial',
  'Kreatif',
  'Ketenagakerjaan',
  'UMKM',
  'Pertanian / pangan',
] as const

const currentYear = new Date().getFullYear()
const optionalUrlSchema = z.union([z.string().url('Masukkan URL yang valid.'), z.literal('')])

const formSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi.'),
  nama_panggilan: z.string().min(1, 'Nama panggilan wajib diisi.'),
  tahun_lahir: z.string().regex(/^\d{4}$/, 'Masukkan tahun lahir 4 digit.'),
  jenis_kelamin: z.enum(genderOptions, { required_error: 'Pilih jenis kelamin.' }),
  kota_domisili: z.string().min(1, 'Kota domisili wajib diisi.'),
  nomor_handphone: z.string().regex(/^62\d{9,12}$/, 'Gunakan format 62xxxxxxxxxxx.'),
  pendidikan_terakhir: z.enum(educationOptions, { required_error: 'Pilih pendidikan terakhir.' }),
  nama_institusi_pendidikan_terakhir: z.string().min(1, 'Nama institusi wajib diisi.'),
  jurusan_studi: z.string().min(1, 'Jurusan atau program studi wajib diisi.'),
  tahun_kelulusan: z.string().regex(/^\d{4}$/, 'Masukkan tahun kelulusan 4 digit.'),
  skill_gabungan: z.string().min(3, 'Jelaskan skill utama Anda.'),
  bahasa_dikuasai: z.string().min(1, 'Bahasa yang dikuasai wajib diisi.'),
  sertifikasi: z.string().optional(),
  instagram_link: optionalUrlSchema.optional(),
  linkedin_link: optionalUrlSchema.optional(),
  portofolio_link: optionalUrlSchema.optional(),
  aktivitas: z.array(z.string()).min(1, 'Pilih minimal satu aktivitas.'),
  jenis_dukungan_dibutuhkan: z.array(z.string()).min(1, 'Pilih minimal satu jenis dukungan.'),
  bidang_kontribusi_minat: z.array(z.string()).min(1, 'Pilih minimal satu bidang kontribusi.'),
  nama_instansi: z.string().optional(),
  posisi: z.string().optional(),
  pengalaman_proyek: z.string().optional(),
  akses_jejaring: z.boolean().default(false),
  pengalaman_bermitra: z.boolean().default(false),
  keahlian_pekerja: z.string().optional(),
  nama_usaha: z.string().optional(),
  skala_usaha: z.string().optional(),
  keahlian_wirausahaan: z.string().optional(),
  produk_layanan_utama: z.string().optional(),
  kendala_bisnis: z.string().optional(),
  target_pasar: z.enum(['B2C', 'B2B', 'B2C dan B2B']).optional(),
  nama_organisasi: z.string().optional(),
  isu_fokus: z.string().optional(),
  keahlian_sosial: z.string().optional(),
  pengalaman_proyek_sosial: z.string().optional(),
  pengalaman_bermitra_sosial: z.boolean().default(false),
  keahlian_kreatif: z.string().optional(),
  platform_digital_utama: z.string().optional(),
  jenis_konten: z.string().optional(),
  total_jangkauan: z.string().optional(),
  kisaran_rate_card: z.string().optional(),
  demografi_followers: z.string().optional(),
  keahlian_irt: z.string().optional(),
  kegiatan_organisasi_irt: z.string().optional(),
  pengalaman_tim_irt: z.boolean().default(false),
  mencari_pekerjaan_kolaborasi_irt: z.boolean().default(false),
  keahlian_mahasiswa: z.string().optional(),
  kegiatan_organisasi_mahasiswa: z.string().optional(),
  pengalaman_tim_mahasiswa: z.boolean().default(false),
  mencari_pekerjaan_kolaborasi_mahasiswa: z.boolean().default(false),
  pengalaman_magang: z.string().optional(),
  keahlian_informal: z.string().optional(),
  pengalaman_tim_informal: z.boolean().default(false),
  pernah_rekrut_memimpin: z.boolean().default(false),
  keahlian_agri: z.string().optional(),
  komoditas_utama: z.string().optional(),
  tergabung_kelompok: z.boolean().default(false),
  skala_usaha_agri: z.string().optional(),
  nilai_tambah_diterapkan: z.string().optional(),
  kendala_dihadapi_agri: z.string().optional(),
  keahlian_pendidik: z.string().optional(),
  jenjang_pendidikan: z.string().optional(),
  mata_pelajaran: z.string().optional(),
  inovasi_pembelajaran: z.string().optional(),
  mengajar_bimbel: z.boolean().default(false),
}).superRefine((values, ctx) => {
  const requireIfActivity = (activity: string, fields: Array<{ key: keyof typeof values; label: string }>) => {
    if (!values.aktivitas.includes(activity)) {
      return
    }

    for (const field of fields) {
      const value = values[field.key]
      if (typeof value === 'string' && value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.key],
          message: `${field.label} wajib diisi.`,
        })
      }
      if (value === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.key],
          message: `${field.label} wajib diisi.`,
        })
      }
    }
  }

  const validYear = (key: 'tahun_lahir' | 'tahun_kelulusan', label: string) => {
    const year = Number(values[key])
    if (Number.isNaN(year) || year < 1900 || year > currentYear + 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${label} tidak valid.`,
      })
    }
  }

  validYear('tahun_lahir', 'Tahun lahir')
  validYear('tahun_kelulusan', 'Tahun kelulusan')

  requireIfActivity('Pekerja', [
    { key: 'keahlian_pekerja', label: 'Keahlian profesional' },
    { key: 'nama_instansi', label: 'Nama instansi' },
    { key: 'posisi', label: 'Posisi atau jabatan' },
    { key: 'pengalaman_proyek', label: 'Pengalaman proyek' },
  ])
  requireIfActivity('Bisnis', [
    { key: 'keahlian_wirausahaan', label: 'Keahlian wirausaha' },
    { key: 'produk_layanan_utama', label: 'Produk atau layanan utama' },
    { key: 'nama_usaha', label: 'Nama usaha' },
    { key: 'skala_usaha', label: 'Skala usaha' },
    { key: 'kendala_bisnis', label: 'Kendala bisnis' },
    { key: 'target_pasar', label: 'Target pasar' },
  ])
  requireIfActivity('Sosial', [
    { key: 'keahlian_sosial', label: 'Keahlian sosial' },
    { key: 'pengalaman_proyek_sosial', label: 'Pengalaman proyek sosial' },
    { key: 'isu_fokus', label: 'Isu fokus' },
    { key: 'nama_organisasi', label: 'Nama organisasi' },
  ])
  requireIfActivity('Kreatif', [
    { key: 'keahlian_kreatif', label: 'Keahlian kreatif' },
    { key: 'platform_digital_utama', label: 'Platform digital utama' },
    { key: 'jenis_konten', label: 'Jenis konten' },
    { key: 'total_jangkauan', label: 'Total jangkauan' },
    { key: 'kisaran_rate_card', label: 'Kisaran rate card' },
    { key: 'demografi_followers', label: 'Demografi followers' },
  ])
  requireIfActivity('Rumah Tangga', [
    { key: 'keahlian_irt', label: 'Keahlian utama' },
    { key: 'kegiatan_organisasi_irt', label: 'Kegiatan organisasi / komunitas' },
  ])
  requireIfActivity('Mahasiswa', [
    { key: 'keahlian_mahasiswa', label: 'Keahlian utama' },
    { key: 'kegiatan_organisasi_mahasiswa', label: 'Kegiatan organisasi' },
    { key: 'pengalaman_magang', label: 'Pengalaman magang' },
  ])
  requireIfActivity('Informal', [
    { key: 'keahlian_informal', label: 'Keahlian utama' },
  ])
  requireIfActivity('Agri', [
    { key: 'keahlian_agri', label: 'Keahlian agribisnis' },
    { key: 'komoditas_utama', label: 'Komoditas utama' },
    { key: 'skala_usaha_agri', label: 'Skala usaha' },
    { key: 'nilai_tambah_diterapkan', label: 'Nilai tambah yang diterapkan' },
    { key: 'kendala_dihadapi_agri', label: 'Kendala yang dihadapi' },
  ])
  requireIfActivity('Pendidik', [
    { key: 'keahlian_pendidik', label: 'Keahlian utama' },
    { key: 'jenjang_pendidikan', label: 'Jenjang pendidikan' },
    { key: 'mata_pelajaran', label: 'Mata pelajaran' },
    { key: 'inovasi_pembelajaran', label: 'Inovasi pembelajaran' },
  ])
})

type FormValues = z.input<typeof formSchema>

type ProfileResponse = Partial<FormValues> & {
  tahun_lahir?: string | number | null
  tahun_kelulusan?: string | number | null
  jenis_kelamin?: string | null
  pendidikan_terakhir?: string | null
  nomor_handphone?: string | null
  bahasa_dikuasai?: string | null
  sertifikasi?: string | null
  instagram_link?: string | null
  linkedin_link?: string | null
  portofolio_link?: string | null
  aktivitas?: string[] | string | null
  jenis_dukungan_dibutuhkan?: string[] | string | null
  bidang_kontribusi_minat?: string[] | string | null
  alumni_pekerja?: Array<Record<string, unknown>>
  alumni_bisnis?: Array<Record<string, unknown>>
  alumni_sosial?: Array<Record<string, unknown>>
  alumni_kreatif?: Array<Record<string, unknown>>
  alumni_rumah_tangga?: Array<Record<string, unknown>>
  alumni_mahasiswa?: Array<Record<string, unknown>>
  alumni_informal?: Array<Record<string, unknown>>
  alumni_agri?: Array<Record<string, unknown>>
  alumni_pendidik?: Array<Record<string, unknown>>
}

function normalizeArray(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function firstRelationItem(value: Array<Record<string, unknown>> | undefined) {
  return value?.[0] ?? {}
}

function buildPayload(values: FormValues) {
  const payload: Record<string, unknown> = {
    nama_lengkap: values.nama_lengkap,
    nama_panggilan: values.nama_panggilan,
    tahun_lahir: Number(values.tahun_lahir),
    jenis_kelamin: values.jenis_kelamin,
    kota_domisili: values.kota_domisili,
    nomor_handphone: values.nomor_handphone,
    pendidikan_terakhir: values.pendidikan_terakhir,
    nama_institusi_pendidikan_terakhir: values.nama_institusi_pendidikan_terakhir,
    jurusan_studi: values.jurusan_studi,
    tahun_kelulusan: Number(values.tahun_kelulusan),
    skill_gabungan: values.skill_gabungan,
    bahasa_dikuasai: values.bahasa_dikuasai,
    sertifikasi: values.sertifikasi?.trim() || null,
    instagram_link: values.instagram_link || null,
    linkedin_link: values.linkedin_link || null,
    portofolio_link: values.portofolio_link || null,
    aktivitas_db: values.aktivitas.join(', '),
    jenis_dukungan_dibutuhkan_db: values.jenis_dukungan_dibutuhkan.join(', '),
    bidang_kontribusi_minat_db: values.bidang_kontribusi_minat.join(', '),
  }

  if (values.aktivitas.includes('Pekerja')) {
    payload.alumni_pekerja = [{
      keahlian_pekerja: values.keahlian_pekerja,
      nama_instansi: values.nama_instansi,
      posisi: values.posisi,
      pengalaman_proyek: values.pengalaman_proyek,
      akses_jejaring: values.akses_jejaring,
      pengalaman_bermitra: values.pengalaman_bermitra,
    }]
  }
  if (values.aktivitas.includes('Bisnis')) {
    payload.alumni_bisnis = [{
      keahlian_wirausahaan: values.keahlian_wirausahaan,
      produk_layanan_utama: values.produk_layanan_utama,
      nama_usaha: values.nama_usaha,
      skala_usaha: values.skala_usaha,
      kendala_bisnis: values.kendala_bisnis,
      target_pasar: values.target_pasar,
    }]
  }
  if (values.aktivitas.includes('Sosial')) {
    payload.alumni_sosial = [{
      keahlian_sosial: values.keahlian_sosial,
      pengalaman_proyek_sosial: values.pengalaman_proyek_sosial,
      isu_fokus: values.isu_fokus,
      nama_organisasi: values.nama_organisasi,
      pengalaman_bermitra_sosial: values.pengalaman_bermitra_sosial,
    }]
  }
  if (values.aktivitas.includes('Kreatif')) {
    payload.alumni_kreatif = [{
      keahlian_kreatif: values.keahlian_kreatif,
      platform_digital_utama: values.platform_digital_utama,
      jenis_konten: values.jenis_konten,
      total_jangkauan: values.total_jangkauan,
      kisaran_rate_card: values.kisaran_rate_card,
      demografi_followers: values.demografi_followers,
    }]
  }
  if (values.aktivitas.includes('Rumah Tangga')) {
    payload.alumni_rumah_tangga = [{
      keahlian_irt: values.keahlian_irt,
      kegiatan_organisasi_irt: values.kegiatan_organisasi_irt,
      pengalaman_tim_irt: values.pengalaman_tim_irt,
      mencari_pekerjaan_kolaborasi_irt: values.mencari_pekerjaan_kolaborasi_irt,
    }]
  }
  if (values.aktivitas.includes('Mahasiswa')) {
    payload.alumni_mahasiswa = [{
      keahlian_mahasiswa: values.keahlian_mahasiswa,
      kegiatan_organisasi_mahasiswa: values.kegiatan_organisasi_mahasiswa,
      pengalaman_tim_mahasiswa: values.pengalaman_tim_mahasiswa,
      mencari_pekerjaan_kolaborasi_mahasiswa: values.mencari_pekerjaan_kolaborasi_mahasiswa,
      pengalaman_magang: values.pengalaman_magang,
    }]
  }
  if (values.aktivitas.includes('Informal')) {
    payload.alumni_informal = [{
      keahlian_informal: values.keahlian_informal,
      pengalaman_tim_informal: values.pengalaman_tim_informal,
      pernah_rekrut_memimpin: values.pernah_rekrut_memimpin,
    }]
  }
  if (values.aktivitas.includes('Agri')) {
    payload.alumni_agri = [{
      keahlian_agri: values.keahlian_agri,
      komoditas_utama: values.komoditas_utama,
      tergabung_kelompok: values.tergabung_kelompok,
      skala_usaha_agri: values.skala_usaha_agri,
      nilai_tambah_diterapkan: values.nilai_tambah_diterapkan,
      kendala_dihadapi_agri: values.kendala_dihadapi_agri,
    }]
  }
  if (values.aktivitas.includes('Pendidik')) {
    payload.alumni_pendidik = [{
      keahlian_pendidik: values.keahlian_pendidik,
      jenjang_pendidikan: values.jenjang_pendidikan,
      mata_pelajaran: values.mata_pelajaran,
      inovasi_pembelajaran: values.inovasi_pembelajaran,
      mengajar_bimbel: values.mengajar_bimbel,
    }]
  }

  return payload
}

function MultiCheckboxField({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string
  description?: string
  options: readonly { value: string; label: string }[] | readonly string[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          const checked = value.includes(optionValue)

          return (
            <label key={optionValue} className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={(nextChecked) => {
                  if (nextChecked) {
                    onChange([...value, optionValue])
                    return
                  }
                  onChange(value.filter((item) => item !== optionValue))
                }}
              />
              <span>{optionLabel}</span>
            </label>
          )
        })}
      </div>
    </FormItem>
  )
}

function BooleanField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <span>{label}</span>
    </label>
  )
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_lengkap: '',
      nama_panggilan: '',
      tahun_lahir: '',
      jenis_kelamin: 'Laki-laki',
      kota_domisili: '',
      nomor_handphone: '',
      pendidikan_terakhir: 'S1',
      nama_institusi_pendidikan_terakhir: '',
      jurusan_studi: '',
      tahun_kelulusan: '',
      skill_gabungan: '',
      bahasa_dikuasai: '',
      sertifikasi: '',
      instagram_link: '',
      linkedin_link: '',
      portofolio_link: '',
      aktivitas: [],
      jenis_dukungan_dibutuhkan: [],
      bidang_kontribusi_minat: [],
      akses_jejaring: false,
      pengalaman_bermitra: false,
      pengalaman_bermitra_sosial: false,
      pengalaman_tim_irt: false,
      mencari_pekerjaan_kolaborasi_irt: false,
      pengalaman_tim_mahasiswa: false,
      mencari_pekerjaan_kolaborasi_mahasiswa: false,
      pengalaman_tim_informal: false,
      pernah_rekrut_memimpin: false,
      tergabung_kelompok: false,
      mengajar_bimbel: false,
    },
  })

  const selectedAktivitas = form.watch('aktivitas')

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/get-profile', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Gagal memuat profil yang sudah ada.')
        }

        const profile = (await response.json()) as ProfileResponse
        if (!profile || Object.keys(profile).length === 0) {
          setPageReady(true)
          return
        }

        const pekerja = firstRelationItem(profile.alumni_pekerja)
        const bisnis = firstRelationItem(profile.alumni_bisnis)
        const sosial = firstRelationItem(profile.alumni_sosial)
        const kreatif = firstRelationItem(profile.alumni_kreatif)
        const rumahTangga = firstRelationItem(profile.alumni_rumah_tangga)
        const mahasiswa = firstRelationItem(profile.alumni_mahasiswa)
        const informal = firstRelationItem(profile.alumni_informal)
        const agri = firstRelationItem(profile.alumni_agri)
        const pendidik = firstRelationItem(profile.alumni_pendidik)

        form.reset({
          ...form.getValues(),
          nama_lengkap: profile.nama_lengkap || '',
          nama_panggilan: profile.nama_panggilan || '',
          tahun_lahir: profile.tahun_lahir ? String(profile.tahun_lahir) : '',
          jenis_kelamin: profile.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
          kota_domisili: profile.kota_domisili || '',
          nomor_handphone: profile.nomor_handphone || '',
          pendidikan_terakhir: educationOptions.includes(profile.pendidikan_terakhir as (typeof educationOptions)[number])
            ? (profile.pendidikan_terakhir as (typeof educationOptions)[number])
            : 'S1',
          nama_institusi_pendidikan_terakhir: profile.nama_institusi_pendidikan_terakhir || '',
          jurusan_studi: profile.jurusan_studi || '',
          tahun_kelulusan: profile.tahun_kelulusan ? String(profile.tahun_kelulusan) : '',
          skill_gabungan: profile.skill_gabungan || '',
          bahasa_dikuasai: profile.bahasa_dikuasai || '',
          sertifikasi: profile.sertifikasi || '',
          instagram_link: profile.instagram_link || '',
          linkedin_link: profile.linkedin_link || '',
          portofolio_link: profile.portofolio_link || '',
          aktivitas: normalizeArray(profile.aktivitas),
          jenis_dukungan_dibutuhkan: normalizeArray(profile.jenis_dukungan_dibutuhkan),
          bidang_kontribusi_minat: normalizeArray(profile.bidang_kontribusi_minat),
          keahlian_pekerja: typeof pekerja.keahlian_pekerja === 'string' ? pekerja.keahlian_pekerja : '',
          nama_instansi: typeof pekerja.nama_instansi === 'string' ? pekerja.nama_instansi : '',
          posisi: typeof pekerja.posisi === 'string' ? pekerja.posisi : '',
          pengalaman_proyek: typeof pekerja.pengalaman_proyek === 'string' ? pekerja.pengalaman_proyek : '',
          akses_jejaring: Boolean(pekerja.akses_jejaring),
          pengalaman_bermitra: Boolean(pekerja.pengalaman_bermitra),
          keahlian_wirausahaan: typeof bisnis.keahlian_wirausahaan === 'string' ? bisnis.keahlian_wirausahaan : '',
          produk_layanan_utama: typeof bisnis.produk_layanan_utama === 'string' ? bisnis.produk_layanan_utama : '',
          nama_usaha: typeof bisnis.nama_usaha === 'string' ? bisnis.nama_usaha : '',
          skala_usaha: typeof bisnis.skala_usaha === 'string' ? bisnis.skala_usaha : '',
          kendala_bisnis: typeof bisnis.kendala_bisnis === 'string' ? bisnis.kendala_bisnis : '',
          target_pasar: bisnis.target_pasar === 'B2C' || bisnis.target_pasar === 'B2B' || bisnis.target_pasar === 'B2C dan B2B'
            ? bisnis.target_pasar
            : undefined,
          nama_organisasi: typeof sosial.nama_organisasi === 'string' ? sosial.nama_organisasi : '',
          isu_fokus: typeof sosial.isu_fokus === 'string' ? sosial.isu_fokus : '',
          keahlian_sosial: typeof sosial.keahlian_sosial === 'string' ? sosial.keahlian_sosial : '',
          pengalaman_proyek_sosial: typeof sosial.pengalaman_proyek_sosial === 'string' ? sosial.pengalaman_proyek_sosial : '',
          pengalaman_bermitra_sosial: Boolean(sosial.pengalaman_bermitra_sosial),
          keahlian_kreatif: typeof kreatif.keahlian_kreatif === 'string' ? kreatif.keahlian_kreatif : '',
          platform_digital_utama: typeof kreatif.platform_digital_utama === 'string' ? kreatif.platform_digital_utama : '',
          jenis_konten: typeof kreatif.jenis_konten === 'string' ? kreatif.jenis_konten : '',
          total_jangkauan: typeof kreatif.total_jangkauan === 'string' ? kreatif.total_jangkauan : '',
          kisaran_rate_card: typeof kreatif.kisaran_rate_card === 'string' ? kreatif.kisaran_rate_card : '',
          demografi_followers: typeof kreatif.demografi_followers === 'string' ? kreatif.demografi_followers : '',
          keahlian_irt: typeof rumahTangga.keahlian_irt === 'string' ? rumahTangga.keahlian_irt : '',
          kegiatan_organisasi_irt: typeof rumahTangga.kegiatan_organisasi_irt === 'string' ? rumahTangga.kegiatan_organisasi_irt : '',
          pengalaman_tim_irt: Boolean(rumahTangga.pengalaman_tim_irt),
          mencari_pekerjaan_kolaborasi_irt: Boolean(rumahTangga.mencari_pekerjaan_kolaborasi_irt),
          keahlian_mahasiswa: typeof mahasiswa.keahlian_mahasiswa === 'string' ? mahasiswa.keahlian_mahasiswa : '',
          kegiatan_organisasi_mahasiswa: typeof mahasiswa.kegiatan_organisasi_mahasiswa === 'string' ? mahasiswa.kegiatan_organisasi_mahasiswa : '',
          pengalaman_tim_mahasiswa: Boolean(mahasiswa.pengalaman_tim_mahasiswa),
          mencari_pekerjaan_kolaborasi_mahasiswa: Boolean(mahasiswa.mencari_pekerjaan_kolaborasi_mahasiswa),
          pengalaman_magang: typeof mahasiswa.pengalaman_magang === 'string' ? mahasiswa.pengalaman_magang : '',
          keahlian_informal: typeof informal.keahlian_informal === 'string' ? informal.keahlian_informal : '',
          pengalaman_tim_informal: Boolean(informal.pengalaman_tim_informal),
          pernah_rekrut_memimpin: Boolean(informal.pernah_rekrut_memimpin),
          keahlian_agri: typeof agri.keahlian_agri === 'string' ? agri.keahlian_agri : '',
          komoditas_utama: typeof agri.komoditas_utama === 'string' ? agri.komoditas_utama : '',
          tergabung_kelompok: Boolean(agri.tergabung_kelompok),
          skala_usaha_agri: typeof agri.skala_usaha_agri === 'string' ? agri.skala_usaha_agri : '',
          nilai_tambah_diterapkan: typeof agri.nilai_tambah_diterapkan === 'string' ? agri.nilai_tambah_diterapkan : '',
          kendala_dihadapi_agri: typeof agri.kendala_dihadapi_agri === 'string' ? agri.kendala_dihadapi_agri : '',
          keahlian_pendidik: typeof pendidik.keahlian_pendidik === 'string' ? pendidik.keahlian_pendidik : '',
          jenjang_pendidikan: typeof pendidik.jenjang_pendidikan === 'string' ? pendidik.jenjang_pendidikan : '',
          mata_pelajaran: typeof pendidik.mata_pelajaran === 'string' ? pendidik.mata_pelajaran : '',
          inovasi_pembelajaran: typeof pendidik.inovasi_pembelajaran === 'string' ? pendidik.inovasi_pembelajaran : '',
          mengajar_bimbel: Boolean(pendidik.mengajar_bimbel),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memuat profil.'
        toast.error('Profil lama tidak bisa dimuat penuh.', { description: message })
      } finally {
        setPageReady(true)
      }
    }

    init()
  }, [form, router])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    let success = false

    try {
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(values)),
      })

      const result = (await response.json()) as { error?: string; details?: Array<{ message?: string }> }

      if (!response.ok) {
        const detailMessage = Array.isArray(result.details)
          ? result.details.map((detail) => detail.message).filter(Boolean).join(', ')
          : undefined
        throw new Error(detailMessage || result.error || 'Gagal menyimpan profil.')
      }

      toast.success('Profil berhasil disimpan!')
      success = true
      setIsRedirecting(true)
      
      // Force cache reload and redirect via full reload
      router.refresh()
      window.location.href = '/'
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan profil.'
      toast.error('Terjadi kesalahan', { description: message })
    } finally {
      if (!success) {
        setLoading(false)
      }
    }
  }

  if (!pageReady) {
    return <div className="flex min-h-screen items-center justify-center p-4">Memuat...</div>
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Card className="mx-auto my-8 w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Lengkapi Profil Anda</CardTitle>
          <CardDescription>
            Lengkapi profil utama dan aktivitas Anda agar rekomendasi kolaborasi dan proyek lebih relevan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Informasi Dasar</h2>
                  <p className="text-sm text-muted-foreground">Bagian ini menjadi profil utama yang tampil ke pengguna lain.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="nama_lengkap" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nama_panggilan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Panggilan</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tahun_lahir" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Lahir</FormLabel>
                      <FormControl><Input inputMode="numeric" placeholder="1998" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="jenis_kelamin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kelamin</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genderOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="kota_domisili" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kota Domisili</FormLabel>
                      <FormControl><Input placeholder="Bandung" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nomor_handphone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Handphone</FormLabel>
                      <FormControl><Input placeholder="6281234567890" {...field} /></FormControl>
                      <FormDescription>Gunakan format Indonesia tanpa tanda plus.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pendidikan_terakhir" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pendidikan Terakhir</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Pilih pendidikan terakhir" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nama_institusi_pendidikan_terakhir" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institusi Pendidikan Terakhir</FormLabel>
                      <FormControl><Input placeholder="Universitas Indonesia" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="jurusan_studi" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurusan / Program Studi</FormLabel>
                      <FormControl><Input placeholder="Teknik Informatika" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tahun_kelulusan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Kelulusan</FormLabel>
                      <FormControl><Input inputMode="numeric" placeholder="2020" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="skill_gabungan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keahlian Utama</FormLabel>
                    <FormControl><Textarea placeholder="Digital marketing, public speaking, product management" {...field} /></FormControl>
                    <FormDescription>Pisahkan beberapa skill dengan koma agar lebih mudah dicari.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="bahasa_dikuasai" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bahasa yang Dikuasai</FormLabel>
                      <FormControl><Textarea placeholder="Bahasa Indonesia, English" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sertifikasi" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sertifikasi</FormLabel>
                      <FormControl><Textarea placeholder="Google Analytics, BNSP, AWS Cloud Practitioner" {...field} /></FormControl>
                      <FormDescription>Opsional. Pisahkan beberapa sertifikasi dengan koma.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField control={form.control} name="instagram_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl><Input placeholder="https://instagram.com/username" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="linkedin_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl><Input placeholder="https://linkedin.com/in/username" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="portofolio_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portofolio</FormLabel>
                      <FormControl><Input placeholder="https://portfolio.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-4">
                <FormField control={form.control} name="aktivitas" render={({ field }) => (
                  <FormItem>
                    <MultiCheckboxField
                      label="Aktivitas Saat Ini"
                      description="Anda bisa memilih lebih dari satu aktivitas jika memang sedang menjalankan beberapa peran."
                      options={aktivitasOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="jenis_dukungan_dibutuhkan" render={({ field }) => (
                  <FormItem>
                    <MultiCheckboxField
                      label="Jenis Dukungan yang Dibutuhkan"
                      options={dukunganOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bidang_kontribusi_minat" render={({ field }) => (
                  <FormItem>
                    <MultiCheckboxField
                      label="Bidang Kontribusi yang Diminati"
                      options={kontribusiOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
              </section>

              {selectedAktivitas.includes('Pekerja') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Pekerja / Profesional</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_pekerja" render={({ field }) => (<FormItem><FormLabel>Keahlian Profesional</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="nama_instansi" render={({ field }) => (<FormItem><FormLabel>Nama Instansi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="posisi" render={({ field }) => (<FormItem><FormLabel>Posisi / Jabatan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="pengalaman_proyek" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Pengalaman Proyek</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField control={form.control} name="akses_jejaring" render={({ field }) => (<FormItem><BooleanField label="Memiliki akses jejaring yang bisa dibuka untuk kolaborasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                    <FormField control={form.control} name="pengalaman_bermitra" render={({ field }) => (<FormItem><BooleanField label="Pernah bermitra lintas tim / organisasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                  </div>
                </section>
              )}

              {selectedAktivitas.includes('Bisnis') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Wirausaha</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="nama_usaha" render={({ field }) => (<FormItem><FormLabel>Nama Usaha</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="skala_usaha" render={({ field }) => (<FormItem><FormLabel>Skala Usaha</FormLabel><FormControl><Input placeholder="Mikro / Kecil / Menengah" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="keahlian_wirausahaan" render={({ field }) => (<FormItem><FormLabel>Keahlian Wirausaha</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="produk_layanan_utama" render={({ field }) => (<FormItem><FormLabel>Produk / Layanan Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="kendala_bisnis" render={({ field }) => (<FormItem><FormLabel>Kendala Bisnis</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="target_pasar" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Pasar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih target pasar" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="B2C">B2C</SelectItem>
                            <SelectItem value="B2B">B2B</SelectItem>
                            <SelectItem value="B2C dan B2B">B2C dan B2B</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>
              )}

              {selectedAktivitas.includes('Sosial') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Sosial / NGO</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="nama_organisasi" render={({ field }) => (<FormItem><FormLabel>Nama Organisasi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="isu_fokus" render={({ field }) => (<FormItem><FormLabel>Isu Fokus</FormLabel><FormControl><Input placeholder="Pendidikan, lingkungan, kesehatan" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="keahlian_sosial" render={({ field }) => (<FormItem><FormLabel>Keahlian Sosial</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="pengalaman_proyek_sosial" render={({ field }) => (<FormItem><FormLabel>Pengalaman Proyek Sosial</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="pengalaman_bermitra_sosial" render={({ field }) => (<FormItem><BooleanField label="Pernah bermitra dengan komunitas / lembaga lain" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                </section>
              )}

              {selectedAktivitas.includes('Kreatif') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Kreatif / Content Creator</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_kreatif" render={({ field }) => (<FormItem><FormLabel>Keahlian Kreatif</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="platform_digital_utama" render={({ field }) => (<FormItem><FormLabel>Platform Digital Utama</FormLabel><FormControl><Input placeholder="Instagram, TikTok, YouTube" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="jenis_konten" render={({ field }) => (<FormItem><FormLabel>Jenis Konten</FormLabel><FormControl><Input placeholder="Edukasi, lifestyle, review" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="total_jangkauan" render={({ field }) => (<FormItem><FormLabel>Total Jangkauan</FormLabel><FormControl><Input placeholder="10.000 followers / 50.000 monthly reach" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="kisaran_rate_card" render={({ field }) => (<FormItem><FormLabel>Kisaran Rate Card</FormLabel><FormControl><Input placeholder="Rp500rb - Rp1jt" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="demografi_followers" render={({ field }) => (<FormItem><FormLabel>Demografi Followers</FormLabel><FormControl><Textarea placeholder="Mayoritas perempuan 18-24, Jawa Barat" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </section>
              )}

              {selectedAktivitas.includes('Rumah Tangga') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Ibu Rumah Tangga</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_irt" render={({ field }) => (<FormItem><FormLabel>Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="kegiatan_organisasi_irt" render={({ field }) => (<FormItem><FormLabel>Kegiatan Organisasi / Komunitas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField control={form.control} name="pengalaman_tim_irt" render={({ field }) => (<FormItem><BooleanField label="Memiliki pengalaman kerja tim / kepanitiaan" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                    <FormField control={form.control} name="mencari_pekerjaan_kolaborasi_irt" render={({ field }) => (<FormItem><BooleanField label="Saat ini mencari peluang kerja atau kolaborasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                  </div>
                </section>
              )}

              {selectedAktivitas.includes('Mahasiswa') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Mahasiswa / Fresh Graduate</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_mahasiswa" render={({ field }) => (<FormItem><FormLabel>Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="kegiatan_organisasi_mahasiswa" render={({ field }) => (<FormItem><FormLabel>Kegiatan Organisasi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="pengalaman_magang" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Pengalaman Magang / Proyek</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField control={form.control} name="pengalaman_tim_mahasiswa" render={({ field }) => (<FormItem><BooleanField label="Memiliki pengalaman kerja tim / organisasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                    <FormField control={form.control} name="mencari_pekerjaan_kolaborasi_mahasiswa" render={({ field }) => (<FormItem><BooleanField label="Sedang mencari peluang kerja atau kolaborasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                  </div>
                </section>
              )}

              {selectedAktivitas.includes('Informal') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Freelancer / Pekerja Informal</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_informal" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField control={form.control} name="pengalaman_tim_informal" render={({ field }) => (<FormItem><BooleanField label="Pernah bekerja dalam tim atau proyek kolaboratif" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                    <FormField control={form.control} name="pernah_rekrut_memimpin" render={({ field }) => (<FormItem><BooleanField label="Pernah merekrut atau memimpin orang lain" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                  </div>
                </section>
              )}

              {selectedAktivitas.includes('Agri') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Agribisnis / Perikanan</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_agri" render={({ field }) => (<FormItem><FormLabel>Keahlian Agribisnis</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="komoditas_utama" render={({ field }) => (<FormItem><FormLabel>Komoditas Utama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="skala_usaha_agri" render={({ field }) => (<FormItem><FormLabel>Skala Usaha</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="nilai_tambah_diterapkan" render={({ field }) => (<FormItem><FormLabel>Nilai Tambah yang Diterapkan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="kendala_dihadapi_agri" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Kendala yang Dihadapi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="tergabung_kelompok" render={({ field }) => (<FormItem><BooleanField label="Tergabung dalam kelompok / koperasi / komunitas tani / nelayan" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                </section>
              )}

              {selectedAktivitas.includes('Pendidik') && (
                <section className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Detail Pendidik</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="keahlian_pendidik" render={({ field }) => (<FormItem><FormLabel>Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="jenjang_pendidikan" render={({ field }) => (<FormItem><FormLabel>Jenjang Pendidikan yang Diajar</FormLabel><FormControl><Input placeholder="SD / SMP / SMA / kursus" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="mata_pelajaran" render={({ field }) => (<FormItem><FormLabel>Mata Pelajaran / Bidang Ajar</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="inovasi_pembelajaran" render={({ field }) => (<FormItem><FormLabel>Inovasi Pembelajaran</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="mengajar_bimbel" render={({ field }) => (<FormItem><BooleanField label="Juga mengajar les privat / bimbel / pelatihan" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                </section>
              )}

              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading || isRedirecting}>
                {(loading || isRedirecting) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRedirecting ? 'Mengalihkan ke beranda...' : loading ? 'Menyimpan...' : 'Simpan Profil & Lanjutkan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}