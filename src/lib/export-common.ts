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
  share: 'Couldn’t open the save screen. Tap Save to Photos again.',
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

export interface ExportProgress {
  done: number;
  total: number;
}

export interface ExportOptions {
  /** Used to name the downloaded files. */
  rollName: string;
  onProgress?: (progress: ExportProgress) => void;
}

/** Where the photos went: the photo library (app), a zip download, or the iOS share sheet (web). */
export type ExportVia = 'library' | 'zip' | 'share';
export type SaveOutcome = 'saved' | 'cancelled';

export interface ExportResult {
  saved: number;
  failed: number;
  via: ExportVia;
  /**
   * iPhone/iPad web only: opens the share sheet so the user can pick "Save Images".
   * Must be called straight from a tap, because Safari only opens the sheet then.
   */
  saveToPhotos?: () => Promise<SaveOutcome>;
}

/**
 * Runs `worker` over every item, at most `concurrency` at a time, reporting progress as
 * each one settles. A failed item becomes `null` and its error is collected, so one bad
 * photo doesn't stop the rest of the roll.
 */
export async function mapWithProgress<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  { concurrency, onProgress }: { concurrency: number; onProgress?: (progress: ExportProgress) => void }
): Promise<{ results: (R | null)[]; errors: unknown[] }> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  const errors: unknown[] = [];
  let next = 0;
  let done = 0;

  async function lane() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        errors.push(error);
      }
      done += 1;
      onProgress?.({ done, total: items.length });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return { results, errors };
}

/** ASCII slug of the roll name, e.g. "Our Anniversary!" -> "our-anniversary". */
function slug(rollName: string): string {
  const value = rollName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return value || 'ikausa';
}

/** "our-anniversary-07.jpg", zero-padded so files sort in shot order. */
export function photoFileName(rollName: string, index: number, total: number): string {
  const width = String(total).length;
  return `${slug(rollName)}-${String(index + 1).padStart(width, '0')}.jpg`;
}

/** "Our Anniversary - Ikausa.zip", without characters that aren't allowed in file names. */
export function zipFileName(rollName: string): string {
  const safe = rollName.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim();
  return `${safe || 'Roll'} - Ikausa.zip`;
}
