'use client'

import { AppShell } from '@/components/layout/AppShell'
import {
  getCV,
  updateCV,
  updateCVData,
} from '@/lib/cvs-api'
import {
  emptyCVData,
  newId,
  normalizeCVData,
  parseLanguagesInput,
  parseSkillsInput,
  parseTechnologiesInput,
  parseCertificationsInput,
  parseProjectsInput,
  skillsToInput,
  languagesToInput,
  technologiesToInput,
  certificationsToInput,
  projectsToInput,
} from '@/lib/cv-data-utils'
import { listActiveTemplates, type Template } from '@/lib/templates-api'
import type { CVData, CVExperience, CVEducation } from '@/lib/types/cv-data'
import { ApiError } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const STEPS = [
  'Personal',
  'Summary',
  'Experience',
  'Education',
  'Skills',
  'Languages',
  'Technologies',
  'Certifications',
  'Projects',
  'Template',
] as const

import type { ParseMeta } from '@/lib/cvs-api'
import { computeResumeHealth } from '@/lib/resume-health'

const inputCls =
  'w-full border border-purple-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200'

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cls =
    level === 'high'
      ? 'bg-emerald-50 text-emerald-700'
      : level === 'medium'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-red-50 text-red-600'
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      AI {level}
    </span>
  )
}

const QUALITY_LABELS: Record<string, string> = {
  excellent: 'Excellent parse (95–100)',
  good: 'Good parse (80–94)',
  review_recommended: 'Review recommended (60–79)',
  manual_review: 'Manual review required (<60)',
}

function qualityFromScore(score: number): string {
  if (score >= 95) return QUALITY_LABELS.excellent
  if (score >= 80) return QUALITY_LABELS.good
  if (score >= 60) return QUALITY_LABELS.review_recommended
  return QUALITY_LABELS.manual_review
}

export default function CVReviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [cvData, setCvData] = useState<CVData>(() => emptyCVData('en'))
  const [skillsText, setSkillsText] = useState('')
  const [languagesText, setLanguagesText] = useState('')
  const [technologiesText, setTechnologiesText] = useState('')
  const [certificationsText, setCertificationsText] = useState('')
  const [projectsText, setProjectsText] = useState('')
  const [parseMeta, setParseMeta] = useState<ParseMeta | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cv, tpls] = await Promise.all([getCV(id), listActiveTemplates()])
      setTitle(cv.title)
      setTemplateId(cv.templateId)
      setTemplates(tpls)
      const locale = (cv.locale ?? 'en') as CVData['meta']['locale']
      const normalized = normalizeCVData(cv.data, locale)
      setCvData(normalized)
      setSkillsText(skillsToInput(normalized.skills))
      setLanguagesText(languagesToInput(normalized.languages))
      setTechnologiesText(technologiesToInput(normalized.technologies))
      setCertificationsText(certificationsToInput(normalized.certifications))
      setProjectsText(projectsToInput(normalized.projects))
      const pm = normalized.meta?.parseMeta as ParseMeta | undefined
      if (pm?.overall != null) setParseMeta(pm)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load CV')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const patchData = (patch: Partial<CVData>) => {
    setCvData((prev) => ({ ...prev, ...patch }))
  }

  const patchPersonal = (patch: Partial<CVData['personal']>) => {
    setCvData((prev) => ({ ...prev, personal: { ...prev.personal, ...patch } }))
  }

  const save = async () => {
    const dataToSave: CVData = {
      ...cvData,
      skills: parseSkillsInput(skillsText),
      languages: parseLanguagesInput(languagesText),
      technologies: parseTechnologiesInput(technologiesText),
      certifications: parseCertificationsInput(certificationsText),
      projects: parseProjectsInput(projectsText),
    }
    await updateCV(id, { title, templateId: templateId ?? undefined })
    await updateCVData(id, dataToSave as unknown as Record<string, unknown>)
    setCvData(dataToSave)
  }

  const finishToEditor = async () => {
    setSaving(true)
    setError(null)
    try {
      await save()
      router.push(`/cv/${id}/edit`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const goJobMatch = async () => {
    setSaving(true)
    setError(null)
    try {
      await save()
      router.push(`/job-match?cvId=${id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addExperience = () => {
    const entry: CVExperience = {
      id: newId(),
      role: '',
      company: '',
      startDate: '',
      endDate: 'present',
      bullets: [''],
    }
    patchData({ experience: [...cvData.experience, entry] })
  }

  const updateExperience = (index: number, patch: Partial<CVExperience>) => {
    patchData({
      experience: cvData.experience.map((exp, i) =>
        i === index ? { ...exp, ...patch } : exp,
      ),
    })
  }

  const addEducation = () => {
    const entry: CVEducation = {
      id: newId(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: '',
    }
    patchData({ education: [...cvData.education, entry] })
  }

  const updateEducation = (index: number, patch: Partial<CVEducation>) => {
    patchData({
      education: cvData.education.map((edu, i) =>
        i === index ? { ...edu, ...patch } : edu,
      ),
    })
  }

  if (loading) {
    return (
      <AppShell title="Review import">
        <p className="text-gray-500 text-sm">Loading imported data…</p>
      </AppShell>
    )
  }

  const health = computeResumeHealth({
    ...cvData,
    skills: parseSkillsInput(skillsText),
    languages: parseLanguagesInput(languagesText),
    technologies: parseTechnologiesInput(technologiesText),
  })
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100)

  const qualityScore = parseMeta?.overall ?? health.score
  const qualityLabel = parseMeta?.qualityLabel
    ? QUALITY_LABELS[parseMeta.qualityLabel] ?? qualityFromScore(qualityScore)
    : qualityFromScore(qualityScore)

  const stepConfidence = (): 'high' | 'medium' | 'low' => {
    const fields = parseMeta?.fields
    if (fields) {
      const map: Record<number, keyof ParseMeta['fields']> = {
        0: 'personal',
        1: 'summary',
        2: 'experience',
        3: 'education',
        4: 'skills',
        5: 'languages',
        6: 'technologies',
      }
      const key = map[step]
      if (key && key !== 'personal') {
        const v = fields[key]
        if (typeof v === 'string') return v as 'high' | 'medium' | 'low'
      }
      if (step === 0 && fields.personal) {
        const levels = [fields.personal.fullName, fields.personal.email, fields.personal.phone]
        if (levels.every((l) => l === 'high')) return 'high'
        if (levels.some((l) => l === 'low')) return 'low'
        return 'medium'
      }
    }
    if (step === 0) {
      const hasContact = Boolean(cvData.personal.email || cvData.personal.phone)
      if (cvData.personal.fullName && hasContact) return 'high'
      if (cvData.personal.fullName || hasContact) return 'medium'
      return 'low'
    }
    if (step === 1) {
      const len = (cvData.summary ?? '').length
      return len > 80 ? 'high' : len > 20 ? 'medium' : 'low'
    }
    if (step === 2) return cvData.experience.length >= 2 ? 'high' : cvData.experience.length >= 1 ? 'medium' : 'low'
    if (step === 3) return cvData.education.length >= 1 ? 'high' : 'low'
    if (step <= 5) return 'medium'
    return 'high'
  }

  return (
    <AppShell title="Review import">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-medium text-gray-900">Review imported CV</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Check each section — verify AI-extracted data before editing.
        </p>

        <div className="mb-6 bg-white border border-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              Step {step + 1} of {STEPS.length} — {progressPct}% complete
            </span>
            <ConfidenceBadge level={stepConfidence()} />
          </div>
          <div className="h-2 bg-purple-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(to right, #7c3aed, #a855f7)',
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
              {qualityLabel} — {qualityScore}/100
            </span>
            {(parseMeta?.warnings ?? health.issues).slice(0, 3).map((issue) => (
              <span key={issue} className="px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                {issue}
              </span>
            ))}
            {parseMeta && !parseMeta.usedAi && (
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                Parsed without AI — verify all fields
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === i
                  ? 'text-white'
                  : i < step
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-gray-50 text-gray-500'
              }`}
              style={step === i ? { background: 'linear-gradient(to right, #7c3aed, #a855f7)' } : undefined}
            >
              {i < step ? <Check size={12} className="inline mr-1" /> : null}
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-purple-100 rounded-xl p-5 space-y-4 mb-6">
          {step === 0 && (
            <>
              <Field label="CV title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Full name">
                <input
                  value={cvData.personal.fullName}
                  onChange={(e) => patchPersonal({ fullName: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Job title">
                <input
                  value={cvData.personal.title}
                  onChange={(e) => patchPersonal({ title: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Email">
                  <input
                    type="email"
                    value={cvData.personal.email}
                    onChange={(e) => patchPersonal({ email: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={cvData.personal.phone ?? ''}
                    onChange={(e) => patchPersonal({ phone: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Location">
                <input
                  value={cvData.personal.location ?? ''}
                  onChange={(e) => patchPersonal({ location: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <Field label="Professional summary">
              <textarea
                value={cvData.summary ?? ''}
                onChange={(e) => patchData({ summary: e.target.value })}
                rows={8}
                className={inputCls}
              />
            </Field>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {cvData.experience.map((exp, index) => (
                <div key={exp.id} className="border border-purple-50 rounded-lg p-3 space-y-2">
                  <input
                    value={exp.role}
                    onChange={(e) => updateExperience(index, { role: e.target.value })}
                    className={inputCls}
                    placeholder="Role"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, { company: e.target.value })}
                    className={inputCls}
                    placeholder="Company"
                  />
                  <textarea
                    value={(exp.bullets ?? []).join('\n')}
                    onChange={(e) =>
                      updateExperience(index, {
                        bullets: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={4}
                    className={inputCls}
                    placeholder="Bullets (one per line)"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addExperience}
                className="text-xs text-purple-600 hover:underline"
              >
                + Add experience
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {cvData.education.map((edu, index) => (
                <div key={edu.id} className="border border-purple-50 rounded-lg p-3 space-y-2">
                  <input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, { institution: e.target.value })}
                    className={inputCls}
                    placeholder="Institution"
                  />
                  <input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, { degree: e.target.value })}
                    className={inputCls}
                    placeholder="Degree"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addEducation}
                className="text-xs text-purple-600 hover:underline"
              >
                + Add education
              </button>
            </div>
          )}

          {step === 4 && (
            <Field label="Skills (soft skills, comma separated)">
              <textarea
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                rows={4}
                className={inputCls}
                placeholder="Communication, teamwork…"
              />
            </Field>
          )}

          {step === 5 && (
            <Field label="Languages (one per line: Language — Level)">
              <textarea
                value={languagesText}
                onChange={(e) => setLanguagesText(e.target.value)}
                rows={5}
                className={inputCls}
                placeholder={'Français — Courant\nEnglish — Fluent'}
              />
            </Field>
          )}

          {step === 6 && (
            <Field label="Technologies (frameworks & tools)">
              <textarea
                value={technologiesText}
                onChange={(e) => setTechnologiesText(e.target.value)}
                rows={5}
                className={inputCls}
                placeholder="React, Node.js, Docker, PostgreSQL…"
              />
            </Field>
          )}

          {step === 7 && (
            <Field label="Certifications (Name — Issuer — Date)">
              <textarea
                value={certificationsText}
                onChange={(e) => setCertificationsText(e.target.value)}
                rows={5}
                className={inputCls}
                placeholder={'AWS Solutions Architect — Amazon — 2023'}
              />
            </Field>
          )}

          {step === 8 && (
            <Field label="Projects">
              <textarea
                value={projectsText}
                onChange={(e) => setProjectsText(e.target.value)}
                rows={6}
                className={inputCls}
                placeholder={'Portfolio Site — Next.js\n- Built admin dashboard'}
              />
            </Field>
          )}

          {step === 9 && (
            <Field label="Choose a template (optional)">
              <select
                value={templateId ?? ''}
                onChange={(e) => setTemplateId(e.target.value || null)}
                className={inputCls}
              >
                <option value="">Default layout</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                You can change the template later in the editor.
              </p>
            </Field>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 px-4 py-2 border border-purple-100 rounded-lg text-sm text-gray-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex flex-wrap gap-2">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 px-4 py-2 text-white rounded-lg text-sm"
                style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={goJobMatch}
                  disabled={saving}
                  className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm disabled:opacity-50"
                >
                  Check job match
                </button>
                <button
                  type="button"
                  onClick={finishToEditor}
                  disabled={saving}
                  className="px-4 py-2 text-white rounded-lg text-sm disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
                >
                  {saving ? 'Saving…' : 'Save & open editor'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
