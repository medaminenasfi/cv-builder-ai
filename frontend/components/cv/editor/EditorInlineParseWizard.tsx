'use client'

import type { ParseMeta } from '@/lib/cvs-api'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'

const WIZARD_STEPS = ['Profile', 'Work history', 'Skills & extras'] as const

const STEP_HINTS = [
  'Name, contact details, and resume title. Check the live preview on the right.',
  'Summary, jobs, and education. Fix dates and bullet points here.',
  'Skills, languages, certifications, and projects. Remove duplicates between fields.',
] as const

export interface ParseImportStats {
  experienceCount: number
  educationCount: number
  hasSummary: boolean
  hasLocation: boolean
  skillsCount: number
  languagesCount: number
}

interface EditorInlineParseWizardProps {
  step: number
  onStepChange: (step: number) => void
  parseMeta: ParseMeta | null
  importStats?: ParseImportStats | null
  saving: boolean
  onFinish: () => void
  onCancel: () => void
  children: React.ReactNode
}

const QUALITY: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  review_recommended: 'Review',
  manual_review: 'Check manually',
}

export function EditorInlineParseWizard({
  step,
  onStepChange,
  parseMeta,
  importStats,
  saving,
  onFinish,
  onCancel,
  children,
}: EditorInlineParseWizardProps) {
  const progress = ((step + 1) / WIZARD_STEPS.length) * 100
  const isLast = step === WIZARD_STEPS.length - 1

  return (
    <div className="bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Review imported CV</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Step {step + 1} of {WIZARD_STEPS.length} — {STEP_HINTS[step]}</p>
          </div>
          {parseMeta && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {parseMeta.overall}% · {QUALITY[parseMeta.qualityLabel] ?? 'Parsed'}
              {parseMeta.usedOcr && ' · OCR'}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {WIZARD_STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => onStepChange(i)}
              className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${
                i === step ? 'bg-purple-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i < step ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
      </div>

      {importStats && (
        <div className="mx-4 mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          <div className={`rounded-lg px-2 py-1.5 border ${importStats.hasLocation ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            Location {importStats.hasLocation ? '✓' : '— step 1'}
          </div>
          <div className={`rounded-lg px-2 py-1.5 border ${importStats.hasSummary ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            Summary {importStats.hasSummary ? '✓' : '— step 2'}
          </div>
          <div className={`rounded-lg px-2 py-1.5 border ${importStats.experienceCount > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            {importStats.experienceCount} job{importStats.experienceCount === 1 ? '' : 's'}
          </div>
          <div className={`rounded-lg px-2 py-1.5 border ${importStats.educationCount > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            {importStats.educationCount} education
          </div>
          <div className={`rounded-lg px-2 py-1.5 border ${importStats.skillsCount > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            {importStats.skillsCount} skill{importStats.skillsCount === 1 ? '' : 's'}
          </div>
          <div className={`rounded-lg px-2 py-1.5 border ${importStats.languagesCount > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            {importStats.languagesCount} language{importStats.languagesCount === 1 ? '' : 's'}
          </div>
        </div>
      )}

      {parseMeta?.warnings && parseMeta.warnings.length > 0 && step === 0 && (
        <div className="mx-4 mt-3 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-800">
          {parseMeta.warnings.slice(0, 2).map((w) => (
            <p key={w}>• {w}</p>
          ))}
        </div>
      )}

      <div className="p-4 max-h-[min(52vh,480px)] overflow-y-auto">{children}</div>

      <div className="px-4 py-3 border-t border-purple-100 flex items-center justify-between gap-2 bg-gray-50/50">
        <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-800">
          Skip review — use full editor
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => onStepChange(step - 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-purple-100 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Back
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onFinish}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 text-xs text-white rounded-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : 'Apply & continue'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStepChange(step + 1)}
              className="flex items-center gap-1 px-4 py-1.5 text-xs text-white rounded-lg"
              style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { WIZARD_STEPS }
