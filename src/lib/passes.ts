import { supabase } from '@/lib/supabase';

export interface Pass {
  id: string;
  name: string;
  maxParticipants: number | null;
  maxShotsPerPerson: number | null;
  /** Store product sold through RevenueCat; null for the free pass. */
  productId: string | null;
  displayPrice: string | null;
}

export async function fetchPasses(): Promise<Pass[]> {
  const { data, error } = await supabase
    .from('passes')
    .select('id, name, max_participants, max_shots_per_person, revenuecat_product_id, display_price')
    .order('sort');
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    maxParticipants: p.max_participants,
    maxShotsPerPerson: p.max_shots_per_person,
    productId: p.revenuecat_product_id,
    displayPrice: p.display_price,
  }));
}

export interface ShotPack {
  id: string;
  name: string;
  shots: number;
  productId: string;
  displayPrice: string | null;
}

export async function fetchShotPacks(): Promise<ShotPack[]> {
  const { data, error } = await supabase
    .from('shot_packs')
    .select('id, name, shots, revenuecat_product_id, display_price')
    .order('sort');
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    shots: p.shots,
    productId: p.revenuecat_product_id,
    displayPrice: p.display_price,
  }));
}

/** Unspent, unrevoked rows of a credit table, counted per catalog id. */
async function countUnspent(
  table: 'pass_credits' | 'shot_pack_credits',
  column: 'pass_id' | 'pack_id'
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .is('spent_at', null)
    .is('revoked_at', null);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data as Record<string, string>[]) {
    const id = row[column];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Unspent, unrevoked credits per pass id. */
export function fetchCredits(): Promise<Map<string, number>> {
  return countUnspent('pass_credits', 'pass_id');
}

/** Bought but not yet applied shot packs, per pack id. */
export function fetchShotPackCredits(): Promise<Map<string, number>> {
  return countUnspent('shot_pack_credits', 'pack_id');
}

const APPLY_ERRORS: Record<string, string> = {
  event_ended: 'This roll has ended, so no more shots can be added.',
  event_unlimited: 'This roll already has unlimited shots.',
  event_not_found: "This roll doesn't exist or you're not a member.",
  shot_pack_required: 'That pack hasn’t been confirmed yet. Try again in a minute.',
};

/** Spends one owned pack on this roll, adding its shots to the caller's limit. */
export async function applyShotPack(eventId: string, packId: string): Promise<void> {
  const { error } = await supabase.rpc('apply_shot_pack', { eid: eventId, pack: packId });
  if (!error) return;
  const code = Object.keys(APPLY_ERRORS).find((key) => error.message.includes(key));
  throw new Error(code ? APPLY_ERRORS[code] : error.message);
}

export function passSummary(pass: Pass): string {
  const people = pass.maxParticipants === null ? 'Unlimited people' : `Up to ${pass.maxParticipants} people`;
  const shots =
    pass.maxShotsPerPerson === null ? 'unlimited shots' : `up to ${pass.maxShotsPerPerson} shots each`;
  return `${people} · ${shots}`;
}
