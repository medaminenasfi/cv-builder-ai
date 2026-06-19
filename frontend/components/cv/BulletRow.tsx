'use client'

import { Wand2, X, CheckCircle2, XCircle } from 'lucide-react'
import { Bullet } from '@/lib/mockData'
import { useState } from 'react'

interface BulletRowProps {
  bullet: Bullet
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  tone: 'professional' | 'technical' | 'creative'
}

export function BulletRow({ bullet, onUpdate, onDelete, tone }: BulletRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(bullet.text)
  const [showAIDiff, setShowAIDiff] = useState(false)

  const aiSuggestions: Record<string, string> = {
    professional:
      'Managed cross-functional initiatives resulting in measurable business impact',
    technical: 'Engineered optimized solution using React and TypeScript',
    creative:
      'Crafted innovative experience that delighted users and exceeded expectations',
  }

  const handleSave = () => {
    onUpdate(bullet.id, text)
    setIsEditing(false)
  }

  return (
    <div className="space-y-3">
      {/* Bullet Edit Row */}
      <div className="flex gap-3 items-start">
        {isEditing ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              rows={2}
            />
            <div className="flex gap-1 pt-1">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs rounded hover:bg-green-100 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setText(bullet.text)
                  setIsEditing(false)
                }}
                className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 text-xs rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-gray-900 py-2">{text}</p>
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => setShowAIDiff(!showAIDiff)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-purple-50 rounded transition-colors"
                title="AI Enhance"
              >
                <Wand2 size={16} />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-purple-50 rounded transition-colors"
                title="Edit"
              >
                <span className="text-xs">✏️</span>
              </button>
              <button
                onClick={() => onDelete(bullet.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <X size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* AI Diff View */}
      {showAIDiff && !isEditing && (
        <div className="bg-gradient-to-r from-purple-50 to-transparent p-3 rounded-lg border border-purple-100">
          <p className="text-xs font-medium text-purple-700 mb-2">AI Suggestion ({tone})</p>

          {/* Original */}
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1">Original:</p>
            <p className="text-xs line-through text-gray-400">{bullet.text}</p>
          </div>

          {/* New */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Enhanced:</p>
            <p className="text-xs text-gray-900">{aiSuggestions[tone]}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 text-xs rounded hover:bg-green-100 transition-colors">
              <CheckCircle2 size={14} />
              Accept
            </button>
            <button className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 text-xs rounded hover:bg-gray-100 transition-colors">
              <XCircle size={14} />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
