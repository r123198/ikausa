// Scheduled cleanup (run hourly or daily):
//  1. Permanently deletes photos of rolls whose export window closed 7+ days ago.
//  2. Removes uploads that were reserved but never finished (older than 1 hour).
// Call with header `x-cron-secret: <CRON_SECRET>`.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'event-media';
const PURGE_GRACE_DAYS = 7;
const STALE_UPLOAD_MINUTES = 60;
const EVENTS_PER_RUN = 25;
const STALE_PER_RUN = 500;
const REMOVE_CHUNK = 100;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

async function removeFiles(paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += REMOVE_CHUNK) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + REMOVE_CHUNK));
    if (error) throw error;
  }
}

async function purgeExpiredRolls(): Promise<number> {
  const cutoff = new Date(Date.now() - PURGE_GRACE_DAYS * 86_400_000).toISOString();
  const { data: events, error } = await supabase
    .from('events')
    .select('id')
    .lt('export_until', cutoff)
    .is('purged_at', null)
    .limit(EVENTS_PER_RUN);
  if (error) throw error;

  for (const { id } of events) {
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('storage_path, original_path')
      .eq('event_id', id);
    if (photosError) throw photosError;

    await removeFiles(photos.flatMap((p) => [p.storage_path, p.original_path].filter(Boolean)));
    const { error: deleteError } = await supabase.from('photos').delete().eq('event_id', id);
    if (deleteError) throw deleteError;
    const { error: markError } = await supabase
      .from('events')
      .update({ purged_at: new Date().toISOString() })
      .eq('id', id);
    if (markError) throw markError;
  }
  return events.length;
}

async function purgeStaleUploads(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_UPLOAD_MINUTES * 60_000).toISOString();
  const { data: stale, error } = await supabase
    .from('photos')
    .select('id, storage_path, original_path')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .limit(STALE_PER_RUN);
  if (error) throw error;
  if (stale.length === 0) return 0;

  // Removing a path that was never uploaded is a no-op.
  await removeFiles(stale.flatMap((p) => [p.storage_path, p.original_path].filter(Boolean)));
  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .in('id', stale.map((p) => p.id));
  if (deleteError) throw deleteError;
  return stale.length;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('unauthorized', { status: 401 });
  }
  try {
    const rolls = await purgeExpiredRolls();
    const uploads = await purgeStaleUploads();
    return Response.json({ purgedRolls: rolls, removedStaleUploads: uploads });
  } catch (error) {
    console.error('Purge failed', error);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
});
