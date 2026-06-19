'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Eye, Pencil, Trash2, X, Upload, Info } from 'lucide-react'
import {
  createTemplate,
  deleteTemplate,
  listAllTemplates,
  previewTemplate,
  toggleTemplate,
  updateTemplate,
  type Template,
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
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const cssInputRef = useRef<HTMLInputElement>(null)

  const load = () => listAllTemplates().then(setTemplates).catch(console.error)
  useEffect(() => { load() }, [])

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
            Add CV templates — users see only <strong>Active</strong> ones on /templates
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={16} /> Add Template
        </button>
      </div>

      {/* Help box */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm">
        <div className="flex gap-2 items-start">
          <Info size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-2 text-gray-700">
            <p className="font-medium text-purple-900">How to add your own templates</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li><strong>Option A — Admin UI:</strong> Click &quot;Add Template&quot;, upload your .html and .css files</li>
              <li><strong>Option B — Folder + seed:</strong> Put files in <code className="bg-white px-1 rounded">templates/my-name/template.html</code> + <code className="bg-white px-1 rounded">template.css</code>, then run <code className="bg-white px-1 rounded">npm run seed:templates</code> in backend</li>
              <li><strong>PDF design:</strong> Export pages as PNG → put in <code className="bg-white px-1 rounded">frontend/public/template-thumbs/</code> → set Thumbnail URL (e.g. <code className="bg-white px-1 rounded">/template-thumbs/modern.png</code>). Rebuild HTML/CSS from your PDF layout for live CV data.</li>
            </ol>
            <p className="text-xs text-gray-600">
              Use placeholders: <code>{'{{fullName}}'}</code>, <code>{'{{title}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{summary}}'}</code>, <code>{'{{experience}}'}</code>, <code>{'{{skills}}'}</code>
            </p>
          </div>
        </div>
      </div>

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
                  No templates yet — run seed or add one
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

      {/* Add/Edit form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white h-full p-6 overflow-y-auto shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">{editingId ? 'Edit Template' : 'Add Template'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

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
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Thumbnail URL (optional — PNG/JPG from PDF screenshot)
                </label>
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

      {/* Preview modal */}
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
