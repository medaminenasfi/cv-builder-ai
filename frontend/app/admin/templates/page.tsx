'use client'

import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Toggle2,
} from 'lucide-react'

interface Template {
  id: string
  name: string
  status: 'active' | 'inactive'
  created: string
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Modern',
      status: 'active',
      created: '2024-01-15',
    },
    {
      id: '2',
      name: 'Classic',
      status: 'active',
      created: '2024-01-10',
    },
    {
      id: '3',
      name: 'Executive',
      status: 'inactive',
      created: '2024-01-05',
    },
  ])
  const [showSlideOver, setShowSlideOver] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    html: '',
    css: '',
    rtl: false,
  })

  const handleToggleStatus = (id: string) => {
    setTemplates(
      templates.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'active' ? 'inactive' : 'active',
            }
          : t
      )
    )
  }

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const handleSave = () => {
    setTemplates([
      ...templates,
      {
        id: Date.now().toString(),
        name: newTemplate.name,
        status: 'active',
        created: new Date().toISOString().split('T')[0],
      },
    ])
    setNewTemplate({ name: '', html: '', css: '', rtl: false })
    setShowSlideOver(false)
  }

  const actions = (
    <button
      onClick={() => setShowSlideOver(true)}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
    >
      <Plus size={18} />
      Add Template
    </button>
  )

  return (
    <AppShell title="Template Management" actions={actions}>
      {/* Templates Table */}
      <div className="bg-white border border-purple-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-purple-50 border-b border-purple-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">
                Created
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template, idx) => (
              <tr
                key={template.id}
                className={`border-t border-purple-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'
                } hover:bg-purple-100 transition-colors`}
              >
                <td className="px-6 py-3 text-gray-900 font-medium">
                  {template.name}
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => handleToggleStatus(template.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      template.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {template.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {new Date(template.created).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => alert('Edit not implemented')}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide Over Panel */}
      {showSlideOver && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSlideOver(false)}
          ></div>

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Template
              </h2>
              <button
                onClick={() => setShowSlideOver(false)}
                className="p-1 text-gray-400 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="e.g., Modern Pro"
                  className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                  HTML
                </label>
                <textarea
                  value={newTemplate.html}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, html: e.target.value })
                  }
                  placeholder="HTML structure..."
                  rows={4}
                  className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                  CSS
                </label>
                <textarea
                  value={newTemplate.css}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, css: e.target.value })
                  }
                  placeholder="CSS styles..."
                  rows={4}
                  className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTemplate.rtl}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, rtl: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">RTL Support</span>
              </label>
            </div>

            {/* Footer */}
            <div className="border-t border-purple-100 px-6 py-4 flex gap-2">
              <button
                onClick={() => setShowSlideOver(false)}
                className="flex-1 px-3 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
