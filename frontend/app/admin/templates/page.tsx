'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Eye, Pencil, Trash2, X, Upload, FolderOpen, Play, RefreshCw } from 'lucide-react'
import {
  compileLatex,
  createTemplate,
  DEFAULT_LATEX_TEMPLATE,
  deleteTemplate,
  LATEX_PLACEHOLDERS,
  listAllTemplates,
  listBundledTemplates,
  loadBundledTemplate,
  previewTemplatePdf,
  toggleTemplate,
  updateTemplate,
  type Template,
} from '@/lib/templates-api'
import { ApiError } from '@/lib/api'
import { pdfBlobToPageImageUrl } from '@/lib/pdf-preview-image'

const EMPTY_FORM = {
  name: '',
  slug: '',
  latexSource: DEFAULT_LATEX_TEMPLATE,
  thumbnailUrl: '',
  supportsRtl: false,
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function extractCompileLog(err: unknown): string | null {
  if (err instanceof ApiError && err.data && typeof err.data === 'object') {
    const d = err.data as {
      log?: string
      message?: string | string[] | { log?: string; error?: string }
    }
    if (d.log) return d.log
    const msg = d.message
    if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
      if (msg.log) return msg.log
      if (msg.error && msg.log) return msg.log
    }
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg)) return msg.join('\n')
  }
  if (err instanceof Error) return err.message
  return null
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [bundled, setBundled] = useState<{ slug: string; name: string; supportsRtl: boolean }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [compileUrl, setCompileUrl] = useState<string | null>(null)
  const [compileLog, setCompileLog] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [importNote, setImportNote] = useState<string | null>(null)
  const texInputRef = useRef<HTMLInputElement>(null)

  const load = () => listAllTemplates().then(setTemplates).catch(console.error)
  useEffect(() => {
    load()
    listBundledTemplates().then(setBundled).catch(() => setBundled([]))
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (compileUrl) URL.revokeObjectURL(compileUrl)
    }
  }, [previewUrl, compileUrl])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setCompileLog(null)
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      slug: t.slug,
      latexSource: t.latexSource ?? DEFAULT_LATEX_TEMPLATE,
      thumbnailUrl: t.thumbnailUrl ?? '',
      supportsRtl: t.supportsRtl,
    })
    setError(null)
    setCompileLog(null)
    setShowForm(true)
  }

  const handleTexUpload = async (file: File | undefined) => {
    if (!file) return
    const text = await readFileAsText(file)
    setForm((f) => ({ ...f, latexSource: text }))
  }

  const applyBundled = (result: { name: string; slug?: string; latexSource: string; supportsRtl: boolean; notes?: string }) => {
    setEditingId(null)
    setForm({
      name: result.name,
      slug: result.slug ?? '',
      latexSource: result.latexSource,
      thumbnailUrl: '',
      supportsRtl: result.supportsRtl,
    })
    setShowForm(true)
    setImportNote(result.notes ?? 'Template loaded — review and click Create Template')
  }

  const handleLoadBundled = async (slug: string) => {
    setImporting(true)
    setError(null)
    setImportNote(null)
    try {
      const result = await loadBundledTemplate(slug)
      applyBundled(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load template')
    } finally {
      setImporting(false)
    }
  }

  const handleCompile = async () => {
    if (!form.latexSource.trim()) {
      setError('Paste LaTeX source first')
      return
    }
    setCompiling(true)
    setError(null)
    setCompileLog(null)
    try {
      const blob = await compileLatex(form.latexSource)
      if (compileUrl) URL.revokeObjectURL(compileUrl)
      setCompileUrl(await pdfBlobToPageImageUrl(blob))
    } catch (e) {
      setCompileLog(extractCompileLog(e))
      setError(extractCompileLog(e) ?? 'Compile failed')
    } finally {
      setCompiling(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.latexSource.trim()) {
      setError('Name and LaTeX source are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await updateTemplate(editingId, {
          name: form.name,
          latexSource: form.latexSource,
          thumbnailUrl: form.thumbnailUrl || null,
          supportsRtl: form.supportsRtl,
        })
      } else {
        await createTemplate({
          name: form.name,
          slug: form.slug || undefined,
          latexSource: form.latexSource,
          thumbnailUrl: form.thumbnailUrl || null,
          supportsRtl: form.supportsRtl,
        })
      }
      setShowForm(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (id: string, rtl = false) => {
    setPreviewId(id)
    setPreviewing(true)
    setError(null)
    try {
      const blob = await previewTemplatePdf(id, rtl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(await pdfBlobToPageImageUrl(blob))
    } catch (e) {
      setPreviewId(null)
      setError(extractCompileLog(e) ?? 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const handleToggle = async (id: string) => {
    await toggleTemplate(id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    await deleteTemplate(id)
    load()
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LaTeX Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paste or upload .tex files with {'{{placeholders}}'}. Requires{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">docker compose up latex-sandbox</code>
            . First compile may take 1–2 minutes while Tectonic downloads packages.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <Plus size={16} /> Add Template
        </button>
      </div>

      {error && !showForm && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {bundled.length > 0 && (
        <section className="bg-white border border-purple-100 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <FolderOpen size={16} className="text-purple-500" /> Built-in LaTeX templates
          </h2>
          <div className="flex flex-wrap gap-2">
            {bundled.map((b) => (
              <button
                key={b.slug}
                type="button"
                disabled={importing}
                onClick={() => handleLoadBundled(b.slug)}
                className="px-3 py-1.5 text-xs border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50"
              >
                {b.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl"
          >
            <div>
              <p className="font-medium text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-500">
                {t.slug} · {t.engine} · {t.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handlePreview(t.id)} disabled={previewing} className="p-2 text-gray-500 hover:text-purple-600 disabled:opacity-50" title="Preview PDF">
                <Eye size={16} />
              </button>
              <button type="button" onClick={() => openEdit(t)} className="p-2 text-gray-500 hover:text-purple-600" title="Edit">
                <Pencil size={16} />
              </button>
              <button type="button" onClick={() => handleToggle(t.id)} className="text-xs px-2 py-1 border rounded-lg">
                {t.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" onClick={() => handleDelete(t.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{editingId ? 'Edit Template' : 'New LaTeX Template'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 grid lg:grid-cols-[1fr_220px] gap-4">
              <div className="space-y-3">
                {importNote && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{importNote}</p>
                )}
                {error && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 whitespace-pre-wrap">{error}</p>
                )}
                {compileLog && (
                  <pre className="text-[10px] text-red-800 bg-red-50 border border-red-200 rounded-lg p-2 max-h-32 overflow-auto whitespace-pre-wrap">{compileLog}</pre>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm"
                    placeholder="Template name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm"
                    placeholder="Slug (optional)"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => texInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                  >
                    <Upload size={12} /> Upload .tex
                  </button>
                  <button
                    type="button"
                    onClick={handleCompile}
                    disabled={compiling}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {compiling ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                    {compiling ? 'Compiling… (may take 1–2 min first time)' : 'Compile & Preview'}
                  </button>
                  <input
                    ref={texInputRef}
                    type="file"
                    accept=".tex,text/plain"
                    className="hidden"
                    onChange={(e) => handleTexUpload(e.target.files?.[0])}
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={form.supportsRtl}
                      onChange={(e) => setForm({ ...form, supportsRtl: e.target.checked })}
                    />
                    Supports RTL
                  </label>
                </div>

                <textarea
                  className="w-full h-80 font-mono text-xs border rounded-lg p-3 resize-y"
                  value={form.latexSource}
                  onChange={(e) => setForm({ ...form, latexSource: e.target.value })}
                  spellCheck={false}
                />

                {compileUrl && (
                  <div className="border rounded-lg overflow-hidden h-96 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={compileUrl}
                      alt="Compile preview"
                      draggable={false}
                      className="w-full h-full object-contain object-top pointer-events-none select-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Template'}
                  </button>
                </div>
              </div>

              <aside className="text-xs text-gray-600 space-y-2">
                <p className="font-semibold text-gray-800">Placeholders</p>
                <ul className="space-y-0.5 font-mono text-[10px] max-h-[420px] overflow-y-auto">
                  {LATEX_PLACEHOLDERS.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </div>
      )}

      {previewing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-xl">
            <RefreshCw size={18} className="animate-spin text-purple-600" />
            <span className="text-sm text-gray-700">Compiling PDF… first run may take 1–2 min</span>
          </div>
        </div>
      )}

      {previewId && previewUrl && !previewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">Template PDF Preview</span>
              <button
                type="button"
                onClick={() => {
                  setPreviewId(null)
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }}
                className="p-1"
              >
                <X size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Template preview"
              draggable={false}
              className="flex-1 w-full object-contain object-top bg-white min-h-0 pointer-events-none select-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
