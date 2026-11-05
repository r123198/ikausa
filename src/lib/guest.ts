import { MAX_NAME_LENGTH } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

/**
 * Guests join a roll from an invite link with just a name. They use a Supabase anonymous
 * sign-in: a real user id with no email or password, kept on this device only.
 * The database lets them join and shoot but not start rolls (migration *_guest_participants).
 */
export const GUEST_MESSAGES = {
  noName: 'Enter your name so others know who took each photo.',
  tooLong: `Keep it under ${MAX_NAME_LENGTH} characters.`,
  disabled: 'Joining as a guest isn’t available right now. Sign in to join.',
  rateLimited: 'Too many people joined from this network just now. Try again in a minute.',
  unknown: 'Couldn’t join as a guest. Try again.',
} as const;

export function validateGuestName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return GUEST_MESSAGES.noName;
  if (trimmed.length > MAX_NAME_LENGTH) return GUEST_MESSAGES.tooLong;
  return null;
}

export async function startGuestSession(name: string): Promise<void> {
  const problem = validateGuestName(name);
  if (problem) throw new Error(problem);

  const { error } = await supabase.auth.signInAnonymously({
    options: { data: { display_name: name.trim() } },
  });
  if (!error) return;

  console.error('Guest sign-in failed', error);
  if (/anonymous sign-ins are disabled/i.test(error.message)) throw new Error(GUEST_MESSAGES.disabled);
  if (error.status === 429 || /rate limit/i.test(error.message)) throw new Error(GUEST_MESSAGES.rateLimited);
  throw new Error(GUEST_MESSAGES.unknown);
}

/** True for a guest (anonymous) session; false when signed out or signed in with an account. */
export function isGuestSession(session: { user: { is_anonymous?: boolean } } | null): boolean {
  return session?.user.is_anonymous === true;
}
