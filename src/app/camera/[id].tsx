import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FannedPhotos } from '@/components/fanned-photos';
import { FilmCounter } from '@/components/film-counter';
import { Icon } from '@/components/icon';
import { InviteSheet } from '@/components/invite-sheet';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useUserId } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { eventPhase, fetchEvent, fetchPhotos, shotsLeft, uploadPhoto } from '@/lib/events';
import { filmById } from '@/lib/film/films';
import { timeUntil } from '@/lib/format';

const PHOTO_QUALITY = 0.8;
const PHASE_TICK_MS = 10_000;

export default function CameraScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  /** Shots taken this session, shown instantly before the server list catches up. */
  const [justTaken, setJustTaken] = useState<string[]>([]);
  const now = useNow(PHASE_TICK_MS);

  const { data, error, isLoading, reload } = useFocusedAsync(async () => {
    const event = await fetchEvent(id);
    const photos = event ? await fetchPhotos(id) : [];
    return { event, myPhotoUrls: photos.filter((p) => p.userId === userId).map((p) => p.url) };
  }, [id, userId]);

  if (!data && isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (!data.event) {
    return <ErrorState message="This roll doesn't exist or you're not a member." onRetry={reload} />;
  }

  const event = data.event;
  const left = shotsLeft(event);
  const isLive = eventPhase(event, now) === 'live';
  const canShoot = isLive && left !== 0 && isReady && !isSaving;
  const recent = [...justTaken, ...data.myPhotoUrls];

  async function handleShutter() {
    if (!cameraRef.current || !canShoot) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: PHOTO_QUALITY });
      setJustTaken((shots) => [picture.uri, ...shots]);
      await uploadPhoto(event.id, userId, picture.uri, event.cameraId);
    } catch (e) {
      const message = errorMessage(e);
      setJustTaken((shots) => shots.slice(1));
      setStatus(
        /shot_limit_reached|row-level security/.test(message)
          ? "That shot couldn't be saved: you're out of shots or the roll has ended."
          : `Couldn't save that shot: ${message}`
      );
    } finally {
      setIsSaving(false);
      reload();
    }
  }

  function renderViewfinder() {
    if (!permission) return <ActivityIndicator color={C.white} style={styles.camera} />;
    if (!permission.granted) {
      return (
        <View style={styles.permission}>
          <Text style={styles.permissionText}>
            Ikausa needs your camera to take photos for this roll.
          </Text>
          <Button label="Allow camera" onPress={requestPermission} />
        </View>
      );
    }
    return (
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={isFlashOn ? 'on' : 'off'}
        onCameraReady={() => setIsReady(true)}
      />
    );
  }

  const blockedMessage = !isLive
    ? 'This roll has ended. No more photos can be taken.'
    : left === 0
      ? "You've used all your shots on this roll."
      : null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            style={styles.iconBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <Icon ios="chevron.left" material="arrow_back" size={22} color={C.white} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {event.name}
            </Text>
            <View style={styles.timeLine}>
              <Icon ios="clock" material="schedule" size={13} color={C.textMuted} />
              <Text style={styles.time}>
                {isLive ? `${timeUntil(event.endsAt, now)} left` : 'Ended'} · {filmById(event.cameraId).name}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invite"
            hitSlop={10}
            disabled={!isLive}
            style={[styles.iconBtn, !isLive && styles.disabled]}
            onPress={() => setIsInviteOpen(true)}>
            <Icon ios="qrcode" material="qr_code_2" size={22} color={C.white} />
          </Pressable>
        </View>

        <View style={styles.viewfinder}>
          {renderViewfinder()}
          {(blockedMessage || status) && (
            <Text style={styles.status} accessibilityLiveRegion="polite">
              {blockedMessage ?? status}
            </Text>
          )}
          <View style={styles.viewfinderControls} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFlashOn ? 'Turn flash off' : 'Turn flash on'}
              hitSlop={10}
              style={styles.overlayBtn}
              onPress={() => setIsFlashOn((on) => !on)}>
              <Icon
                ios={isFlashOn ? 'bolt.fill' : 'bolt.slash.fill'}
                material={isFlashOn ? 'flash_on' : 'flash_off'}
                size={20}
                color={C.white}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
              hitSlop={10}
              style={styles.overlayBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
              <Icon ios="arrow.triangle.2.circlepath" material="cameraswitch" size={20} color={C.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.side}>
            <FilmCounter
              frame={event.shotsPerPerson === null ? null : Math.min(event.myShotCount + 1, event.shotsPerPerson)}
              total={event.shotsPerPerson}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: !canShoot, busy: isSaving }}
            disabled={!canShoot}
            style={({ pressed }) => [
              styles.shutter,
              !canShoot && styles.disabled,
              pressed && styles.shutterPressed,
            ]}
            onPress={handleShutter}>
            {isSaving ? <ActivityIndicator color={C.black} /> : <View style={styles.shutterInner} />}
          </Pressable>

          <View style={[styles.side, styles.sideRight]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Your shots on this roll"
              hitSlop={8}
              onPress={() => router.push(`/roll/${event.id}`)}>
              <FannedPhotos urls={recent} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <InviteSheet
        visible={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        eventName={event.name}
        inviteCode={event.inviteCode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black },
  flex: { flex: 1 },
  disabled: { opacity: 0.4 },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center', gap: 2 },
  title: { ...T.title, fontSize: 21, lineHeight: 26, color: C.white },
  timeLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { ...T.caption, fontSize: 13 },

  viewfinder: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#050505',
  },
  camera: { flex: 1 },
  viewfinderControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  overlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  status: {
    ...T.caption,
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: C.white,
    fontSize: 14,
    textAlign: 'center',
  },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  permissionText: { ...T.bodyMd, color: C.white, textAlign: 'center' },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  side: { flex: 1, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  shutter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterInner: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: C.white },
});
