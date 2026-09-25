'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface CreatedCohort {
  id: number | string
  name: string
  description: string | null
  [key: string]: unknown
}

interface CreateCohortModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the newly created cohort once the API call succeeds. */
  onCreated: (cohort: CreatedCohort) => void
}

/**
 * The single "create community" form, used from both the Navbar portal
 * selector and the Home feed. Only collects a name and description —
 * there is no real billing/subscription flow behind cohort creation, so
 * this form does not pretend there is one.
 */
export default function CreateCohortModal({ open, onOpenChange, onCreated }: CreateCohortModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const resetAndClose = () => {
    setName('')
    setDescription('')
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat komunitas.')
      }

      toast.success('Komunitas berhasil dibuat!')
      onCreated(data.cohort as CreatedCohort)
      resetAndClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat komunitas.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Buat Komunitas</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Buat portal komunitas Anda sendiri. Undang anggota, buat proyek tim, dan bagikan ide secara eksklusif.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Komunitas</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Indo Tech Innovators"
              className="h-9 bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-md focus:border-primary"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deskripsi Singkat</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan visi dan misi dari komunitas Anda..."
              className="bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-md resize-none focus:border-primary"
              rows={3}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetAndClose} className="rounded-md text-xs">Batal</Button>
            <Button type="submit" size="sm" disabled={isCreating || !name.trim()} className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md px-5 shadow-sm">
              {isCreating ? 'Membuat...' : 'Buat Komunitas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
