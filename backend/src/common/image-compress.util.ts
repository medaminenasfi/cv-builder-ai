import sharp from 'sharp';

/** Shrink images for low-credit OpenRouter vision calls (fewer prompt tokens). */
export async function compressImageForVision(
  buffer: Buffer,
  maxWidth = 900,
): Promise<{ buffer: Buffer; mimeType: 'image/jpeg' }> {
  const out = await sharp(buffer)
    .rotate()
    .resize({
      width: maxWidth,
      height: Math.round(maxWidth * 1.35),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 68, mozjpeg: true })
    .toBuffer();
  return { buffer: out, mimeType: 'image/jpeg' };
}
