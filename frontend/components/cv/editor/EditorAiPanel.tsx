'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import type { EnhanceResult } from '@/lib/cvs-api'

export type AiActionId =
  | 'summary'
  | 'experience'
  | 'quantify'
  | 'skills'
  | 'ats'
  | 'professional'
  | 'executive'
  | 'technical'
  | 'academic'

const AI_ACTIONS: { id: AiActionId; label: string; sections: string[]; tone: string }[] = [
  { id: 'summary', label: 'Improve Summary', sections: ['summary'], tone: 'professional' },
  { id: 'experience', label: 'Rewrite Experience', sections: ['experience'], tone: 'professional' },
  { id: 'quantify', label: 'Quantify Achievements', sections: ['experience'], tone: 'professional' },
  { id: 'skills', label: 'Improve Skills', sections: ['skills', 'technologies'], tone: 'professional' },
  { id: 'ats', label: 'ATS Optimize', sections: ['summary', 'experience', 'skills'], tone: 'professional' },
  { id: 'professional', label: 'Professional Tone', sections: ['summary', 'experience', 'skills'], tone: 'professional' },
  { id: 'executive', label: 'Executive Tone', sections: ['summary', 'experience', 'skills'], tone: 'executive' },
  { id: 'technical', label: 'Technical Tone', sections: ['summary', 'experience', 'skills'], tone: 'technical' },
  { id: 'academic', label: 'Academic Tone', sections: ['summary', 'experience', 'skills'], tone: 'academic' },
]

interface EditorAiPanelProps {
  loading: boolean
  activeAction: AiActionId | null
  preview: EnhanceResult | null
  onRun: (action: typeof AI_ACTIONS[number]) => void
  onApply: () => void
  onDiscard: () => void
  onUndo: () => void
  canUndo: boolean
}

export function EditorAiPanel({
  loading,
  activeAction,
  preview,
  onRun,
  onApply,
  onDiscard,
  onUndo,
  canUndo,
}: EditorAiPanelProps) {
  return (
    <div className="bg-white border border-purple-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-purple-600" />
        <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {AI_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={loading}
            onClick={() => onRun(action)}
            className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
              activeAction === action.id
                ? 'border-purple-400 bg-purple-50 text-purple-800'
                : 'border-purple-100 hover:border-purple-300 text-gray-700'
            }`}
          >
            {loading && activeAction === action.id ? (
              <span className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Working…
              </span>
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>
      {preview && (
        <div className="border-t border-purple-100 pt-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Before / After</p>
          {preview.after.summary !== preview.before.summary && (
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-red-50 rounded-lg line-through opacity-70 max-h-24 overflow-y-auto">
                {preview.before.summary || '(empty)'}
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg max-h-24 overflow-y-auto">
                {preview.after.summary}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApply}
              className="px-3 py-1.5 text-xs text-white rounded-lg"
              style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
            >
              Apply
            </button>
            <button type="button" onClick={onDiscard} className="px-3 py-1.5 text-xs border border-purple-200 rounded-lg text-purple-700">
              Discard
            </button>
            {canUndo && (
              <button type="button" onClick={onUndo} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { AI_ACTIONS }
