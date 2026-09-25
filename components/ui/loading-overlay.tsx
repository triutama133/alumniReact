'use client'

import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  message: string
  subMessage?: string
  /** Use 'absolute' inside a relatively-positioned container (e.g. a Dialog form); use 'fixed' to cover the whole viewport. */
  variant?: 'absolute' | 'fixed'
}

/**
 * A blocking overlay shown while an async submit is in flight, so the process
 * is unmistakable even if the triggering button scrolls out of view.
 */
export function LoadingOverlay({ message, subMessage, variant = 'absolute' }: LoadingOverlayProps) {
  return (
    <div
      className={`${variant === 'fixed' ? 'fixed' : 'absolute'} inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center px-4">{message}</p>
      {subMessage && <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-4">{subMessage}</p>}
    </div>
  )
}
