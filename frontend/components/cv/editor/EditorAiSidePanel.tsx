'use client'

import Link from 'next/link'
import { CloudUpload, FileUp, Loader2, Sparkles, Briefcase, FileCheck } from 'lucide-react'
import type { RefObject, ReactNode } from 'react'

interface EditorAiSidePanelProps {
  cvId: string
  importing: boolean
  importStep: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onImportClick: () => void
  onFileSelect: (file: File | undefined) => void
  parseWizard: ReactNode | null
  aiPanel: ReactNode
}

export function EditorAiSidePanel({
  cvId,
  importing,
  importStep,
  fileInputRef,
  onImportClick,
  onFileSelect,
  parseWizard,
  aiPanel,
}: EditorAiSidePanelProps) {
  if (parseWizard) {
    return <>{parseWizard}</>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/job-match?cvId=${cvId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-lg font-medium"
          style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
        >
          <Briefcase size={14} />
          Job Match
        </Link>
        <Link
          href={`/cv/${cvId}/review`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
        >
          <FileCheck size={14} />
          Full review
        </Link>
      </div>

      <div className="bg-white border border-purple-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-purple-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Import & parse CV</h3>
            <p className="text-[11px] text-gray-500">Upload PDF or Word — AI extracts all sections</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onImportClick}
          disabled={importing}
          className="w-full flex flex-col items-center justify-center gap-2 py-10 px-4 border-2 border-dashed border-purple-200 rounded-xl text-purple-700 hover:bg-purple-50/80 hover:border-purple-400 transition-colors disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 size={32} className="animate-spin text-purple-500" />
              <span className="text-sm font-medium">{importStep ?? 'Parsing…'}</span>
              <span className="text-[11px] text-gray-500">OCR + AI extraction — please wait</span>
            </>
          ) : (
            <>
              <CloudUpload size={32} className="text-purple-400" />
              <span className="text-sm font-medium">Upload from device</span>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <FileUp size={12} /> PDF or DOCX
              </span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0])}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2 px-1">Enhance with AI</p>
        {aiPanel}
      </div>
    </div>
  )
}
