'use client'

import Link from 'next/link'
import { ChevronLeft, Download, Loader2, Check, AlertCircle } from 'lucide-react'
import { EditorHealthBadge } from './EditorHealthBadge'
import type { ResumeHealth } from '@/lib/resume-health'

interface EditorHeaderProps {
  title: string
  health: ResumeHealth
  autoSaveStatus: 'saved' | 'dirty' | 'saving' | 'error'
  downloadingPdf: boolean
  onDownloadPdf: () => void
}

export function EditorHeader({
  title,
  health,
  autoSaveStatus,
  downloadingPdf,
  onDownloadPdf,
}: EditorHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-purple-100 px-4 sm:px-6 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-700 shrink-0"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">My Resumes</span>
          </Link>
          <div className="h-5 w-px bg-purple-100 hidden sm:block" />
          <h1 className="text-lg font-medium text-gray-900 truncate">{title || 'Edit Resume'}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <EditorHealthBadge health={health} />
          <span className="text-xs text-gray-500 inline-flex items-center gap-1">
            {autoSaveStatus === 'saving' && (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving…
              </>
            )}
            {autoSaveStatus === 'dirty' && 'Unsaved'}
            {autoSaveStatus === 'saved' && (
              <>
                <Check size={12} className="text-emerald-500" /> Saved
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <AlertCircle size={12} className="text-red-500" /> Save failed
              </>
            )}
          </span>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 shadow-sm hover:opacity-90"
            style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
          >
            <Download size={16} />
            {downloadingPdf ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
