// Turns RevenueCat purchase events into pass credits.
// Configure the same secret as REVENUECAT_WEBHOOK_SECRET here and as the
// webhook's Authorization header value in the RevenueCat dashboard.
import { createClient } from 'npm:@supabase/supabase-js@2';

interface RevenueCatEvent {
  id: string;
  type: string;
  app_user_id: string;
  original_app_user_id: string;
  aliases?: string[];
  product_id: string;
  transaction_id: string;
  environment: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

/** The app logs users into RevenueCat with their Supabase user id. */
function supabaseUserId(event: RevenueCatEvent): string | null {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  return candidates.find((id) => UUID_PATTERN.test(id)) ?? null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function grantCredit(event: RevenueCatEvent): Promise<Response> {
  const userId = supabaseUserId(event);
  if (!userId) {
    console.error('Purchase without a Supabase user id', event.id);
    return json({ ignored: 'no_user' });
  }

  const { data: pass, error: passError } = await supabase
    .from('passes')
    .select('id')
    .eq('revenuecat_product_id', event.product_id)
    .maybeSingle();
  if (passError) throw passError;
  if (!pass) {
    console.error('Unknown product', event.product_id);
    return json({ ignored: 'unknown_product' });
  }

  // store_transaction_id is unique, so webhook retries can't double-grant.
  const { error } = await supabase.from('pass_credits').upsert(
    { user_id: userId, pass_id: pass.id, store_transaction_id: event.transaction_id },
    { onConflict: 'store_transaction_id', ignoreDuplicates: true }
  );
  if (error) throw error;
  return json({ granted: pass.id });
}

async function revokeCredit(event: RevenueCatEvent): Promise<Response> {
  const { error } = await supabase
    .from('pass_credits')
    .update({ revoked_at: new Date().toISOString() })
    .eq('store_transaction_id', event.transaction_id)
    .is('revoked_at', null);
  if (error) throw error;
  return json({ revoked: event.transaction_id });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const auth = req.headers.get('Authorization') ?? '';
  if (!secret || !timingSafeEqual(auth, secret)) return json({ error: 'unauthorized' }, 401);

  let event: RevenueCatEvent;
  try {
    ({ event } = await req.json());
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  try {
    switch (event.type) {
      case 'NON_RENEWING_PURCHASE':
        return await grantCredit(event);
      case 'CANCELLATION':
        // Refunds of one-time purchases arrive as cancellations.
        return await revokeCredit(event);
      default:
        return json({ ignored: event.type });
    }
  } catch (error) {
    // Non-2xx makes RevenueCat retry later.
    console.error('Webhook failed', event.id, error);
    return json({ error: 'internal' }, 500);
  }
});
