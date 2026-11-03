import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { fetchHostInvitePreview, redeemHostInvite } from '@/lib/studio';

/** Where a client lands from the host link their organizer sent: becomes a co-host. */
export default function HostInviteScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const {
    data: rollName,
    error,
    isLoading,
    reload,
  } = useFocusedAsync(() => fetchHostInvitePreview(token), [token]);

  if (rollName === undefined && isLoading) return <LoadingState />;
  if (rollName === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (rollName === null) {
    return (
      <ErrorState
        message="This host link was already used or has expired. Ask your organizer for a new one."
        onRetry={reload}
      />
    );
  }

  async function handleAccept() {
    if (!session) {
      router.push({ pathname: '/sign-in', params: { next: `/host/${encodeURIComponent(token)}` } });
      return;
    }
    setIsAccepting(true);
    setAcceptError(null);
    try {
      const eventId = await redeemHostInvite(token);
      router.replace(`/roll/${eventId}`);
    } catch (e) {
      setAcceptError(errorMessage(e));
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Logo size={56} />
        <Text style={styles.eyebrow}>You’re a host</Text>
        <Text style={styles.title}>{rollName}</Text>
        <Text style={styles.text}>
          Your organizer set up this roll for you. As a co-host you’ll see every photo your guests
          take once they develop, and you can download the whole album.
        </Text>
        {acceptError && <Text style={styles.error}>{acceptError}</Text>}
        <Button
          label={session ? 'Open my roll' : 'Sign in or create an account'}
          isLoading={isAccepting}
          onPress={handleAccept}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.background },
  card: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    gap: 14,
    padding: 36,
    borderRadius: 28,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  eyebrow: { ...T.eyebrow, color: C.primary },
  title: { ...T.title, fontSize: 34, lineHeight: 42, textAlign: 'center' },
  text: { ...T.bodyMd, color: C.textSoft, textAlign: 'center' },
  error: { ...T.caption, fontSize: 14, color: C.error, textAlign: 'center' },
});
