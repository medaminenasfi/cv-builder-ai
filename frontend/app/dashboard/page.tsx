'use client'

import { AppShell } from '@/components/layout/AppShell'
import { DashboardKpis } from '@/components/dashboard/DashboardKpis'
import { CVCard } from '@/components/cv/CVCard'
import { deleteCV, duplicateCV, listCVs, type CV } from '@/lib/cvs-api'
import { listActiveTemplates, type Template } from '@/lib/templates-api'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [cvs, setCVs] = useState<CV[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [cvList, tpls] = await Promise.all([listCVs(), listActiveTemplates()])
      setCVs(cvList)
      setTemplates(tpls)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load CVs')
    } finally {
      setLoading(false)
    }
  }, [])

  const templateNameById = (id: string | null) => {
    if (!id) return 'Default'
    return templates.find((t) => t.id === id)?.name ?? 'Custom'
  }

  useEffect(() => {
    load()
  }, [load])

  const handleNewResume = () => router.push('/dashboard/cvs/new')

  const handleEdit = (id: string) => router.push(`/cv/${id}/edit`)

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateCV(id)
      load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to duplicate')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this CV?')) return
    await deleteCV(id)
    load()
  }

  const handleShare = async (id: string) => {
    const { shareCV } = await import('@/lib/cvs-api')
    const result = await shareCV(id)
    alert(`Share link: ${window.location.origin}${result.url}`)
  }

  const actions = (
    <div className="flex gap-2">
      <Link
        href="/templates"
        className="px-4 py-2 border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50"
      >
        Browse Templates
      </Link>
      <button
        onClick={handleNewResume}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90"
      >
        <Plus size={18} />
        New Resume
      </button>
    </div>
  )

  return (
    <AppShell title="My Resumes" actions={actions}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!loading && <DashboardKpis cvs={cvs} />}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : cvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-64 bg-white border border-purple-100 rounded-xl">
          <FileText size={48} className="text-purple-200 mb-4" />
          <p className="text-sm text-gray-700 font-medium mb-2">No resumes yet</p>
          <p className="text-xs text-gray-500 mb-4">Pick a template or start from scratch</p>
          <div className="flex gap-2">
            <Link
              href="/templates"
              className="px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg"
            >
              Choose Template
            </Link>
            <button
              onClick={handleNewResume}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg"
            >
              Blank Resume
            </button>
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
                ats_score: user?.plan === 'pro' ? 85 : 0,
                last_edited: new Date(cv.updatedAt).toLocaleDateString(),
                experience: [],
                skills: [],
              }}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
