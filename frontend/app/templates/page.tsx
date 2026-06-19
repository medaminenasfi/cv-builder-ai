'use client'

import { AppShell } from '@/components/layout/AppShell'
import { listActiveTemplates, type Template } from '@/lib/templates-api'
import { createCV } from '@/lib/cvs-api'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    listActiveTemplates().then((t) => {
      setTemplates(t)
      if (t[0]) setActive(t[0].id)
    })
  }, [])

  const selected = templates.find((t) => t.id === active)

  const useTemplate = async () => {
    if (!selected) return
    const cv = await createCV({ title: `${selected.name} Resume`, templateId: selected.id })
    router.push(`/cv/${cv.id}/edit`)
  }

  return (
    <AppShell title="CV Templates">
      <p className="text-sm text-gray-600 mb-6">Choose a template for your resume.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`border-2 rounded-xl p-4 cursor-pointer ${active === t.id ? 'border-purple-500' : 'border-purple-100'}`}
          >
            <div className="h-32 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg mb-3 flex items-center justify-center text-purple-600 font-semibold">
              {t.name}
            </div>
            <h3 className="font-semibold text-sm">{t.name}</h3>
            {t.supportsRtl && <span className="text-xs text-purple-500">RTL supported</span>}
          </div>
        ))}
      </div>
      {selected && (
        <button onClick={useTemplate} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
          Use {selected.name} Template
        </button>
      )}
    </AppShell>
  )
}
