'use client'

import { AppShell } from '@/components/layout/AppShell'
import { createCV, importCVFile, importCVJsonFile } from '@/lib/cvs-api'
import { copyChatGptPrompt, downloadCvJsonExample } from '@/lib/cv-json-import'
import { ApiError } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FileUp, PenLine, Link2, ArrowRight, FileJson, Copy } from 'lucide-react'

const GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'

export default function NewCVPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const jsonRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importStep, setImportStep] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)

  const handleManual = () => router.push('/templates')

  const handleImportClick = () => fileRef.current?.click()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    setImportStep('Uploading file…')
    setError(null)
    try {
      setImportStep('Extracting text…')
      await new Promise((r) => setTimeout(r, 300))
      setImportStep('AI parsing sections…')
      const result = await importCVFile(file)
      if (result.parseMeta) {
        sessionStorage.setItem(`parseMeta-${result.cvId}`, JSON.stringify(result.parseMeta))
      }
      router.push(`/cv/${result.cvId}/edit?parse=1`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed')
      setImporting(false)
      setImportStep(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleJsonFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    setImportStep('Reading JSON…')
    setError(null)
    try {
      const result = await importCVJsonFile(file)
      if (result.parseMeta) {
        sessionStorage.setItem(`parseMeta-${result.cvId}`, JSON.stringify(result.parseMeta))
      }
      router.push(`/cv/${result.cvId}/edit?parse=1`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'JSON import failed')
      setImporting(false)
      setImportStep(null)
      if (jsonRef.current) jsonRef.current.value = ''
    }
  }

  const handleCopyPrompt = async () => {
    await copyChatGptPrompt()
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  return (
    <AppShell title="Create Resume">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">How would you like to start?</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            Build a new resume from professional templates, or upload your existing PDF or Word file
            and let AI extract everything automatically.
          </p>
        </div>

        {error && (
          <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-purple-100 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-200 flex flex-col">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white"
              style={{ background: GRADIENT }}
            >
              <PenLine size={28} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Manual Builder</h2>
            <p className="text-sm text-gray-500 mt-2 flex-1">
              Create your resume from scratch using professional templates. Choose a design, fill in
              your details, and customize every section.
            </p>
            <button
              type="button"
              onClick={handleManual}
              disabled={creating}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: GRADIENT }}
            >
              Start Building
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-200 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-purple-50 text-purple-600">
              <FileUp size={28} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Import Existing Resume</h2>
            <p className="text-sm text-gray-500 mt-2 flex-1">
              Upload PDF or Word and let AI extract your experience, education, skills, and contact
              info. Review parsed data before editing.
            </p>
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importing}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-purple-200 text-purple-700 font-medium hover:bg-purple-50 disabled:opacity-50"
            >
              {importing ? (importStep ?? 'Parsing with AI…') : 'Import Resume'}
              {!importing && <ArrowRight size={18} />}
            </button>
          </div>
        </div>

        <div className="mt-8 bg-purple-50 border border-purple-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <FileJson className="text-purple-600 shrink-0 mt-0.5" size={22} />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-purple-900">Import via JSON (no AI credits)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload your CV PDF to ChatGPT, paste the prompt below, save the JSON file, then import it here.
                  JSON carries <strong>content only</strong> (name, jobs, skills) — pick a <strong>template</strong> in the app for fonts, colors, and layout.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white hover:bg-purple-50"
                >
                  <Copy size={14} />
                  {promptCopied ? 'Prompt copied!' : 'Copy ChatGPT prompt'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadCvJsonExample()}
                  className="px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white hover:bg-purple-50"
                >
                  JSON example
                </button>
                <button
                  type="button"
                  onClick={() => jsonRef.current?.click()}
                  disabled={importing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ background: GRADIENT }}
                >
                  <FileJson size={14} />
                  {importing && importStep?.includes('JSON') ? importStep : 'Import JSON file'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400 border border-dashed border-purple-100 rounded-xl px-4 py-3">
            <Link2 size={16} />
            LinkedIn import — Coming soon
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={jsonRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            setImportStep('Importing JSON…')
            handleJsonFile(e.target.files?.[0])
          }}
        />
      </div>
    </AppShell>
  )
}
