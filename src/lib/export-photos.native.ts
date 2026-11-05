// Native modules are imported statically: a lazy `import()` in a dev build fetches a
// separate bundle from Metro and fails with "Could not load bundle" when it's unreachable.
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import type { Photo } from '@/lib/events';
import {
  EXPORT_MESSAGES,
  ExportError,
  mapWithProgress,
  photoFileName,
  prepareUrls,
  type ExportOptions,
  type ExportResult,
} from '@/lib/export-common';

export { exportErrorMessage } from '@/lib/export-common';

/** A few at a time: quicker than one by one without flooding the photo library. */
const SAVE_CONCURRENCY = 3;

/** Saves every photo to the camera roll after a single permission prompt. */
export async function exportPhotos(
  photos: Photo[],
  { rollName, onProgress }: ExportOptions
): Promise<ExportResult> {
  if (photos.length === 0) return { saved: 0, failed: 0, via: 'library' };
  const urls = await prepareUrls(photos);

  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) throw new ExportError(EXPORT_MESSAGES.permission);

  const folder = new Directory(Paths.cache, 'export');
  folder.create({ idempotent: true });
  const total = urls.length;
  onProgress?.({ done: 0, total });

  const { results, errors } = await mapWithProgress(
    urls,
    (url, index) => savePhoto(url, new File(folder, photoFileName(rollName, index, total))),
    { concurrency: SAVE_CONCURRENCY, onProgress }
  );
  const saved = results.filter((result) => result !== null).length;
  if (saved === 0) {
    throw errors[0] instanceof ExportError ? errors[0] : new ExportError(EXPORT_MESSAGES.save);
  }
  return { saved, failed: total - saved, via: 'library' };
}

async function savePhoto(url: string, destination: File): Promise<true> {
  let file: File;
  try {
    file = await File.downloadFileAsync(url, destination, { idempotent: true });
  } catch (e) {
    console.error('Could not download photo for export', e);
    throw new ExportError(EXPORT_MESSAGES.download);
  }
  try {
    await MediaLibrary.Asset.create(file.uri);
    return true;
  } catch (e) {
    console.error('Could not save photo to library', e);
    throw new ExportError(EXPORT_MESSAGES.save);
  } finally {
    file.delete();
  }
}
