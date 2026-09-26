'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EnvironmentSelect, EnvironmentCohortOption } from '@/components/community/EnvironmentSelect'

export interface PostedJob {
  id: number
  job_title: string
  company: string
  platform: string
  category: string
  description: string
  job_desk: string[]
  requirements: string[]
  job_url: string | null
  salary: string | null
  owner_id: number
  source: string
  is_active: boolean
  cohort_ids?: number[]
}

interface PostJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (job: PostedJob) => void
  /** When present, the modal edits this job instead of creating a new one. */
  editingJob?: PostedJob | null
  onUpdated?: (job: PostedJob) => void
}

const linesToArray = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
const arrayToLines = (value: string[] | null | undefined) => (value || []).join('\n')

export default function PostJobModal({ open, onOpenChange, onCreated, editingJob, onUpdated }: PostJobModalProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [jobDesk, setJobDesk] = useState('')
  const [requirements, setRequirements] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [salary, setSalary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cohorts, setCohorts] = useState<EnvironmentCohortOption[]>([])
  const [selectedCohortIds, setSelectedCohortIds] = useState<number[]>([])

  const isEditing = Boolean(editingJob)

  // Load the communities this user belongs to, so they can tag the posting.
  useEffect(() => {
    if (!open) return
    fetch('/api/cohorts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EnvironmentCohortOption[]) => setCohorts(data))
      .catch(() => {})
  }, [open])

  // Pre-fill the form when opening in edit mode.
  useEffect(() => {
    if (open && editingJob) {
      setJobTitle(editingJob.job_title || '')
      setCompany(editingJob.company || '')
      setCategory(editingJob.category || '')
      setDescription(editingJob.description || '')
      setJobDesk(arrayToLines(editingJob.job_desk))
      setRequirements(arrayToLines(editingJob.requirements))
      setJobUrl(editingJob.job_url || '')
      setSalary(editingJob.salary || '')
      setSelectedCohortIds(editingJob.cohort_ids || [])
    } else if (open && !editingJob) {
      setSelectedCohortIds([])
    }
  }, [open, editingJob])

  const resetAndClose = () => {
    setJobTitle('')
    setCompany('')
    setCategory('')
    setDescription('')
    setJobDesk('')
    setRequirements('')
    setJobUrl('')
    setSalary('')
    setSelectedCohortIds([])
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim() || !company.trim() || !description.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(isEditing ? `/api/jobs/${editingJob!.id}` : '/api/jobs', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          company,
          category: category || 'Others / General',
          description,
          job_desk: linesToArray(jobDesk),
          requirements: linesToArray(requirements),
          job_url: jobUrl || null,
          salary: salary || null,
          cohortIds: selectedCohortIds,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (isEditing ? 'Gagal memperbarui lowongan.' : 'Gagal memasang lowongan.'))
      }

      toast.success(isEditing ? 'Lowongan berhasil diperbarui!' : 'Lowongan berhasil dipasang!')
      if (isEditing) {
        onUpdated?.(data.job as PostedJob)
      } else {
        onCreated(data.job as PostedJob)
      }
      resetAndClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isEditing ? 'Gagal memperbarui lowongan.' : 'Gagal memasang lowongan.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto">
        {/* Radix's DialogContent must keep its base `fixed` positioning for viewport
            centering to work — `relative` here would win the position conflict via
            tailwind-merge and collapse it into normal document flow, so the wrapper
            below carries `relative` instead, just for the overlay's `absolute` anchor. */}
        <div className="relative">
        {isSubmitting && <LoadingOverlay message={isEditing ? 'Memperbarui lowongan...' : 'Memasang lowongan...'} />}
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{isEditing ? 'Edit Lowongan' : 'Pasang Lowongan'}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isEditing
              ? 'Perbarui detail lowongan Anda. Perubahan langsung tampil di daftar.'
              : 'Lowongan yang Anda pasang akan langsung tampil di daftar, ditandai sebagai lowongan komunitas. Anda bisa menonaktifkannya kapan saja.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Posisi</label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Contoh: Frontend Developer" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Perusahaan</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nama perusahaan" required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kategori</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Contoh: Teknologi, Marketing" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deskripsi</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan posisi dan perusahaan secara singkat..." rows={3} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tugas & Tanggung Jawab</label>
            <Textarea value={jobDesk} onChange={(e) => setJobDesk(e.target.value)} placeholder={'Satu poin per baris, contoh:\nMengembangkan fitur baru\nMemperbaiki bug'} rows={3} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Persyaratan / Keahlian</label>
            <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder={'Satu poin per baris, contoh:\nMenguasai React\nPengalaman minimal 1 tahun'} rows={3} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gaji / Rentang Gaji (opsional)</label>
              <Input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Contoh: Rp 8.000.000 - 12.000.000" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Link Lamar (opsional)</label>
              <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://... (kosongkan jika cukup hubungi langsung)" />
            </div>
          </div>
          <EnvironmentSelect
            cohorts={cohorts}
            selectedCohortIds={selectedCohortIds}
            onChange={setSelectedCohortIds}
          />
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetAndClose} className="rounded-md text-xs">Batal</Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !jobTitle.trim() || !company.trim() || !description.trim()} className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md px-5 shadow-sm gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? (isEditing ? 'Memperbarui...' : 'Memasang...') : (isEditing ? 'Simpan Perubahan' : 'Pasang Lowongan')}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
