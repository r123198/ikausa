// Native modules are imported statically: a lazy `import()` in a dev build fetches a
// separate bundle from Metro and fails with "Could not load bundle" when it's unreachable.
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import type { Photo } from '@/lib/events';
import { EXPORT_MESSAGES, ExportError, prepareUrls } from '@/lib/export-common';

export { exportErrorMessage } from '@/lib/export-common';

/** Saves every photo to the camera roll. Resolves with how many were saved. */
export async function exportPhotos(photos: Photo[]): Promise<number> {
  if (photos.length === 0) return 0;
  const urls = await prepareUrls(photos);

  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) throw new ExportError(EXPORT_MESSAGES.permission);

  const folder = new Directory(Paths.cache, 'export');
  folder.create({ idempotent: true });

  let saved = 0;
  for (const [index, url] of urls.entries()) {
    const file = await downloadToCache(url, new File(folder, `photo-${index}.jpg`));
    try {
      await MediaLibrary.Asset.create(file.uri);
      saved += 1;
    } catch (e) {
      console.error('Could not save photo to library', e);
      throw new ExportError(EXPORT_MESSAGES.save);
    } finally {
      file.delete();
    }
  }
  return saved;
}

async function downloadToCache(url: string, destination: File): Promise<File> {
  try {
    return await File.downloadFileAsync(url, destination, { idempotent: true });
  } catch (e) {
    console.error('Could not download photo for export', e);
    throw new ExportError(EXPORT_MESSAGES.download);
  }
}
