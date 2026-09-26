'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Target, Loader2, Wallet, TrendingUp, History } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { playClickSound, playSuccessSound } from '@/lib/audio'

interface RankedJob {
  id: number
  job_title: string
  company: string
  category: string | null
  salary: string | null
  matched_skills: string[]
  match_score: number
  match_strength: number
  tier: 'kuat' | 'sedang' | 'lemah'
}

interface HistoryEntry {
  id: number
  candidates: RankedJob[]
  created_at: string
}

const TIER_LABEL: Record<RankedJob['tier'], string> = {
  kuat: 'Cocok Kuat',
  sedang: 'Cocok Sedang',
  lemah: 'Cocok Lemah',
}

const TIER_COLOR: Record<RankedJob['tier'], string> = {
  kuat: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  sedang: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  lemah: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
}

interface SmartJobAggregatorTabProps {
  /** Feeds a job's role/category into the existing Learning Path generator. */
  onImproveFit: (role: string) => void
}

export function SmartJobAggregatorTab({ onImproveFit }: SmartJobAggregatorTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)

  const selectedEntry = history.find((h) => h.id === selectedHistoryId) || null
  const jobs = selectedEntry?.candidates || []

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/ai/recommendations?contextType=job_match&list=true')
      if (res.ok) {
        const data = await res.json()
        const items: HistoryEntry[] = data.items || []
        setHistory(items)
        if (items.length > 0) setSelectedHistoryId(items[0].id)
      }
    } catch {
      // Not critical — the tab just starts empty until the user runs an analysis.
    } finally {
      setIsLoadingSaved(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleAnalyze = async () => {
    playClickSound()
    setIsLoading(true)
    try {
      const res = await fetch('/api/jobs/smart-match')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menganalisis kecocokan lowongan.')

      playSuccessSound()
      toast.success(`${(data.jobs || []).length} lowongan paling cocok ditemukan!`)

      await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'job_match',
          candidates: data.jobs || [],
          append: true,
        }),
      })
      await loadHistory()
    } catch (err) {
      toast.error('Gagal menganalisis', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="premium-light-card liquid-glass-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Smart Job Agregator</CardTitle>
          </div>
          <CardDescription className="text-xs">
            AI menganalisis profil dan keahlian Anda, lalu memberi peringkat 10 lowongan aktif yang paling sesuai untuk Anda. Setiap analisis disimpan sebagai riwayat terpisah (maks. 10 terakhir).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-full px-6 py-2 shadow-sm gap-2"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
            Jalankan Analisis Baru
          </Button>
        </CardContent>
      </Card>

      {isLoadingSaved && (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat riwayat tersimpan...
        </div>
      )}

      {history.length > 0 && !isLoadingSaved && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><History className="h-3 w-3" /> Riwayat:</span>
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelectedHistoryId(entry.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                selectedHistoryId === entry.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-primary/40'
              }`}
            >
              {new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="min-h-[160px] flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs">Mencocokkan profil Anda dengan lowongan aktif...</p>
        </div>
      )}

      {!isLoading && !isLoadingSaved && jobs.length === 0 && (
        <Card className="premium-light-card liquid-glass-border p-8 text-center text-slate-500">
          <Target className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Belum ada analisis</h4>
          <p className="text-xs mt-1">Klik &quot;Jalankan Analisis Baru&quot; untuk melihat lowongan paling sesuai untuk Anda.</p>
        </Card>
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <Card key={job.id} className="premium-light-card liquid-glass-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{job.job_title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{job.company}</p>
                    </div>
                  </div>
                  <Badge className={`text-[9px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${TIER_COLOR[job.tier]}`}>
                    {TIER_LABEL[job.tier]} &middot; {job.match_strength}%
                  </Badge>
                </div>

                {job.salary && (
                  <p className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Wallet className="h-3.5 w-3.5" /> {job.salary}
                  </p>
                )}

                {job.matched_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.matched_skills.map((skill) => (
                      <Badge key={skill} className="text-[9px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => onImproveFit(job.category || job.job_title)}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 gap-1.5 mt-1"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Tingkatkan Peluang untuk Peran Ini
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
