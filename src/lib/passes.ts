import { supabase } from '@/lib/supabase';

export interface Pass {
  id: string;
  name: string;
  maxParticipants: number | null;
  maxShotsPerPerson: number | null;
  /** Store product sold through RevenueCat; null for the free pass. */
  productId: string | null;
  displayPrice: string | null;
  /** Retired passes can still be spent by hosts holding a credit, but aren't sold. */
  isActive: boolean;
}

/** All passes, retired ones included; filter on `isActive` for what's on sale. */
export async function fetchPasses(): Promise<Pass[]> {
  const { data, error } = await supabase
    .from('passes')
    .select('id, name, max_participants, max_shots_per_person, revenuecat_product_id, display_price, is_active')
    .order('sort');
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    maxParticipants: p.max_participants,
    maxShotsPerPerson: p.max_shots_per_person,
    productId: p.revenuecat_product_id,
    displayPrice: p.display_price,
    isActive: p.is_active,
  }));
}

/** Unspent, unrevoked credits per pass id. */
export async function fetchCredits(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('pass_credits')
    .select('pass_id')
    .is('spent_at', null)
    .is('revoked_at', null);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const { pass_id: id } of data) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function passSummary(pass: Pass): string {
  const people = pass.maxParticipants === null ? 'Unlimited people' : `Up to ${pass.maxParticipants} people`;
  const shots =
    pass.maxShotsPerPerson === null ? 'unlimited shots' : `up to ${pass.maxShotsPerPerson} shots each`;
  return `${people} · ${shots}`;
}
