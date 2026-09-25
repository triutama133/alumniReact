'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Users, CheckCircle, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Applicant {
  id: number
  status: 'pending' | 'accepted' | 'rejected'
  message: string | null
  created_at: string
  user_id: number
  alumni_db: {
    id: number
    nama_lengkap: string | null
    nama_panggilan: string | null
    aktivitas: string | null
    skill_gabungan: string | null
    kota_domisili: string | null
  } | null
}

interface JobApplicantsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: number
  jobTitle: string
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'accepted': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending': return 'Menunggu'
    case 'accepted': return 'Diterima'
    case 'rejected': return 'Ditolak'
    default: return status
  }
}

export default function JobApplicantsModal({ open, onOpenChange, jobId, jobTitle }: JobApplicantsModalProps) {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadApplicants = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/applications`)
      if (res.ok) {
        setApplicants(await res.json())
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Gagal memuat pelamar.')
      }
    } catch {
      toast.error('Gagal memuat pelamar.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadApplicants()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId])

  const handleReview = async (applicant: Applicant, action: 'accept' | 'reject') => {
    const confirmMsg = action === 'accept'
      ? `Terima lamaran dari ${applicant.alumni_db?.nama_lengkap || 'pelamar ini'}?`
      : `Tolak lamaran dari ${applicant.alumni_db?.nama_lengkap || 'pelamar ini'}?`
    if (!window.confirm(confirmMsg)) return

    try {
      const res = await fetch('/api/jobs/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: applicant.id, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses lamaran.')

      toast.success(data.message || 'Status lamaran diperbarui.')
      setApplicants((prev) => prev.map((a) => (a.id === applicant.id ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses lamaran.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Pelamar &quot;{jobTitle}&quot;
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
            <span>Kelola siapa saja yang melamar lowongan ini.</span>
            <button onClick={loadApplicants} className="flex items-center gap-1 text-primary hover:underline flex-shrink-0">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Memuat pelamar...</p>
        ) : applicants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">Belum ada yang melamar lowongan ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applicants.map((applicant) => (
              <div key={applicant.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="min-w-0">
                  <Link href={`/profile/${applicant.user_id}`} className="font-bold text-xs text-slate-900 dark:text-white hover:underline">
                    {applicant.alumni_db?.nama_lengkap || 'Talent'}
                  </Link>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {applicant.alumni_db?.aktivitas && (
                      <Badge className="text-[8px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">
                        {applicant.alumni_db.aktivitas}
                      </Badge>
                    )}
                    {applicant.alumni_db?.kota_domisili && (
                      <Badge className="text-[8px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {applicant.alumni_db.kota_domisili}
                      </Badge>
                    )}
                  </div>
                  {applicant.message && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 italic">&quot;{applicant.message}&quot;</p>
                  )}
                  <p className="text-[9px] text-slate-400 mt-1.5">
                    Melamar: {new Date(applicant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold ${getStatusColor(applicant.status)}`}>
                    {getStatusText(applicant.status)}
                  </Badge>
                  {applicant.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => handleReview(applicant, 'accept')} className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-md px-3 gap-1">
                        <CheckCircle className="h-3 w-3" /> Terima
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReview(applicant, 'reject')} className="h-7 border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10 text-[10px] font-bold rounded-md px-3 gap-1">
                        <X className="h-3 w-3" /> Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
