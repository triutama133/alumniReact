'use client'

import { useState } from 'react'
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
}

interface PostJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (job: PostedJob) => void
}

const linesToArray = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)

export default function PostJobModal({ open, onOpenChange, onCreated }: PostJobModalProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [jobDesk, setJobDesk] = useState('')
  const [requirements, setRequirements] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [salary, setSalary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetAndClose = () => {
    setJobTitle('')
    setCompany('')
    setCategory('')
    setDescription('')
    setJobDesk('')
    setRequirements('')
    setJobUrl('')
    setSalary('')
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim() || !company.trim() || !description.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
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
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memasang lowongan.')
      }

      toast.success('Lowongan berhasil dipasang!')
      onCreated(data.job as PostedJob)
      resetAndClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memasang lowongan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="relative sm:max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto">
        {isSubmitting && <LoadingOverlay message="Memasang lowongan..." />}
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Pasang Lowongan</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Lowongan yang Anda pasang akan langsung tampil di daftar, ditandai sebagai lowongan komunitas. Anda bisa menonaktifkannya kapan saja.
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
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetAndClose} className="rounded-md text-xs">Batal</Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !jobTitle.trim() || !company.trim() || !description.trim()} className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md px-5 shadow-sm gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? 'Memasang...' : 'Pasang Lowongan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
