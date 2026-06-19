'use client';

import { useEffect, useState } from 'react';
import { previewCV } from '@/lib/cvs-api';
import type { CVData } from '@/lib/types/cv-data';

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

  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden flex flex-col sticky top-6 h-[calc(100vh-6rem)]">
      <div className="px-4 py-3 border-b border-purple-100 bg-purple-50 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">
            Live Preview
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {templateName ?? 'No template'} — updates as you type
          </p>
        </div>
        {loading && (
          <span className="text-[10px] text-purple-400 animate-pulse">Updating…</span>
        )}
      </div>

      <div className="flex-1 relative bg-slate-50 min-h-0">
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
          <iframe
            title="CV template preview"
            srcDoc={html}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
