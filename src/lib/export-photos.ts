// Web: trigger a browser download per photo. The phone uses export-photos.native.ts.
import type { Photo } from '@/lib/events';
import { prepareUrls } from '@/lib/export-common';

export { exportErrorMessage } from '@/lib/export-common';

/** Browsers drop or block downloads started in the same instant, so space them out. */
const DOWNLOAD_GAP_MS = 300;

export async function exportPhotos(photos: Photo[]): Promise<number> {
  if (photos.length === 0) return 0;
  const urls = await prepareUrls(photos);
  for (const [index, url] of urls.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_GAP_MS));
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener';
    link.click();
  }
  return urls.length;
}
