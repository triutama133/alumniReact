import * as z from 'zod'

export const genderOptions = ['Laki-laki', 'Perempuan'] as const

export const aktivitasOptions = [
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

export const dukunganOptions = [
  'Akses pekerjaan',
  'Partner kolaborasi',
  'Mentor / coaching',
  'Akses pasar',
  'Promosi / exposure',
  'Pendanaan',
  'Rekrutmen talent',
  'Belajar skill baru',
] as const

export const kontribusiOptions = [
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

export const educationLevels = ['SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'] as const
export const activityStatusOptions = ['Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun'] as const

export type IndonesiaCityOption = {
  id: string
  city: string
  province: string
  label: string
}

export const formSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi.'),
  nama_panggilan: z.string().min(1, 'Nama panggilan wajib diisi.'),
  tahun_lahir: z.string().regex(/^\d{4}$/, 'Masukkan tahun lahir 4 digit.'),
  jenis_kelamin: z.enum(genderOptions, { required_error: 'Pilih jenis kelamin.' }),
  kota_domisili: z.string().min(1, 'Kota domisili wajib diisi.'),
  nomor_handphone: z.string().regex(/^62\d{9,12}$/, 'Gunakan format 62xxxxxxxxxxx.'),
  skill_gabungan: z.string().min(3, 'Jelaskan skill utama Anda.'),
  bahasa_dikuasai: z.string().min(1, 'Bahasa yang dikuasai wajib diisi.'),
  sertifikasi: z.string().optional(),
  instagram_link: optionalUrlSchema.optional(),
  linkedin_link: optionalUrlSchema.optional(),
  portofolio_link: optionalUrlSchema.optional(),
  domisili_city_ref_id: z.string().optional(),
  domisili_provinsi: z.string().optional(),
  domisili_kota_kabupaten: z.string().optional(),
  education_histories: z.array(z.object({
    level: z.enum(educationLevels),
    institution_name: z.string().min(1, 'Institusi wajib diisi.'),
    major_program: z.string().min(1, 'Jurusan wajib diisi.'),
    start_year: z.string().optional(),
    end_year: z.string().optional(),
    is_current: z.boolean().default(false),
  })).min(1, 'Minimal satu riwayat pendidikan wajib diisi.'),
  pekerja_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_pekerja: z.string().optional(),
    nama_instansi: z.string().optional(),
    posisi: z.string().optional(),
    pengalaman_proyek: z.string().optional(),
    akses_jejaring: z.boolean().default(false),
    pengalaman_bermitra: z.boolean().default(false),
  })).default([]),
  bisnis_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_wirausahaan: z.string().optional(),
    produk_layanan_utama: z.string().optional(),
    nama_usaha: z.string().optional(),
    skala_usaha: z.string().optional(),
    kendala_bisnis: z.string().optional(),
    target_pasar: z.enum(['B2C', 'B2B', 'B2C dan B2B']).optional(),
    kolaborasi_terbuka: z.string().optional(),
    keahlian_dibagikan: z.string().optional(),
  })).default([]),
  sosial_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_sosial: z.string().optional(),
    pengalaman_proyek_sosial: z.string().optional(),
    isu_fokus: z.string().optional(),
    nama_organisasi: z.string().optional(),
    pengalaman_bermitra_sosial: z.boolean().default(false),
  })).default([]),
  kreatif_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_kreatif: z.string().optional(),
    platform_digital_utama: z.string().optional(),
    jenis_konten: z.string().optional(),
    total_jangkauan: z.string().optional(),
    kisaran_rate_card: z.string().optional(),
    demografi_followers: z.string().optional(),
  })).default([]),
  aktivitas: z.array(z.string()).min(1, 'Pilih minimal satu aktivitas.'),
  aktivitas_status_durasi: z.record(z.string()).default({}),
  jenis_dukungan_dibutuhkan: z.array(z.string()).min(1, 'Pilih minimal satu jenis dukungan.'),
  bidang_kontribusi_minat: z.array(z.string()).min(1, 'Pilih minimal satu bidang kontribusi.'),
  irt_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_irt: z.string().optional(),
    kegiatan_organisasi_irt: z.string().optional(),
    pengalaman_tim_irt: z.boolean().default(false),
    mencari_pekerjaan_kolaborasi_irt: z.boolean().default(false),
  })).default([]),
  mahasiswa_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_mahasiswa: z.string().optional(),
    kegiatan_organisasi_mahasiswa: z.string().optional(),
    pengalaman_tim_mahasiswa: z.boolean().default(false),
    mencari_pekerjaan_kolaborasi_mahasiswa: z.boolean().default(false),
    pengalaman_magang: z.string().optional(),
  })).default([]),
  informal_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_informal: z.string().optional(),
    pengalaman_tim_informal: z.boolean().default(false),
    pernah_rekrut_memimpin: z.boolean().default(false),
  })).default([]),
  agri_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_agri: z.string().optional(),
    komoditas_utama: z.string().optional(),
    tergabung_kelompok: z.boolean().default(false),
    skala_usaha_agri: z.string().optional(),
    nilai_tambah_diterapkan: z.string().optional(),
    kendala_dihadapi_agri: z.string().optional(),
  })).default([]),
  pendidik_details: z.array(z.object({
    status_keaktifan: z.enum(activityStatusOptions),
    keahlian_pendidik: z.string().optional(),
    jenjang_pendidikan: z.string().optional(),
    mata_pelajaran: z.string().optional(),
    inovasi_pembelajaran: z.string().optional(),
    mengajar_bimbel: z.boolean().default(false),
  })).default([]),
}).superRefine((values, ctx) => {
  const validYear = (key: 'tahun_lahir', label: string) => {
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

  const validate = (
    key: 'pekerja_details' | 'bisnis_details' | 'sosial_details' | 'kreatif_details' | 'irt_details' | 'mahasiswa_details' | 'informal_details' | 'agri_details' | 'pendidik_details',
    aktivitas: string,
    rules: Array<{ field: string; label: string }>
  ) => {
    if (!values.aktivitas.includes(aktivitas)) return
    const details = values[key] as Array<Record<string, unknown>>
    if (!details || details.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `Minimal satu detail ${aktivitas} wajib diisi.` })
      return
    }
    details.forEach((detail, index) => {
      if (detail.status_keaktifan === '>5 tahun') return
      rules.forEach((rule) => {
        const value = detail[rule.field]
        if (typeof value === 'string' && !value.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key, index, rule.field], message: `${rule.label} wajib diisi.` })
        }
        if (value === undefined || value === null) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key, index, rule.field], message: `${rule.label} wajib diisi.` })
        }
      })
    })
  }

  validate('pekerja_details', 'Pekerja', [
    { field: 'keahlian_pekerja', label: 'Keahlian profesional' },
    { field: 'nama_instansi', label: 'Nama instansi' },
    { field: 'posisi', label: 'Posisi' },
    { field: 'pengalaman_proyek', label: 'Pengalaman proyek' },
  ])
  validate('bisnis_details', 'Bisnis', [
    { field: 'keahlian_wirausahaan', label: 'Keahlian wirausaha' },
    { field: 'produk_layanan_utama', label: 'Produk atau layanan utama' },
    { field: 'nama_usaha', label: 'Nama usaha' },
    { field: 'skala_usaha', label: 'Skala usaha' },
    { field: 'kendala_bisnis', label: 'Kendala bisnis' },
    { field: 'target_pasar', label: 'Target pasar' },
    { field: 'kolaborasi_terbuka', label: 'Keterbukaan kolaborasi' },
    { field: 'keahlian_dibagikan', label: 'Keahlian yang bisa dibagikan' },
  ])
  validate('sosial_details', 'Sosial', [
    { field: 'keahlian_sosial', label: 'Keahlian sosial' },
    { field: 'pengalaman_proyek_sosial', label: 'Pengalaman proyek sosial' },
    { field: 'isu_fokus', label: 'Isu fokus' },
    { field: 'nama_organisasi', label: 'Nama organisasi' },
  ])
  validate('kreatif_details', 'Kreatif', [
    { field: 'keahlian_kreatif', label: 'Keahlian kreatif' },
    { field: 'platform_digital_utama', label: 'Platform digital utama' },
    { field: 'jenis_konten', label: 'Jenis konten' },
    { field: 'total_jangkauan', label: 'Total jangkauan' },
    { field: 'kisaran_rate_card', label: 'Kisaran rate card' },
    { field: 'demografi_followers', label: 'Demografi followers' },
  ])
  validate('irt_details', 'Rumah Tangga', [
    { field: 'keahlian_irt', label: 'Keahlian utama' },
    { field: 'kegiatan_organisasi_irt', label: 'Kegiatan organisasi / komunitas' },
  ])
  validate('mahasiswa_details', 'Mahasiswa', [
    { field: 'keahlian_mahasiswa', label: 'Keahlian utama' },
    { field: 'kegiatan_organisasi_mahasiswa', label: 'Kegiatan organisasi' },
    { field: 'pengalaman_magang', label: 'Pengalaman magang' },
  ])
  validate('informal_details', 'Informal', [{ field: 'keahlian_informal', label: 'Keahlian utama' }])
  validate('agri_details', 'Agri', [
    { field: 'keahlian_agri', label: 'Keahlian agribisnis' },
    { field: 'komoditas_utama', label: 'Komoditas utama' },
    { field: 'skala_usaha_agri', label: 'Skala usaha' },
    { field: 'nilai_tambah_diterapkan', label: 'Nilai tambah yang diterapkan' },
    { field: 'kendala_dihadapi_agri', label: 'Kendala yang dihadapi' },
  ])
  validate('pendidik_details', 'Pendidik', [
    { field: 'keahlian_pendidik', label: 'Keahlian utama' },
    { field: 'jenjang_pendidikan', label: 'Jenjang pendidikan' },
    { field: 'mata_pelajaran', label: 'Mata pelajaran' },
    { field: 'inovasi_pembelajaran', label: 'Inovasi pembelajaran' },
  ])
})

export type FormValues = z.input<typeof formSchema>
export type TargetPasar = 'B2C' | 'B2B' | 'B2C dan B2B'

export type ProfileResponse = Partial<FormValues> & {
  tahun_lahir?: string | number | null
  tahun_kelulusan?: string | number | null
  jenis_kelamin?: string | null
  pendidikan_terakhir?: string | null
  nama_institusi_pendidikan_terakhir?: string | null
  jurusan_studi?: string | null
  nomor_handphone?: string | null
  bahasa_dikuasai?: string | null
  sertifikasi?: string | null
  instagram_link?: string | null
  linkedin_link?: string | null
  portofolio_link?: string | null
  aktivitas?: string[] | string | null
  aktivitas_status_durasi?: Record<string, unknown> | null
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
  domisili_city_ref_id?: string | null
  domisili_provinsi?: string | null
  domisili_kota_kabupaten?: string | null
  alumni_education_histories?: Array<{
    level?: string
    institution_name?: string
    major_program?: string
    start_year?: number | null
    end_year?: number | null
    is_current?: boolean
  }>
}

export function normalizeArray(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function pickLatestEducation(values: FormValues) {
  const histories = [...(values.education_histories || [])]
  if (histories.length === 0) return null

  histories.sort((a, b) => {
    const aCurrent = a.is_current ? 1 : 0
    const bCurrent = b.is_current ? 1 : 0
    if (aCurrent !== bCurrent) return bCurrent - aCurrent

    const aEnd = a.end_year ? Number(a.end_year) : 0
    const bEnd = b.end_year ? Number(b.end_year) : 0
    if (aEnd !== bEnd) return bEnd - aEnd

    const aStart = a.start_year ? Number(a.start_year) : 0
    const bStart = b.start_year ? Number(b.start_year) : 0
    return bStart - aStart
  })

  return histories[0]
}

function normalizeStatus(value: unknown): (typeof activityStatusOptions)[number] {
  const allowed = new Set(activityStatusOptions)
  if (typeof value === 'string' && allowed.has(value as (typeof activityStatusOptions)[number])) {
    return value as (typeof activityStatusOptions)[number]
  }
  return 'Aktif saat ini'
}

function normalizeTargetPasar(value: unknown): TargetPasar | undefined {
  return value === 'B2C' || value === 'B2B' || value === 'B2C dan B2B' ? value : undefined
}

function statusList(profile: ProfileResponse, key: string) {
  const raw = profile.aktivitas_status_durasi && typeof profile.aktivitas_status_durasi === 'object'
    ? (profile.aktivitas_status_durasi as Record<string, unknown>)[key]
    : undefined
  return Array.isArray(raw) ? raw : [typeof raw === 'string' ? raw : 'Aktif saat ini']
}

export function ensurePekerjaDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Pekerja')
  if (profile.alumni_pekerja && profile.alumni_pekerja.length > 0) {
    return profile.alumni_pekerja.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_pekerja: typeof item.keahlian_pekerja === 'string' ? item.keahlian_pekerja : '',
      nama_instansi: typeof item.nama_instansi === 'string' ? item.nama_instansi : '',
      posisi: typeof item.posisi === 'string' ? item.posisi : '',
      pengalaman_proyek: typeof item.pengalaman_proyek === 'string' ? item.pengalaman_proyek : '',
      akses_jejaring: Boolean(item.akses_jejaring),
      pengalaman_bermitra: Boolean(item.pengalaman_bermitra),
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_pekerja: '', nama_instansi: '', posisi: '', pengalaman_proyek: '', akses_jejaring: false, pengalaman_bermitra: false }]
}

export function ensureBisnisDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Bisnis')
  if (profile.alumni_bisnis && profile.alumni_bisnis.length > 0) {
    return profile.alumni_bisnis.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_wirausahaan: typeof item.keahlian_wirausahaan === 'string' ? item.keahlian_wirausahaan : '',
      produk_layanan_utama: typeof item.produk_layanan_utama === 'string' ? item.produk_layanan_utama : '',
      nama_usaha: typeof item.nama_usaha === 'string' ? item.nama_usaha : '',
      skala_usaha: typeof item.skala_usaha === 'string' ? item.skala_usaha : '',
      kendala_bisnis: typeof item.kendala_bisnis === 'string' ? item.kendala_bisnis : '',
      target_pasar: normalizeTargetPasar(item.target_pasar),
      kolaborasi_terbuka: typeof item.kolaborasi_terbuka === 'string' ? item.kolaborasi_terbuka : '',
      keahlian_dibagikan: typeof item.keahlian_dibagikan === 'string' ? item.keahlian_dibagikan : '',
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_wirausahaan: '', produk_layanan_utama: '', nama_usaha: '', skala_usaha: '', kendala_bisnis: '', target_pasar: undefined, kolaborasi_terbuka: '', keahlian_dibagikan: '' }]
}

export function ensureSosialDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Sosial')
  if (profile.alumni_sosial && profile.alumni_sosial.length > 0) {
    return profile.alumni_sosial.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_sosial: typeof item.keahlian_sosial === 'string' ? item.keahlian_sosial : '',
      pengalaman_proyek_sosial: typeof item.pengalaman_proyek_sosial === 'string' ? item.pengalaman_proyek_sosial : '',
      isu_fokus: typeof item.isu_fokus === 'string' ? item.isu_fokus : '',
      nama_organisasi: typeof item.nama_organisasi === 'string' ? item.nama_organisasi : '',
      pengalaman_bermitra_sosial: Boolean(item.pengalaman_bermitra_sosial),
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_sosial: '', pengalaman_proyek_sosial: '', isu_fokus: '', nama_organisasi: '', pengalaman_bermitra_sosial: false }]
}

export function ensureKreatifDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Kreatif')
  if (profile.alumni_kreatif && profile.alumni_kreatif.length > 0) {
    return profile.alumni_kreatif.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_kreatif: typeof item.keahlian_kreatif === 'string' ? item.keahlian_kreatif : '',
      platform_digital_utama: typeof item.platform_digital_utama === 'string' ? item.platform_digital_utama : '',
      jenis_konten: typeof item.jenis_konten === 'string' ? item.jenis_konten : '',
      total_jangkauan: typeof item.total_jangkauan === 'string' ? item.total_jangkauan : '',
      kisaran_rate_card: typeof item.kisaran_rate_card === 'string' ? item.kisaran_rate_card : '',
      demografi_followers: typeof item.demografi_followers === 'string' ? item.demografi_followers : '',
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_kreatif: '', platform_digital_utama: '', jenis_konten: '', total_jangkauan: '', kisaran_rate_card: '', demografi_followers: '' }]
}

export function ensureIrtDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Rumah Tangga')
  if (profile.alumni_rumah_tangga && profile.alumni_rumah_tangga.length > 0) {
    return profile.alumni_rumah_tangga.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_irt: typeof item.keahlian_irt === 'string' ? item.keahlian_irt : '',
      kegiatan_organisasi_irt: typeof item.kegiatan_organisasi_irt === 'string' ? item.kegiatan_organisasi_irt : '',
      pengalaman_tim_irt: Boolean(item.pengalaman_tim_irt),
      mencari_pekerjaan_kolaborasi_irt: Boolean(item.mencari_pekerjaan_kolaborasi_irt),
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_irt: '', kegiatan_organisasi_irt: '', pengalaman_tim_irt: false, mencari_pekerjaan_kolaborasi_irt: false }]
}

export function ensureMahasiswaDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Mahasiswa')
  if (profile.alumni_mahasiswa && profile.alumni_mahasiswa.length > 0) {
    return profile.alumni_mahasiswa.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_mahasiswa: typeof item.keahlian_mahasiswa === 'string' ? item.keahlian_mahasiswa : '',
      kegiatan_organisasi_mahasiswa: typeof item.kegiatan_organisasi_mahasiswa === 'string' ? item.kegiatan_organisasi_mahasiswa : '',
      pengalaman_tim_mahasiswa: Boolean(item.pengalaman_tim_mahasiswa),
      mencari_pekerjaan_kolaborasi_mahasiswa: Boolean(item.mencari_pekerjaan_kolaborasi_mahasiswa),
      pengalaman_magang: typeof item.pengalaman_magang === 'string' ? item.pengalaman_magang : '',
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_mahasiswa: '', kegiatan_organisasi_mahasiswa: '', pengalaman_tim_mahasiswa: false, mencari_pekerjaan_kolaborasi_mahasiswa: false, pengalaman_magang: '' }]
}

export function ensureInformalDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Informal')
  if (profile.alumni_informal && profile.alumni_informal.length > 0) {
    return profile.alumni_informal.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_informal: typeof item.keahlian_informal === 'string' ? item.keahlian_informal : '',
      pengalaman_tim_informal: Boolean(item.pengalaman_tim_informal),
      pernah_rekrut_memimpin: Boolean(item.pernah_rekrut_memimpin),
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_informal: '', pengalaman_tim_informal: false, pernah_rekrut_memimpin: false }]
}

export function ensureAgriDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Agri')
  if (profile.alumni_agri && profile.alumni_agri.length > 0) {
    return profile.alumni_agri.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_agri: typeof item.keahlian_agri === 'string' ? item.keahlian_agri : '',
      komoditas_utama: typeof item.komoditas_utama === 'string' ? item.komoditas_utama : '',
      tergabung_kelompok: Boolean(item.tergabung_kelompok),
      skala_usaha_agri: typeof item.skala_usaha_agri === 'string' ? item.skala_usaha_agri : '',
      nilai_tambah_diterapkan: typeof item.nilai_tambah_diterapkan === 'string' ? item.nilai_tambah_diterapkan : '',
      kendala_dihadapi_agri: typeof item.kendala_dihadapi_agri === 'string' ? item.kendala_dihadapi_agri : '',
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_agri: '', komoditas_utama: '', tergabung_kelompok: false, skala_usaha_agri: '', nilai_tambah_diterapkan: '', kendala_dihadapi_agri: '' }]
}

export function ensurePendidikDetailsFromProfile(profile: ProfileResponse) {
  const statuses = statusList(profile, 'Pendidik')
  if (profile.alumni_pendidik && profile.alumni_pendidik.length > 0) {
    return profile.alumni_pendidik.map((item, index) => ({
      status_keaktifan: normalizeStatus(item.status_keaktifan ?? statuses[index]),
      keahlian_pendidik: typeof item.keahlian_pendidik === 'string' ? item.keahlian_pendidik : '',
      jenjang_pendidikan: typeof item.jenjang_pendidikan === 'string' ? item.jenjang_pendidikan : '',
      mata_pelajaran: typeof item.mata_pelajaran === 'string' ? item.mata_pelajaran : '',
      inovasi_pembelajaran: typeof item.inovasi_pembelajaran === 'string' ? item.inovasi_pembelajaran : '',
      mengajar_bimbel: Boolean(item.mengajar_bimbel),
    }))
  }
  return [{ status_keaktifan: 'Aktif saat ini' as const, keahlian_pendidik: '', jenjang_pendidikan: '', mata_pelajaran: '', inovasi_pembelajaran: '', mengajar_bimbel: false }]
}

export function buildPayload(values: FormValues) {
  const pekerjaDetails = values.pekerja_details || []
  const bisnisDetails = values.bisnis_details || []
  const sosialDetails = values.sosial_details || []
  const kreatifDetails = values.kreatif_details || []
  const irtDetails = values.irt_details || []
  const mahasiswaDetails = values.mahasiswa_details || []
  const informalDetails = values.informal_details || []
  const agriDetails = values.agri_details || []
  const pendidikDetails = values.pendidik_details || []

  const latestEducation = pickLatestEducation(values)
  const legacyGraduationYear = latestEducation?.is_current
    ? currentYear
    : latestEducation?.end_year
      ? Number(latestEducation.end_year)
      : currentYear

  const payload: Record<string, unknown> = {
    nama_lengkap: values.nama_lengkap,
    nama_panggilan: values.nama_panggilan,
    tahun_lahir: Number(values.tahun_lahir),
    jenis_kelamin: values.jenis_kelamin,
    kota_domisili: values.kota_domisili,
    nomor_handphone: values.nomor_handphone,
    pendidikan_terakhir: latestEducation?.level || 'S1',
    nama_institusi_pendidikan_terakhir: latestEducation?.institution_name || '-',
    jurusan_studi: latestEducation?.major_program || '-',
    tahun_kelulusan: legacyGraduationYear,
    skill_gabungan: values.skill_gabungan,
    bahasa_dikuasai: values.bahasa_dikuasai,
    sertifikasi: values.sertifikasi?.trim() || null,
    instagram_link: values.instagram_link || null,
    linkedin_link: values.linkedin_link || null,
    portofolio_link: values.portofolio_link || null,
    domisili_city_ref_id: values.domisili_city_ref_id || null,
    domisili_provinsi: values.domisili_provinsi || null,
    domisili_kota_kabupaten: values.domisili_kota_kabupaten || values.kota_domisili,
    education_histories: values.education_histories.map((edu) => ({
      level: edu.level,
      institution_name: edu.institution_name,
      major_program: edu.major_program,
      start_year: edu.start_year ? Number(edu.start_year) : null,
      end_year: edu.end_year ? Number(edu.end_year) : null,
      is_current: edu.is_current,
    })),
    aktivitas_db: values.aktivitas.join(', '),
    jenis_dukungan_dibutuhkan_db: values.jenis_dukungan_dibutuhkan.join(', '),
    bidang_kontribusi_minat_db: values.bidang_kontribusi_minat.join(', '),
    aktivitas_status_durasi: {
      ...values.aktivitas_status_durasi,
      Pekerja: pekerjaDetails.map((detail) => detail.status_keaktifan),
      Bisnis: bisnisDetails.map((detail) => detail.status_keaktifan),
      Sosial: sosialDetails.map((detail) => detail.status_keaktifan),
      Kreatif: kreatifDetails.map((detail) => detail.status_keaktifan),
      'Rumah Tangga': irtDetails.map((detail) => detail.status_keaktifan),
      Mahasiswa: mahasiswaDetails.map((detail) => detail.status_keaktifan),
      Informal: informalDetails.map((detail) => detail.status_keaktifan),
      Agri: agriDetails.map((detail) => detail.status_keaktifan),
      Pendidik: pendidikDetails.map((detail) => detail.status_keaktifan),
    },
  }

  if (values.aktivitas.includes('Pekerja')) {
    payload.alumni_pekerja = pekerjaDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_pekerja: detail.keahlian_pekerja,
      nama_instansi: detail.nama_instansi,
      posisi: detail.posisi,
      pengalaman_proyek: detail.pengalaman_proyek,
      akses_jejaring: detail.akses_jejaring,
      pengalaman_bermitra: detail.pengalaman_bermitra,
    }))
  }

  if (values.aktivitas.includes('Bisnis')) {
    payload.alumni_bisnis = bisnisDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_wirausahaan: detail.keahlian_wirausahaan,
      produk_layanan_utama: detail.produk_layanan_utama,
      nama_usaha: detail.nama_usaha,
      skala_usaha: detail.skala_usaha,
      kendala_bisnis: detail.kendala_bisnis,
      target_pasar: detail.target_pasar,
      kolaborasi_terbuka: detail.kolaborasi_terbuka,
      keahlian_dibagikan: detail.keahlian_dibagikan,
    }))
  }

  if (values.aktivitas.includes('Sosial')) {
    payload.alumni_sosial = sosialDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_sosial: detail.keahlian_sosial,
      pengalaman_proyek_sosial: detail.pengalaman_proyek_sosial,
      isu_fokus: detail.isu_fokus,
      nama_organisasi: detail.nama_organisasi,
      pengalaman_bermitra_sosial: detail.pengalaman_bermitra_sosial,
    }))
  }

  if (values.aktivitas.includes('Kreatif')) {
    payload.alumni_kreatif = kreatifDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_kreatif: detail.keahlian_kreatif,
      platform_digital_utama: detail.platform_digital_utama,
      jenis_konten: detail.jenis_konten,
      total_jangkauan: detail.total_jangkauan,
      kisaran_rate_card: detail.kisaran_rate_card,
      demografi_followers: detail.demografi_followers,
    }))
  }

  if (values.aktivitas.includes('Rumah Tangga')) {
    payload.alumni_rumah_tangga = irtDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_irt: detail.keahlian_irt,
      kegiatan_organisasi_irt: detail.kegiatan_organisasi_irt,
      pengalaman_tim_irt: detail.pengalaman_tim_irt,
      mencari_pekerjaan_kolaborasi_irt: detail.mencari_pekerjaan_kolaborasi_irt,
    }))
  }

  if (values.aktivitas.includes('Mahasiswa')) {
    payload.alumni_mahasiswa = mahasiswaDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_mahasiswa: detail.keahlian_mahasiswa,
      kegiatan_organisasi_mahasiswa: detail.kegiatan_organisasi_mahasiswa,
      pengalaman_tim_mahasiswa: detail.pengalaman_tim_mahasiswa,
      mencari_pekerjaan_kolaborasi_mahasiswa: detail.mencari_pekerjaan_kolaborasi_mahasiswa,
      pengalaman_magang: detail.pengalaman_magang,
    }))
  }

  if (values.aktivitas.includes('Informal')) {
    payload.alumni_informal = informalDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_informal: detail.keahlian_informal,
      pengalaman_tim_informal: detail.pengalaman_tim_informal,
      pernah_rekrut_memimpin: detail.pernah_rekrut_memimpin,
    }))
  }

  if (values.aktivitas.includes('Agri')) {
    payload.alumni_agri = agriDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_agri: detail.keahlian_agri,
      komoditas_utama: detail.komoditas_utama,
      tergabung_kelompok: detail.tergabung_kelompok,
      skala_usaha_agri: detail.skala_usaha_agri,
      nilai_tambah_diterapkan: detail.nilai_tambah_diterapkan,
      kendala_dihadapi_agri: detail.kendala_dihadapi_agri,
    }))
  }

  if (values.aktivitas.includes('Pendidik')) {
    payload.alumni_pendidik = pendidikDetails.map((detail) => ({
      status_keaktifan: detail.status_keaktifan,
      keahlian_pendidik: detail.keahlian_pendidik,
      jenjang_pendidikan: detail.jenjang_pendidikan,
      mata_pelajaran: detail.mata_pelajaran,
      inovasi_pembelajaran: detail.inovasi_pembelajaran,
      mengajar_bimbel: detail.mengajar_bimbel,
    }))
  }

  return payload
}
