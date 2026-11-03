import { Redirect, useGlobalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { errorMessage } from '@/hooks/use-async';
import { exchangeCodeFromUrl } from '@/lib/oauth';

/**
 * Where the OAuth provider sends the user back. On web this page finishes the sign-in.
 * On the phone the auth sheet already did, so it just returns to the app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ code?: string; error_description?: string }>();
  const [status, setStatus] = useState<'working' | 'done' | 'failed'>('working');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    exchangeCodeFromUrl(window.location.href)
      .then(() => setStatus('done'))
      .catch((e: unknown) => {
        setError(errorMessage(e));
        setStatus('failed');
      });
  }, [params.code]);

  if (Platform.OS !== 'web' || status === 'done') return <Redirect href="/" />;
  if (status === 'failed') {
    return <ErrorState message={error ?? 'Sign-in failed.'} onRetry={() => router.replace('/sign-in')} />;
  }
  return <LoadingState />;
}
