'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RecommendedCandidate } from '@/lib/api'

const TIER_LABEL: Record<RecommendedCandidate['tier'], string> = {
  kuat: 'Rekomendasi Kuat',
  sedang: 'Rekomendasi Sedang',
  lemah: 'Rekomendasi Lemah',
}

interface TalentPreviewDialogProps {
  candidate: RecommendedCandidate | null
  onOpenChange: (open: boolean) => void
  /** Only present when previewing from a project's AI Scout — lets the owner invite the candidate directly. */
  inviteProjectId?: string
  onInvited?: (candidateId: number) => void
}

export function TalentPreviewDialog({ candidate, onOpenChange, inviteProjectId, onInvited }: TalentPreviewDialogProps) {
  const [isInviting, setIsInviting] = useState(false)

  const handleInvite = async () => {
    if (!candidate || !inviteProjectId) return
    setIsInviting(true)
    try {
      const res = await fetch(`/api/projects/${inviteProjectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: candidate.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengundang talenta.')

      toast.success(data.message || `${candidate.nama_lengkap} berhasil diundang!`)
      onInvited?.(candidate.id)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengundang talenta.')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <Dialog open={candidate !== null} onOpenChange={onOpenChange}>
      {candidate && (
        <DialogContent className="sm:max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{candidate.nama_lengkap}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {candidate.aktivitas || 'Talenta'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Badge className="text-[10px] font-bold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20">
              {TIER_LABEL[candidate.tier]} &middot; {candidate.match_strength}% kecocokan
            </Badge>

            {candidate.matched_skills.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Kecocokan dengan Kebutuhan</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matched_skills.map((skill) => (
                    <Badge key={skill} className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {candidate.skills && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Keahlian</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">{candidate.skills}</p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 flex-col sm:flex-col gap-2">
            {inviteProjectId && (
              <Button
                onClick={handleInvite}
                disabled={isInviting}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md gap-1.5"
              >
                {isInviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {isInviting ? 'Mengundang...' : 'Undang ke Proyek'}
              </Button>
            )}
            <Button asChild variant="outline" className="w-full text-xs rounded-md gap-1.5">
              <Link href={`/profile/${candidate.id}`} target="_blank">
                Lihat Profil Lengkap <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
