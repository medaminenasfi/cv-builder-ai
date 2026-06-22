/** Infer MIME from extension when browser sends application/octet-stream. */
export function resolveUploadMime(mimeType: string, originalName?: string): string {
  const normalized = (mimeType || '').toLowerCase().split(';')[0].trim();
  if (
    normalized === 'application/pdf' ||
    normalized === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    normalized === 'application/msword'
  ) {
    return normalized;
  }

  const ext = originalName?.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (ext === 'doc') return 'application/msword';

  if (normalized === 'application/octet-stream' && ext === 'pdf') {
    return 'application/pdf';
  }

  return normalized || 'application/octet-stream';
}
