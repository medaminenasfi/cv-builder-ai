'use client'

import { useEffect, useRef, useState } from 'react'
import { pdfBlobToPageImageUrl } from '@/lib/pdf-preview-image'
import { previewActiveTemplatePdf } from '@/lib/templates-api'

interface TemplatePreviewFrameProps {
  templateId: string
  templateName: string
  thumbnailUrl?: string | null
  compact?: boolean
  card?: boolean
  rtl?: boolean
  /** Grid cards must stay false — PDF embeds download on click in some browsers. */
  livePreview?: boolean
}

function TemplateCardPlaceholder({ templateName }: { templateName: string }) {
  const initial = templateName.trim().charAt(0).toUpperCase() || 'T'
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-white via-purple-50/80 to-purple-100/60 p-3 pointer-events-none">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <p className="text-[10px] font-medium text-purple-900 truncate leading-tight">{templateName}</p>
      </div>
      <div className="flex-1 rounded-md bg-white/70 border border-purple-100/80 p-2 space-y-1.5 shadow-sm">
        <div className="h-1.5 bg-purple-200/80 rounded w-3/4" />
        <div className="h-1 bg-purple-100 rounded w-full" />
        <div className="h-1 bg-purple-100 rounded w-5/6" />
        <div className="h-1 bg-purple-100 rounded w-4/5" />
        <div className="mt-2 h-1 bg-purple-200/70 rounded w-1/3" />
        <div className="h-1 bg-purple-100 rounded w-full" />
        <div className="h-1 bg-purple-100 rounded w-11/12" />
      </div>
    </div>
  )
}

export function TemplatePreviewFrame({
  templateId,
  templateName,
  thumbnailUrl,
  compact = false,
  card = false,
  rtl = false,
  livePreview = true,
}: TemplatePreviewFrameProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!livePreview || thumbnailUrl) {
      setImageUrl(null)
      setLoading(false)
      setError(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    previewActiveTemplatePdf(templateId, rtl)
      .then(async (blob) => {
        if (cancelled) return
        const url = await pdfBlobToPageImageUrl(blob, card ? 480 : 900)
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = url
        setImageUrl(url)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [templateId, rtl, livePreview, thumbnailUrl, card])

  const shellClass = card
    ? 'absolute inset-0'
    : compact
      ? 'h-36 rounded-lg border border-slate-200'
      : 'h-full min-h-[420px] rounded-xl border border-slate-200'

  if (thumbnailUrl) {
    return (
      <div className={`relative overflow-hidden bg-purple-50 ${shellClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={`${templateName} preview`}
          className="w-full h-full object-cover object-top pointer-events-none"
          draggable={false}
        />
      </div>
    )
  }

  if (!livePreview) {
    return (
      <div className={`relative overflow-hidden ${shellClass}`}>
        <TemplateCardPlaceholder templateName={templateName} />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-white ${shellClass} ${compact ? '' : 'shadow-inner'}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-xs text-slate-400 z-10">
          Compiling preview…
        </div>
      )}
      {error && !imageUrl && (
        <div className="absolute inset-0 z-10">
          <TemplateCardPlaceholder templateName={templateName} />
        </div>
      )}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={`${templateName} preview`}
          draggable={false}
          className={
            card
              ? 'absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none'
              : 'w-full h-full object-contain object-top bg-white pointer-events-none select-none'
          }
        />
      )}
    </div>
  )
}
