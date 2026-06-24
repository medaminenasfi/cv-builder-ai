'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pdfBlobToObjectUrl, previewCVPdf } from '@/lib/cvs-api';
import { ApiError } from '@/lib/api';
import { Eye, Maximize2, RefreshCw } from 'lucide-react';

interface CVLivePreviewProps {
  cvId: string;
  data: Record<string, unknown>;
  dataRevision: string;
  templateId: string | null;
  templateName?: string;
}

/** Wait after last edit before compiling (LaTeX is slow). */
const PREVIEW_DEBOUNCE_MS = 4000;

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

function revisionKey(templateId: string | null, dataRevision: string): string {
  return `${templateId ?? ''}::${dataRevision}`;
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
  const requestIdRef = useRef(0);
  const pdfUrlRef = useRef<string | null>(null);
  const draftRef = useRef({ cvId, data, templateId });
  const lastCompiledKeyRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  draftRef.current = { cvId, data, templateId };

  const runCompile = useCallback((force = false) => {
    if (!dataRevision || dataRevision === 'undefined') return;

    const key = revisionKey(templateId, dataRevision);

    if (!force && key === lastCompiledKeyRef.current) {
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setCompileLog(null);

    const { cvId: id, data: draft, templateId: tpl } = draftRef.current;

    previewCVPdf(id, { data: draft, templateId: tpl })
      .then((blob) => {
        if (requestId !== requestIdRef.current) return;
        if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
        const url = pdfBlobToObjectUrl(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
        lastCompiledKeyRef.current = key;
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
  }, [cvId, dataRevision, templateId]);

  const scheduleCompile = useCallback(
    (force = false) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (force) {
        runCompile(true);
        return;
      }
      debounceTimerRef.current = setTimeout(() => runCompile(false), PREVIEW_DEBOUNCE_MS);
    },
    [runCompile],
  );

  useEffect(() => {
    scheduleCompile(false);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [dataRevision, templateId, scheduleCompile]);

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
              {templateName ?? 'Default template'} · LaTeX · updates ~4s after you stop typing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-purple-400 animate-pulse">Compiling…</span>
          )}
          <button
            type="button"
            onClick={() => scheduleCompile(true)}
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

      <div className="flex-1 relative bg-slate-200 min-h-0 overflow-auto flex flex-col items-center justify-start p-4">
        {error && (
          <div className="w-full max-w-lg p-3 mb-2 text-center text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg whitespace-pre-wrap">
            {compileLog ?? error}
          </div>
        )}
        {!error && !pdfUrl && loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Compiling PDF preview (LaTeX may take 15–30s)…
          </div>
        )}
        {pdfUrl && (
          <embed
            title="CV PDF preview"
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="w-full flex-1 min-h-[500px] border-0 bg-white shadow-lg rounded"
          />
        )}
      </div>
    </div>
  );
}
