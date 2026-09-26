'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Loader2, Send, RefreshCw, Star, ThumbsUp, TrendingUp, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { playClickSound, playSuccessSound } from '@/lib/audio'

interface Turn {
  role: 'ai' | 'user'
  content: string
}

interface Feedback {
  overall_score: number
  summary: string
  strengths: string[]
  improvements: string[]
  closing_tip: string
}

export function InterviewSimulationTab() {
  const [targetRole, setTargetRole] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [messages, setMessages] = useState<Turn[]>([])
  const [answerInput, setAnswerInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, feedback])

  const requestNextTurn = async (history: Turn[]) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/interview-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, conversationHistory: history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses simulasi wawancara.')

      if (data.is_complete) {
        setFeedback(data.feedback)
        playSuccessSound()
        toast.success('Sesi latihan selesai! Lihat evaluasi Anda di bawah.')
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: data.question }])
        setTotalQuestions(data.total_questions || 5)
      }
    } catch (err) {
      toast.error('Gagal melanjutkan sesi', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStart = async () => {
    if (!targetRole.trim()) return
    playClickSound()
    setIsStarted(true)
    setMessages([])
    setFeedback(null)
    await requestNextTurn([])
  }

  const handleAnswer = async () => {
    const content = answerInput.trim()
    if (!content || isLoading) return
    const nextHistory: Turn[] = [...messages, { role: 'user', content }]
    setMessages(nextHistory)
    setAnswerInput('')
    await requestNextTurn(nextHistory)
  }

  const handleReset = () => {
    playClickSound()
    setIsStarted(false)
    setMessages([])
    setFeedback(null)
    setTargetRole('')
  }

  const answeredCount = messages.filter((m) => m.role === 'user').length

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="premium-light-card liquid-glass-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">Latihan Interview AI</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Sesi simulasi wawancara singkat (5 pertanyaan, sekitar 5 menit). AI akan mengajukan pertanyaan sesuai peran
              yang Anda targetkan dan profil Anda, lalu memberi evaluasi di akhir sesi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStart() }}
              placeholder="Peran yang ingin dilatih, contoh: Frontend Developer"
              className="flex-1"
            />
            <Button
              onClick={handleStart}
              disabled={!targetRole.trim()}
              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-full px-6 gap-2 flex-shrink-0"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Mulai Latihan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Simulasi: {targetRole}</h3>
          {!feedback && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pertanyaan {Math.min(answeredCount + 1, totalQuestions)} dari {totalQuestions}
            </p>
          )}
        </div>
        <Button onClick={handleReset} variant="ghost" size="sm" className="text-xs gap-1.5 text-slate-500">
          <RefreshCw className="h-3.5 w-3.5" />
          Sesi Baru
        </Button>
      </div>

      <Card className="premium-light-card liquid-glass-border">
        <CardContent className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl border text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white border-primary rounded-br-sm'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> AI sedang berpikir...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {!feedback && (
        <div className="flex items-center gap-2">
          <Input
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnswer() } }}
            placeholder="Ketik jawaban Anda..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleAnswer}
            disabled={!answerInput.trim() || isLoading}
            className="bg-primary hover:bg-primary/95 text-white rounded-full px-4 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {feedback && (
        <Card className="premium-light-card liquid-glass-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Evaluasi Sesi
              </CardTitle>
              <span className="text-lg font-black text-primary">{feedback.overall_score}/10</span>
            </div>
            <CardDescription className="text-xs leading-relaxed">{feedback.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {feedback.strengths.length > 0 && (
              <div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" /> Kekuatan
                </p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {feedback.improvements.length > 0 && (
              <div>
                <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Area Peningkatan
                </p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {feedback.closing_tip && (
              <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-3">
                <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-300">{feedback.closing_tip}</p>
              </div>
            )}
            <Button onClick={handleReset} className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-full gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Latihan Lagi dengan Peran Lain
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
