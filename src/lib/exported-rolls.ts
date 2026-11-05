import '@/lib/install-storage';

import type { ExportVia } from '@/lib/export-common';

/** Rolls saved from this device, so the roll screen can show they're already downloaded. */
export interface RollExport {
  at: Date;
  count: number;
  /** Null for records written before the destination was stored. */
  via: ExportVia | null;
}

const VIAS: readonly ExportVia[] = ['library', 'zip', 'share'];

const keyFor = (eventId: string) => `ikausa.exported.${eventId}`;

export function rollExport(eventId: string): RollExport | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(keyFor(eventId));
    if (!raw) return null;
    const { at, count, via } = JSON.parse(raw) as { at: string; count: number; via?: string };
    const date = new Date(at);
    if (Number.isNaN(date.getTime()) || typeof count !== 'number') return null;
    const knownVia = VIAS.find((value) => value === via) ?? null;
    return { at: date, count, via: knownVia };
  } catch (error) {
    console.error('Could not read export record', error);
    return null;
  }
}

export function markRollExported(
  eventId: string,
  count: number,
  via: ExportVia,
  at: Date = new Date()
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(keyFor(eventId), JSON.stringify({ at: at.toISOString(), count, via }));
  } catch (error) {
    console.error('Could not save export record', error);
  }
}
