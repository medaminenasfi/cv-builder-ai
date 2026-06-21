'use client'

import { AppShell } from '@/components/layout/AppShell'
import { createCV, importCVFile } from '@/lib/cvs-api'
import { ApiError } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FileUp, LayoutTemplate, PenLine, Link2 } from 'lucide-react'

export default function NewCVPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBlank = async () => {
    setCreating(true)
    setError(null)
    try {
      const cv = await createCV({ title: 'Untitled Resume' })
      router.push(`/cv/${cv.id}/edit`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create CV')
      setCreating(false)
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    setError(null)
    try {
      const result = await importCVFile(file)
      router.push(`/cv/${result.cvId}/review`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed')
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <AppShell title="Create CV">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-medium text-gray-900">How would you like to start?</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">
          Choose a template, build from scratch, or import an existing resume.
        </p>

        <p className="text-xs text-gray-400 mb-6 -mt-4">
          To import: click <strong>Import PDF or Word</strong> below, select your .pdf or .docx file,
          review parsed fields, then open the editor.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => router.push('/templates')}
            className="text-left bg-white border border-purple-100 rounded-xl p-6 hover:border-purple-300 transition-colors"
          >
            <LayoutTemplate className="text-purple-500 mb-3" size={28} />
            <h2 className="font-medium text-gray-900">Choose a template</h2>
            <p className="text-xs text-gray-500 mt-1">
              Pick a design, then fill in your details.
            </p>
          </button>

          <button
            type="button"
            onClick={handleBlank}
            disabled={creating}
            className="text-left bg-white border border-purple-100 rounded-xl p-6 hover:border-purple-300 transition-colors disabled:opacity-50"
          >
            <PenLine className="text-purple-500 mb-3" size={28} />
            <h2 className="font-medium text-gray-900">Start from scratch</h2>
            <p className="text-xs text-gray-500 mt-1">
              {creating ? 'Creating…' : 'Blank resume — add sections manually.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="text-left bg-white border border-purple-100 rounded-xl p-6 hover:border-purple-300 transition-colors disabled:opacity-50"
          >
            <FileUp className="text-purple-500 mb-3" size={28} />
            <h2 className="font-medium text-gray-900">Import PDF or Word</h2>
            <p className="text-xs text-gray-500 mt-1">
              {importing ? 'Parsing with AI…' : 'Upload .pdf or .docx — review before editing.'}
            </p>
          </button>

          <div className="text-left bg-white border border-dashed border-purple-100 rounded-xl p-6 opacity-60">
            <Link2 className="text-purple-300 mb-3" size={28} />
            <h2 className="font-medium text-gray-700">LinkedIn import</h2>
            <p className="text-xs text-gray-400 mt-1">Coming soon</p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </AppShell>
  )
}
