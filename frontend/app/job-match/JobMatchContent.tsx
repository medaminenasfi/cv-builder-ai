'use client'

import { AppShell } from '@/components/layout/AppShell'
import {
  applyJobEnhancement,
  coverLetter,
  enhanceForJob,
  listCVs,
  listAtsMatches,
  matchJob,
  type AtsMatchResult,
  type JobEnhanceResult,
  type CV,
} from '@/lib/cvs-api'
import { ApiError } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles, FileText, Plus } from 'lucide-react'
import { CircularScore, MatchStatusBadge } from '@/components/job-match/CircularScore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const GRADIENT = 'linear-gradient(to right, #7c3aed, #a855f7)'

export default function JobMatchContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const initialCvId = searchParams.get('cvId')

  const [cvs, setCvs] = useState<CV[]>([])
  const [cvId, setCvId] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AtsMatchResult | null>(null)
  const [enhanceResult, setEnhanceResult] = useState<JobEnhanceResult | null>(null)
  const [letter, setLetter] = useState('')
  const [letterTone, setLetterTone] = useState<'professional' | 'creative' | 'technical'>('professional')
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    listCVs().then((list) => {
      setCvs(list)
      const pick = initialCvId && list.some((c) => c.id === initialCvId)
        ? initialCvId
        : list[0]?.id ?? ''
      setCvId(pick)
    })
  }, [initialCvId])

  useEffect(() => {
    if (!cvId) return
    listAtsMatches(cvId)
      .then((rows) => {
        const scores = [...rows].reverse().map((r) => r.score)
        if (scores.length) setScoreHistory(scores)
      })
      .catch(() => undefined)
  }, [cvId])

  const runMatch = async () => {
    if (!cvId || !jd.trim()) return
    setLoading(true)
    setError(null)
    setEnhanceResult(null)
    try {
      const r = await matchJob(cvId, jd)
      setResult(r)
      setScoreHistory((h) => [...h, r.score])
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const runEnhance = async () => {
    if (!cvId || !jd.trim()) return
    setLoading(true)
    setError(null)
    try {
      const r = await enhanceForJob(cvId, jd, ['summary', 'experience', 'skills'], 'professional')
      setEnhanceResult(r)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Enhance failed')
    } finally {
      setLoading(false)
    }
  }

  const applyEnhance = async () => {
    if (!enhanceResult || !cvId) return
    setApplying(true)
    setError(null)
    try {
      await applyJobEnhancement(cvId, enhanceResult.after as unknown as Record<string, unknown>)
      setEnhanceResult(null)
      const r = await matchJob(cvId, jd)
      setResult(r)
      setScoreHistory((h) => [...h, r.score])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Apply failed')
    } finally {
      setApplying(false)
    }
  }

  const genLetter = async () => {
    if (!cvId || !jd.trim()) return
    setLoading(true)
    setError(null)
    try {
      const r = await coverLetter(cvId, jd, undefined, letterTone)
      setLetter(r.content)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cover letter failed')
    } finally {
      setLoading(false)
    }
  }

  const scoreDelta =
    scoreHistory.length >= 2
      ? scoreHistory[scoreHistory.length - 1] - scoreHistory[scoreHistory.length - 2]
      : null

  return (
    <AppShell title="Job Match & ATS">
      <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Job Match & ATS</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paste a job description — get an ATS score, missing keywords, and AI-tailored rewrites.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-500">Select CV</label>
            <select
              value={cvId}
              onChange={(e) => setCvId(e.target.value)}
              className="w-full border border-purple-100 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {cvs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3 lg:col-span-2">
            <label className="text-xs font-medium text-gray-500">Job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={8}
              className="w-full border border-purple-100 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-purple-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:static fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-purple-100 p-3 sm:p-0 sm:border-0 sm:bg-transparent">
          <button
            type="button"
            onClick={runMatch}
            disabled={loading || !cvId || !jd.trim()}
            className="px-4 py-2 text-white rounded-lg text-sm disabled:opacity-50"
            style={{ background: GRADIENT }}
          >
            {loading ? 'Analyzing…' : 'Analyze ATS Score'}
          </button>
          <button
            type="button"
            onClick={runEnhance}
            disabled={loading || !cvId || !jd.trim()}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm disabled:opacity-50"
          >
            <Sparkles size={16} />
            Enhance for this job
          </button>
          <button
            type="button"
            onClick={genLetter}
            disabled={loading || !cvId || !jd.trim()}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm disabled:opacity-50"
          >
            <FileText size={16} />
            Cover letter
          </button>
          <select
            value={letterTone}
            onChange={(e) => setLetterTone(e.target.value as typeof letterTone)}
            className="border border-purple-100 rounded-lg px-2 py-2 text-sm"
            aria-label="Cover letter tone"
          >
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
          </select>
          {cvId && (
            <button
              type="button"
              onClick={() => router.push(`/cv/${cvId}/edit`)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Open editor
            </button>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <CircularScore score={result.score} label="Overall ATS Score" />
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <MatchStatusBadge score={result.score} />
                    {result.analysisMode === 'keyword' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                        Basic mode — add AI credits for full analysis
                      </span>
                    )}
                    {scoreDelta !== null && scoreDelta !== 0 && (
                      <span className={`text-xs ${scoreDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {scoreDelta > 0 ? '+' : ''}
                        {scoreDelta} vs previous
                      </span>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <ScoreBar label="Keywords" value={result.breakdown.keywords} />
                    <ScoreBar label="Experience" value={result.breakdown.experience} />
                    <ScoreBar label="Skills" value={result.breakdown.sections} />
                    <ScoreBar label="Education" value={Math.min(100, Math.round(result.breakdown.sections * 0.85))} />
                    <ScoreBar label="Formatting" value={result.breakdown.format} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <KeywordPanel title="Matched keywords" words={result.matchedKeywords} variant="matched" />
              <div>
                <KeywordPanel title="Missing keywords" words={result.missingKeywords} variant="missing" />
                {result.missingKeywords.length > 0 && cvId && (
                  <button
                    type="button"
                    onClick={() => router.push(`/cv/${cvId}/edit?keywords=${encodeURIComponent(result.missingKeywords.slice(0, 5).join(','))}`)}
                    className="mt-2 flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"
                  >
                    <Plus size={14} />
                    Insert into Resume
                  </button>
                )}
              </div>
            </div>

            {result.suggestions?.length > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
                  AI Recommendations
                </p>
                {Object.entries(groupSuggestions(result.suggestions)).map(([group, items]) =>
                  items.length > 0 ? (
                    <div key={group}>
                      <p className="text-xs font-medium text-purple-700 capitalize mb-1">{group}</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {items.map((s) => (
                          <li key={s} className="flex gap-2">
                            <span className="text-purple-400">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>
        )}

        {enhanceResult && (
          <div className="bg-white border border-purple-100 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-gray-900">AI enhancement preview</h3>
            {enhanceResult.after.summary !== enhanceResult.before.summary && (
              <DiffBlock
                label="Summary"
                before={enhanceResult.before.summary ?? ''}
                after={enhanceResult.after.summary ?? ''}
              />
            )}
            {enhanceResult.addedKeywords.length > 0 && (
              <p className="text-xs text-gray-500">
                Keywords added: {enhanceResult.addedKeywords.join(', ')}
              </p>
            )}
            <button
              type="button"
              onClick={applyEnhance}
              disabled={applying}
              className="px-4 py-2 text-white rounded-lg text-sm disabled:opacity-50"
              style={{ background: GRADIENT }}
            >
              {applying ? 'Applying…' : 'Apply & re-score'}
            </button>
          </div>
        )}

        {letter && (
          <div className="bg-white border border-purple-100 rounded-xl p-5">
            <h3 className="font-medium text-gray-900 mb-2">Cover letter</h3>
            <pre className="text-sm whitespace-pre-wrap text-gray-700 font-sans">{letter}</pre>
          </div>
        )}

        {scoreHistory.length > 1 && (
          <div className="bg-white border border-purple-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">ATS score history</p>
            <div className="h-36 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory.map((score, i) => ({ run: i + 1, score }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                  <XAxis dataKey="run" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={28} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-2 flex-wrap">
              {scoreHistory.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700"
                >
                  Run {i + 1}: {s}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-purple-50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: GRADIENT }}
        />
      </div>
    </div>
  )
}

function KeywordPanel({
  title,
  words,
  variant,
}: {
  title: string
  words: string[]
  variant: 'matched' | 'missing'
}) {
  if (!words.length) {
    return (
      <div className="bg-white border border-purple-100 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-xs text-gray-400 mt-1">None</p>
      </div>
    )
  }
  return (
    <div className="bg-white border border-purple-100 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w) => (
          <span
            key={w}
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              variant === 'matched'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-amber-50 text-amber-800 border border-amber-100'
            }`}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  )
}

function groupSuggestions(suggestions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    summary: [],
    experience: [],
    skills: [],
    projects: [],
    other: [],
  }
  for (const s of suggestions) {
    const lower = s.toLowerCase()
    if (/summary|profil|profile|intro|opening/.test(lower)) groups.summary.push(s)
    else if (/experience|job|role|work|employment|bullet/.test(lower)) groups.experience.push(s)
    else if (/skill|keyword|competenc|technology|tool/.test(lower)) groups.skills.push(s)
    else if (/project|portfolio/.test(lower)) groups.projects.push(s)
    else groups.other.push(s)
  }
  return groups
}

function DiffBlock({
  label,
  before,
  after,
}: {
  label: string
  before: string
  after: string
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs text-gray-400 mb-1">{label} — before</p>
        <p className="text-gray-600 bg-gray-50 rounded-lg p-2">{before || '—'}</p>
      </div>
      <div>
        <p className="text-xs text-purple-600 mb-1">{label} — after</p>
        <p className="text-gray-800 bg-purple-50 rounded-lg p-2">{after || '—'}</p>
      </div>
    </div>
  )
}
