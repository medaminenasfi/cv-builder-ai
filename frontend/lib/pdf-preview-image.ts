let workerReady = false;

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerReady = true;
  }
  return pdfjs;
}

/** Render page 1 of a PDF blob to a PNG object URL (safe for clicks — no download). */
export async function pdfBlobToPageImageUrl(blob: Blob, maxWidth = 900): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await blob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  if (doc.numPages < 1) {
    throw new Error('PDF has no pages');
  }

  const page = await doc.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = baseViewport.width > maxWidth ? maxWidth / baseViewport.width : 1;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not render PDF preview');
  }

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to render PDF preview image'))),
      'image/png',
    );
  });

  return URL.createObjectURL(imageBlob);
}
