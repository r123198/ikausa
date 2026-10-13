import { developPhoto } from '@/lib/film/develop';
import { randomId, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const MEDIA_BUCKET = 'event-media';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type RevealOption = 'during' | 'after' | 'delay';
export type ExportDays = 7 | 30 | 90;

/**
 * live       – still shooting (camera + invite available)
 * developing – ended, photos not revealed yet
 * ready      – revealed and still inside the export window
 * expired    – export window has closed
 */
export type EventPhase = 'live' | 'developing' | 'ready' | 'expired';

export interface EventSummary {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
  endsAt: Date;
  revealAt: Date;
  exportUntil: Date;
  maxParticipants: number | null;
  shotsPerPerson: number | null;
  cameraId: string;
  cover: string | null;
  createdAt: Date;
  everyoneCanSee: boolean;
  memberCount: number;
  myShotCount: number;
  photoCount: number;
  /** Storage paths of up to 4 recent photos the user can see. */
  previewPaths: string[];
}

interface EventRow {
  id: string;
  owner_id: string;
  name: string;
  invite_code: string;
  ends_at: string;
  reveal_at: string;
  export_until: string;
  max_participants: number | null;
  shots_per_person: number | null;
  camera_id: string;
  cover: string | null;
  created_at: string;
  everyone_can_see: boolean;
  member_count: number;
  my_shot_count: number;
  photo_count: number;
  preview_paths: string[] | null;
}

function toEvent(row: EventRow): EventSummary {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    inviteCode: row.invite_code,
    endsAt: new Date(row.ends_at),
    revealAt: new Date(row.reveal_at),
    exportUntil: new Date(row.export_until),
    maxParticipants: row.max_participants,
    shotsPerPerson: row.shots_per_person,
    cameraId: row.camera_id,
    cover: row.cover,
    createdAt: new Date(row.created_at),
    everyoneCanSee: row.everyone_can_see,
    memberCount: row.member_count,
    myShotCount: row.my_shot_count,
    photoCount: row.photo_count,
    previewPaths: row.preview_paths ?? [],
  };
}

export function eventPhase(event: EventSummary, now: Date = new Date()): EventPhase {
  if (now < event.endsAt) return 'live';
  if (now < event.revealAt) return 'developing';
  if (now < event.exportUntil) return 'ready';
  return 'expired';
}

/** Shots the current user has left, or null when unlimited. */
export function shotsLeft(event: EventSummary): number | null {
  if (event.shotsPerPerson === null) return null;
  return Math.max(0, event.shotsPerPerson - event.myShotCount);
}

export async function fetchMyEvents(): Promise<EventSummary[]> {
  const { data, error } = await supabase.rpc('my_events');
  if (error) throw error;
  return (data as EventRow[]).map(toEvent);
}

export async function fetchEvent(id: string): Promise<EventSummary | null> {
  const { data, error } = await supabase.rpc('my_events').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toEvent(data as EventRow) : null;
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export interface NewEventInput {
  name: string;
  passId: string;
  endsAt: Date;
  revealOption: RevealOption;
  exportDays: ExportDays;
  maxParticipants: number | null;
  shotsPerPerson: number | null;
  everyoneCanSee: boolean;
  cameraId: string;
  /** Preset id, or a local/remote image uri to upload. */
  cover: { kind: 'preset'; id: string } | { kind: 'uri'; uri: string };
}

export interface CreatedEvent {
  id: string;
  inviteCode: string;
  /** False when a custom cover was chosen but couldn't be uploaded. */
  coverUploaded: boolean;
}

export async function createEvent(input: NewEventInput): Promise<CreatedEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      pass_id: input.passId,
      ends_at: input.endsAt.toISOString(),
      reveal_option: input.revealOption,
      export_days: input.exportDays,
      max_participants: input.maxParticipants,
      shots_per_person: input.shotsPerPerson,
      everyone_can_see: input.everyoneCanSee,
      camera_id: input.cameraId,
      cover: input.cover.kind === 'preset' ? `preset:${input.cover.id}` : null,
    })
    .select('id, invite_code')
    .single();
  if (error) throw new Error(createEventErrorMessage(error.message));

  if (input.cover.kind === 'uri') {
    // The event exists either way; a failed cover upload leaves it without one.
    try {
      const path = `${data.id}/cover/${randomId()}.jpg`;
      await uploadImage(MEDIA_BUCKET, path, input.cover.uri);
      const { error: updateError } = await supabase
        .from('events')
        .update({ cover: path })
        .eq('id', data.id);
      if (updateError) throw updateError;
    } catch (coverError) {
      console.error('Cover upload failed', coverError);
      return { id: data.id, inviteCode: data.invite_code, coverUploaded: false };
    }
  }

  return { id: data.id, inviteCode: data.invite_code, coverUploaded: true };
}

const CREATE_ERRORS: Record<string, string> = {
  pass_required: 'This plan needs a pass. Buy one first, then start the roll.',
  pass_limit_participants: 'Too many participants for this plan.',
  pass_limit_shots: 'Too many shots per person for this plan.',
  unknown_pass: 'That plan is no longer available.',
};

function createEventErrorMessage(message: string): string {
  const code = Object.keys(CREATE_ERRORS).find((key) => message.includes(key));
  return code ? CREATE_ERRORS[code] : message;
}

/* ------------------------------------------------------------------ */
/* Join                                                                */
/* ------------------------------------------------------------------ */

export interface EventPreview {
  name: string;
  endsAt: Date;
  cover: string | null;
  hostName: string;
  memberCount: number;
  maxParticipants: number | null;
  shotsPerPerson: number | null;
}

export async function fetchEventPreview(code: string): Promise<EventPreview | null> {
  const { data, error } = await supabase.rpc('get_event_preview', { code }).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    name: string;
    ends_at: string;
    cover: string | null;
    host_name: string;
    member_count: number;
    max_participants: number | null;
    shots_per_person: number | null;
  };
  return {
    name: row.name,
    endsAt: new Date(row.ends_at),
    cover: row.cover,
    hostName: row.host_name,
    memberCount: row.member_count,
    maxParticipants: row.max_participants,
    shotsPerPerson: row.shots_per_person,
  };
}

export type JoinFailure = 'event_not_found' | 'event_ended' | 'event_full' | 'too_many_attempts';

export class JoinError extends Error {
  constructor(public readonly reason: JoinFailure) {
    super(reason);
  }
}

export async function joinEvent(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_event', { code });
  if (error) {
    const reason = (['event_ended', 'event_full', 'too_many_attempts'] as const).find((r) =>
      error.message.includes(r)
    );
    if (reason) throw new JoinError(reason);
    throw error;
  }
  // Unknown codes return null so the server can count the failed attempt.
  if (!data) throw new JoinError('event_not_found');
  return data as string;
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

export interface Photo {
  id: string;
  userId: string;
  path: string;
  url: string;
  authorName: string;
  createdAt: Date;
}

export async function fetchPhotos(eventId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, user_id, storage_path, created_at, profiles(display_name)')
    .eq('event_id', eventId)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (data.length === 0) return [];

  const urls = await signedUrls(data.map((p) => p.storage_path));
  return data.map((p) => ({
    id: p.id,
    userId: p.user_id,
    path: p.storage_path,
    url: urls.get(p.storage_path) ?? '',
    authorName:
      (p.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Someone',
    createdAt: new Date(p.created_at),
  }));
}

/** Develops with the roll's look; falls back to the untouched shot if that fails. */
async function developOrNull(uri: string, filmId: string): Promise<string | null> {
  try {
    return await developPhoto(uri, filmId);
  } catch (error) {
    console.error('Developing failed, keeping the original', error);
    return null;
  }
}

/**
 * Develop the shot with the roll's film look, reserve it (enforces the shot
 * limit), upload the original and developed files, then mark it ready.
 * A failed upload releases the reservation.
 */
export async function uploadPhoto(
  eventId: string,
  userId: string,
  uri: string,
  filmId: string
): Promise<void> {
  const base = `${eventId}/photos/${userId}/${randomId()}`;
  const developedUri = await developOrNull(uri, filmId);
  const path = `${base}.jpg`;
  const originalPath = developedUri ? `${base}-original.jpg` : null;

  const { data: reserved, error: reserveError } = await supabase
    .from('photos')
    .insert({ event_id: eventId, storage_path: path, original_path: originalPath })
    .select('id')
    .single();
  if (reserveError) throw reserveError;

  try {
    if (originalPath) await uploadImage(MEDIA_BUCKET, originalPath, uri);
    await uploadImage(MEDIA_BUCKET, path, developedUri ?? uri);
  } catch (error) {
    // Nothing was stored, so release the shot right away.
    const { error: cancelError } = await supabase.from('photos').delete().eq('id', reserved.id);
    if (cancelError) console.error('Could not release reserved shot', cancelError);
    throw error;
  }

  // If this fails the row stays pending; the scheduled cleanup removes the row and file.
  const { error: readyError } = await supabase.rpc('mark_photo_ready', { photo_id: reserved.id });
  if (readyError) throw readyError;
}

/** Signed URLs that make the browser download instead of display. */
export async function downloadUrls(paths: string[]): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS, { download: true });
  if (error) throw error;
  return data.flatMap((d) => (d.signedUrl ? [d.signedUrl] : []));
}

export async function signedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error('Failed to sign url', error);
    return null;
  }
  return data.signedUrl;
}

/** Signs many storage paths in one request; missing/failed paths are left out. */
export async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return new Map(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])));
}
