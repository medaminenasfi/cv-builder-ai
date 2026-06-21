'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

interface UseAutoSaveOptions {
  enabled: boolean;
  snapshot: string;
  debounceMs?: number;
  onSave: () => Promise<void>;
}

export function useAutoSave({
  enabled,
  snapshot,
  debounceMs = 30000,
  onSave,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('saved');
  const savedSnapshotRef = useRef(snapshot);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const runSave = useCallback(async () => {
    if (savingRef.current || snapshot === savedSnapshotRef.current) return;
    savingRef.current = true;
    setStatus('saving');
    try {
      await onSave();
      savedSnapshotRef.current = snapshot;
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [onSave, snapshot]);

  useEffect(() => {
    if (!enabled) return;

    if (snapshot === savedSnapshotRef.current) {
      setStatus((s) => (s === 'saving' ? s : 'saved'));
      return;
    }

    setStatus('dirty');
    clearTimer();
    timerRef.current = setTimeout(() => {
      void runSave();
    }, debounceMs);

    return clearTimer;
  }, [enabled, snapshot, debounceMs, runSave]);

  const markSaved = useCallback((nextSnapshot?: string) => {
    savedSnapshotRef.current = nextSnapshot ?? snapshot;
    clearTimer();
    setStatus('saved');
  }, [snapshot]);

  return { status, markSaved, saveNow: runSave };
}
