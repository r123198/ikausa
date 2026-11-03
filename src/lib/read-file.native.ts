import { File } from 'expo-file-system';

/** Reads a local file: URI. Static import, so no lazy bundle fetch on dev builds. */
export function readFileBytes(uri: string): Promise<ArrayBuffer> {
  return new File(uri).arrayBuffer();
}
