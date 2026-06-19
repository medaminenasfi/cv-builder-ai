'use client'

import { FileText, Crown, Sparkles, Target, Calendar } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import type { CV } from '@/lib/cvs-api'

interface DashboardKpisProps {
  cvs: CV[]
}

export function DashboardKpis({ cvs }: DashboardKpisProps) {
  const { user } = useAuth()
  const isPro = user?.plan === 'pro'
  const cvLimit = isPro ? null : 3
  const used = cvs.length
  const usagePct = cvLimit ? Math.min(100, Math.round((used / cvLimit) * 100)) : 100

  const lastEdited = cvs.length
    ? new Date(
        Math.max(...cvs.map((c) => new Date(c.updatedAt).getTime())),
      ).toLocaleDateString()
    : '—'

  const templatesUsed = new Set(cvs.map((c) => c.templateId).filter(Boolean)).size

  const baseKpis = [
    {
      label: 'Resumes',
      value: cvLimit ? `${used} / ${cvLimit}` : `${used}`,
      sub: cvLimit ? `${usagePct}% of free limit` : 'Unlimited (Pro)',
      icon: FileText,
      accent: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Plan',
      value: isPro ? 'Pro' : 'Free',
      sub: isPro ? 'All features unlocked' : 'Upgrade for unlimited',
      icon: Crown,
      accent: isPro ? 'text-amber-600 bg-amber-50' : 'text-slate-600 bg-slate-100',
    },
    {
      label: 'Templates used',
      value: String(templatesUsed),
      sub: 'Different designs applied',
      icon: Sparkles,
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Last edited',
      value: lastEdited,
      sub: cvs.length ? 'Most recent CV update' : 'Create your first CV',
      icon: Calendar,
      accent: 'text-teal-600 bg-teal-50',
    },
  ]

  const proKpis = isPro
    ? [
        {
          label: 'ATS readiness',
          value: 'Pro',
          sub: 'AI job match enabled',
          icon: Target,
          accent: 'text-green-600 bg-green-50',
        },
      ]
    : []

  const kpis = [...baseKpis, ...proKpis]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Your overview</h2>
        {isPro && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800">
            Pro KPIs
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-purple-100 rounded-xl p-4 hover:border-purple-200 transition-colors"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.accent}`}>
              <k.icon size={18} />
            </div>
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{k.sub}</p>
          </div>
        ))}
      </div>
      {!isPro && used >= (cvLimit ?? 0) && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Free plan limit reached. Upgrade to Pro for unlimited resumes and premium KPIs.
        </p>
      )}
    </div>
  )
}
