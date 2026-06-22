'use client'

import { AppShell } from '@/components/layout/AppShell'
import { DashboardKpis } from '@/components/dashboard/DashboardKpis'
import { CVCard } from '@/components/cv/CVCard'
import {
  deleteCV,
  duplicateCV,
  updateCV,
} from '@/lib/cvs-api'
import { useCVList, useCvAtsScores, useTemplates } from '@/lib/hooks/dashboard-queries'
import { Plus, FileText, Upload, LayoutTemplate } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetchBlob } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: cvs = [], isLoading: loading, error: cvError } = useCVList()
  const { data: templates = [] } = useTemplates()
  const { data: atsScores = {} } = useCvAtsScores()
  const error = cvError instanceof ApiError ? cvError.message : cvError ? 'Failed to load CVs' : null

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cvs'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const templateNameById = (id: string | null) => {
    if (!id) return 'Default'
    return templates.find((t) => t.id === id)?.name ?? 'Custom'
  }

  const handleShare = async (id: string) => {
    const { shareCV } = await import('@/lib/cvs-api')
    const result = await shareCV(id)
    const url = `${window.location.origin}${result.url}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch {
      toast.info(url)
    }
  }

  const handleRename = async (id: string, title: string) => {
    await updateCV(id, { title })
    refresh()
  }

  const downloadExport = async (id: string, format: 'pdf' | 'docx' | 'html') => {
    try {
      if (format === 'html') {
        const { exportCVHtml } = await import('@/lib/cvs-api')
        const { html } = await exportCVHtml(id)
        const blob = new Blob([html], { type: 'text/html' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'resume.html'
        a.click()
        return
      }
      const blob = await apiFetchBlob(`/cvs/${id}/export/${format}`)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = format === 'pdf' ? 'resume.pdf' : 'resume.docx'
      a.click()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Export failed')
    }
  }

  const actions = (
    <div className="flex gap-2">
      <Link
        href="/templates"
        className="px-4 py-2 border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50"
      >
        Browse Templates
      </Link>
      <button
        onClick={() => router.push('/dashboard/cvs/new')}
        className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90"
        style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
      >
        <Plus size={18} />
        New Resume
      </button>
    </div>
  )

  return (
    <AppShell title="My Resumes" actions={actions}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <DashboardKpis />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 bg-white border border-purple-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-72 bg-white border border-purple-100 rounded-2xl shadow-sm px-6">
          <FileText size={56} className="text-purple-200 mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-1">No resumes yet</p>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            Create a professional resume from scratch or import your existing PDF or Word file.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard/cvs/new')}
              className="px-5 py-2.5 text-white text-sm font-medium rounded-xl"
              style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
            >
              Create Resume
            </button>
            <Link
              href="/dashboard/cvs/new"
              className="px-5 py-2.5 border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 flex items-center gap-2"
            >
              <Upload size={16} />
              Import Resume
            </Link>
            <Link
              href="/templates"
              className="px-5 py-2.5 border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 flex items-center gap-2"
            >
              <LayoutTemplate size={16} />
              Browse Templates
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => (
            <CVCard
              key={cv.id}
              cv={{
                id: cv.id,
                title: cv.title,
                template: templateNameById(cv.templateId),
                lang: cv.locale.toUpperCase(),
                ats_score: atsScores[cv.id] ?? null,
                last_edited: new Date(cv.updatedAt).toLocaleDateString(),
                updatedAt: cv.updatedAt,
              }}
              onEdit={(id) => router.push(`/cv/${id}/edit`)}
              onDuplicate={async (id) => {
                await duplicateCV(id)
                refresh()
              }}
              onDelete={async (id) => {
                if (!confirm('Delete this CV?')) return
                await deleteCV(id)
                refresh()
              }}
              onShare={handleShare}
              onRename={handleRename}
              onExportPdf={(id) => downloadExport(id, 'pdf')}
              onExportDocx={(id) => downloadExport(id, 'docx')}
              onExportHtml={(id) => downloadExport(id, 'html')}
              onJobMatch={(id) => router.push(`/job-match?cvId=${id}`)}
              onAiImprove={(id) => router.push(`/cv/${id}/edit?ai=1`)}
            />
          ))}
        </div>
      )}

      <Link
        href="/dashboard/cvs/new"
        className="md:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
        aria-label="New resume"
      >
        <Plus size={24} />
      </Link>
    </AppShell>
  )
}
