import * as Linking from 'expo-linking';

/**
 * Link guests open to join. Set EXPO_PUBLIC_INVITE_BASE_URL (e.g. an https
 * domain with universal links) to override the app's own URL scheme.
 */
export function inviteUrl(code: string): string {
  const base = process.env.EXPO_PUBLIC_INVITE_BASE_URL;
  if (base) return `${base.replace(/\/$/, '')}/join/${code}`;
  return Linking.createURL(`/join/${code}`);
}
