const MAX_WIDTH = 820;

/** Render the first page of a PDF to a small JPEG for AI vision (low token cost). */
export async function pdfFileToPng(file: File, scale = 1): Promise<File> {
  const pdfjs = await import('pdfjs-dist');

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  if (doc.numPages < 1) {
    throw new Error('PDF has no pages');
  }

  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  let width = Math.floor(viewport.width);
  let height = Math.floor(viewport.height);

  if (width > MAX_WIDTH) {
    const ratio = MAX_WIDTH / width;
    width = MAX_WIDTH;
    height = Math.floor(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas for PDF rendering');
  }

  const scaledViewport = page.getViewport({ scale: scale * (width / viewport.width) });
  await page.render({ canvas, canvasContext: ctx, viewport: scaledViewport }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to export PDF page as image'))),
      'image/jpeg',
      0.68,
    );
  });

  const baseName = file.name.replace(/\.pdf$/i, '') || 'cv-template';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/** Downscale a raster image before upload to reduce OpenRouter vision token usage. */
export async function compressImageFile(file: File, maxWidth = MAX_WIDTH): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image compression failed'))),
      'image/jpeg',
      0.68,
    );
  });

  const name = file.name.replace(/\.(png|webp)$/i, '.jpg');
  return new File([blob], name.endsWith('.jpg') ? name : `${name}.jpg`, { type: 'image/jpeg' });
}
