'use client'

/** Admin templates: HTML/CSS/JSON only — no PDF import (use built-in templates or Dashboard for CV JSON). */
import { useEffect, useRef, useState } from 'react'
import { Plus, Eye, Pencil, Trash2, X, Upload, Info, FolderOpen } from 'lucide-react'
import {
  createTemplate,
  deleteTemplate,
  importTemplateFromHtmlCss,
  importTemplateFromJson,
  importTemplateJsonText,
  listAllTemplates,
  listBundledTemplates,
  loadBundledTemplate,
  previewTemplate,
  TEMPLATE_JSON_EXAMPLE,
  toggleTemplate,
  updateTemplate,
  type Template,
  type TemplateImportResult,
} from '@/lib/templates-api'

const EMPTY_FORM = {
  name: '',
  slug: '',
  htmlStructure: '',
  css: '',
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

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [bundled, setBundled] = useState<{ slug: string; name: string; supportsRtl: boolean }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importNote, setImportNote] = useState<string | null>(null)
  const [pasteJson, setPasteJson] = useState('')
  const [showPasteJson, setShowPasteJson] = useState(false)
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const cssInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const packageHtmlRef = useRef<HTMLInputElement>(null)
  const packageCssRef = useRef<HTMLInputElement>(null)
  const pendingPackageHtml = useRef<File | null>(null)

  const load = () => listAllTemplates().then(setTemplates).catch(console.error)
  useEffect(() => {
    load()
    listBundledTemplates().then(setBundled).catch(() => setBundled([]))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      slug: t.slug,
      htmlStructure: t.htmlStructure,
      css: t.css,
      thumbnailUrl: t.thumbnailUrl ?? '',
      supportsRtl: t.supportsRtl,
    })
    setError(null)
    setShowForm(true)
  }

  const handleFileUpload = async (type: 'html' | 'css', file: File | undefined) => {
    if (!file) return
    const text = await readFileAsText(file)
    if (type === 'html') setForm((f) => ({ ...f, htmlStructure: text }))
    else setForm((f) => ({ ...f, css: text }))
  }

  const applyImportResult = (result: TemplateImportResult) => {
    setEditingId(null)
    setForm({
      name: result.name,
      slug: result.slug ?? '',
      htmlStructure: result.htmlStructure,
      css: result.css,
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
      applyImportResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load template')
    } finally {
      setImporting(false)
    }
  }

  const handlePasteJsonImport = async () => {
    if (!pasteJson.trim()) return
    setImporting(true)
    setError(null)
    setImportNote(null)
    try {
      const result = await importTemplateJsonText(pasteJson)
      applyImportResult(result)
      setShowPasteJson(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleJsonImport = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    setError(null)
    setImportNote(null)
    try {
      const result = await importTemplateFromJson(file)
      applyImportResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON import failed')
    } finally {
      setImporting(false)
      if (jsonInputRef.current) jsonInputRef.current.value = ''
    }
  }

  const handlePackageHtml = (file: File | undefined) => {
    if (!file) return
    pendingPackageHtml.current = file
    if (packageCssRef.current) packageCssRef.current.value = ''
    packageCssRef.current?.click()
  }

  const handlePackageCss = async (cssFile: File | undefined) => {
    const htmlFile = pendingPackageHtml.current
    pendingPackageHtml.current = null
    if (!htmlFile || !cssFile) return
    setImporting(true)
    setError(null)
    setImportNote(null)
    try {
      const result = await importTemplateFromHtmlCss(htmlFile, cssFile)
      applyImportResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'HTML/CSS import failed')
    } finally {
      setImporting(false)
      if (packageHtmlRef.current) packageHtmlRef.current.value = ''
      if (packageCssRef.current) packageCssRef.current.value = ''
    }
  }

  const downloadJsonExample = () => {
    const blob = new Blob([JSON.stringify(TEMPLATE_JSON_EXAMPLE, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-example.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.htmlStructure.trim() || !form.css.trim()) {
      setError('Name, HTML and CSS are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await updateTemplate(editingId, {
          name: form.name,
          htmlStructure: form.htmlStructure,
          css: form.css,
          thumbnailUrl: form.thumbnailUrl || undefined,
          supportsRtl: form.supportsRtl,
        })
      } else {
        await createTemplate({
          name: form.name,
          slug: form.slug || undefined,
          htmlStructure: form.htmlStructure,
          css: form.css,
          thumbnailUrl: form.thumbnailUrl || undefined,
          supportsRtl: form.supportsRtl,
        })
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (id: string, rtl = false) => {
    const { html } = await previewTemplate(id, rtl)
    setPreviewHtml(html)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Template Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Templates = HTML + CSS design only. CV PDF/JSON goes on{' '}
            <a href="/dashboard/cvs/new" className="text-purple-600 underline">Create Resume</a>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => handleJsonImport(e.target.files?.[0])}
          />
          <input
            ref={packageHtmlRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            onChange={(e) => handlePackageHtml(e.target.files?.[0])}
          />
          <input
            ref={packageCssRef}
            type="file"
            accept=".css,text/css"
            className="hidden"
            onChange={(e) => handlePackageCss(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => packageHtmlRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50"
          >
            <Upload size={16} />
            Import HTML+CSS
          </button>
          <button
            type="button"
            onClick={() => setShowPasteJson((v) => !v)}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 border border-purple-300 bg-purple-50 text-purple-800 rounded-lg text-sm hover:bg-purple-100 disabled:opacity-50"
          >
            Paste ChatGPT JSON
          </button>
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload size={16} />
            Import Template JSON
          </button>
          <button
            type="button"
            onClick={downloadJsonExample}
            className="px-3 py-2 text-xs text-purple-600 hover:underline"
          >
            JSON example
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:opacity-90"
          >
            <Plus size={16} /> Add Template
          </button>
        </div>
      </div>

      {showPasteJson && (
        <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-purple-900">Paste JSON from ChatGPT</p>
          <p className="text-xs text-gray-500">
            Copy the whole message (even if invalid JSON). Broken quotes inside HTML are fixed automatically.
          </p>
          <textarea
            value={pasteJson}
            onChange={(e) => setPasteJson(e.target.value)}
            rows={8}
            placeholder='Paste {"name":"...","htmlStructure":"...","css":"..."} here'
            className="w-full border rounded-lg px-3 py-2 text-xs font-mono"
          />
          <button
            type="button"
            onClick={handlePasteJsonImport}
            disabled={importing || !pasteJson.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import pasted JSON'}
          </button>
        </div>
      )}

      {bundled.length > 0 && (
        <div className="bg-white border border-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={18} className="text-purple-600" />
            <p className="font-medium text-sm">Built-in templates (HTML + CSS — no PDF, no AI)</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Click to load ready-made design into the editor, then save. Same files as{' '}
            <code className="bg-gray-50 px-1 rounded">templates/modern/</code> in the project.
          </p>
          <div className="flex flex-wrap gap-2">
            {bundled.map((t) => (
              <button
                key={t.slug}
                type="button"
                disabled={importing}
                onClick={() => handleLoadBundled(t.slug)}
                className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-800 hover:bg-purple-50 disabled:opacity-50"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-950">
        <p className="font-semibold">PDF is not a template</p>
        <p className="text-xs mt-1">
          A CV PDF cannot become an exact HTML template automatically. Use built-in templates above,
          or import <strong>HTML + CSS</strong> files. Your CV content (PDF → ChatGPT → JSON) belongs on{' '}
          <a href="/dashboard/cvs/new" className="underline font-medium">Dashboard → Import JSON</a>.
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm">
        <div className="flex gap-2 items-start">
          <Info size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-2 text-gray-700">
            <p className="font-medium text-purple-900">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li><strong>Template</strong> (here): HTML + CSS with {'{{fullName}}'}, {'{{experience}}'}, etc.</li>
              <li><strong>CV data</strong> (Dashboard): JSON with your jobs, skills, profile</li>
              <li>User picks template + fills data → export PDF looks like the template</li>
            </ol>
            <p className="text-xs text-gray-600">
              Placeholders: <code>{'{{fullName}}'}</code>, <code>{'{{contactLine}}'}</code>,{' '}
              <code>{'{{summary}}'}</code>, <code>{'{{education}}'}</code>, <code>{'{{experience}}'}</code>,{' '}
              <code>{'{{skills}}'}</code>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">RTL</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No templates — click a built-in template above or run npm run seed:templates
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">{t.slug}</td>
                  <td className="px-4 py-3">{t.supportsRtl ? '✓' : '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleTemplate(t.id).then(load)}
                      className={`px-2 py-1 rounded text-xs ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handlePreview(t.id)}
                        title="Preview LTR"
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Eye size={16} />
                      </button>
                      {t.supportsRtl && (
                        <button
                          onClick={() => handlePreview(t.id, true)}
                          title="Preview RTL"
                          className="p-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded border border-purple-100 px-2"
                        >
                          RTL
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${t.name}"?`)) deleteTemplate(t.id).then(load)
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white h-full p-6 overflow-y-auto shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">{editingId ? 'Edit Template' : 'Add Template'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            {importNote && (
              <p className="mb-3 text-sm text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{importNote}</p>
            )}
            {error && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Name *</label>
                <input
                  placeholder="e.g. Modern Professional"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Slug (optional)</label>
                  <input
                    placeholder="auto from name if empty"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-500 uppercase">HTML *</label>
                  <button
                    type="button"
                    onClick={() => htmlInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
                  >
                    <Upload size={12} /> Upload .html
                  </button>
                </div>
                <input
                  ref={htmlInputRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={(e) => handleFileUpload('html', e.target.files?.[0])}
                />
                <textarea
                  value={form.htmlStructure}
                  onChange={(e) => setForm({ ...form, htmlStructure: e.target.value })}
                  rows={8}
                  placeholder="<div><h1>{{fullName}}</h1>...</div>"
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-500 uppercase">CSS *</label>
                  <button
                    type="button"
                    onClick={() => cssInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
                  >
                    <Upload size={12} /> Upload .css
                  </button>
                </div>
                <input
                  ref={cssInputRef}
                  type="file"
                  accept=".css,text/css"
                  className="hidden"
                  onChange={(e) => handleFileUpload('css', e.target.files?.[0])}
                />
                <textarea
                  value={form.css}
                  onChange={(e) => setForm({ ...form, css: e.target.value })}
                  rows={6}
                  placeholder="body { font-family: sans-serif; }"
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Thumbnail URL (optional)</label>
                <input
                  placeholder="/template-thumbs/my-design.png"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.supportsRtl}
                  onChange={(e) => setForm({ ...form, supportsRtl: e.target.checked })}
                />
                RTL support (Arabic)
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewHtml(null)} />
          <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Template Preview</h3>
              <button onClick={() => setPreviewHtml(null)}><X size={20} /></button>
            </div>
            <iframe
              srcDoc={previewHtml}
              title="Template preview"
              className="flex-1 w-full min-h-[500px] border-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
