'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  createTemplate,
  deleteTemplate,
  listAllTemplates,
  toggleTemplate,
  type Template,
} from '@/lib/templates-api'

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', htmlStructure: '', css: '', supportsRtl: false })

  const load = () => listAllTemplates().then(setTemplates)
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    await createTemplate(form)
    setForm({ name: '', htmlStructure: '', css: '', supportsRtl: false })
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Template Management</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
          <Plus size={16} /> Add Template
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3 text-gray-500">{t.slug}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleTemplate(t.id).then(load)} className={`px-2 py-1 rounded text-xs ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteTemplate(t.id).then(load)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-96 bg-white h-full p-6 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Add Template</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="HTML" value={form.htmlStructure} onChange={(e) => setForm({ ...form, htmlStructure: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
              <textarea placeholder="CSS" value={form.css} onChange={(e) => setForm({ ...form, css: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.supportsRtl} onChange={(e) => setForm({ ...form, supportsRtl: e.target.checked })} />
                RTL Support
              </label>
              <button onClick={handleSave} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
