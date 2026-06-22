'use client'

import {
  MoreHorizontal,
  Copy,
  Trash2,
  Share2,
  Pencil,
  FileDown,
  FileType,
  Code,
  Briefcase,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export interface CVCardData {
  id: string
  title: string
  template: string
  lang: string
  ats_score: number | null
  last_edited: string
  updatedAt: string
}

interface CVCardProps {
  cv: CVCardData
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onShare?: (id: string) => void
  onRename?: (id: string, title: string) => void
  onExportPdf?: (id: string) => void
  onExportDocx?: (id: string) => void
  onExportHtml?: (id: string) => void
  onJobMatch?: (id: string) => void
  onAiImprove?: (id: string) => void
}

function getATSBadgeColor(score: number | null) {
  if (score == null || score === 0) return 'bg-slate-100 text-slate-500 border border-slate-200'
  if (score >= 70) return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
  if (score >= 40) return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-red-50 text-red-600 border border-red-200'
}

function getLanguageFlag(lang: string) {
  const flags: Record<string, string> = { EN: '🇬🇧', FR: '🇫🇷', AR: '🇸🇦' }
  return flags[lang] ?? '🌐'
}

const TEMPLATE_COLORS: Record<string, string> = {
  Modern: 'from-blue-500 to-indigo-600',
  Classic: 'from-amber-600 to-orange-700',
  Minimal: 'from-slate-400 to-slate-600',
  Creative: 'from-pink-500 to-rose-600',
  Executive: 'from-gray-700 to-gray-900',
  'LaTeX Academic': 'from-teal-600 to-cyan-700',
}

export function CVCard({
  cv,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
  onRename,
  onExportPdf,
  onExportDocx,
  onExportHtml,
  onJobMatch,
  onAiImprove,
}: CVCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const thumbGradient = TEMPLATE_COLORS[cv.template] ?? 'from-purple-600 to-purple-500'

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const menuAction = (fn?: () => void) => {
    fn?.()
    setShowMenu(false)
  }

  return (
    <div className="group bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-200">
      <button
        type="button"
        onClick={() => onEdit?.(cv.id)}
        className="w-full text-left"
      >
        <div
          className={`h-28 bg-gradient-to-br ${thumbGradient} relative flex items-end p-4`}
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
          <div className="relative z-10 flex gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-white/90 text-gray-800 px-2 py-0.5 rounded-full">
              {cv.template}
            </span>
            {cv.ats_score != null && cv.ats_score > 0 && (
              <span className="text-[10px] font-semibold bg-white/90 text-purple-700 px-2 py-0.5 rounded-full">
                ATS {cv.ats_score}%
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{cv.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Updated {cv.last_edited}</p>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-purple-50 transition-colors"
              aria-label="More actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-purple-100 rounded-xl shadow-xl z-20 min-w-[180px] py-1">
                {[
                  { label: 'Edit', icon: Pencil, fn: () => onEdit?.(cv.id) },
                  { label: 'Rename', icon: Pencil, fn: () => {
                    const t = prompt('Resume title', cv.title)
                    if (t?.trim()) onRename?.(cv.id, t.trim())
                  }},
                  { label: 'Duplicate', icon: Copy, fn: () => onDuplicate?.(cv.id) },
                  { label: 'Share', icon: Share2, fn: () => onShare?.(cv.id) },
                  { label: 'Export PDF', icon: FileDown, fn: () => onExportPdf?.(cv.id) },
                  { label: 'Export DOCX', icon: FileType, fn: () => onExportDocx?.(cv.id) },
                  { label: 'Export HTML', icon: Code, fn: () => onExportHtml?.(cv.id) },
                  { label: 'Job Match', icon: Briefcase, fn: () => onJobMatch?.(cv.id) },
                  { label: 'AI Improve', icon: Sparkles, fn: () => onAiImprove?.(cv.id) },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => menuAction(item.fn)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2"
                  >
                    <item.icon size={14} className="text-purple-500" />
                    {item.label}
                  </button>
                ))}
                <hr className="border-purple-100 my-1" />
                <button
                  type="button"
                  onClick={() => menuAction(() => onDelete?.(cv.id))}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${getATSBadgeColor(cv.ats_score)}`}
          >
            {cv.ats_score != null && cv.ats_score > 0 ? `ATS ${cv.ats_score}` : 'No ATS score'}
          </span>
          <span className="text-lg" title={cv.lang}>
            {getLanguageFlag(cv.lang)}
          </span>
        </div>

        <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit?.(cv.id)}
            className="flex-1 text-xs py-1.5 rounded-lg bg-purple-50 text-purple-700 font-medium hover:bg-purple-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onExportPdf?.(cv.id)}
            className="flex-1 text-xs py-1.5 rounded-lg border border-purple-100 text-purple-700 font-medium hover:bg-purple-50 flex items-center justify-center gap-1"
          >
            <ExternalLink size={12} />
            PDF
          </button>
        </div>
      </div>
    </div>
  )
}
