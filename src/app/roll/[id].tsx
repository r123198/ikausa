import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { Icon } from '@/components/icon';
import { InviteSheet } from '@/components/invite-sheet';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { useCoverSource } from '@/constants/covers';
import { C, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import {
  eventPhase,
  fetchEvent,
  fetchPhotos,
  shotsLeft,
  type EventPhase,
  type EventSummary,
} from '@/lib/events';
import { exportPhotos } from '@/lib/export-photos';
import { formatDate, pluralize, timeUntil } from '@/lib/format';

const GRID_GAP = 4;
const GRID_PADDING = 20;
const GRID_COLUMNS = 3;

function statusLine(event: EventSummary, phase: EventPhase): string {
  switch (phase) {
    case 'live': {
      const left = shotsLeft(event);
      const shots = left === null ? 'Unlimited shots' : `${pluralize(left, 'shot')} left`;
      return `Ends in ${timeUntil(event.endsAt)} · ${shots} · ${pluralize(event.memberCount, 'person', 'people')}`;
    }
    case 'developing':
      return `Developing · reveals in ${timeUntil(event.revealAt)}`;
    case 'ready':
      return `${pluralize(event.photoCount, 'photo')} · Export until ${formatDate(event.exportUntil)}`;
    case 'expired':
      return `Export closed on ${formatDate(event.exportUntil)}`;
  }
}

export default function RollScreen() {
  const router = useRouter();
  const { id, notice } = useLocalSearchParams<{ id: string; notice?: string }>();
  const { width } = useWindowDimensions();
  const now = useNow();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useFocusedAsync(
    async () => {
      const event = await fetchEvent(id);
      // While developing nobody sees photos, not even their own shots.
      const photos = event && eventPhase(event) !== 'developing' ? await fetchPhotos(id) : [];
      return { event, photos };
    },
    [id]
  );
  const cover = useCoverSource(data?.event?.cover ?? null);

  if (!data && isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (!data.event) {
    return <ErrorState message="This roll doesn't exist or you're not a member." onRetry={reload} />;
  }

  const { event, photos } = data;
  const phase = eventPhase(event, now);
  const visiblePhotos = phase === 'developing' ? [] : photos;
  const tileSize = (Math.min(width, 800) - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  async function handleExport() {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const saved = await exportPhotos(photos);
      setExportMessage(`Saved ${pluralize(saved, 'photo')}.`);
    } catch (e) {
      setExportMessage(errorMessage(e));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={8}>
          <Icon ios="chevron.left" material="arrow_back" size={20} color={C.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={C.primary} />
        }>
        {cover && <Image source={cover} style={styles.cover} contentFit="cover" />}

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.status}>{statusLine(event, phase)}</Text>
          {notice === 'cover-failed' && (
            <Text style={styles.notice}>
              Your roll is ready, but the cover photo couldn't be uploaded.
            </Text>
          )}
        </View>

        {phase === 'live' && (
          <View style={styles.actions}>
            <Button
              label={shotsLeft(event) === 0 ? 'No shots left' : 'Shoot'}
              disabled={shotsLeft(event) === 0}
              style={styles.flex}
              icon={<Icon ios="camera.fill" material="photo_camera" size={20} color={C.onPrimary} />}
              onPress={() => router.push(`/camera/${event.id}`)}
            />
            <Button
              label="Invite"
              variant="secondary"
              icon={<Icon ios="person.badge.plus" material="person_add" size={20} color={C.onSurface} />}
              onPress={() => setIsInviteOpen(true)}
            />
          </View>
        )}

        {phase === 'ready' && (
          <View style={styles.exportBlock}>
            <Button
              label={`Export ${pluralize(photos.length, 'photo')}`}
              disabled={photos.length === 0}
              isLoading={isExporting}
              icon={<Icon ios="square.and.arrow.down" material="download" size={20} color={C.onPrimary} />}
              onPress={handleExport}
            />
            {exportMessage && <Text style={styles.exportMessage}>{exportMessage}</Text>}
          </View>
        )}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {phase === 'live' && visiblePhotos.length > 0 && event.revealAt > now
            ? 'Your shots'
            : 'Photos'}
        </Text>

        {visiblePhotos.length === 0 ? (
          <Text style={styles.empty}>
            {phase === 'live'
              ? 'No photos yet. Tap Shoot to take the first one.'
              : phase === 'developing'
                ? 'Photos appear here once the roll is revealed.'
                : 'No photos on this roll.'}
          </Text>
        ) : (
          <View style={styles.grid}>
            {visiblePhotos.map((photo) => (
              <View key={photo.id} style={{ width: tileSize, height: tileSize }}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photo}
                  contentFit="cover"
                  accessibilityLabel={`Photo by ${photo.authorName}`}
                />
                <Text style={styles.author} numberOfLines={1}>
                  {photo.authorName}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <InviteSheet
        visible={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        eventName={event.name}
        inviteCode={event.inviteCode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 12, paddingVertical: 4 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  content: { paddingHorizontal: GRID_PADDING, paddingBottom: 40, gap: 20 },

  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20 },
  titleBlock: { gap: 6 },
  title: { ...T.headlineLgMobile },
  status: { ...T.bodyMd, fontSize: 15, color: C.onSurfaceVariant },
  notice: { ...T.bodyMd, fontSize: 14, color: C.error },

  actions: { flexDirection: 'row', gap: 8 },
  exportBlock: { gap: 8 },
  exportMessage: { ...T.bodyMd, fontSize: 14, color: C.onSurfaceVariant },

  sectionTitle: {
    ...T.label,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: C.outline,
  },
  empty: { ...T.bodyMd, fontSize: 15, color: C.onSurfaceVariant },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  photo: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: C.surface },
  author: {
    ...T.bodyMd,
    position: 'absolute',
    left: 6,
    bottom: 4,
    right: 6,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
