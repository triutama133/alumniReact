'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface ApplyJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: number
  jobTitle: string
  onApplied: () => void
}

export default function ApplyJobModal({ open, onOpenChange, jobId, jobTitle, onApplied }: ApplyJobModalProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetAndClose = () => {
    setMessage('')
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, message: message || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan lamaran.')
      }
      toast.success('Lamaran berhasil dikirim!')
      onApplied()
      resetAndClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirimkan lamaran.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="relative sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
        {isSubmitting && <LoadingOverlay message="Mengirim lamaran..." />}
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Ajukan Diri</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Melamar untuk lowongan &quot;{jobTitle}&quot;. Pemilik lowongan akan melihat profil Anda dan bisa menghubungi Anda langsung.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pesan Singkat (opsional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ceritakan singkat kenapa Anda cocok untuk posisi ini..."
              rows={4}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetAndClose} className="rounded-md text-xs">Batal</Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md px-5 shadow-sm gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? 'Mengirim...' : 'Kirim Lamaran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
