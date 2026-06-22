'use client'

import { CloudUpload, FileUp, Loader2 } from 'lucide-react'
import type { RefObject } from 'react'

interface EditorImportZoneProps {
  importing: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (file: File | undefined) => void
}

export function EditorImportZone({ importing, fileInputRef, onFileSelect }: EditorImportZoneProps) {
  return (
    <div className="bg-white border border-purple-100 rounded-xl p-4 mb-4">
      <p className="text-xs font-semibold text-gray-800 mb-1">Import resume</p>
      <p className="text-[11px] text-gray-500 mb-3">
        Upload PDF or Word — AI parses and fills all fields (replaces current content).
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 border-2 border-dashed border-purple-200 rounded-xl text-purple-700 hover:bg-purple-50/80 hover:border-purple-300 transition-colors disabled:opacity-50"
      >
        {importing ? (
          <>
            <Loader2 size={28} className="animate-spin text-purple-500" />
            <span className="text-sm font-medium">Parsing your file…</span>
            <span className="text-[11px] text-gray-500">OCR + AI extraction in progress</span>
          </>
        ) : (
          <>
            <CloudUpload size={28} className="text-purple-400" />
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
  )
}
