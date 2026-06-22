'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Target,
  Sparkles,
  Briefcase,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useDashboardStats } from '@/lib/hooks/dashboard-queries'

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
        <Minus size={10} /> 0%
      </span>
    )
  }
  const up = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
        up ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}
      {value}%
    </span>
  )
}

function AnimatedNumber({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value)
  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value)
      return
    }
    const start = typeof display === 'number' ? display : 0
    const end = value
    if (start === end) return
    const steps = 20
    let step = 0
    const id = setInterval(() => {
      step++
      setDisplay(Math.round(start + ((end - start) * step) / steps))
      if (step >= steps) clearInterval(id)
    }, 25)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <>{display}</>
}

function KpiSkeleton() {
  return (
    <div className="bg-white border border-purple-100 rounded-2xl p-5 animate-pulse">
      <div className="w-10 h-10 bg-purple-50 rounded-xl mb-3" />
      <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
      <div className="h-7 w-16 bg-gray-100 rounded mb-2" />
      <div className="h-2 w-24 bg-gray-50 rounded" />
    </div>
  )
}

export function DashboardKpis() {
  const { data: stats, isLoading: loading, error: queryError } = useDashboardStats()
  const error = queryError instanceof ApiError ? queryError.message : queryError ? 'Failed to load stats' : null

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Your overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="mb-8 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
        {error ?? 'Could not load dashboard stats'}
      </div>
    )
  }

  const kpis = [
    {
      label: 'Total Resumes',
      value: stats.totalResumes,
      sub: 'Active in your account',
      icon: FileText,
      accent: 'text-purple-600 bg-purple-50',
      trend: stats.trends.resumes,
    },
    {
      label: 'ATS Avg Score',
      value: stats.avgAtsScore != null ? `${stats.avgAtsScore}%` : '—',
      sub: stats.avgAtsScore != null ? 'Across all analyses' : 'Run job match first',
      icon: Target,
      accent: 'text-emerald-600 bg-emerald-50',
      trend: stats.trends.atsScore,
    },
    {
      label: 'Job Matches',
      value: stats.jobMatchesCompleted,
      sub: 'Analyses completed',
      icon: Briefcase,
      accent: 'text-indigo-600 bg-indigo-50',
      trend: stats.trends.jobMatches,
    },
    {
      label: 'AI Enhancements',
      value: stats.aiEnhancementsUsed,
      sub: 'Total AI calls used',
      icon: Sparkles,
      accent: 'text-violet-600 bg-violet-50',
      trend: stats.trends.aiUsage,
    },
    {
      label: 'Resume Views',
      value: stats.resumeViews,
      sub: 'Shared link views',
      icon: Eye,
      accent: 'text-sky-600 bg-sky-50',
      trend: stats.trends.views,
    },
    {
      label: 'Exports',
      value: stats.exportCount,
      sub: 'PDF, DOCX & HTML',
      icon: Download,
      accent: 'text-amber-600 bg-amber-50',
      trend: stats.trends.exports,
    },
  ]

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Your overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.accent}`}>
              <k.icon size={18} />
            </div>
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-gray-500">{k.label}</p>
              <TrendBadge value={k.trend} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1 truncate">
              <AnimatedNumber value={k.value} />
            </p>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{k.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
