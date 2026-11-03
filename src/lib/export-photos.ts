// Web: trigger a browser download per photo. The phone uses export-photos.native.ts.
import type { Photo } from '@/lib/events';
import { prepareUrls } from '@/lib/export-common';

export { exportErrorMessage } from '@/lib/export-common';

export async function exportPhotos(photos: Photo[]): Promise<number> {
  if (photos.length === 0) return 0;
  const urls = await prepareUrls(photos);
  for (const url of urls) {
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener';
    link.click();
  }
  return urls.length;
}
