// Web export. Desktop and Android browsers get one zip download. iPhone and iPad Safari
// can't put files in Photos, so they get the share sheet, whose "Save Images" does.
// The phone app uses export-photos.native.ts and saves straight to the photo library.
import type { Photo } from '@/lib/events';
import {
  EXPORT_MESSAGES,
  ExportError,
  isNetworkError,
  mapWithProgress,
  photoFileName,
  prepareUrls,
  zipFileName,
  type ExportOptions,
  type ExportResult,
  type SaveOutcome,
} from '@/lib/export-common';
import { createZip } from '@/lib/zip';

export { exportErrorMessage } from '@/lib/export-common';

const DOWNLOAD_CONCURRENCY = 4;
/** Give the browser time to start reading the blob before its URL is released. */
const REVOKE_DELAY_MS = 60_000;

async function fetchBytes(url: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Photo download failed (${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
}

function saveFile(blob: Blob, fileName: string): void {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), REVOKE_DELAY_MS);
}

/** iPhone, iPod, or an iPad (which reports itself as a Mac but has a touch screen). */
function isAppleTouchDevice(): boolean {
  if (typeof navigator === 'undefined' || !navigator) return false;
  const userAgent = navigator.userAgent ?? '';
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
}

function canShareFiles(files: File[]): boolean {
  try {
    return typeof navigator.share === 'function' && navigator.canShare?.({ files }) === true;
  } catch {
    return false;
  }
}

/** Opens the share sheet. Its first await is `share`, so the user's tap still counts. */
async function shareToPhotos(files: File[]): Promise<SaveOutcome> {
  try {
    await navigator.share({ files });
    return 'saved';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    console.error('Share sheet failed', error);
    throw new ExportError(EXPORT_MESSAGES.share);
  }
}

export async function exportPhotos(
  photos: Photo[],
  { rollName, onProgress }: ExportOptions
): Promise<ExportResult> {
  if (photos.length === 0) return { saved: 0, failed: 0, via: 'zip' };
  const urls = await prepareUrls(photos);
  const total = urls.length;
  onProgress?.({ done: 0, total });

  const { results, errors } = await mapWithProgress(urls, fetchBytes, {
    concurrency: DOWNLOAD_CONCURRENCY,
    onProgress,
  });
  const files = results.flatMap((data, index) =>
    data ? [{ name: photoFileName(rollName, index, total), data }] : []
  );
  if (errors.length > 0) console.error('Some photos could not be downloaded', errors);
  if (files.length === 0) {
    throw new ExportError(isNetworkError(errors[0]) ? EXPORT_MESSAGES.offline : EXPORT_MESSAGES.download);
  }
  const failed = total - files.length;

  if (isAppleTouchDevice()) {
    const images = files.map(({ name, data }) => new File([data], name, { type: 'image/jpeg' }));
    if (canShareFiles(images)) {
      return { saved: images.length, failed, via: 'share', saveToPhotos: () => shareToPhotos(images) };
    }
  }

  saveFile(new Blob([createZip(files)], { type: 'application/zip' }), zipFileName(rollName));
  return { saved: files.length, failed, via: 'zip' };
}
