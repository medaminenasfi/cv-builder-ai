'use client';

import { useEffect, useRef, useState } from 'react';
import { previewCV } from '@/lib/cvs-api';
import type { CVData } from '@/lib/types/cv-data';
import Link from 'next/link';
import { Maximize2 } from 'lucide-react';

interface CVLivePreviewProps {
  cvId: string;
  data: CVData;
  templateId: string | null;
  templateName?: string;
}

export function CVLivePreview({ cvId, data, templateId, templateName }: CVLivePreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      previewCV(cvId, { data, templateId })
        .then((r) => {
          if (!cancelled) setHtml(r.html);
        })
        .catch((e) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Preview failed');
            setHtml(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cvId, data, templateId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth - 32;
      const a4WidthPx = (210 / 25.4) * 96;
      setScale(Math.min(1, w / a4WidthPx));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden flex flex-col sticky top-6 h-[calc(100vh-6rem)]">
      <div className="px-4 py-3 border-b border-purple-100 bg-purple-50 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">
            Live Preview
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {templateName ?? 'Default'} · A4 ({210}×{297} mm)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-purple-400 animate-pulse">Updating…</span>
          )}
          <Link
            href={`/cv/${cvId}/preview`}
            className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline"
            title="Full A4 preview & PDF export"
          >
            <Maximize2 size={12} />
            Full preview
          </Link>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative bg-slate-200 min-h-0 overflow-auto flex items-start justify-center p-4"
      >
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        {!error && !html && loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Loading preview…
          </div>
        )}
        {html && (
          <div
            className="origin-top shadow-lg"
            style={{
              width: '210mm',
              minHeight: '297mm',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              marginBottom: scale < 1 ? `-${(1 - scale) * 297}mm` : undefined,
            }}
          >
            <iframe
              title="CV template preview"
              srcDoc={html}
              className="w-full border-0 bg-white"
              style={{ width: '210mm', minHeight: '297mm' }}
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
