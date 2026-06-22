'use client'

import { useEffect, useRef, useState } from 'react'
import { previewActiveTemplatePdf } from '@/lib/templates-api'

interface TemplatePreviewFrameProps {
  templateId: string
  templateName: string
  thumbnailUrl?: string | null
  compact?: boolean
  card?: boolean
  rtl?: boolean
}

export function TemplatePreviewFrame({
  templateId,
  templateName,
  thumbnailUrl,
  compact = false,
  card = false,
  rtl = false,
}: TemplatePreviewFrameProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(false)
    previewActiveTemplatePdf(templateId, rtl)
      .then((blob) => {
        if (cancelled) return
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setPdfUrl(url)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [templateId, rtl])

  if (thumbnailUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-purple-50 ${
          card
            ? 'absolute inset-0'
            : compact
              ? 'h-36 rounded-lg border border-slate-200'
              : 'h-full min-h-[420px] rounded-xl border border-slate-200'
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

  const initial = templateName.trim().charAt(0).toUpperCase() || 'T'
  const heightClass = compact ? 'h-36' : 'min-h-[420px] h-full'

  return (
    <div
      className={`relative overflow-hidden bg-white border border-slate-200 ${heightClass} ${
        compact ? 'rounded-lg' : 'rounded-xl shadow-inner'
      }`}
    >
      {!pdfUrl && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-xs text-slate-400">
          Loading preview…
        </div>
      )}
      {(error || (!pdfUrl && card)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-50 text-xs text-purple-600 p-4 text-center">
          {error ? templateName : initial}
        </div>
      )}
      {pdfUrl && (
        <iframe
          title={`${templateName} preview`}
          src={pdfUrl}
          className={
            card
              ? 'w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none bg-white'
              : 'w-full h-full min-h-[500px] border-0 bg-white'
          }
        />
      )}
    </div>
  )
}
