'use client'

import { CloudUpload, PenLine, Sparkles, Wand2, Loader2, ArrowRight } from 'lucide-react'
import type { RefObject } from 'react'

const GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'

interface EditorWorkflowPanelProps {
  importing: boolean
  importStep: string | null
  enhancing: boolean
  hasContent: boolean
  workflowStarted: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onImportClick: () => void
  onFileSelect: (file: File | undefined) => void
  onFillManual: () => void
  onOpenAi: () => void
  onQuickEnhance: () => void
}

export function EditorWorkflowPanel({
  importing,
  importStep,
  enhancing,
  hasContent,
  workflowStarted,
  fileInputRef,
  onImportClick,
  onFileSelect,
  onFillManual,
  onOpenAi,
  onQuickEnhance,
}: EditorWorkflowPanelProps) {
  const showStartCards = !workflowStarted && !hasContent

  if (showStartCards) {
    return (
      <div className="bg-white border border-purple-100 rounded-2xl p-5 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-1">How do you want to build this resume?</h2>
        <p className="text-xs text-gray-500 mb-4">
          Import an existing file, fill all sections manually, or use AI after you have content.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onImportClick}
            disabled={importing}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition-colors disabled:opacity-50"
          >
            {importing ? (
              <Loader2 size={24} className="animate-spin text-purple-500" />
            ) : (
              <CloudUpload size={24} className="text-purple-500" />
            )}
            <span className="text-sm font-medium text-gray-900">Import CV</span>
            <span className="text-[10px] text-gray-500">
              {importing ? importStep ?? 'Parsing…' : 'PDF or DOCX · AI extract'}
            </span>
          </button>

          <button
            type="button"
            onClick={onFillManual}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
          >
            <PenLine size={24} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-900">Fill manually</span>
            <span className="text-[10px] text-gray-500">Add all sections · type yourself</span>
          </button>

          <button
            type="button"
            onClick={onOpenAi}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
          >
            <Sparkles size={24} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-900">AI Assistant</span>
            <span className="text-[10px] text-gray-500">9 actions · improve text</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0])}
        />
      </div>
    )
  }

  return (
    <div className="bg-white border border-purple-100 rounded-xl p-4 mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
        <span className={hasContent ? 'text-emerald-600' : ''}>① Start</span>
        <span>→</span>
        <span className={hasContent ? 'text-emerald-600' : 'text-purple-600'}>② Fill / Import</span>
        <span>→</span>
        <span className={hasContent ? 'text-purple-600' : ''}>③ Enhance</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onImportClick}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-dashed border-purple-200 rounded-lg text-purple-700 hover:bg-purple-50 disabled:opacity-50"
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
          {importing ? importStep ?? 'Importing…' : 'Re-import CV'}
        </button>
        <button
          type="button"
          onClick={onFillManual}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-purple-100 rounded-lg text-gray-700 hover:bg-purple-50"
        >
          <PenLine size={14} />
          Add section
        </button>
        <button
          type="button"
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-purple-100 rounded-lg text-purple-700 hover:bg-purple-50"
        >
          <Sparkles size={14} />
          AI Assistant
        </button>
        <button
          type="button"
          onClick={onQuickEnhance}
          disabled={!hasContent || enhancing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-white rounded-lg disabled:opacity-40 ml-auto"
          style={{ background: GRADIENT }}
          title={hasContent ? 'AI polish summary, experience & skills' : 'Add content first, then enhance'}
        >
          {enhancing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          Enhance resume
          <ArrowRight size={12} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0])}
      />
    </div>
  )
}
