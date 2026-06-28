'use client';

import { useEffect, useState } from 'react';
import { getVersions } from '@/lib/cvs-api';
import type { CVVersion } from '@/lib/cvs-api';
import { History, Loader2 } from 'lucide-react';

interface EditorVersionPanelProps {
  cvId: string;
}

export function EditorVersionPanel({ cvId }: EditorVersionPanelProps) {
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getVersions(cvId);
        if (!cancelled) setVersions(list.slice(0, 10));
      } catch {
        if (!cancelled) setError('Could not load version history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cvId]);

  return (
    <div className="app-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <History size={16} className="text-purple-600" />
        <h4 className="text-sm font-semibold text-gray-900">Version history</h4>
      </div>
      {loading && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> Loading…
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!loading && !error && (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-purple-50/60 border border-purple-100/80"
            >
              <span className="font-medium text-gray-800">v{v.versionNumber}</span>
              <span className="text-gray-500 capitalize">{v.source}</span>
              <span className="text-gray-400">
                {new Date(v.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </li>
          ))}
          {!versions.length && <li className="text-xs text-gray-500">No versions yet</li>}
        </ul>
      )}
    </div>
  );
}
