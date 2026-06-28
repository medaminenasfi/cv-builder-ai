'use client'

import { AppShell } from '@/components/layout/AppShell'
import { importCVFile, importCVFileAsync, getParseJob } from '@/lib/cvs-api'
import { ApiError } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FileUp, PenLine, Link2, ArrowRight } from 'lucide-react'

const GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'

export default function NewCVPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importStep, setImportStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleManual = () => router.push('/templates')

  const handleImportClick = () => fileRef.current?.click()

  const pollParseJob = async (jobId: string, cvIdHint?: string) => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const job = await getParseJob(jobId)
      if (job.status === 'completed' && job.result) {
        const cvId = (job.result as { cvId?: string }).cvId ?? cvIdHint
        if (cvId) {
          const meta = (job.result as { parseMeta?: unknown }).parseMeta
          if (meta) sessionStorage.setItem(`parseMeta-${cvId}`, JSON.stringify(meta))
          sessionStorage.setItem(`parsePending-${cvId}`, '1')
          router.push(`/cv/${cvId}/edit?parse=1`)
          return
        }
      }
      if (job.status === 'failed') {
        throw new ApiError(job.error ?? 'Parse failed', 422)
      }
      setImportStep(`Processing… (${i + 1}/60)`)
    }
    throw new ApiError('Parse timed out — try a smaller file or sync import', 408)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    setImportStep('Uploading file…')
    setError(null)
    try {
      const useAsync = file.size > 1_500_000
      if (useAsync) {
        setImportStep('Queued for background parsing…')
        const { jobId } = await importCVFileAsync(file)
        await pollParseJob(jobId)
        return
      }
      setImportStep('Extracting text…')
      await new Promise((r) => setTimeout(r, 300))
      setImportStep('AI parsing sections…')
      const result = await importCVFile(file)
      if (result.parseMeta) {
        sessionStorage.setItem(`parseMeta-${result.cvId}`, JSON.stringify(result.parseMeta))
        sessionStorage.setItem(`parsePending-${result.cvId}`, '1')
      }
      router.push(`/cv/${result.cvId}/edit?parse=1`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed')
      setImporting(false)
      setImportStep(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <AppShell title="Create Resume">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">How would you like to start?</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            Build a new resume from professional LaTeX templates, or upload your existing PDF or Word file
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
              Create your resume from scratch using professional LaTeX templates. Choose a design, fill in
              your details, and customize every section.
            </p>
            <button
              type="button"
              onClick={handleManual}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium hover:opacity-90"
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
      </div>
    </AppShell>
  )
}
