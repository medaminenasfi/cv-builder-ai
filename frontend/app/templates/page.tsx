'use client'

import { AppShell } from '@/components/layout/AppShell'
import { TemplatePreviewFrame } from '@/components/templates/TemplatePreviewFrame'
import { listActiveTemplates, type Template } from '@/lib/templates-api'
import { createCV } from '@/lib/cvs-api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { X } from 'lucide-react'

const PRIMARY_GRADIENT = 'linear-gradient(to right, #7c3aed, #a855f7)'

export default function TemplatesPage() {
  const router = useRouter()
  const { hasAdminSession } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listActiveTemplates()
      .then((t) => {
        setTemplates(t)
        if (t[0]) setActive(t[0].id)
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : 'Failed to load templates')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q))
  }, [templates, search])

  const selected = templates.find((t) => t.id === active)
  const previewTemplate = templates.find((t) => t.id === previewId)

  const useTemplate = async (template?: Template) => {
    const target = template ?? selected
    if (!target) return
    setCreating(true)
    try {
      const cv = await createCV({ title: `${target.name} Resume`, templateId: target.id })
      router.push(`/cv/${cv.id}/edit`)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to create CV')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppShell title="" hideTopBar fullBleed>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-5 sm:py-7 lg:px-6 lg:py-8">
        {/* Page top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900">CV Templates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Choose a template — preview updates live below
            </p>
            {hasAdminSession && (
              <p className="text-xs text-gray-400 mt-1">
                Have a PDF template? Upload it in Admin → Templates
              </p>
            )}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full sm:w-48 border border-purple-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-300"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading templates…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-purple-200 rounded-xl p-12 text-center">
            <p className="text-gray-600 font-medium">
              {search.trim() ? 'No templates match your search' : 'No templates available yet'}
            </p>
            {!search.trim() && (
              <p className="text-xs text-gray-400 mt-2">Ask admin to activate templates</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((t) => {
              const isSelected = active === t.id
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActive(t.id)
                    }
                  }}
                  className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-purple-300 ${
                    isSelected
                      ? 'border-2 border-purple-600'
                      : 'border border-purple-100'
                  }`}
                >
                  {isSelected && (
                    <span
                      className="absolute top-2 right-2 z-10 text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: PRIMARY_GRADIENT }}
                    >
                      Active
                    </span>
                  )}

                  <div className="aspect-[3/4] w-full bg-purple-50 overflow-hidden relative">
                    <TemplatePreviewFrame
                      templateId={t.id}
                      templateName={t.name}
                      thumbnailUrl={t.thumbnailUrl}
                      card
                      rtl={t.supportsRtl}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewId(t.id)
                      }}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-purple-600 bg-transparent px-2 py-0.5 rounded-md hover:bg-purple-50"
                    >
                      Preview
                    </button>
                  </div>

                  <div className="px-3 py-2 border-t border-purple-50">
                    <p className="text-xs font-medium text-gray-800 truncate">{t.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-preview-title"
        >
          <div className="relative bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl sm:w-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-100 shrink-0">
              <h2 id="template-preview-title" className="text-sm font-medium text-gray-900">
                {previewTemplate.name}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-purple-50"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="h-[min(70vh,560px)]">
                <TemplatePreviewFrame
                  templateId={previewTemplate.id}
                  templateName={previewTemplate.name}
                  thumbnailUrl={previewTemplate.thumbnailUrl}
                  rtl={previewTemplate.supportsRtl}
                />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-purple-100 shrink-0">
              <button
                type="button"
                onClick={() => useTemplate(previewTemplate)}
                disabled={creating}
                className="w-full sm:w-auto text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                style={{ background: PRIMARY_GRADIENT }}
              >
                {creating ? 'Creating…' : 'Use this template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
