/** Render the first page of a PDF to a JPEG File (browser only). Smaller than PNG for AI vision uploads. */
export async function pdfFileToPng(file: File, scale = 1.25): Promise<File> {
  const pdfjs = await import('pdfjs-dist')

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise

  if (doc.numPages < 1) {
    throw new Error('PDF has no pages')
  }

  const page = await doc.getPage(1)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create canvas for PDF rendering')
  }

  await page.render({ canvas, canvasContext: ctx, viewport }).promise

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to export PDF page as image'))),
      'image/jpeg',
      0.85,
    )
  })

  const baseName = file.name.replace(/\.pdf$/i, '') || 'cv-template'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
