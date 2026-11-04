import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { useStudio } from '@/components/studio/studio-context';
import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage } from '@/hooks/use-async';
import { redeemOrganizerInvite } from '@/lib/studio';

/** Where a new organizer lands from the one-time link an admin sent them. */
export default function OrganizerInviteScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session } = useAuth();
  const { status, reloadStatus } = useStudio();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!session) {
      router.push({ pathname: '/sign-in', params: { next: `/studio/invite/${encodeURIComponent(token)}` } });
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      await redeemOrganizerInvite(token);
      // Wait for the new status so the layout's invite-only gate doesn't flash.
      await reloadStatus();
      router.replace('/studio');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Logo size={56} />
        <Text style={styles.eyebrow}>You’re invited</Text>
        <Text style={styles.title}>Join Ikausa Studio</Text>
        <Text style={styles.text}>
          Run shared film rolls for your clients: create events, hand them a QR code for their
          guests, and pass the finished album to the celebrants.
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {status.isOrganizer ? (
          <Button label="Go to Studio" onPress={() => router.replace('/studio')} />
        ) : (
          <Button
            label={session ? 'Accept invite' : 'Sign in or create an account'}
            isLoading={isJoining}
            onPress={handleJoin}
          />
        )}
        {session && !status.isOrganizer && (
          <Text style={styles.note}>Signed in as {session.user.email}</Text>
        )}
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
  note: { ...T.caption, fontSize: 13 },
  error: { ...T.caption, fontSize: 14, color: C.error, textAlign: 'center' },
});
