'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetchPublic } from '@/lib/api'
import { Printer, Download } from 'lucide-react'

interface SharePayload {
  cvId: string
  title: string
  locale: string
  fullName: string
  html: string
  expiresAt?: string
}

export default function ShareCVPage() {
  const params = useParams()
  const token = params.token as string
  const [payload, setPayload] = useState<SharePayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetchPublic<SharePayload | null>(`/share/${token}`)
      .then((r) => setPayload(r))
      .catch(() => setPayload(null))
      .finally(() => setLoading(false))
  }, [token])

  const handlePrint = () => window.print()

  const handleDownloadPdf = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api'
      const res = await fetch(`${base}/share/${token}/export/pdf`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${payload?.fullName ?? 'resume'}.pdf`.replace(/\s+/g, '-')
      a.click()
    } catch {
      handlePrint()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-gray-400 text-sm">Loading shared resume…</div>
      </div>
    )
  }

  if (!payload?.html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-900 font-semibold text-lg">Link expired or not found</p>
          <p className="text-gray-500 text-sm mt-2">
            This share link may have expired after 7 days. Ask the owner to generate a new link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-purple-100 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{payload.fullName}</p>
            <p className="text-xs text-gray-500">{payload.title}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
              style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
            >
              <Download size={16} />
              Download PDF
            </button>
            {'share' in navigator && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={() =>
                  navigator.share({
                    title: payload?.fullName ?? 'Resume',
                    url: window.location.href,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-purple-200 text-purple-700 rounded-lg"
              >
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[210mm] mx-auto py-8 px-4 print:p-0 print:max-w-none">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden print:shadow-none print:rounded-none">
          <iframe
            title="Shared resume"
            srcDoc={payload.html}
            className="w-full border-0 min-h-[297mm]"
            style={{ height: '297mm' }}
          />
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 print:hidden">
        Powered by <span className="font-semibold text-purple-600">ResumeAI</span>
      </footer>
    </div>
  )
}
