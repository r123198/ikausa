import { supabase } from '@/lib/supabase';

/** Mirrors the largest bucket file_size_limit (event-media, 10 MB). */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Uploads a local/remote image (file:, data:, blob: or https:) as JPEG. */
export async function uploadImage(bucket: string, path: string, uri: string): Promise<void> {
  const body = await readBytes(uri);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
}

async function readBytes(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith('file:')) {
    const { File } = await import('expo-file-system');
    return new File(uri).arrayBuffer();
  }
  // data:, blob: and http(s): URIs (web capture, picked images, pasted links).
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read image (${response.status})`);
  if (!response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error('That file is not an image.');
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('Image is larger than 10 MB.');
  return bytes;
}

/** Removes files, grouped per bucket, in chunks the Storage API accepts. */
export async function removeFiles(files: { bucket: string; path: string }[]): Promise<void> {
  const CHUNK = 100;
  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of files) byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += CHUNK) {
      const { error } = await supabase.storage.from(bucket).remove(paths.slice(i, i + CHUNK));
      if (error) throw error;
    }
  }
}
