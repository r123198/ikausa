import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { T } from '@/constants/theme';
import { useUserId } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { eventPhase, fetchEvent, shotsLeft, uploadPhoto } from '@/lib/events';

const PHOTO_QUALITY = 0.8;
const WHITE = '#fff';

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
  const [status, setStatus] = useState<string | null>(null);
  const now = useNow(10_000);
  const { data: event, error, isLoading, reload } = useFocusedAsync(() => fetchEvent(id), [id]);

  if (event === undefined && isLoading) return <LoadingState />;
  if (event === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (event === null) {
    return <ErrorState message="This roll doesn't exist or you're not a member." onRetry={reload} />;
  }

  const left = shotsLeft(event);
  const isLive = eventPhase(event, now) === 'live';
  const canShoot = isLive && left !== 0 && isReady && !isSaving;

  async function handleShutter() {
    if (!cameraRef.current || !canShoot) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: PHOTO_QUALITY });
      await uploadPhoto(event!.id, userId, picture.uri);
      setStatus('Saved to the roll');
      reload();
    } catch (e) {
      const message = errorMessage(e);
      setStatus(
        /shot_limit_reached|row-level security/.test(message)
          ? "That shot couldn't be saved: you're out of shots or the roll has ended."
          : `Couldn't save that shot: ${message}`
      );
      reload();
    } finally {
      setIsSaving(false);
    }
  }

  function renderViewfinder() {
    if (!permission) return <ActivityIndicator color={WHITE} style={styles.camera} />;
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

  const counter =
    left === null ? 'Unlimited shots' : `${left} of ${event.shotsPerPerson} shots left`;

  return (
    <View style={styles.safe}>
      <SafeAreaView style={styles.safeInner}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            style={styles.roundBtn}
            onPress={() => router.back()}>
            <Icon ios="xmark" material="close" size={18} color={WHITE} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.eventName} numberOfLines={1}>
              {event.name}
            </Text>
            <Text style={styles.shotCounterText}>{counter}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFlashOn ? 'Turn flash off' : 'Turn flash on'}
            style={styles.roundBtn}
            onPress={() => setIsFlashOn((on) => !on)}>
            <Icon
              ios={isFlashOn ? 'bolt.fill' : 'bolt.slash.fill'}
              material={isFlashOn ? 'flash_on' : 'flash_off'}
              size={18}
              color={WHITE}
            />
          </Pressable>
        </View>

        <View style={styles.viewfinder}>
          {renderViewfinder()}
          <View style={styles.vignette} pointerEvents="none" />
          {(status || !isLive || left === 0) && (
            <Text style={styles.status} accessibilityLiveRegion="polite">
              {!isLive
                ? 'This roll has ended. No more photos can be taken.'
                : left === 0
                  ? "You've used all your shots on this roll."
                  : status}
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <View style={styles.sideSlot}>
            {event.shotsPerPerson !== null && (
              <View style={styles.filmRollBox} accessibilityLabel={counter}>
                <View style={styles.filmRollPerfs}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={styles.filmRollPerf} />
                  ))}
                </View>
                <View style={styles.filmRollCenter}>
                  <Text style={styles.filmCountTop}>{left}</Text>
                  <View style={styles.filmCountDivider} />
                  <Text style={styles.filmCountBottom}>{event.shotsPerPerson}</Text>
                </View>
              </View>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: !canShoot, busy: isSaving }}
            disabled={!canShoot}
            style={[styles.shutter, !canShoot && styles.shutterDisabled]}
            onPress={handleShutter}>
            {isSaving ? <ActivityIndicator color={WHITE} /> : <View style={styles.shutterInner} />}
          </Pressable>

          <View style={styles.sideSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
              style={styles.roundBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
              <Icon
                ios="arrow.triangle.2.circlepath"
                material="cameraswitch"
                size={20}
                color={WHITE}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1c1c1e' },
  safeInner: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  titleBlock: { flex: 1, gap: 2 },
  eventName: {
    fontFamily: 'HankenGrotesk',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#fff',
  },
  shotCounterText: {
    fontFamily: 'HankenGrotesk',
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },

  camera: { flex: 1 },
  status: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontFamily: 'HankenGrotesk',
    fontSize: 14,
    textAlign: 'center',
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permissionText: { ...T.bodyMd, color: '#fff', textAlign: 'center' },
  sideSlot: { width: 64, alignItems: 'center' },
  viewfinder: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  vignette: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    borderRadius: 16,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 32,
    height: 128,
  },

  filmRollBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filmRollPerfs: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filmRollPerf: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 1,
  },
  filmRollCenter: { alignItems: 'center', paddingLeft: 8 },
  filmCountTop: {
    fontFamily: 'HankenGrotesk',
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  filmCountDivider: { width: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 2 },
  filmCountBottom: {
    fontFamily: 'HankenGrotesk',
    fontSize: 10,
    color: '#9ca3af',
  },

  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: {
    flex: 1,
    width: '100%',
    borderRadius: 36,
    backgroundColor: '#fff',
  },

});
