'use client'

import { AppShell } from '@/components/layout/AppShell'
import { listCVs, matchJob, coverLetter } from '@/lib/cvs-api'
import { useEffect, useState } from 'react'
import type { CV } from '@/lib/cvs-api'

export default function JobMatchPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [cvId, setCvId] = useState('')
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<{ score: number; gaps: string[] } | null>(null)
  const [letter, setLetter] = useState('')

  useEffect(() => {
    listCVs().then((list) => {
      setCvs(list)
      if (list[0]) setCvId(list[0].id)
    })
  }, [])

  const runMatch = async () => {
    if (!cvId || !jd) return
    const r = await matchJob(cvId, jd) as { score: number; gaps: string[] }
    setResult(r)
  }

  const genLetter = async () => {
    if (!cvId || !jd) return
    const r = await coverLetter(cvId, jd)
    setLetter(r.content)
  }

  return (
    <AppShell title="Job Match">
      <div className="space-y-4 max-w-2xl">
        <select value={cvId} onChange={(e) => setCvId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
          {cvs.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste job description..."
          rows={8}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button onClick={runMatch} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Analyze ATS Score</button>
          <button onClick={genLetter} className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm">Generate Cover Letter</button>
        </div>
        {result && (
          <div className="bg-white border rounded-xl p-4">
            <p className="text-2xl font-bold text-purple-600">{result.score}% ATS Match</p>
            {result.gaps?.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">Missing keywords: {result.gaps.join(', ')}</p>
            )}
          </div>
        )}
        {letter && (
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold mb-2">Cover Letter</h3>
            <pre className="text-sm whitespace-pre-wrap text-gray-700">{letter}</pre>
          </div>
        )}
      </div>
    </AppShell>
  )
}
