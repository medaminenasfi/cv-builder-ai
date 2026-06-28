/** Normalize PDF blob so browsers display inline instead of forcing a download. */
export function ensurePdfBlob(blob: Blob): Blob {
  return blob.type === 'application/pdf'
    ? blob
    : new Blob([blob], { type: 'application/pdf' });
}

export function pdfBlobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(ensurePdfBlob(blob));
}
