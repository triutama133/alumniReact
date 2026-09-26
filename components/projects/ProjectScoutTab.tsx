'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Cpu, Loader2, Radar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CandidateOrbit } from '@/components/ai/CandidateOrbit'
import { TalentPreviewDialog } from '@/components/ai/TalentPreviewDialog'
import { CandidateAwareMarkdown } from '@/components/ai/CandidateAwareMarkdown'
import { playClickSound, playScanSound, playSuccessSound } from '@/lib/audio'
import type { RecommendedCandidate } from '@/lib/api'

interface MyProject {
  id: string
  title: string
  description: string
  required_skills: string[] | null
}

interface ProjectScoutTabProps {
  myProjects: MyProject[]
}

export function ProjectScoutTab({ myProjects }: ProjectScoutTabProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(myProjects[0]?.id || '')
  const [isSearching, setIsSearching] = useState(false)
  const [reportText, setReportText] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<RecommendedCandidate[]>([])
  const [previewCandidate, setPreviewCandidate] = useState<RecommendedCandidate | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)

  const selectedProject = myProjects.find((p) => p.id === selectedProjectId)

  // Reload the last-saved scout result for whichever project is selected, so switching
  // between projects (or coming back later) doesn't lose a previous run.
  useEffect(() => {
    if (!selectedProjectId) return
    let cancelled = false
    setIsLoadingSaved(true)
    setReportText(null)
    setCandidates([])
    setSavedAt(null)
    fetch(`/api/ai/recommendations?contextType=project_scout&contextId=${selectedProjectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((saved) => {
        if (cancelled || !saved) return
        setReportText(saved.recommendation_text)
        setCandidates(saved.candidates || [])
        setSavedAt(saved.updated_at)
      })
      .catch(() => {
        // Not critical — the tab just starts empty until the user runs a search.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSaved(false)
      })
    return () => { cancelled = true }
  }, [selectedProjectId])

  const handleSearch = async () => {
    if (!selectedProject) return
    playClickSound()
    setIsSearching(true)
    setReportText(null)
    setCandidates([])

    const scanSound = playScanSound(8.0)
    const prompt = `Pencarian talenta untuk proyek: ${selectedProject.title}. Kebutuhan Keahlian: ${selectedProject.required_skills?.join(', ') || 'Semua keahlian'}. Deskripsi Proyek: ${selectedProject.description}`

    try {
      const res = await fetch('/api/ai/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mencari talenta.')

      setReportText(data.rekomendasi_proyek)
      setCandidates(data.candidates || [])
      setSavedAt(new Date().toISOString())
      playSuccessSound()
      toast.success('Rekomendasi talenta berhasil ditemukan!')

      fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'project_scout',
          contextId: selectedProject.id,
          recommendationText: data.rekomendasi_proyek,
          candidates: data.candidates || [],
        }),
      }).catch(() => {
        // Best-effort — the result is already shown even if saving it fails.
      })
    } catch (err) {
      toast.error('AI Scout Error', { description: err instanceof Error ? err.message : 'Koneksi ke AI Engine terputus.' })
    } finally {
      setIsSearching(false)
      if (scanSound) scanSound.stop()
    }
  }

  if (myProjects.length === 0) {
    return (
      <Card className="premium-light-card liquid-glass-border p-8 text-center text-slate-500">
        <Radar className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Anda belum memiliki proyek</h4>
        <p className="text-xs mt-1 mb-4">Buat proyek terlebih dahulu untuk mencari talenta dengan AI Scout.</p>
        <Button asChild size="sm" className="bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-md">
          <Link href="/projects/create">Buat Proyek</Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="premium-light-card liquid-glass-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold">Scout Talenta AI</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Pilih salah satu proyek Anda, dan AI akan mencocokkan talenta dari seluruh database berdasarkan kebutuhan keahlian proyek tersebut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="h-9 flex-grow bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm">
                <SelectValue placeholder="Pilih proyek..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                {myProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !selectedProjectId}
              className="h-9 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-5 rounded-md gap-1.5 flex-shrink-0"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cpu className="h-3.5 w-3.5" />}
              {savedAt ? 'Perbarui Pencarian' : 'Cari Talenta via AI'}
            </Button>
          </div>
          {savedAt && !isSearching && !isLoadingSaved && (
            <p className="text-[10px] text-slate-400 mt-2">
              Hasil tersimpan {new Date(savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoadingSaved && !isSearching && (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat hasil tersimpan...
        </div>
      )}

      {isSearching && (
        <div className="min-h-[200px] flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs">AI sedang menganalisis kandidat terbaik...</p>
        </div>
      )}

      {candidates.length > 0 && !isSearching && (
        <Card className="premium-light-card liquid-glass-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Peta Rekomendasi Talenta</CardTitle>
            <CardDescription className="text-xs">Klik salah satu talenta untuk melihat pratinjau dan mengundangnya ke proyek.</CardDescription>
          </CardHeader>
          <CardContent>
            <CandidateOrbit
              candidates={candidates}
              centerLabel={selectedProject?.title.slice(0, 12) || 'Proyek'}
              onSelect={setPreviewCandidate}
            />
          </CardContent>
        </Card>
      )}

      {reportText && !isSearching && (
        <Card className="premium-light-card liquid-glass-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Ringkasan Analisis AI</CardTitle>
          </CardHeader>
          <CardContent>
            <CandidateAwareMarkdown
              text={reportText}
              candidates={candidates}
              onSelectCandidate={setPreviewCandidate}
              className="prose prose-sm dark:prose-invert max-w-none text-xs"
            />
          </CardContent>
        </Card>
      )}

      <TalentPreviewDialog
        candidate={previewCandidate}
        onOpenChange={(open) => { if (!open) setPreviewCandidate(null) }}
        invite={{ endpoint: `/api/projects/${selectedProjectId}/invite`, label: 'Undang ke Proyek' }}
      />
    </div>
  )
}
