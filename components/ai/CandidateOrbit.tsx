'use client'

import { useState } from 'react'
import type { RecommendedCandidate } from '@/lib/api'

interface CandidateOrbitProps {
  candidates: RecommendedCandidate[]
  centerLabel: string
  onSelect: (candidate: RecommendedCandidate) => void
}

const TIER_CONFIG = {
  kuat: { radius: 70, color: '#059669', ring: 'Rekomendasi Kuat' },
  sedang: { radius: 135, color: '#d97706', ring: 'Rekomendasi Sedang' },
  lemah: { radius: 200, color: '#64748b', ring: 'Rekomendasi Lemah' },
} as const

const VIEW_SIZE = 460
const CENTER = VIEW_SIZE / 2

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Positions AI-recommended candidates on concentric "orbits" around a center point —
 * the closer the orbit, the stronger the recommendation. Purely a layout/visualization
 * component: it doesn't know or care whether the candidates are project-scout talent or
 * collaboration partners, just their id/name/tier.
 */
export function CandidateOrbit({ candidates, centerLabel, onSelect }: CandidateOrbitProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const byTier: Record<'kuat' | 'sedang' | 'lemah', RecommendedCandidate[]> = {
    kuat: candidates.filter((c) => c.tier === 'kuat'),
    sedang: candidates.filter((c) => c.tier === 'sedang'),
    lemah: candidates.filter((c) => c.tier === 'lemah'),
  }

  if (candidates.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="w-full max-w-md">
        {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map((tier) => (
          <circle
            key={tier}
            cx={CENTER}
            cy={CENTER}
            r={TIER_CONFIG[tier].radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeDasharray="4 4"
            className="text-slate-400 dark:text-slate-600"
          />
        ))}

        <circle cx={CENTER} cy={CENTER} r={26} className="fill-primary/10 stroke-primary" strokeWidth={1.5} />
        <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="central" className="fill-primary text-[9px] font-bold">
          {centerLabel}
        </text>

        {(Object.keys(byTier) as Array<keyof typeof byTier>).map((tier) =>
          byTier[tier].map((candidate, idx) => {
            const count = byTier[tier].length
            const angle = (2 * Math.PI * idx) / count - Math.PI / 2
            const radius = TIER_CONFIG[tier].radius
            const x = CENTER + radius * Math.cos(angle)
            const y = CENTER + radius * Math.sin(angle)
            const isHovered = hoveredId === candidate.id

            return (
              <g
                key={candidate.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelect(candidate)}
                onMouseEnter={() => setHoveredId(candidate.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
              >
                <circle
                  r={isHovered ? 20 : 17}
                  fill={TIER_CONFIG[tier].color}
                  fillOpacity={isHovered ? 1 : 0.85}
                  stroke="white"
                  strokeWidth={2}
                  className="transition-all"
                />
                <text textAnchor="middle" dominantBaseline="central" className="fill-white text-[9px] font-bold select-none pointer-events-none">
                  {initials(candidate.nama_lengkap)}
                </text>
                <text
                  y={32}
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-slate-300 text-[9px] font-semibold select-none pointer-events-none"
                >
                  {candidate.nama_lengkap.length > 16 ? candidate.nama_lengkap.slice(0, 15) + '…' : candidate.nama_lengkap}
                </text>
              </g>
            )
          })
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map((tier) => (
          <span key={tier} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_CONFIG[tier].color }} />
            {TIER_CONFIG[tier].ring}
          </span>
        ))}
      </div>
    </div>
  )
}
