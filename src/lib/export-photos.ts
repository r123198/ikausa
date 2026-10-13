import { Platform } from 'react-native';

import { downloadUrls, type Photo } from '@/lib/events';

export class ExportPermissionError extends Error {
  constructor() {
    super('Allow photo library access to save the roll.');
  }
}

/** Saves every photo to the device (camera roll on native, downloads on web). */
export async function exportPhotos(photos: Photo[]): Promise<number> {
  if (photos.length === 0) return 0;
  const urls = await downloadUrls(photos.map((p) => p.path));
  if (urls.length < photos.length) {
    throw new Error(`Only ${urls.length} of ${photos.length} photos could be prepared. Try again.`);
  }

  if (Platform.OS === 'web') {
    for (const url of urls) {
      const link = document.createElement('a');
      link.href = url;
      link.rel = 'noopener';
      link.click();
    }
    return urls.length;
  }

  const MediaLibrary = await import('expo-media-library');
  const { Directory, File, Paths } = await import('expo-file-system');

  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) throw new ExportPermissionError();

  const folder = new Directory(Paths.cache, 'export');
  folder.create({ idempotent: true });

  let saved = 0;
  for (const [index, url] of urls.entries()) {
    const file = await File.downloadFileAsync(url, new File(folder, `photo-${index}.jpg`), {
      idempotent: true,
    });
    try {
      await MediaLibrary.Asset.create(file.uri);
      saved += 1;
    } finally {
      file.delete();
    }
  }
  return saved;
}
