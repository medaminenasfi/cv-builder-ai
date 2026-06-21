'use client';

import { AppShell } from '@/components/layout/AppShell';
import { exportCVHtml, exportCVPdf, getCV } from '@/lib/cvs-api';
import { ApiError } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';

export default function CVPreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cv = await getCV(id);
      setTitle(cv.title);
      const { html: doc } = await exportCVHtml(id);
      setHtml(doc);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const printPdf = () => {
    window.print();
  };

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_') || 'CV'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    setError(null);
    try {
      const safeName = (title || 'resume').replace(/[^\w\-]+/g, '_').slice(0, 60);
      await exportCVPdf(id, `${safeName}.pdf`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'PDF download failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <AppShell title="CV Preview" fullBleed>
      <div className="sticky top-0 z-30 bg-white/95 border-b border-purple-100 backdrop-blur print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-sm font-medium text-gray-900">{title || 'CV Preview'}</h1>
            <p className="text-xs text-gray-500">A4 format (210 × 297 mm)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cv/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to editor
            </Link>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={!html || downloadingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              <Download size={16} />
              {downloadingPdf ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={printPdf}
              disabled={!html}
              className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg disabled:opacity-50"
            >
              <Printer size={16} />
              Browser print
            </button>
            <button
              type="button"
              onClick={downloadHtml}
              disabled={!html}
              className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg disabled:opacity-50"
            >
              <Download size={16} />
              Download HTML
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cv-print-root,
          #cv-print-root * {
            visibility: visible;
          }
          #cv-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 m-4 print:hidden">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500 text-center py-12 print:hidden">Loading A4 preview…</p>
      )}

      {html && (
        <div id="cv-print-root" className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
          <p className="text-center text-xs text-gray-500 mb-4 print:hidden">
            A4 preview — use <strong>Download PDF</strong> for server export, or <strong>Browser print</strong> as fallback
          </p>
          <iframe
            title="CV A4 preview"
            srcDoc={html}
            className="block mx-auto border-0 bg-transparent print:w-full print:h-auto"
            style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%' }}
            sandbox="allow-same-origin allow-modals"
          />
        </div>
      )}
    </AppShell>
  );
}
