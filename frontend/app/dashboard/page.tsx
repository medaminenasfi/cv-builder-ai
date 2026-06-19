'use client'

import { AppShell } from '@/components/layout/AppShell'
import { CVCard } from '@/components/cv/CVCard'
import { createCV, deleteCV, duplicateCV, listCVs, type CV } from '@/lib/cvs-api'
import { Plus, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { ApiError } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [cvs, setCVs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setCVs(await listCVs())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load CVs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleNewResume = async () => {
    try {
      const cv = await createCV({ title: 'Untitled Resume' })
      router.push(`/cv/${cv.id}/edit`)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to create CV')
    }
  }

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

  const cvLimit = user?.plan === 'pro' ? Infinity : 3

  const actions = (
    <button
      onClick={handleNewResume}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90"
    >
      <Plus size={18} />
      New Resume
    </button>
  )

  return (
    <AppShell title="My Resumes" actions={actions}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : cvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-96">
          <FileText size={48} className="text-purple-200 mb-4" />
          <p className="text-sm text-gray-700 font-medium mb-4">No resumes yet</p>
          <button onClick={handleNewResume} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg">
            Create Your First Resume
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-4">
            {cvs.length} / {cvLimit === Infinity ? '∞' : cvLimit} CVs used
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvs.map((cv) => (
              <CVCard
                key={cv.id}
                cv={{
                  id: cv.id,
                  title: cv.title,
                  template: cv.templateId ?? 'Default',
                  lang: cv.locale.toUpperCase(),
                  ats_score: 0,
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
        </>
      )}
    </AppShell>
  )
}
