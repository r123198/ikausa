import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { RollHero } from '@/components/roll-hero';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { fetchEventPreview, JoinError, joinEvent } from '@/lib/events';
import { timeUntil } from '@/lib/format';

export default function JoinScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { session } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const {
    data: preview,
    error,
    isLoading,
    reload,
  } = useFocusedAsync(() => fetchEventPreview(code), [code]);

  if (preview === undefined && isLoading) return <LoadingState />;
  if (preview === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (preview === null) {
    return (
      <ErrorState
        message={`No roll found for code ${code.toUpperCase()}. Check the link and try again.`}
        onRetry={reload}
      />
    );
  }

  const hasEnded = preview.endsAt <= new Date();
  const isFull =
    preview.maxParticipants !== null && preview.memberCount >= preview.maxParticipants;

  async function handleJoin() {
    if (!session) {
      router.push({ pathname: '/sign-in', params: { next: `/join/${encodeURIComponent(code)}` } });
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const eventId = await joinEvent(code);
      router.replace(`/roll/${eventId}`);
    } catch (e) {
      if (e instanceof JoinError && e.reason === 'event_full') {
        router.replace({ pathname: '/join/limit-reached', params: { name: preview!.name } });
        return;
      }
      setJoinError(
        e instanceof JoinError && e.reason === 'event_ended'
          ? 'This roll has already ended.'
          : errorMessage(e)
      );
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <RollHero
          cover={preview.cover}
          eyebrow={`Invited by ${preview.hostName}`}
          title={preview.name}
          stats={[
            {
              value: preview.shotsPerPerson === null ? '∞' : String(preview.shotsPerPerson),
              label: 'Shots each',
            },
            { value: hasEnded ? 'Ended' : timeUntil(preview.endsAt), label: 'Left' },
            {
              value:
                preview.maxParticipants === null
                  ? String(preview.memberCount)
                  : `${preview.memberCount}/${preview.maxParticipants}`,
              label: 'People',
            },
          ]}
        />

        <SafeAreaView edges={['bottom']} style={styles.actions}>
        {joinError && <Text style={styles.error}>{joinError}</Text>}
        {hasEnded && (
          <Text style={styles.message}>
            This roll has ended. If you were part of it, you can still open it.
          </Text>
        )}
        {!(hasEnded && !session) && (
          <Button
            label={session ? (hasEnded || isFull ? 'Open roll' : 'Join roll') : 'Sign in to join'}
            isLoading={isJoining}
            icon={<Icon ios="camera.fill" material="photo_camera" size={20} color={C.onPrimary} />}
            onPress={handleJoin}
          />
        )}
        {!session && !hasEnded && (
          <Text style={styles.message}>You'll need a free account to shoot on this roll.</Text>
        )}
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scroll: { flexGrow: 1 },
  actions: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, gap: 12 },
  message: { ...T.caption, fontSize: 14, textAlign: 'center' },
  error: { ...T.caption, fontSize: 14, color: C.error, textAlign: 'center' },
});
