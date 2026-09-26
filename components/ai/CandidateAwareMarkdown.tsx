'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { RecommendedCandidate } from '@/lib/api'
import { linkifyCandidateNames } from '@/lib/linkifyCandidates'

interface CandidateAwareMarkdownProps {
  text: string
  candidates: RecommendedCandidate[]
  onSelectCandidate: (candidate: RecommendedCandidate) => void
  className?: string
}

/**
 * Renders AI-generated markdown where any mention of a known candidate's name becomes
 * clickable, opening that candidate's preview instead of leaving the name as static text
 * disconnected from the rest of the UI.
 */
export function CandidateAwareMarkdown({ text, candidates, onSelectCandidate, className }: CandidateAwareMarkdownProps) {
  const linkedText = candidates.length > 0 ? linkifyCandidateNames(text, candidates) : text

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('#candidate-')) {
              const id = Number(href.replace('#candidate-', ''))
              const candidate = candidates.find((c) => c.id === id)
              return (
                <button
                  type="button"
                  onClick={() => candidate && onSelectCandidate(candidate)}
                  className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80"
                >
                  {children}
                </button>
              )
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {linkedText}
      </ReactMarkdown>
    </div>
  )
}
