import { removeFiles, randomId, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';
const AVATAR_URL_TTL_SECONDS = 60 * 60;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 40;

export interface Profile {
  id: string;
  displayName: string;
  email: string;
  avatarPath: string | null;
  avatarUrl: string | null;
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You are signed out.');
  return data.user;
}

export async function fetchMyProfile(): Promise<Profile> {
  const user = await currentUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_path')
    .eq('id', user.id)
    .single();
  if (error) throw error;

  let avatarUrl: string | null = null;
  if (data.avatar_path) {
    const { data: signed, error: signError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(data.avatar_path, AVATAR_URL_TTL_SECONDS);
    if (signError) console.error('Could not sign avatar url', signError);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return {
    id: user.id,
    displayName: data.display_name,
    email: user.email ?? '',
    avatarPath: data.avatar_path,
    avatarUrl,
  };
}

/** Updates the public profile and the session copy used for greetings. */
export async function updateDisplayName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error('Enter a name.');
  if (trimmed.length > MAX_NAME_LENGTH) throw new Error(`Keep it under ${MAX_NAME_LENGTH} characters.`);
  const user = await currentUser();

  const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', user.id);
  if (error) throw error;
  const { error: authError } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
  if (authError) throw authError;
}

/** Uploads a new photo, points the profile at it, then removes the old one. */
export async function updateAvatar(uri: string): Promise<void> {
  const user = await currentUser();
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', user.id)
    .single();
  if (readError) throw readError;

  const path = `${user.id}/${randomId()}.jpg`;
  await uploadImage(AVATAR_BUCKET, path, uri);
  const { error } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id);
  if (error) throw error;

  if (existing.avatar_path) {
    // The new photo is live either way; an old file left behind is harmless.
    await removeFiles([{ bucket: AVATAR_BUCKET, path: existing.avatar_path }]).catch((e) =>
      console.error('Could not remove old avatar', e)
    );
  }
}

export async function removeAvatar(): Promise<void> {
  const user = await currentUser();
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', user.id)
    .single();
  if (readError) throw readError;
  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', user.id);
  if (error) throw error;
  if (existing.avatar_path) await removeFiles([{ bucket: AVATAR_BUCKET, path: existing.avatar_path }]);
}

/** Checks the current password first so a borrowed, unlocked phone can't change it. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (newPassword === currentPassword) throw new Error('Choose a password you haven’t used here.');
  const user = await currentUser();
  if (!user.email) throw new Error('This account has no email to verify against.');

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw new Error('Your current password is incorrect.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Starts an email change. Supabase emails a confirmation link before it takes effect. */
export async function changeEmail(newEmail: string): Promise<void> {
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

/**
 * Permanently deletes the account: first every file it's responsible for
 * (Storage can't be cleaned up from SQL), then the user and all their data.
 */
export async function deleteAccount(): Promise<void> {
  const { data: files, error } = await supabase.rpc('my_storage_paths');
  if (error) throw error;
  await removeFiles(files as { bucket: string; path: string }[]);

  const { error: deleteError } = await supabase.rpc('delete_my_account');
  if (deleteError) throw deleteError;
  // The session's user no longer exists; clear it locally.
  await supabase.auth.signOut({ scope: 'local' });
}
