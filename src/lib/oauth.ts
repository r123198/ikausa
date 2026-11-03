import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type OAuthProvider = 'google';
export type OAuthOutcome = 'signed-in' | 'cancelled' | 'redirecting';

/** Where the provider sends the user back: ikausa://auth/callback on the phone, /auth/callback on web. */
export function oauthRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

/**
 * Signs in through the provider's own page. On the phone this opens an in-app auth
 * sheet and finishes here; on web the page navigates away and /auth/callback finishes.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<OAuthOutcome> {
  const redirectTo = oauthRedirectUrl();
  const isWeb = Platform.OS === 'web';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: !isWeb,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (isWeb) return 'redirecting';
  if (!data.url) throw new Error('Could not start sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';
  await exchangeCodeFromUrl(result.url);
  return 'signed-in';
}

/** Completes the PKCE flow from the callback URL the provider redirected to. */
export async function exchangeCodeFromUrl(url: string): Promise<void> {
  const { queryParams } = Linking.parse(url);
  const code = queryParams?.code;
  const description = queryParams?.error_description;
  if (typeof description === 'string') throw new Error(description);
  if (typeof code !== 'string') throw new Error('Sign-in did not complete. Try again.');
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}
