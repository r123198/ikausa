import { supabase } from '@/lib/supabase';

const MEDIA_BUCKET = 'event-media';
const SIGNED_URL_TTL_SECONDS = 60 * 60;
/** Mirrors the bucket's file_size_limit. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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
  memberCount: number;
  myShotCount: number;
  photoCount: number;
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
  member_count: number;
  my_shot_count: number;
  photo_count: number;
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
    memberCount: row.member_count,
    myShotCount: row.my_shot_count,
    photoCount: row.photo_count,
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
  /** False when a custom cover was chosen but couldn't be uploaded. */
  coverUploaded: boolean;
}

export async function createEvent(input: NewEventInput): Promise<CreatedEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      ends_at: input.endsAt.toISOString(),
      reveal_option: input.revealOption,
      export_days: input.exportDays,
      max_participants: input.maxParticipants,
      shots_per_person: input.shotsPerPerson,
      everyone_can_see: input.everyoneCanSee,
      camera_id: input.cameraId,
      cover: input.cover.kind === 'preset' ? `preset:${input.cover.id}` : null,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (input.cover.kind === 'uri') {
    // The event exists either way; a failed cover upload leaves it without one.
    try {
      const path = `${data.id}/cover/${randomId()}.jpg`;
      await uploadImage(path, input.cover.uri);
      const { error: updateError } = await supabase
        .from('events')
        .update({ cover: path })
        .eq('id', data.id);
      if (updateError) throw updateError;
    } catch (coverError) {
      console.error('Cover upload failed', coverError);
      return { id: data.id, coverUploaded: false };
    }
  }

  return { id: data.id, coverUploaded: true };
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

export type JoinFailure = 'event_not_found' | 'event_ended' | 'event_full';

export class JoinError extends Error {
  constructor(public readonly reason: JoinFailure) {
    super(reason);
  }
}

export async function joinEvent(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_event', { code });
  if (error) {
    const reason = (['event_not_found', 'event_ended', 'event_full'] as const).find((r) =>
      error.message.includes(r)
    );
    if (reason) throw new JoinError(reason);
    throw error;
  }
  return data as string;
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

export interface Photo {
  id: string;
  path: string;
  url: string;
  authorName: string;
  createdAt: Date;
}

export async function fetchPhotos(eventId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, storage_path, created_at, profiles(display_name)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (data.length === 0) return [];

  const urls = await signedUrls(data.map((p) => p.storage_path));
  return data.map((p) => ({
    id: p.id,
    path: p.storage_path,
    url: urls.get(p.storage_path) ?? '',
    authorName:
      (p.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Someone',
    createdAt: new Date(p.created_at),
  }));
}

export async function uploadPhoto(eventId: string, userId: string, uri: string): Promise<void> {
  const path = `${eventId}/photos/${userId}/${randomId()}.jpg`;
  await uploadImage(path, uri);
  const { error } = await supabase.from('photos').insert({ event_id: eventId, storage_path: path });
  if (error) throw error;
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

async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return new Map(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])));
}

async function uploadImage(path: string, uri: string): Promise<void> {
  const body = await readBytes(uri);
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
}

async function readBytes(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith('file:')) {
    const { File } = await import('expo-file-system');
    return new File(uri).arrayBuffer();
  }
  // data: and http(s): URIs (web capture, pasted links).
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read image (${response.status})`);
  if (!response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error('That link is not an image.');
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('Image is larger than 10 MB.');
  return bytes;
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
