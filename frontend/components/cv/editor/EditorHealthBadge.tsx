'use client'

import type { ResumeHealth } from '@/lib/resume-health'

export function EditorHealthBadge({ health }: { health: ResumeHealth }) {
  const color =
    health.score >= 80 ? 'text-emerald-600 bg-emerald-50' : health.score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'

  return (
    <div className={`hidden sm:flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${color}`} title={health.issues.join('\n')}>
      Score {health.score}/100
    </div>
  )
}
