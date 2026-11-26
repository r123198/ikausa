import type { ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';

import { signedUrl } from '@/lib/events';

export interface PresetCover {
  id: string;
  title: string;
  src: number;
}

/**
 * Shown in this order, grouped by occasion. Ids are stored on rolls as `preset:<id>`,
 * so never reuse or remove one: 1–5 date from the old travel set and now show event photos.
 */
export const PRESET_COVERS: PresetCover[] = [
  { id: '1', title: 'Wedding Send-off', src: require('@/assets/images/occasions/wedding-3.jpg') },
  { id: '6', title: 'Bridal Party', src: require('@/assets/images/occasions/wedding-1.jpg') },
  { id: '7', title: 'Vows', src: require('@/assets/images/occasions/wedding-2.jpg') },
  { id: '2', title: 'Birthday Cake', src: require('@/assets/images/occasions/birthday-2.jpg') },
  { id: '5', title: 'Kids’ Party', src: require('@/assets/images/occasions/birthday-1.jpg') },
  { id: '8', title: 'Birthday Picnic', src: require('@/assets/images/occasions/birthday-3.jpg') },
  { id: '3', title: 'Family Dinner', src: require('@/assets/images/occasions/family-2.jpg') },
  { id: '9', title: 'Family Reunion', src: require('@/assets/images/occasions/family-1.jpg') },
  { id: '10', title: 'Garden Party', src: require('@/assets/images/occasions/family-3.jpg') },
  { id: '4', title: 'Conference', src: require('@/assets/images/occasions/business-3.jpg') },
  { id: '11', title: 'Workshop', src: require('@/assets/images/occasions/business-1.jpg') },
  { id: '12', title: 'Launch Party', src: require('@/assets/images/occasions/business-2.jpg') },
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
