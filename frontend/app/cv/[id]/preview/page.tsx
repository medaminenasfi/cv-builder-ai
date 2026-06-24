'use client';

import { AppShell } from '@/components/layout/AppShell';
import { exportCVPdf, getCV, pdfBlobToObjectUrl, previewCVSavedPdf } from '@/lib/cvs-api';
import { ApiError } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';

export default function CVPreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const urlRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cv = await getCV(id);
      setTitle(cv.title);
      const blob = await previewCVSavedPdf(id);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = pdfBlobToObjectUrl(blob);
      urlRef.current = url;
      setPdfUrl(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [load]);

  const printPdf = () => {
    window.print();
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
            <p className="text-xs text-gray-500">A4 PDF (LaTeX compile)</p>
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
              disabled={!pdfUrl || downloadingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              <Download size={16} />
              {downloadingPdf ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={printPdf}
              disabled={!pdfUrl}
              className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg disabled:opacity-50"
            >
              <Printer size={16} />
              Browser print
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 m-4 print:hidden">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500 text-center py-12 print:hidden">Compiling PDF preview…</p>
      )}

      {pdfUrl && (
        <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
          <iframe
            title="CV A4 preview"
            src={pdfUrl}
            className="block mx-auto border-0 bg-white shadow-lg print:shadow-none"
            style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%' }}
          />
        </div>
      )}
    </AppShell>
  );
}
