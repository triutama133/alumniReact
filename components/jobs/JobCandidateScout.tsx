'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Cpu, Loader2, Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CandidateOrbit } from '@/components/ai/CandidateOrbit'
import { TalentPreviewDialog } from '@/components/ai/TalentPreviewDialog'
import { CandidateAwareMarkdown } from '@/components/ai/CandidateAwareMarkdown'
import { playClickSound, playScanSound, playSuccessSound } from '@/lib/audio'
import type { RecommendedCandidate } from '@/lib/api'

interface JobCandidateScoutProps {
  jobId: number
  jobTitle: string
  description: string
  jobDesk: string[]
  requirements: string[]
}

/**
 * Owner-only: lets a job poster run the same AI-scout scoring used for projects,
 * scoped to this specific job posting, and offer the job directly to a candidate.
 */
export function JobCandidateScout({ jobId, jobTitle, description, jobDesk, requirements }: JobCandidateScoutProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [reportText, setReportText] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<RecommendedCandidate[]>([])
  const [previewCandidate, setPreviewCandidate] = useState<RecommendedCandidate | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/ai/recommendations?contextType=job_scout&contextId=${jobId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((saved) => {
        if (cancelled || !saved) return
        setReportText(saved.recommendation_text)
        setCandidates(saved.candidates || [])
        setSavedAt(saved.updated_at)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingSaved(false) })
    return () => { cancelled = true }
  }, [jobId])

  const handleSearch = async () => {
    playClickSound()
    setIsSearching(true)
    setReportText(null)
    setCandidates([])

    const scanSound = playScanSound(8.0)
    const prompt = `Pencarian kandidat untuk lowongan kerja: ${jobTitle}. Tugas & Tanggung Jawab: ${jobDesk.join(', ') || 'Tidak disebutkan'}. Persyaratan/Keahlian: ${requirements.join(', ') || 'Tidak disebutkan'}. Deskripsi: ${description}`

    try {
      const res = await fetch('/api/ai/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mencari kandidat.')

      setReportText(data.rekomendasi_proyek)
      setCandidates(data.candidates || [])
      setSavedAt(new Date().toISOString())
      playSuccessSound()
      toast.success('Rekomendasi kandidat berhasil ditemukan!')

      fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'job_scout',
          contextId: String(jobId),
          recommendationText: data.rekomendasi_proyek,
          candidates: data.candidates || [],
        }),
      }).catch(() => {})
    } catch (err) {
      toast.error('AI Scout Error', { description: err instanceof Error ? err.message : 'Koneksi ke AI Engine terputus.' })
    } finally {
      setIsSearching(false)
      if (scanSound) scanSound.stop()
    }
  }

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Radar className="h-3.5 w-3.5 text-primary" /> Scout Kandidat AI
        </h4>
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          size="sm"
          className="h-8 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 rounded-md gap-1.5"
        >
          {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cpu className="h-3.5 w-3.5" />}
          {savedAt ? 'Perbarui Pencarian' : 'Cari Kandidat via AI'}
        </Button>
      </div>

      {savedAt && !isSearching && !isLoadingSaved && (
        <p className="text-[10px] text-slate-400">
          Hasil tersimpan {new Date(savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {isSearching && (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> AI sedang menganalisis kandidat terbaik...
        </div>
      )}

      {candidates.length > 0 && !isSearching && (
        <div className="pt-2">
          <CandidateOrbit candidates={candidates} centerLabel={jobTitle.slice(0, 12)} onSelect={setPreviewCandidate} />
        </div>
      )}

      {reportText && !isSearching && (
        <CandidateAwareMarkdown
          text={reportText}
          candidates={candidates}
          onSelectCandidate={setPreviewCandidate}
          className="prose prose-sm dark:prose-invert max-w-none text-xs pt-2"
        />
      )}

      <TalentPreviewDialog
        candidate={previewCandidate}
        onOpenChange={(open) => { if (!open) setPreviewCandidate(null) }}
        invite={{ endpoint: `/api/jobs/${jobId}/offer`, label: 'Tawarkan Lowongan' }}
      />
    </div>
  )
}
