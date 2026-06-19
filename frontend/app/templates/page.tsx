'use client'

import { AppShell } from '@/components/layout/AppShell'
import { TemplatePreviewFrame } from '@/components/templates/TemplatePreviewFrame'
import { listActiveTemplates, type Template } from '@/lib/templates-api'
import { createCV } from '@/lib/cvs-api'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'
import { Info } from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [active, setActive] = useState<string | null>(null)
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

  const selected = templates.find((t) => t.id === active)

  const useTemplate = async () => {
    if (!selected) return
    setCreating(true)
    try {
      const cv = await createCV({ title: `${selected.name} Resume`, templateId: selected.id })
      router.push(`/cv/${cv.id}/edit`)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to create CV')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppShell title="CV Templates">
      <p className="text-sm text-gray-600 mb-4">
        Choose a design — live preview with sample data below.
      </p>

      {/* PDF import help */}
      <div className="mb-6 bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3 text-sm">
        <Info size={18} className="text-purple-600 shrink-0 mt-0.5" />
        <div className="text-gray-700">
          <p className="font-medium text-purple-900">Have a PDF template?</p>
          <p className="text-xs mt-1 text-gray-600">
            Convert it to <strong>HTML + CSS</strong> (or export pages as PNG thumbnail).
            Admin adds it at <strong>/admin/templates</strong> — upload .html and .css files,
            or place in <code className="bg-white px-1 rounded">templates/your-name/</code> and run{' '}
            <code className="bg-white px-1 rounded">npm run seed:templates</code>.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-dashed border-purple-200 rounded-xl p-12 text-center">
          <p className="text-gray-600 font-medium">No templates available yet</p>
          <p className="text-xs text-gray-400 mt-2">Ask admin to activate templates</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Template list with mini previews */}
          <div className="lg:col-span-2 space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all bg-white ${
                  active === t.id
                    ? 'border-purple-500 shadow-md ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-purple-200'
                }`}
              >
                <TemplatePreviewFrame
                  templateId={t.id}
                  templateName={t.name}
                  thumbnailUrl={t.thumbnailUrl}
                  compact
                  rtl={t.supportsRtl}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{t.name}</h3>
                    {t.supportsRtl && (
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide">
                        RTL · Arabic
                      </span>
                    )}
                  </div>
                  {active === t.id && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Large preview */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="sticky top-6 bg-slate-100 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selected.name}</h2>
                    <p className="text-xs text-gray-500">Full preview — sample CV data</p>
                  </div>
                  <button
                    onClick={useTemplate}
                    disabled={creating}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : `Use ${selected.name}`}
                  </button>
                </div>
                <div className="h-[520px]">
                  <TemplatePreviewFrame
                    templateId={selected.id}
                    templateName={selected.name}
                    thumbnailUrl={selected.thumbnailUrl}
                    rtl={selected.supportsRtl}
                  />
                </div>
              </div>
            ) : (
              <div className="h-96 bg-white border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                Select a template
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
