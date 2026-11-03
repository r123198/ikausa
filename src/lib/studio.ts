// Studio: the invite-only web portal for organizers who run rolls for clients.
// Every rule here is enforced in the database (see the studio migration);
// these are thin wrappers that turn its error codes into readable messages.
import { supabase } from '@/lib/supabase';

export const MAX_NOTE_LENGTH = 100;
export const MAX_CLIENT_NAME_LENGTH = 60;
export const MAX_GRANT_QUANTITY = 50;

export interface OrganizerStatus {
  isOrganizer: boolean;
  isAdmin: boolean;
}

export interface OrganizerInvite {
  token: string;
  note: string | null;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface AdminOrganizer {
  userId: string;
  displayName: string;
  email: string;
  createdAt: Date;
  isAdmin: boolean;
  eventCount: number;
  /** Unused credits per pass id. */
  unusedCredits: Map<string, number>;
}

const ERRORS: Record<string, string> = {
  not_admin: 'Only Ikausa admins can do that.',
  not_owner: 'Only the organizer who created this roll can do that.',
  invite_invalid: 'This link is invalid, already used or expired. Ask for a new one.',
  not_an_organizer: 'That account isn’t an organizer.',
  not_a_paid_pass: 'Pick a paid pass.',
  invalid_quantity: `Grant between 1 and ${MAX_GRANT_QUANTITY} credits at a time.`,
  not_authenticated: 'Sign in first.',
};

function studioError(error: { message: string }): Error {
  const code = Object.keys(ERRORS).find((key) => error.message.includes(key));
  return new Error(code ? ERRORS[code] : error.message);
}

/** The web app's own origin, for links organizers copy and send. */
function appOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

export function organizerInviteUrl(token: string): string {
  return `${appOrigin()}/studio/invite/${token}`;
}

export function hostInviteUrl(token: string): string {
  return `${appOrigin()}/host/${token}`;
}

/** RLS returns only the caller's own organizer row. */
export async function fetchOrganizerStatus(userId: string): Promise<OrganizerStatus> {
  const { data, error } = await supabase
    .from('organizers')
    .select('is_admin')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { isOrganizer: data !== null, isAdmin: data?.is_admin ?? false };
}

export async function redeemOrganizerInvite(token: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_organizer_invite', { invite_token: token });
  if (error) throw studioError(error);
}

/* Admin --------------------------------------------------------------- */

export async function createOrganizerInvite(note: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_organizer_invite', { invite_note: note });
  if (error) throw studioError(error);
  return data as string;
}

export async function fetchOrganizerInvites(): Promise<OrganizerInvite[]> {
  const { data, error } = await supabase
    .from('organizer_invites')
    .select('token, note, created_at, expires_at, used_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    token: row.token,
    note: row.note,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
  }));
}

interface AdminOrganizerRow {
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  event_count: number;
  unused_credits: Record<string, number>;
}

export async function fetchAdminOrganizers(): Promise<AdminOrganizer[]> {
  const { data, error } = await supabase.rpc('admin_organizers');
  if (error) throw studioError(error);
  return (data as AdminOrganizerRow[]).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    createdAt: new Date(row.created_at),
    isAdmin: row.is_admin,
    eventCount: row.event_count,
    unusedCredits: new Map(Object.entries(row.unused_credits)),
  }));
}

export async function grantPassCredits(
  organizerId: string,
  passId: string,
  quantity: number,
  note: string
): Promise<void> {
  const { error } = await supabase.rpc('grant_pass_credits', {
    organizer_id: organizerId,
    grant_pass_id: passId,
    quantity,
    grant_note: note,
  });
  if (error) throw studioError(error);
}

/* Clients ------------------------------------------------------------- */

export async function updateClientName(eventId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (trimmed.length > MAX_CLIENT_NAME_LENGTH) {
    throw new Error(`Keep it under ${MAX_CLIENT_NAME_LENGTH} characters.`);
  }
  const { error } = await supabase
    .from('events')
    .update({ client_name: trimmed || null })
    .eq('id', eventId);
  if (error) throw error;
}

export async function createHostInvite(eventId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_host_invite', { eid: eventId });
  if (error) throw studioError(error);
  return data as string;
}

/** The roll's name, or null when the link is invalid, used or expired. Works signed out. */
export async function fetchHostInvitePreview(token: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('host_invite_preview', { invite_token: token });
  if (error) throw studioError(error);
  return (data as string | null) ?? null;
}

/** Makes the caller a co-host and returns the roll's id. */
export async function redeemHostInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_host_invite', { invite_token: token });
  if (error) throw studioError(error);
  return data as string;
}

export interface HostInvite {
  token: string;
  createdAt: Date;
  usedAt: Date | null;
}

/** Host links for one of the caller's own rolls, newest first. */
export async function fetchHostInvites(eventId: string): Promise<HostInvite[]> {
  const { data, error } = await supabase
    .from('host_invites')
    .select('token, created_at, used_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    token: row.token,
    createdAt: new Date(row.created_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
  }));
}
