import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PulsingLogo } from '@/components/logo';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { fetchEvent } from '@/lib/events';

export default function DevelopingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const { data: event, error, isLoading, reload } = useFocusedAsync(() => fetchEvent(id), [id]);

  const isRevealed = event ? now >= event.revealAt : false;

  // Once the reveal time passes, send people straight to the photos.
  useEffect(() => {
    if (event && isRevealed) router.replace(`/roll/${event.id}`);
  }, [event, isRevealed, router]);

  if (event === undefined && isLoading) return <LoadingState />;
  if (event === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (event === null) {
    return <ErrorState message="This roll doesn't exist or you're not a member." onRetry={reload} />;
  }

  const remainingMs = Math.max(0, event.revealAt.getTime() - now.getTime());
  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);

  return (
    <View style={styles.safe}>
      <View style={styles.glow} />
      <SafeAreaView style={styles.safeInner}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            style={styles.backRow}
            onPress={() => router.back()}>
            <Icon ios="chevron.left" material="arrow_back" size={18} color={C.onSurfaceVariant} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <PulsingLogo size={48} />
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {event.name}
            </Text>
          </View>

          <Text style={styles.headline}>Film is developing</Text>

          <View
            style={styles.timerRing}
            accessibilityLabel={`Reveals in ${hours} hours ${minutes} minutes`}>
            <View style={styles.timerRingOuter}>
              <View style={styles.timerRingInner}>
                <Text style={styles.timerHours}>{String(hours).padStart(2, '0')}</Text>
                <Text style={styles.timerSep}>:</Text>
                <Text style={styles.timerHours}>{String(minutes).padStart(2, '0')}</Text>
              </View>
            </View>
            <View style={styles.timerLabels}>
              <Text style={styles.timerLabel}>hours</Text>
              <Text style={styles.timerLabel}>mins</Text>
            </View>
          </View>

          <Text style={styles.subtext}>
            The event has ended. The photos are developing and will appear here when the timer
            runs out.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  glow: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    top: '10%',
    left: '10%',
    borderRadius: 9999,
    backgroundColor: C.primaryContainer,
    opacity: 0.05,
    transform: [{ scaleX: 1.5 }],
  },
  safeInner: { flex: 1 },

  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, alignSelf: 'flex-start' },
  backLabel: {
    ...T.label,
    textTransform: 'uppercase',
    color: C.onSurfaceVariant,
    letterSpacing: 1.5,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
    gap: 24,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}4d`,
    backgroundColor: C.surfaceLow,
  },
  badgeText: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.onSurfaceVariant,
  },

  headline: {
    ...T.headlineLgMobile,
    color: C.onSurface,
    textAlign: 'center',
  },

  timerRing: { alignItems: 'center', gap: 8 },
  timerRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: `${C.primaryContainer}33`,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  timerRingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerHours: {
    fontFamily: 'HankenGrotesk',
    fontWeight: '700',
    fontSize: 40,
    color: C.onSurface,
    letterSpacing: -1,
  },
  timerSep: {
    fontFamily: 'HankenGrotesk',
    fontWeight: '700',
    fontSize: 32,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  timerLabels: {
    flexDirection: 'row',
    gap: 32,
    paddingHorizontal: 24,
  },
  timerLabel: { ...T.label, color: C.onSurfaceVariant, letterSpacing: 1.5 },

  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },

});
