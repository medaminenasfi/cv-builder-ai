'use client'

import { useEffect, useState } from 'react'
import { previewActiveTemplate } from '@/lib/templates-api'

interface TemplatePreviewFrameProps {
  templateId: string
  templateName: string
  thumbnailUrl?: string | null
  compact?: boolean
  rtl?: boolean
}

export function TemplatePreviewFrame({
  templateId,
  templateName,
  thumbnailUrl,
  compact = false,
  rtl = false,
}: TemplatePreviewFrameProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(false)
    previewActiveTemplate(templateId, rtl)
      .then((r) => {
        if (!cancelled) setHtml(r.html)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [templateId, rtl])

  if (thumbnailUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-100 border border-slate-200 ${
          compact ? 'h-36 rounded-lg' : 'h-full min-h-[420px] rounded-xl'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={`${templateName} preview`}
          className="w-full h-full object-cover object-top"
        />
      </div>
    )
  }

  const heightClass = compact ? 'h-36' : 'min-h-[420px] h-full'

  return (
    <div
      className={`relative overflow-hidden bg-white border border-slate-200 ${heightClass} ${
        compact ? 'rounded-lg' : 'rounded-xl shadow-inner'
      }`}
    >
      {!html && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-xs text-slate-400">
          Loading preview…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-50 text-xs text-purple-600 p-4 text-center">
          {templateName}
        </div>
      )}
      {html && (
        <iframe
          title={`${templateName} preview`}
          srcDoc={html}
          className={
            compact
              ? 'w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none bg-white'
              : 'w-full h-full min-h-[500px] border-0 bg-white'
          }
          sandbox="allow-same-origin"
        />
      )}
    </div>
  )
}
