import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/cover-image';
import { Icon } from '@/components/icon';
import { InviteSheet } from '@/components/invite-sheet';
import { Wordmark } from '@/components/logo';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, FloatingTabBarSpace, T } from '@/constants/theme';
import { useUserId } from '@/context/auth-context';
import { useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { eventPhase, fetchMyEvents, shotsLeft, signedUrls, type EventSummary } from '@/lib/events';
import { formatDateRange, timeUntil } from '@/lib/format';

const PAGE_PADDING = 20;
const STRIP_SIZE = 4;
const STRIP_OVERLAP = 10;
const STRIP_TILTS = ['-3deg', '2deg', '-2deg', '3deg'];

async function loadHome() {
  const events = await fetchMyEvents();
  const previewUrls = await signedUrls(events.flatMap((e) => e.previewPaths));
  return { events, previewUrls };
}

interface ActiveCardProps {
  event: EventSummary;
  width: number;
  now: Date;
  onInvite: () => void;
}

function ActiveCard({ event, width, now, onInvite }: ActiveCardProps) {
  const router = useRouter();
  const canShoot = shotsLeft(event) !== 0;

  // The open-roll area and the action buttons are siblings: nested buttons are invalid on web
  // and confusing for screen readers.
  return (
    <View style={[styles.activeCard, { width }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${event.name}, ${timeUntil(event.endsAt, now)} left`}
        style={({ pressed }) => [StyleSheet.absoluteFill, pressed && styles.pressedDim]}
        onPress={() => router.push(`/roll/${event.id}`)}>
        <CoverImage cover={event.cover} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
          locations={[0, 0.38, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.activeTop}>
          <Text style={styles.activeTitle} numberOfLines={2}>
            {event.name}
          </Text>
          <View style={styles.metaLine}>
            <Icon ios="clock" material="schedule" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.activeMeta}>{timeUntil(event.endsAt, now)} left</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.activeActions} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canShoot ? 'Open camera' : 'No shots left'}
          disabled={!canShoot}
          hitSlop={6}
          style={({ pressed }) => [
            styles.cardButton,
            !canShoot && styles.disabled,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push(`/camera/${event.id}`)}>
          <Icon ios="camera.fill" material="photo_camera" size={22} color={C.white} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Invite"
          hitSlop={6}
          style={({ pressed }) => [styles.cardButton, pressed && styles.pressed]}
          onPress={onInvite}>
          <Icon ios="qrcode" material="qr_code_2" size={20} color={C.white} />
        </Pressable>
      </View>
    </View>
  );
}

function StartCard({ width }: { width: number }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.activeCard,
        styles.startCard,
        { width },
        pressed && styles.pressed,
      ]}
      onPress={() => router.push('/create/name')}>
      <View style={styles.startIcon}>
        <Icon ios="plus" material="add" size={24} color={C.onPrimary} />
      </View>
      <Text style={styles.startTitle}>Start a roll</Text>
      <Text style={styles.startText}>Pick a name and invite friends to shoot with you.</Text>
    </Pressable>
  );
}

interface AlbumRowProps {
  event: EventSummary;
  userId: string;
  urls: Map<string, string>;
  stripWidth: number;
}

function AlbumRow({ event, userId, urls, stripWidth }: AlbumRowProps) {
  const router = useRouter();
  const previews = event.previewPaths.flatMap((p) => {
    const url = urls.get(p);
    return url ? [url] : [];
  });
  const extra = event.photoCount - previews.length;
  const tile = (stripWidth + (STRIP_SIZE - 1) * STRIP_OVERLAP) / STRIP_SIZE;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.name} album`}
      style={({ pressed }) => [styles.album, pressed && styles.pressed]}
      onPress={() => router.push(`/roll/${event.id}`)}>
      <View style={styles.albumHeader}>
        <View style={styles.albumTitleRow}>
          <Text style={styles.albumTitle} numberOfLines={1}>
            {event.name}
          </Text>
          {event.ownerId !== userId && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Joined</Text>
            </View>
          )}
        </View>
        <Text style={styles.albumDate}>{formatDateRange(event.createdAt, event.endsAt)}</Text>
      </View>

      {previews.length === 0 ? (
        <Text style={styles.noPhotos}>
          {eventPhase(event) === 'expired' ? 'Export closed · photos removed' : 'No photos yet'}
        </Text>
      ) : (
        <View style={styles.strip}>
          {previews.map((url, i) => (
            <View
              key={url}
              style={[
                styles.stripCard,
                {
                  width: tile,
                  height: tile * 1.25,
                  marginLeft: i === 0 ? 0 : -STRIP_OVERLAP,
                  transform: [{ rotate: STRIP_TILTS[i] }],
                  zIndex: i,
                },
              ]}>
              <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {i === previews.length - 1 && extra > 0 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{extra}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const userId = useUserId();
  const now = useNow();
  const { width } = useWindowDimensions();
  const { data, error, isLoading, reload } = useFocusedAsync(loadHome, []);
  const [inviteEvent, setInviteEvent] = useState<EventSummary | null>(null);

  if (!data && isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const contentWidth = Math.min(width, 800) - PAGE_PADDING * 2;
  const cardWidth = Math.min(contentWidth * 0.62, 280);
  const live = data.events.filter((e) => eventPhase(e, now) === 'live');
  const albums = data.events.filter((e) => ['ready', 'expired'].includes(eventPhase(e, now)));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={C.primary} />
        }>
        <View style={styles.brand}>
          <Wordmark />
        </View>

        {error && <Text style={styles.inlineError}>{error}</Text>}

        <Text style={styles.eyebrow}>Active</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeScroller}
          contentContainerStyle={styles.activeRow}>
          {live.length === 0 ? (
            <StartCard width={cardWidth} />
          ) : (
            live.map((event) => (
              <ActiveCard
                key={event.id}
                event={event}
                width={cardWidth}
                now={now}
                onInvite={() => setInviteEvent(event)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.rule} />

        <Text style={styles.eyebrow}>Albums</Text>
        {albums.length === 0 ? (
          <Text style={styles.noPhotos}>Finished rolls land here once their photos are revealed.</Text>
        ) : (
          albums.map((event) => (
            <AlbumRow
              key={event.id}
              event={event}
              userId={userId}
              urls={data.previewUrls}
              stripWidth={contentWidth}
            />
          ))
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
  content: { paddingHorizontal: PAGE_PADDING, paddingBottom: FloatingTabBarSpace },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  pressedDim: { opacity: 0.9 },
  disabled: { opacity: 0.4 },

  brand: { paddingTop: 16, paddingBottom: 28 },
  inlineError: { ...T.caption, color: C.error, marginBottom: 12 },
  eyebrow: { ...T.eyebrow, marginBottom: 14 },

  activeScroller: { marginHorizontal: -PAGE_PADDING },
  activeRow: { paddingHorizontal: PAGE_PADDING, gap: 12 },
  activeCard: {
    aspectRatio: 0.72,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: C.card,
    justifyContent: 'space-between',
  },
  activeTop: { padding: 18, gap: 6 },
  activeTitle: { ...T.title, fontSize: 26, lineHeight: 31, color: C.white },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeMeta: { ...T.caption, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  activeActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
  },
  cardButton: {
    width: 64,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(10,10,10,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startCard: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  startIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  startTitle: { ...T.title, fontSize: 24 },
  startText: { ...T.caption, fontSize: 14, lineHeight: 20 },

  rule: {
    height: 1,
    backgroundColor: C.hairline,
    marginHorizontal: -PAGE_PADDING,
    marginVertical: 28,
  },

  album: { gap: 14, marginBottom: 30 },
  albumHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  albumTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  albumTitle: { ...T.title, flexShrink: 1 },
  albumDate: { ...T.caption },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,196,153,0.14)',
  },
  chipText: { ...T.eyebrow, fontSize: 10, lineHeight: 12, letterSpacing: 1.2, color: C.primary },
  noPhotos: { ...T.caption, fontSize: 14, marginBottom: 30 },
  strip: { flexDirection: 'row', paddingVertical: 6 },
  stripCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { ...T.italic, fontSize: 24, color: C.white },
});
