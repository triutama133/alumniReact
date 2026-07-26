// app/(main)/profile/edit/[userId]/page.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

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
import {
  aktivitasOptions,
  activityStatusOptions,
  buildPayload,
  dukunganOptions,
  educationLevels,
  ensureAgriDetailsFromProfile,
  ensureBisnisDetailsFromProfile,
  ensureInformalDetailsFromProfile,
  ensureIrtDetailsFromProfile,
  ensureKreatifDetailsFromProfile,
  ensureMahasiswaDetailsFromProfile,
  ensurePekerjaDetailsFromProfile,
  ensurePendidikDetailsFromProfile,
  ensureSosialDetailsFromProfile,
  formSchema,
  FormValues,
  genderOptions,
  IndonesiaCityOption,
  kontribusiOptions,
  normalizeArray,
  ProfileResponse,
} from '@/lib/profileForm'

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

function AktivitasSelectionField({
  label,
  description,
  options,
  value,
  onChange,
  statusValue,
  onStatusChange,
}: {
  label: string
  description?: string
  options: readonly { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  statusValue: Record<string, string>
  onStatusChange: (activity: string, status: string) => void
}) {
  return (
    <FormItem className="space-y-4">
      <div>
        <FormLabel className="text-base font-semibold">{label}</FormLabel>
        {description ? <FormDescription className="text-sm text-slate-400">{description}</FormDescription> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const optionValue = option.value
          const optionLabel = option.label
          const checked = value.includes(optionValue)
          const currentStatus = statusValue[optionValue] || 'Aktif saat ini'
          const useDetailStatusOnly = ['Pekerja', 'Bisnis', 'Sosial', 'Kreatif', 'Rumah Tangga', 'Mahasiswa', 'Informal', 'Agri', 'Pendidik'].includes(optionValue)

          return (
            <div key={optionValue} className={`flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300 ${checked ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/30' : 'bg-transparent border-slate-200 dark:border-border'}`}>
               <label className="flex items-start gap-3 text-sm font-medium cursor-pointer">
                 <Checkbox
                   checked={checked}
                   onCheckedChange={(nextChecked) => {
                     if (nextChecked) {
                       onChange([...value, optionValue])
                       if (!useDetailStatusOnly) {
                         onStatusChange(optionValue, 'Aktif saat ini')
                       }
                       return
                     }
                     onChange(value.filter((item) => item !== optionValue))
                   }}
                 />
                 <span className="text-slate-900 dark:text-white">{optionLabel}</span>
               </label>
               
               {checked && !useDetailStatusOnly && (
                 <div className="pl-7 pr-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                   <label className="text-xs text-slate-400 block">Status Keaktifan:</label>
                   <Select 
                     value={currentStatus} 
                     onValueChange={(val) => onStatusChange(optionValue, val)}
                   >
                     <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-border text-slate-900 dark:text-slate-200 rounded-md">
                       <SelectValue placeholder="Pilih status" />
                     </SelectTrigger>
                     <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-border text-slate-900 dark:text-slate-200">
                       <SelectItem value="Aktif saat ini">Aktif saat ini</SelectItem>
                       <SelectItem value="<1 tahun lalu">Berhenti &lt;1 tahun lalu</SelectItem>
                       <SelectItem value="1-3 tahun lalu">Berhenti 1-3 tahun lalu</SelectItem>
                       <SelectItem value="3-5 tahun lalu">Berhenti 3-5 tahun lalu</SelectItem>
                       <SelectItem value=">5 tahun">Berhenti &gt;5 tahun (Lewati detail)</SelectItem>
                     </SelectContent>
                   </Select>
                   {currentStatus === '>5 tahun' && (
                     <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                       ⚠️ Detail pertanyaan untuk aktivitas ini akan dilewati.
                     </p>
                   )}
                 </div>
               )}
             </div>
          )
        })}
      </div>
    </FormItem>
  )
}

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [loading, setLoading] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [cityOptions, setCityOptions] = useState<IndonesiaCityOption[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [cityLoading, setCityLoading] = useState(false)
  const [cityError, setCityError] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_lengkap: '',
      nama_panggilan: '',
      tahun_lahir: '',
      jenis_kelamin: 'Laki-laki',
      kota_domisili: '',
      nomor_handphone: '',
      skill_gabungan: '',
      bahasa_dikuasai: '',
      sertifikasi: '',
      instagram_link: '',
      linkedin_link: '',
      portofolio_link: '',
      domisili_city_ref_id: '',
      domisili_provinsi: '',
      domisili_kota_kabupaten: '',
      education_histories: [
        {
          level: 'SMA/SMK',
          institution_name: '',
          major_program: '',
          start_year: '',
          end_year: '',
          is_current: false,
        },
      ],
      pekerja_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_pekerja: '',
          nama_instansi: '',
          posisi: '',
          pengalaman_proyek: '',
          akses_jejaring: false,
          pengalaman_bermitra: false,
        },
      ],
      bisnis_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_wirausahaan: '',
          produk_layanan_utama: '',
          nama_usaha: '',
          skala_usaha: '',
          kendala_bisnis: '',
          target_pasar: undefined,
        },
      ],
      sosial_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_sosial: '',
          pengalaman_proyek_sosial: '',
          isu_fokus: '',
          nama_organisasi: '',
          pengalaman_bermitra_sosial: false,
        },
      ],
      kreatif_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_kreatif: '',
          platform_digital_utama: '',
          jenis_konten: '',
          total_jangkauan: '',
          kisaran_rate_card: '',
          demografi_followers: '',
        },
      ],
      aktivitas: [],
      aktivitas_status_durasi: {},
      jenis_dukungan_dibutuhkan: [],
      bidang_kontribusi_minat: [],
      irt_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_irt: '',
          kegiatan_organisasi_irt: '',
          pengalaman_tim_irt: false,
          mencari_pekerjaan_kolaborasi_irt: false,
        },
      ],
      mahasiswa_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_mahasiswa: '',
          kegiatan_organisasi_mahasiswa: '',
          pengalaman_tim_mahasiswa: false,
          mencari_pekerjaan_kolaborasi_mahasiswa: false,
          pengalaman_magang: '',
        },
      ],
      informal_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_informal: '',
          pengalaman_tim_informal: false,
          pernah_rekrut_memimpin: false,
        },
      ],
      agri_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_agri: '',
          komoditas_utama: '',
          tergabung_kelompok: false,
          skala_usaha_agri: '',
          nilai_tambah_diterapkan: '',
          kendala_dihadapi_agri: '',
        },
      ],
      pendidik_details: [
        {
          status_keaktifan: 'Aktif saat ini',
          keahlian_pendidik: '',
          jenjang_pendidikan: '',
          mata_pelajaran: '',
          inovasi_pembelajaran: '',
          mengajar_bimbel: false,
        },
      ],
    },
  })

  const selectedAktivitas = form.watch('aktivitas')

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setCityLoading(true)
        setCityError('')
        const response = await fetch(`/api/reference/indonesia-cities?search=${encodeURIComponent(citySearch)}&limit=120`)
        if (!response.ok) {
          throw new Error('Gagal memuat referensi kota/kabupaten.')
        }
        const data = (await response.json()) as { items?: IndonesiaCityOption[]; error?: string }
        if (data.error) {
          throw new Error(data.error)
        }
        setCityOptions(data.items || [])
      } catch (error) {
        setCityOptions([])
        setCityError(error instanceof Error ? error.message : 'Gagal memuat daftar kota/kabupaten.')
      } finally {
        setCityLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [citySearch])

  const addEducationHistory = () => {
    const current = form.getValues('education_histories') || []
    form.setValue('education_histories', [
      ...current,
      {
        level: 'S1',
        institution_name: '',
        major_program: '',
        start_year: '',
        end_year: '',
        is_current: false,
      },
    ])
  }

  const removeEducationHistory = (index: number) => {
    const current = form.getValues('education_histories') || []
    if (current.length <= 1) {
      return
    }
    form.setValue(
      'education_histories',
      current.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  const addPekerjaDetail = () => {
    const current = form.getValues('pekerja_details') || []
    form.setValue('pekerja_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_pekerja: '',
        nama_instansi: '',
        posisi: '',
        pengalaman_proyek: '',
        akses_jejaring: false,
        pengalaman_bermitra: false,
      },
    ])
  }

  const removePekerjaDetail = (index: number) => {
    const current = form.getValues('pekerja_details') || []
    if (current.length <= 1) {
      return
    }
    form.setValue(
      'pekerja_details',
      current.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  const addBisnisDetail = () => {
    const current = form.getValues('bisnis_details') || []
    form.setValue('bisnis_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_wirausahaan: '',
        produk_layanan_utama: '',
        nama_usaha: '',
        skala_usaha: '',
        kendala_bisnis: '',
        target_pasar: undefined,
      },
    ])
  }

  const removeBisnisDetail = (index: number) => {
    const current = form.getValues('bisnis_details') || []
    if (current.length <= 1) {
      return
    }
    form.setValue('bisnis_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addSosialDetail = () => {
    const current = form.getValues('sosial_details') || []
    form.setValue('sosial_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_sosial: '',
        pengalaman_proyek_sosial: '',
        isu_fokus: '',
        nama_organisasi: '',
        pengalaman_bermitra_sosial: false,
      },
    ])
  }

  const removeSosialDetail = (index: number) => {
    const current = form.getValues('sosial_details') || []
    if (current.length <= 1) {
      return
    }
    form.setValue('sosial_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addKreatifDetail = () => {
    const current = form.getValues('kreatif_details') || []
    form.setValue('kreatif_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_kreatif: '',
        platform_digital_utama: '',
        jenis_konten: '',
        total_jangkauan: '',
        kisaran_rate_card: '',
        demografi_followers: '',
      },
    ])
  }

  const removeKreatifDetail = (index: number) => {
    const current = form.getValues('kreatif_details') || []
    if (current.length <= 1) {
      return
    }
    form.setValue('kreatif_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addIrtDetail = () => {
    const current = form.getValues('irt_details') || []
    form.setValue('irt_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_irt: '',
        kegiatan_organisasi_irt: '',
        pengalaman_tim_irt: false,
        mencari_pekerjaan_kolaborasi_irt: false,
      },
    ])
  }

  const removeIrtDetail = (index: number) => {
    const current = form.getValues('irt_details') || []
    if (current.length <= 1) return
    form.setValue('irt_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addMahasiswaDetail = () => {
    const current = form.getValues('mahasiswa_details') || []
    form.setValue('mahasiswa_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_mahasiswa: '',
        kegiatan_organisasi_mahasiswa: '',
        pengalaman_tim_mahasiswa: false,
        mencari_pekerjaan_kolaborasi_mahasiswa: false,
        pengalaman_magang: '',
      },
    ])
  }

  const removeMahasiswaDetail = (index: number) => {
    const current = form.getValues('mahasiswa_details') || []
    if (current.length <= 1) return
    form.setValue('mahasiswa_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addInformalDetail = () => {
    const current = form.getValues('informal_details') || []
    form.setValue('informal_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_informal: '',
        pengalaman_tim_informal: false,
        pernah_rekrut_memimpin: false,
      },
    ])
  }

  const removeInformalDetail = (index: number) => {
    const current = form.getValues('informal_details') || []
    if (current.length <= 1) return
    form.setValue('informal_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addAgriDetail = () => {
    const current = form.getValues('agri_details') || []
    form.setValue('agri_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_agri: '',
        komoditas_utama: '',
        tergabung_kelompok: false,
        skala_usaha_agri: '',
        nilai_tambah_diterapkan: '',
        kendala_dihadapi_agri: '',
      },
    ])
  }

  const removeAgriDetail = (index: number) => {
    const current = form.getValues('agri_details') || []
    if (current.length <= 1) return
    form.setValue('agri_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

  const addPendidikDetail = () => {
    const current = form.getValues('pendidik_details') || []
    form.setValue('pendidik_details', [
      ...current,
      {
        status_keaktifan: 'Aktif saat ini',
        keahlian_pendidik: '',
        jenjang_pendidikan: '',
        mata_pelajaran: '',
        inovasi_pembelajaran: '',
        mengajar_bimbel: false,
      },
    ])
  }

  const removePendidikDetail = (index: number) => {
    const current = form.getValues('pendidik_details') || []
    if (current.length <= 1) return
    form.setValue('pendidik_details', current.filter((_, currentIndex) => currentIndex !== index))
  }

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

        form.reset({
          ...form.getValues(),
          nama_lengkap: profile.nama_lengkap || '',
          nama_panggilan: profile.nama_panggilan || '',
          tahun_lahir: profile.tahun_lahir ? String(profile.tahun_lahir) : '',
          jenis_kelamin: profile.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
          kota_domisili: profile.kota_domisili || '',
          nomor_handphone: profile.nomor_handphone || '',
          skill_gabungan: profile.skill_gabungan || '',
          bahasa_dikuasai: profile.bahasa_dikuasai || '',
          sertifikasi: profile.sertifikasi || '',
          instagram_link: profile.instagram_link || '',
          linkedin_link: profile.linkedin_link || '',
          portofolio_link: profile.portofolio_link || '',
          domisili_city_ref_id: profile.domisili_city_ref_id || '',
          domisili_provinsi: profile.domisili_provinsi || '',
          domisili_kota_kabupaten: profile.domisili_kota_kabupaten || profile.kota_domisili || '',
          education_histories: profile.alumni_education_histories && profile.alumni_education_histories.length > 0
            ? profile.alumni_education_histories.map((edu) => ({
                level: educationLevels.includes((edu.level || '') as (typeof educationLevels)[number])
                  ? (edu.level as (typeof educationLevels)[number])
                  : 'S1',
                institution_name: edu.institution_name || '',
                major_program: edu.major_program || '',
                start_year: edu.start_year ? String(edu.start_year) : '',
                end_year: edu.end_year ? String(edu.end_year) : '',
                is_current: Boolean(edu.is_current),
              }))
            : [{
                level: 'SMA/SMK',
                institution_name: profile.nama_institusi_pendidikan_terakhir || '',
                major_program: profile.jurusan_studi || '',
                start_year: '',
                end_year: profile.tahun_kelulusan ? String(profile.tahun_kelulusan) : '',
                is_current: false,
              }],
          pekerja_details: ensurePekerjaDetailsFromProfile(profile),
          bisnis_details: ensureBisnisDetailsFromProfile(profile),
          sosial_details: ensureSosialDetailsFromProfile(profile),
          kreatif_details: ensureKreatifDetailsFromProfile(profile),
          irt_details: ensureIrtDetailsFromProfile(profile),
          mahasiswa_details: ensureMahasiswaDetailsFromProfile(profile),
          informal_details: ensureInformalDetailsFromProfile(profile),
          agri_details: ensureAgriDetailsFromProfile(profile),
          pendidik_details: ensurePendidikDetailsFromProfile(profile),
          aktivitas: normalizeArray(profile.aktivitas),
          aktivitas_status_durasi: (profile.aktivitas_status_durasi && typeof profile.aktivitas_status_durasi === 'object')
            ? (profile.aktivitas_status_durasi as Record<string, string>)
            : {},
          jenis_dukungan_dibutuhkan: normalizeArray(profile.jenis_dukungan_dibutuhkan),
          bidang_kontribusi_minat: normalizeArray(profile.bidang_kontribusi_minat),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memuat profil.'
        toast.error('Profil tidak bisa dimuat.', { description: message })
      } finally {
        setPageReady(true)
      }
    }

    init()
  }, [form, router])

  async function onSubmit(values: FormValues) {
    setLoading(true)

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
        throw new Error(detailMessage || result.error || 'Gagal memperbarui profil.')
      }

      toast.success('Profil berhasil diperbarui!')
      router.push(`/profile/${userId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan profil.'
      toast.error('Terjadi kesalahan', { description: message })
    } finally {
      setLoading(false)
    }
  }

  if (!pageReady) {
    return <div className="flex min-h-screen items-center justify-center p-4">Memuat data profil...</div>
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 stagger-children">
      <Card className="mx-auto my-8 w-full max-w-4xl premium-light-card">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Edit Profil Anda</CardTitle>
          <CardDescription className="text-muted-foreground">
            Perbarui informasi dasar dan detail aktivitas Anda agar rekan alumni mendapatkan informasi terbaru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Informasi Dasar</h2>
                  <p className="text-sm text-muted-foreground">Bagian ini menjadi profil utama yang tampil ke pengguna lain.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="nama_lengkap" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Nama Lengkap</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nama_panggilan" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Nama Panggilan</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tahun_lahir" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Tahun Lahir</FormLabel>
                      <FormControl><Input inputMode="numeric" placeholder="1998" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="jenis_kelamin" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Jenis Kelamin</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover text-popover-foreground">
                          {genderOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="kota_domisili" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Kota Domisili</FormLabel>
                      <Select
                        value={form.watch('domisili_city_ref_id') || ''}
                        onValueChange={(value) => {
                          const selected = cityOptions.find((item) => item.id === value)
                          form.setValue('domisili_city_ref_id', value)
                          if (selected) {
                            form.setValue('domisili_provinsi', selected.province)
                            form.setValue('domisili_kota_kabupaten', selected.city)
                            field.onChange(`${selected.city}, ${selected.province}`)
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={cityLoading ? 'Memuat referensi kota...' : 'Pilih kota/kabupaten'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80 bg-popover text-popover-foreground">
                          <div className="sticky top-0 z-10 bg-popover p-2 border-b border-border">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder="Cari kota/kabupaten atau provinsi..."
                                value={citySearch}
                                onChange={(event) => setCitySearch(event.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div className="p-1">
                            {cityOptions.length > 0 ? (
                              cityOptions.map((city) => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.label}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-3 text-sm text-muted-foreground">
                                Tidak ada hasil. Coba kata kunci lain.
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-muted-foreground">Pilih domisili dari referensi kota/kabupaten Indonesia.</FormDescription>
                      {cityError && <p className="text-sm text-destructive">{cityError}</p>}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nomor_handphone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Nomor Handphone</FormLabel>
                      <FormControl><Input placeholder="6281234567890" {...field} /></FormControl>
                      <FormDescription className="text-muted-foreground">Gunakan format Indonesia tanpa tanda plus.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="skill_gabungan" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Keahlian Utama</FormLabel>
                    <FormControl><Textarea placeholder="Digital marketing, public speaking, product management" {...field} /></FormControl>
                    <FormDescription className="text-muted-foreground">Pisahkan beberapa skill dengan koma agar lebih mudah dicari.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="bahasa_dikuasai" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Bahasa yang Dikuasai</FormLabel>
                      <FormControl><Textarea placeholder="Bahasa Indonesia, English" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sertifikasi" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Sertifikasi</FormLabel>
                      <FormControl><Textarea placeholder="Google Analytics, BNSP, AWS Cloud Practitioner" {...field} /></FormControl>
                      <FormDescription className="text-muted-foreground">Opsional. Pisahkan beberapa sertifikasi dengan koma.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField control={form.control} name="instagram_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Instagram</FormLabel>
                      <FormControl><Input placeholder="https://instagram.com/username" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="linkedin_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">LinkedIn</FormLabel>
                      <FormControl><Input placeholder="https://linkedin.com/in/username" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="portofolio_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Portofolio</FormLabel>
                      <FormControl><Input placeholder="https://portfolio.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">Riwayat Pendidikan</h3>
                      <p className="text-sm text-muted-foreground">Isi seluruh jenjang pendidikan yang pernah ditempuh.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={addEducationHistory}>Tambah Jenjang</Button>
                  </div>

                  {form.watch('education_histories').map((_, index) => (
                    <div key={`education-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-foreground">Jenjang {index + 1}</h4>
                        <Button type="button" variant="ghost" onClick={() => removeEducationHistory(index)} disabled={form.watch('education_histories').length <= 1}>
                          Hapus
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`education_histories.${index}.level` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Jenjang</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih jenjang" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-popover text-popover-foreground">
                                  {educationLevels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`education_histories.${index}.institution_name` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Institusi Pendidikan</FormLabel>
                              <FormControl><Input placeholder="Nama sekolah/universitas" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`education_histories.${index}.major_program` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Jurusan / Program Studi</FormLabel>
                              <FormControl><Input placeholder="Contoh: Teknik Informatika" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`education_histories.${index}.start_year` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Tahun Mulai</FormLabel>
                              <FormControl><Input inputMode="numeric" placeholder="2015" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`education_histories.${index}.end_year` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Tahun Selesai</FormLabel>
                              <FormControl><Input inputMode="numeric" placeholder="2019" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`education_histories.${index}.is_current` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <BooleanField label="Masih menempuh jenjang ini" checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </section>
              </section>

              <section className="space-y-4">
                <FormField control={form.control} name="aktivitas" render={({ field }) => (
                  <AktivitasSelectionField
                    label="Aktivitas atau Pekerjaan"
                    description="Pilih aktivitas yang pernah atau sedang Anda lakukan. Jika sudah berhenti lebih dari 5 tahun, pertanyaan lanjutan akan dilewati secara otomatis."
                    options={aktivitasOptions}
                    value={field.value}
                    onChange={field.onChange}
                    statusValue={form.watch('aktivitas_status_durasi') || {}}
                    onStatusChange={(activity, status) => {
                      const current = form.getValues('aktivitas_status_durasi') || {}
                      form.setValue('aktivitas_status_durasi', {
                        ...current,
                        [activity]: status
                      })
                    }}
                  />
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
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Pekerja / Profesional</h3>
                    <Button type="button" variant="outline" onClick={addPekerjaDetail}>Tambah Detail</Button>
                  </div>

                  {(form.watch('pekerja_details') || []).map((_, index) => {
                    const statusValue = form.watch(`pekerja_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'

                    return (
                      <div key={`pekerja-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Pekerjaan {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removePekerjaDetail(index)}
                            disabled={(form.watch('pekerja_details') || []).length <= 1}
                          >
                            Hapus
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name={`pekerja_details.${index}.status_keaktifan` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-popover text-popover-foreground">
                                  {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`pekerja_details.${index}.keahlian_pekerja` as const} render={({ field }) => (
                                <FormItem><FormLabel className="text-foreground">Keahlian Profesional</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={form.control} name={`pekerja_details.${index}.nama_instansi` as const} render={({ field }) => (
                                <FormItem><FormLabel className="text-foreground">Nama Instansi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={form.control} name={`pekerja_details.${index}.posisi` as const} render={({ field }) => (
                                <FormItem><FormLabel className="text-foreground">Posisi / Jabatan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={form.control} name={`pekerja_details.${index}.pengalaman_proyek` as const} render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel className="text-foreground">Pengalaman Proyek</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <FormField control={form.control} name={`pekerja_details.${index}.akses_jejaring` as const} render={({ field }) => (
                                <FormItem><BooleanField label="Memiliki akses jejaring yang bisa dibuka untuk kolaborasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>
                              )} />
                              <FormField control={form.control} name={`pekerja_details.${index}.pengalaman_bermitra` as const} render={({ field }) => (
                                <FormItem><BooleanField label="Pernah bermitra lintas tim / organisasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>
                              )} />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Bisnis') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Wirausaha</h3>
                    <Button type="button" variant="outline" onClick={addBisnisDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('bisnis_details') || []).map((_, index) => {
                    const statusValue = form.watch(`bisnis_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`bisnis-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Bisnis {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeBisnisDetail(index)} disabled={(form.watch('bisnis_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`bisnis_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField control={form.control} name={`bisnis_details.${index}.nama_usaha` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Nama Usaha</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`bisnis_details.${index}.skala_usaha` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Skala Usaha</FormLabel><FormControl><Input placeholder="Mikro / Kecil / Menengah" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`bisnis_details.${index}.keahlian_wirausahaan` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Wirausaha</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`bisnis_details.${index}.produk_layanan_utama` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Produk / Layanan Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`bisnis_details.${index}.kendala_bisnis` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Kendala Bisnis</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`bisnis_details.${index}.target_pasar` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground">Target Pasar</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih target pasar" /></SelectTrigger></FormControl>
                                  <SelectContent className="bg-popover text-popover-foreground">
                                    <SelectItem value="B2C">B2C</SelectItem>
                                    <SelectItem value="B2B">B2B</SelectItem>
                                    <SelectItem value="B2C dan B2B">B2C dan B2B</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`bisnis_details.${index}.kolaborasi_terbuka` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keterbukaan Kolaborasi (Inkubasi, Ekspansi, dsb)</FormLabel><FormControl><Textarea placeholder="Jelaskan jenis kolaborasi yang Anda harapkan..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`bisnis_details.${index}.keahlian_dibagikan` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian yang Bisa Dibagikan ke Komunitas</FormLabel><FormControl><Textarea placeholder="Sebutkan keahlian yang dapat Anda bagikan/mentorkan..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Sosial') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Sosial / NGO</h3>
                    <Button type="button" variant="outline" onClick={addSosialDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('sosial_details') || []).map((_, index) => {
                    const statusValue = form.watch(`sosial_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`sosial-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Sosial {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeSosialDetail(index)} disabled={(form.watch('sosial_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`sosial_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`sosial_details.${index}.nama_organisasi` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Nama Organisasi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`sosial_details.${index}.isu_fokus` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Isu Fokus</FormLabel><FormControl><Input placeholder="Pendidikan, lingkungan, kesehatan" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`sosial_details.${index}.keahlian_sosial` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Sosial</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`sosial_details.${index}.pengalaman_proyek_sosial` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Pengalaman Proyek Sosial</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`sosial_details.${index}.pengalaman_bermitra_sosial` as const} render={({ field }) => (<FormItem><BooleanField label="Pernah bermitra dengan komunitas / lembaga lain" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Kreatif') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Kreatif / Content Creator</h3>
                    <Button type="button" variant="outline" onClick={addKreatifDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('kreatif_details') || []).map((_, index) => {
                    const statusValue = form.watch(`kreatif_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`kreatif-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Kreatif {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeKreatifDetail(index)} disabled={(form.watch('kreatif_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`kreatif_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField control={form.control} name={`kreatif_details.${index}.keahlian_kreatif` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Kreatif</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`kreatif_details.${index}.platform_digital_utama` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Platform Digital Utama</FormLabel><FormControl><Input placeholder="Instagram, TikTok, YouTube" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`kreatif_details.${index}.jenis_konten` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Jenis Konten</FormLabel><FormControl><Input placeholder="Edukasi, lifestyle, review" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`kreatif_details.${index}.total_jangkauan` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Total Jangkauan</FormLabel><FormControl><Input placeholder="10.000 followers / 50.000 monthly reach" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`kreatif_details.${index}.kisaran_rate_card` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Kisaran Rate Card</FormLabel><FormControl><Input placeholder="Rp500rb - Rp1jt" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`kreatif_details.${index}.demografi_followers` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Demografi Followers</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Rumah Tangga') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Ibu Rumah Tangga</h3>
                    <Button type="button" variant="outline" onClick={addIrtDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('irt_details') || []).map((_, index) => {
                    const statusValue = form.watch(`irt_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`irt-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Detail IRT {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeIrtDetail(index)} disabled={(form.watch('irt_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`irt_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`irt_details.${index}.keahlian_irt` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`irt_details.${index}.kegiatan_organisasi_irt` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Kegiatan Organisasi / Komunitas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <FormField control={form.control} name={`irt_details.${index}.pengalaman_tim_irt` as const} render={({ field }) => (<FormItem><BooleanField label="Memiliki pengalaman kerja tim / kepanitiaan" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                              <FormField control={form.control} name={`irt_details.${index}.mencari_pekerjaan_kolaborasi_irt` as const} render={({ field }) => (<FormItem><BooleanField label="Saat ini mencari peluang kerja atau kolaborasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Mahasiswa') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Mahasiswa / Fresh Graduate</h3>
                    <Button type="button" variant="outline" onClick={addMahasiswaDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('mahasiswa_details') || []).map((_, index) => {
                    const statusValue = form.watch(`mahasiswa_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`mahasiswa-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Detail Mahasiswa {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeMahasiswaDetail(index)} disabled={(form.watch('mahasiswa_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`mahasiswa_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`mahasiswa_details.${index}.keahlian_mahasiswa` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`mahasiswa_details.${index}.kegiatan_organisasi_mahasiswa` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Kegiatan Organisasi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`mahasiswa_details.${index}.pengalaman_magang` as const} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-foreground">Pengalaman Magang / Proyek</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <FormField control={form.control} name={`mahasiswa_details.${index}.pengalaman_tim_mahasiswa` as const} render={({ field }) => (<FormItem><BooleanField label="Memiliki pengalaman kerja tim / organisasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                              <FormField control={form.control} name={`mahasiswa_details.${index}.mencari_pekerjaan_kolaborasi_mahasiswa` as const} render={({ field }) => (<FormItem><BooleanField label="Sedang mencari peluang kerja atau kolaborasi" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Informal') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Freelancer / Pekerja Informal</h3>
                    <Button type="button" variant="outline" onClick={addInformalDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('informal_details') || []).map((_, index) => {
                    const statusValue = form.watch(`informal_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`informal-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Detail Informal {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeInformalDetail(index)} disabled={(form.watch('informal_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`informal_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`informal_details.${index}.keahlian_informal` as const} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-foreground">Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <FormField control={form.control} name={`informal_details.${index}.pengalaman_tim_informal` as const} render={({ field }) => (<FormItem><BooleanField label="Pernah bekerja dalam tim atau proyek kolaboratif" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                              <FormField control={form.control} name={`informal_details.${index}.pernah_rekrut_memimpin` as const} render={({ field }) => (<FormItem><BooleanField label="Pernah merekrut atau memimpin orang lain" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Agri') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Agribisnis / Perikanan</h3>
                    <Button type="button" variant="outline" onClick={addAgriDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('agri_details') || []).map((_, index) => {
                    const statusValue = form.watch(`agri_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`agri-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Detail Agri {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removeAgriDetail(index)} disabled={(form.watch('agri_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`agri_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`agri_details.${index}.keahlian_agri` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Agribisnis</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`agri_details.${index}.komoditas_utama` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Komoditas Utama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`agri_details.${index}.skala_usaha_agri` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Skala Usaha</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`agri_details.${index}.nilai_tambah_diterapkan` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Nilai Tambah yang Diterapkan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`agri_details.${index}.kendala_dihadapi_agri` as const} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-foreground">Kendala yang Dihadapi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`agri_details.${index}.tergabung_kelompok` as const} render={({ field }) => (<FormItem><BooleanField label="Tergabung dalam kelompok / koperasi / komunitas tani / nelayan" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              {selectedAktivitas.includes('Pendidik') && (
                <section className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">Detail Pendidik</h3>
                    <Button type="button" variant="outline" onClick={addPendidikDetail}>Tambah Detail</Button>
                  </div>
                  {(form.watch('pendidik_details') || []).map((_, index) => {
                    const statusValue = form.watch(`pendidik_details.${index}.status_keaktifan` as const)
                    const skipDetail = statusValue === '>5 tahun'
                    return (
                      <div key={`pendidik-${index}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-foreground">Detail Pendidik {index + 1}</h4>
                          <Button type="button" variant="ghost" onClick={() => removePendidikDetail(index)} disabled={(form.watch('pendidik_details') || []).length <= 1}>Hapus</Button>
                        </div>
                        <FormField control={form.control} name={`pendidik_details.${index}.status_keaktifan` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Status Keaktifan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-popover text-popover-foreground">
                                {activityStatusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {!skipDetail && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField control={form.control} name={`pendidik_details.${index}.keahlian_pendidik` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Keahlian Utama</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`pendidik_details.${index}.jenjang_pendidikan` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Jenjang Pendidikan yang Diajar</FormLabel><FormControl><Input placeholder="SD / SMP / SMA / kursus" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`pendidik_details.${index}.mata_pelajaran` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Mata Pelajaran / Bidang Ajar</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name={`pendidik_details.${index}.inovasi_pembelajaran` as const} render={({ field }) => (<FormItem><FormLabel className="text-foreground">Inovasi Pembelajaran</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`pendidik_details.${index}.mengajar_bimbel` as const} render={({ field }) => (<FormItem><BooleanField label="Juga mengajar les privat / bimbel / pelatihan" checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormItem>)} />
                          </>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" disabled={loading}>
                {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan & Selesai'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
