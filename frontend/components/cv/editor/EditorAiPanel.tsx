'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import type { EnhanceResult } from '@/lib/cvs-api'
import type { CVData } from '@/lib/types/cv-data'

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

function DiffBlock({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-gray-600">{label}</p>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-red-50 rounded-lg line-through opacity-70 max-h-32 overflow-y-auto whitespace-pre-wrap">
          {before || '(empty)'}
        </div>
        <div className="p-2 bg-emerald-50 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
          {after}
        </div>
      </div>
    </div>
  )
}

function formatSkills(data: CVData): string {
  const skills = (data.skills ?? []).map((s) => s.name).filter(Boolean)
  const tech = (data.technologies ?? []).map((t) => t.name).filter(Boolean)
  const parts: string[] = []
  if (skills.length) parts.push(`Skills: ${skills.join(', ')}`)
  if (tech.length) parts.push(`Technologies: ${tech.join(', ')}`)
  return parts.join('\n') || '(empty)'
}

function formatExperienceJob(job: CVData['experience'][number]): string {
  const header = [job.role, job.company].filter(Boolean).join(' @ ')
  const dates = [job.startDate, job.endDate].filter(Boolean).join(' – ')
  const bullets = (job.bullets ?? []).map((b) => `• ${b}`).join('\n')
  return [header, dates, bullets].filter(Boolean).join('\n')
}

function experienceDiffs(before: CVData, after: CVData) {
  const out: { label: string; before: string; after: string }[] = []
  const afterById = new Map((after.experience ?? []).map((e) => [e.id, e]))
  for (const job of before.experience ?? []) {
    const next = afterById.get(job.id)
    if (!next) continue
    const b = formatExperienceJob(job)
    const a = formatExperienceJob(next)
    if (b !== a) {
      out.push({
        label: [job.role, job.company].filter(Boolean).join(' @ ') || 'Experience',
        before: b,
        after: a,
      })
    }
  }
  return out
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
  const summaryChanged =
    preview != null && (preview.before.summary ?? '') !== (preview.after.summary ?? '')
  const skillsChanged =
    preview != null && formatSkills(preview.before) !== formatSkills(preview.after)
  const expDiffs = preview ? experienceDiffs(preview.before, preview.after) : []
  const hasDiff = summaryChanged || skillsChanged || expDiffs.length > 0

  return (
    <div className="bg-white border border-purple-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-purple-600" />
        <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
      </div>
      <p className="text-[11px] text-gray-500">
        Pick an action below. Suggestions appear here — click <strong>Apply</strong> to update your CV.
      </p>
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
          <p className="text-xs font-medium text-purple-800">
            {preview.message || 'Review suggestions, then click Apply'}
          </p>
          {hasDiff ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <p className="text-xs font-medium text-gray-500">Before / After</p>
              {summaryChanged && (
                <DiffBlock
                  label="Summary"
                  before={preview.before.summary ?? ''}
                  after={preview.after.summary ?? ''}
                />
              )}
              {expDiffs.map((d) => (
                <DiffBlock key={d.label} label={d.label} before={d.before} after={d.after} />
              ))}
              {skillsChanged && (
                <DiffBlock
                  label="Skills & technologies"
                  before={formatSkills(preview.before)}
                  after={formatSkills(preview.after)}
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
              No visible text changes — try another action or edit manually.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApply}
              disabled={!hasDiff}
              className="px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-50"
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
