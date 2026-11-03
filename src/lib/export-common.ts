import { downloadUrls, type Photo } from '@/lib/events';

/** A failure the user can act on; `message` is short, plain copy shown on the roll screen. */
export class ExportError extends Error {}

export const EXPORT_MESSAGES = {
  permission: 'Allow photo access in Settings to save the roll.',
  offline: 'No connection. Try again.',
  partial: 'Some photos aren’t ready. Try again in a moment.',
  download: 'Couldn’t download the photos. Check your connection.',
  save: 'Couldn’t save to your photo library.',
  unknown: 'Couldn’t export. Try again.',
} as const;

const NETWORK_HINTS = ['Network request failed', 'Failed to fetch', 'Could not load bundle', 'timed out'];

export function isNetworkError(e: unknown): boolean {
  const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : '';
  return NETWORK_HINTS.some((hint) => message.includes(hint));
}

/** Signed download links for every photo; fails if any photo can't be prepared. */
export async function prepareUrls(photos: Photo[]): Promise<string[]> {
  let urls: string[];
  try {
    urls = await downloadUrls(photos.map((p) => p.path));
  } catch (e) {
    console.error('Could not sign export urls', e);
    throw new ExportError(isNetworkError(e) ? EXPORT_MESSAGES.offline : EXPORT_MESSAGES.partial);
  }
  if (urls.length < photos.length) throw new ExportError(EXPORT_MESSAGES.partial);
  return urls;
}

/** What to show the user when `exportPhotos` throws. Unknown errors are logged, not shown. */
export function exportErrorMessage(e: unknown): string {
  if (e instanceof ExportError) return e.message;
  console.error('Export failed', e);
  return isNetworkError(e) ? EXPORT_MESSAGES.offline : EXPORT_MESSAGES.unknown;
}
