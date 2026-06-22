'use client';

import { useEffect, useRef, useState } from 'react';
import { previewCV } from '@/lib/cvs-api';
import { Eye, Maximize2 } from 'lucide-react';

interface CVLivePreviewProps {
  cvId: string;
  data: Record<string, unknown>;
  /** Bumps when editor data changes — used only to trigger refresh */
  dataRevision: string;
  templateId: string | null;
  templateName?: string;
}

export function CVLivePreview({
  cvId,
  data,
  dataRevision,
  templateId,
  templateName,
}: CVLivePreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [renderKey, setRenderKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!dataRevision || dataRevision === 'undefined') return;

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      previewCV(cvId, { data, templateId })
        .then((r) => {
          if (requestId !== requestIdRef.current) return;
          setHtml(r.html);
          setRenderKey((k) => k + 1);
        })
        .catch((e) => {
          if (requestId !== requestIdRef.current) return;
          setError(e instanceof Error ? e.message : 'Preview failed');
          setHtml(null);
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [cvId, data, dataRevision, templateId]);

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
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-5.5rem)] min-h-[480px]">
      <div className="px-4 py-3 border-b border-purple-100 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-purple-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">Live Preview</p>
            <p className="text-[11px] text-gray-500">
              {templateName ?? 'Default template'} · 1 page
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-purple-400 animate-pulse">Updating…</span>
          )}
          <a
            href={`/cv/${cvId}/preview`}
            className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline"
            title="Full A4 preview & PDF export"
          >
            <Maximize2 size={12} />
            Full preview
          </a>
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
              key={renderKey}
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
