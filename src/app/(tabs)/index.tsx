import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { InviteSheet } from '@/components/invite-sheet';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { useCoverSource } from '@/constants/covers';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { eventPhase, fetchMyEvents, shotsLeft, type EventSummary } from '@/lib/events';
import { formatDate, pluralize, timeUntil } from '@/lib/format';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

function Cover({ cover, style }: { cover: string | null; style: object }) {
  const source = useCoverSource(cover);
  return source ? (
    <Image source={source} style={style} contentFit="cover" />
  ) : (
    <View style={[style, styles.coverFallback]} />
  );
}

function shotsLabel(event: EventSummary): string {
  const left = shotsLeft(event);
  return left === null ? 'Unlimited shots' : `${pluralize(left, 'shot')} left`;
}

function NowShootingCard({ event, onInvite }: { event: EventSummary; onInvite: () => void }) {
  const router = useRouter();
  const isOutOfShots = shotsLeft(event) === 0;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${event.name}`}
        style={({ pressed }) => pressed && styles.pressed}
        onPress={() => router.push(`/roll/${event.id}`)}>
        <Cover cover={event.cover} style={styles.shootingImage} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {event.name}
          </Text>
          <Text style={styles.cardMeta}>
            {shotsLabel(event)} · {pluralize(event.memberCount, 'person', 'people')} ·{' '}
            {timeUntil(event.endsAt)} left
          </Text>
          {event.shotsPerPerson !== null && (
            <ProgressBar value={event.myShotCount} max={event.shotsPerPerson} />
          )}
        </View>
      </Pressable>

      <View style={styles.actionRow}>
        <Button
          label={isOutOfShots ? 'No shots left' : 'Shoot'}
          disabled={isOutOfShots}
          style={styles.flex}
          icon={<Icon ios="camera.fill" material="photo_camera" size={20} color={C.onPrimary} />}
          onPress={() => router.push(`/camera/${event.id}`)}
        />
        <Button
          label="Invite"
          variant="secondary"
          icon={<Icon ios="person.badge.plus" material="person_add" size={20} color={C.onSurface} />}
          onPress={onInvite}
        />
      </View>
    </View>
  );
}

function StartRollCard() {
  const router = useRouter();

  return (
    <View style={[styles.card, styles.cardBody]}>
      <Text style={styles.cardTitle}>No roll in progress</Text>
      <Text style={styles.cardMeta}>
        Start a roll for your next ganap and invite friends to shoot with you.
      </Text>
      <Button
        label="Start a roll"
        style={styles.startBtn}
        icon={<Icon ios="plus" material="add" size={20} color={C.onPrimary} />}
        onPress={() => router.push('/create/event-name')}
      />
    </View>
  );
}

function ReadyCard({ event }: { event: EventSummary }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${event.name} photos`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/roll/${event.id}`)}>
      <Cover cover={event.cover} style={styles.readyImage} />
      <View style={[styles.cardBody, styles.readyBody]}>
        <View style={styles.readyText}>
          <Text style={styles.readyTitle} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.readyMeta}>
            {pluralize(event.photoCount, 'photo')} · Export until {formatDate(event.exportUntil)}
          </Text>
        </View>
        <View style={styles.viewLink}>
          <Text style={styles.viewLinkLabel}>View</Text>
          <Icon ios="chevron.right" material="chevron_right" size={14} color={C.primary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { data: events, error, isLoading, reload } = useFocusedAsync(fetchMyEvents, []);
  const [inviteEvent, setInviteEvent] = useState<EventSummary | null>(null);
  const now = useNow();

  const displayName = session?.user.user_metadata.display_name as string | undefined;

  if (!events && isLoading) return <LoadingState />;
  if (!events) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const live = events.filter((e) => eventPhase(e, now) === 'live');
  const ready = events.filter((e) => eventPhase(e, now) === 'ready');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={C.primary} />
        }>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {displayName ? `Kumusta, ${displayName}` : 'Kumusta'}
          </Text>
          <Text style={styles.subtitle}>Here's what's happening with your rolls.</Text>
        </View>

        {error && <Text style={styles.inlineError}>{error}</Text>}

        <Section title="Now shooting">
          {live.length === 0 ? (
            <StartRollCard />
          ) : (
            live.map((event) => (
              <NowShootingCard
                key={event.id}
                event={event}
                onInvite={() => setInviteEvent(event)}
              />
            ))
          )}
        </Section>

        {ready.length > 0 && (
          <Section title="Ready to view">
            {ready.map((event) => (
              <ReadyCard key={event.id} event={event} />
            ))}
          </Section>
        )}
      </ScrollView>

      {inviteEvent && (
        <InviteSheet
          visible
          onClose={() => setInviteEvent(null)}
          eventName={inviteEvent.name}
          inviteCode={inviteEvent.inviteCode}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 32,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  header: { paddingTop: 16, gap: 6 },
  greeting: { ...T.headlineLgMobile },
  subtitle: { ...T.bodyMd, color: C.onSurfaceVariant },
  inlineError: { ...T.bodyMd, fontSize: 14, color: C.error },

  section: { gap: 12 },
  sectionTitle: {
    ...T.label,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: C.outline,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  coverFallback: { backgroundColor: C.surfaceHigh },
  cardBody: { padding: 20, gap: 8 },
  cardTitle: { ...T.headlineMd, fontSize: 24, lineHeight: 30 },
  cardMeta: { ...T.bodyMd, fontSize: 15, lineHeight: 22, color: C.onSurfaceVariant },

  shootingImage: { width: '100%', height: 180 },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.surfaceHighest,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: C.primary },

  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 20 },
  startBtn: { marginTop: 8 },

  readyImage: { width: '100%', aspectRatio: 16 / 10 },
  readyBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  readyText: { flex: 1, gap: 4 },
  readyTitle: { ...T.bodyMd, fontSize: 17, fontWeight: '700' },
  readyMeta: { ...T.bodyMd, fontSize: 14, lineHeight: 20, color: C.onSurfaceVariant },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewLinkLabel: { ...T.bodyMd, fontSize: 15, fontWeight: '700', color: C.primary },
});
