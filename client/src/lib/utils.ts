import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImageToJpeg(
  blob: Blob,
  maxWidth = 1600,
  quality = 0.8,
): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  ctx.drawImage(img, 0, 0, width, height);

  const out = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  img.close();
  return out;
}
