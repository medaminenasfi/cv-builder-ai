'use client'

import { AppShell } from '@/components/layout/AppShell'
import { CVPreview } from '@/components/cv/CVPreview'
import { enhanceCV, exportCVHtml, getCV, getVersions, importCV, updateCV, updateCVData } from '@/lib/cvs-api'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CVEditorPage() {
  const params = useParams()
  const id = params.id as string
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [importText, setImportText] = useState('')

  useEffect(() => {
    getCV(id).then((cv) => setTitle(cv.title))
    getVersions(id).then((versions) => {
      const latest = versions[0]
      if (latest?.data) {
        const d = latest.data as { summary?: string }
        setSummary(d.summary ?? '')
      }
    })
  }, [id])

  const save = async () => {
    setSaving(true)
    await updateCV(id, { title })
    await updateCVData(id, {
      personal: { fullName: title, title: '', email: '' },
      meta: { locale: 'en', direction: 'ltr', sections: ['summary'] },
      summary,
      experience: [],
      education: [],
      skills: [],
    })
    setSaving(false)
  }

  const enhance = async () => {
    const result = await enhanceCV(id, ['summary'], 'professional') as { summary?: string }
    if (result.summary) setSummary(result.summary)
  }

  const exportHtml = async () => {
    const { html } = await exportCVHtml(id)
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    await importCV(title || 'Imported Resume', importText)
    alert('Import queued — refresh to see parsed data')
  }

  return (
    <AppShell title="Edit CV">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-purple-400 uppercase">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-purple-400 uppercase">Summary</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save CV'}
            </button>
            <button onClick={enhance} className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm">AI Enhance</button>
            <button onClick={exportHtml} className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm">Export HTML</button>
          </div>
          <div>
            <label className="text-xs font-semibold text-purple-400 uppercase">Import text (PDF/DOCX stub)</label>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={3} placeholder="Paste resume text..." className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            <button onClick={handleImport} className="mt-2 px-4 py-2 border rounded-lg text-sm">Import</button>
          </div>
        </div>
        <CVPreview title={title} summary={summary} />
      </div>
    </AppShell>
  )
}
