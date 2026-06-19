'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetchPublic } from '@/lib/api'

export default function ShareCVPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    apiFetchPublic<{ cvId: string; data: Record<string, unknown> }>(`/share/${token}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
  }, [token])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Loading shared CV or link expired...</p>
      </div>
    )
  }

  const personal = (data.personal ?? {}) as { fullName?: string; title?: string }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl border p-8">
        <h1 className="text-2xl font-bold">{personal.fullName ?? 'Shared CV'}</h1>
        <p className="text-gray-600">{personal.title}</p>
        <pre className="mt-6 text-xs bg-gray-50 p-4 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
