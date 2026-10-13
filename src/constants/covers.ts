import type { ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';

import { signedUrl } from '@/lib/events';

export interface PresetCover {
  id: string;
  title: string;
  src: number;
}

export const PRESET_COVERS: PresetCover[] = [
  { id: '1', title: 'Beach Gathering', src: require('@/assets/images/samples/trvl_4.jpg') },
  { id: '2', title: 'Lake Boat', src: require('@/assets/images/samples/trvl_1.jpg') },
  { id: '3', title: 'Sunset Plane', src: require('@/assets/images/samples/trvl_2.jpg') },
  { id: '4', title: 'Mountain Lake', src: require('@/assets/images/samples/trvl_3.jpg') },
  { id: '5', title: 'Coastal View', src: require('@/assets/images/samples/trvl_5.jpg') },
];

const PRESET_PREFIX = 'preset:';

function presetSource(cover: string): number | null {
  const id = cover.slice(PRESET_PREFIX.length);
  return PRESET_COVERS.find((p) => p.id === id)?.src ?? null;
}

/** Resolves an event's stored `cover` value into something <Image> can render. */
export function useCoverSource(cover: string | null): ImageSource | number | null {
  const isPreset = cover?.startsWith(PRESET_PREFIX) ?? false;
  // Keyed by cover so a stale URL is never shown for a different cover.
  const [remote, setRemote] = useState<{ cover: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!cover || isPreset) return;
    let isCurrent = true;
    signedUrl(cover).then((url) => {
      if (isCurrent) setRemote({ cover, url });
    });
    return () => {
      isCurrent = false;
    };
  }, [cover, isPreset]);

  if (!cover) return null;
  if (isPreset) return presetSource(cover);
  return remote?.cover === cover && remote.url ? { uri: remote.url } : null;
}
