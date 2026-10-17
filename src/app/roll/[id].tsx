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

import { CoverImage } from '@/components/cover-image';
import { Icon } from '@/components/icon';
import { InviteSheet } from '@/components/invite-sheet';
import { PhotoGrid } from '@/components/photo-grid';
import { RollDetailsSheet } from '@/components/roll-details-sheet';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import {
  eventPhase,
  fetchEvent,
  fetchPhotos,
  shotsLeft,
  type EventPhase,
  type EventSummary,
  type Photo,
} from '@/lib/events';
import { exportPhotos } from '@/lib/export-photos';
import { formatDate, pluralize, timeUntil } from '@/lib/format';

const PAGE_PADDING = 20;
const MAX_CONTENT_WIDTH = 800;

function timeLabel(event: EventSummary, phase: EventPhase, now: Date): string {
  switch (phase) {
    case 'live':
      return `${timeUntil(event.endsAt, now)} left`;
    case 'developing':
      return `Developing · reveals in ${timeUntil(event.revealAt, now)}`;
    case 'ready':
      return `Export until ${formatDate(event.exportUntil)}`;
    case 'expired':
      return `Export closed ${formatDate(event.exportUntil)}`;
  }
}

function emptyMessage(phase: EventPhase): string {
  switch (phase) {
    case 'live':
      return 'No shots yet. Open the camera to take the first one.';
    case 'developing':
      return 'The film is developing. Photos appear here once the roll is revealed.';
    case 'expired':
      return 'The export window has closed, so these photos are no longer available.';
    default:
      return 'No photos on this roll.';
  }
}

function HeaderButton({
  ios,
  material,
  label,
  onPress,
}: {
  ios: 'chevron.left' | 'gearshape.fill';
  material: 'arrow_back' | 'settings';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
      onPress={onPress}>
      <Icon ios={ios} material={material} size={20} color={C.onSurface} />
    </Pressable>
  );
}

export default function RollScreen() {
  const router = useRouter();
  const { id, notice } = useLocalSearchParams<{ id: string; notice?: string }>();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const now = useNow();
  const [openSheet, setOpenSheet] = useState<'invite' | 'details' | null>(null);
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

  if (!data && isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (!data.event) {
    return <ErrorState message="This roll doesn't exist or you're not a member." onRetry={reload} />;
  }

  const { event } = data;
  const phase = eventPhase(event, now);
  const photos: Photo[] = phase === 'developing' ? [] : data.photos;
  const left = shotsLeft(event);
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - PAGE_PADDING * 2;

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
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBar}>
        <HeaderButton
          ios="chevron.left"
          material="arrow_back"
          label="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <HeaderButton
          ios="gearshape.fill"
          material="settings"
          label="Roll details"
          onPress={() => setOpenSheet('details')}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={C.primary} />
        }>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} accessibilityRole="header">
              {event.name}
            </Text>
            <View style={styles.metaRow}>
              <Icon ios="clock" material="schedule" size={15} color={C.textMuted} />
              <Text style={styles.metaText}>{timeLabel(event, phase, now)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Icon ios="person.crop.circle.fill" material="account_circle" size={15} color={C.textMuted} />
              <Text style={styles.metaText}>
                {pluralize(event.memberCount, 'person', 'people')} joined
              </Text>
            </View>
          </View>
          <CoverImage cover={event.cover} style={styles.cover} />
        </View>

        <View style={styles.actions}>
          <Button
            label="Export"
            variant="outline"
            size="sm"
            disabled={phase !== 'ready' || photos.length === 0}
            isLoading={isExporting}
            icon={<Icon ios="square.and.arrow.down" material="download" size={16} color={C.onSurface} />}
            onPress={handleExport}
          />
          <Button
            label="Invite"
            variant="outline"
            size="sm"
            disabled={phase !== 'live'}
            icon={<Icon ios="qrcode" material="qr_code_2" size={16} color={C.onSurface} />}
            onPress={() => setOpenSheet('invite')}
          />
          <Button
            label={left === 0 ? 'No shots left' : 'Camera'}
            size="sm"
            style={styles.flex}
            disabled={phase !== 'live' || left === 0}
            icon={<Icon ios="camera.fill" material="photo_camera" size={16} color={C.onPrimary} />}
            onPress={() => router.push(`/camera/${event.id}`)}
          />
        </View>
        {exportMessage && <Text style={styles.status}>{exportMessage}</Text>}

        <View style={styles.rule} />

        {photos.length === 0 ? (
          <Text style={styles.empty}>{emptyMessage(phase)}</Text>
        ) : (
          <PhotoGrid photos={photos} width={contentWidth} />
        )}
      </ScrollView>

      {notice === 'cover-failed' && (
        <SafeAreaView style={styles.toastWrap} edges={['bottom']} pointerEvents="none">
          <Text style={styles.toast}>Your roll is ready, but the cover photo couldn’t be uploaded.</Text>
        </SafeAreaView>
      )}
      <InviteSheet
        visible={openSheet === 'invite'}
        onClose={() => setOpenSheet(null)}
        eventName={event.name}
        inviteCode={event.inviteCode}
      />
      <RollDetailsSheet
        visible={openSheet === 'details'}
        onClose={() => setOpenSheet(null)}
        event={event}
        isOwner={event.ownerId === session?.user.id}
        onDeleted={() => {
          setOpenSheet(null);
          router.replace('/');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAGE_PADDING,
    paddingTop: 4,
  },
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },

  content: { paddingHorizontal: PAGE_PADDING, paddingTop: 22, paddingBottom: 48, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  headerText: { flex: 1, gap: 8 },
  title: { ...T.headlineLgMobile, fontSize: 34, lineHeight: 40, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { ...T.caption, fontSize: 14, color: C.textSoft },
  cover: { width: 88, height: 88, borderRadius: 18 },

  actions: { flexDirection: 'row', gap: 8 },
  status: { ...T.caption, fontSize: 14, textAlign: 'center' },
  rule: { height: 1, backgroundColor: C.hairline },
  empty: { ...T.caption, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingVertical: 32 },

  toastWrap: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  toast: {
    ...T.caption,
    fontSize: 14,
    color: C.onSurface,
    backgroundColor: C.cardRaised,
    padding: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
