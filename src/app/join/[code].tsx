import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { useCoverSource } from '@/constants/covers';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { fetchEventPreview, JoinError, joinEvent } from '@/lib/events';
import { pluralize, timeUntil } from '@/lib/format';

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
  const cover = useCoverSource(preview?.cover ?? null);

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
      if (e instanceof JoinError && e.reason === 'event_ended') {
        setJoinError('This roll has already ended.');
        return;
      }
      setJoinError(errorMessage(e));
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <View style={styles.safe}>
      <View style={styles.heroSection}>
        {cover ? (
          <Image source={cover} style={styles.heroImg} contentFit="cover" />
        ) : (
          <View style={[styles.heroImg, styles.heroFallback]} />
        )}
        <View style={styles.heroGrad} />
        <SafeAreaView style={styles.heroText} edges={['top']}>
          <View style={styles.heroTextInner}>
            <Text style={styles.invitedBy}>Invited by {preview.hostName}</Text>
            <Text style={styles.eventTitle}>{preview.name}</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <View style={styles.statAccent} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Time left</Text>
              <Text style={styles.statValue}>{hasEnded ? 'Ended' : timeUntil(preview.endsAt)}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statAccent, styles.statAccentSec]} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Shots each</Text>
              <Text style={styles.statValue}>
                {preview.shotsPerPerson === null ? 'Unlimited' : preview.shotsPerPerson}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.message}>
          {preview.maxParticipants === null
            ? `${pluralize(preview.memberCount, 'person', 'people')} joined`
            : `${preview.memberCount} of ${preview.maxParticipants} people joined`}
        </Text>

        <View style={styles.spacer} />

        <View style={styles.actionArea}>
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
            <Text style={styles.noAccount}>You'll need a free account to shoot on this roll.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  heroFallback: { backgroundColor: C.surfaceHigh },
  message: { ...T.bodyMd, fontSize: 15, color: C.onSurfaceVariant, textAlign: 'center' },
  error: { ...T.bodyMd, fontSize: 14, color: C.error, textAlign: 'center' },

  heroSection: { height: 440, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroGrad: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'transparent',
  },
  heroText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroTextInner: {
    padding: 24,
    paddingBottom: 28,
  },
  invitedBy: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.primary,
    marginBottom: 8,
  },
  eventTitle: { ...T.headlineLgMobile, color: C.onSurface },

  body: { flex: 1, padding: 24 },

  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: `${C.primary}80`,
    marginRight: 12,
  },
  statAccentSec: { backgroundColor: `${C.secondaryFixedDim}80` },
  statContent: { gap: 8 },
  statLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
  },
  statValue: { ...T.bodyLg, color: C.onSurface },

  spacer: { flex: 1 },

  actionArea: { gap: 16 },

  noAccount: {
    ...T.bodyMd,
    fontSize: 13,
    color: `${C.onSurfaceVariant}99`,
    textAlign: 'center',
  },
});
