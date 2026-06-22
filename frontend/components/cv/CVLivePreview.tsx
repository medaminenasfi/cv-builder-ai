'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { previewCVPdf } from '@/lib/cvs-api';
import { ApiError } from '@/lib/api';
import { Eye, Maximize2, RefreshCw } from 'lucide-react';

interface CVLivePreviewProps {
  cvId: string;
  data: Record<string, unknown>;
  dataRevision: string;
  templateId: string | null;
  templateName?: string;
}

function extractCompileLog(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === 'object') {
    const d = err.data as { log?: string; message?: string | string[] };
    if (d.log) return d.log;
    if (typeof d.message === 'string') return d.message;
    if (Array.isArray(d.message)) return d.message.join('\n');
  }
  if (err instanceof Error) return err.message;
  return 'Preview failed';
}

export function CVLivePreview({
  cvId,
  data,
  dataRevision,
  templateId,
  templateName,
}: CVLivePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compileLog, setCompileLog] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const pdfUrlRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    if (!dataRevision || dataRevision === 'undefined') return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setCompileLog(null);

    previewCVPdf(cvId, { data, templateId })
      .then((blob) => {
        if (requestId !== requestIdRef.current) return;
        if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
        const url = URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        const msg = extractCompileLog(e);
        setError(msg);
        setCompileLog(msg);
        setPdfUrl(null);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [cvId, data, dataRevision, templateId]);

  useEffect(() => {
    const timer = setTimeout(refresh, 1500);
    return () => clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-5.5rem)] min-h-[480px]">
      <div className="px-4 py-3 border-b border-purple-100 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-purple-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">Live Preview (PDF)</p>
            <p className="text-[11px] text-gray-500">
              {templateName ?? 'Default template'} · LaTeX compile
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-purple-400 animate-pulse">Compiling…</span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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
        className="flex-1 relative bg-slate-200 min-h-0 overflow-auto flex flex-col items-center justify-start p-4"
      >
        {error && (
          <div className="w-full max-w-lg p-3 mb-2 text-center text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg whitespace-pre-wrap">
            {compileLog ?? error}
          </div>
        )}
        {!error && !pdfUrl && loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Compiling PDF preview…
          </div>
        )}
        {pdfUrl && (
          <iframe
            title="CV PDF preview"
            src={pdfUrl}
            className="w-full flex-1 min-h-[500px] border-0 bg-white shadow-lg rounded"
          />
        )}
      </div>
    </div>
  );
}
