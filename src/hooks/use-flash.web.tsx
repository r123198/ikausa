import type { CameraType } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Flash } from '@/hooks/use-flash';

export type { Flash } from '@/hooks/use-flash';

/** How long the white screen shows before the frame is grabbed, so exposure can adjust. */
const SCREEN_FLASH_MS = 180;
/** Phone torches take a moment to reach full brightness and for exposure to settle. */
const TORCH_WARMUP_MS = 450;
/**
 * expo-camera reports ready before its <video> switches to the new stream, so the
 * torch check runs again over the next second until the new track is attached.
 */
const TORCH_CHECK_DELAYS_MS = [0, 250, 600, 1200];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The live camera track behind expo-camera's <video>, if the browser has one running. */
function videoTrackIn(root: unknown): MediaStreamTrack | null {
  if (!(root instanceof HTMLElement)) return null;
  const stream = root.querySelector('video')?.srcObject;
  return stream instanceof MediaStream ? (stream.getVideoTracks()[0] ?? null) : null;
}

function hasTorch(track: MediaStreamTrack | null): boolean {
  const capabilities = track?.getCapabilities?.() as { torch?: boolean } | undefined;
  return capabilities?.torch === true;
}

function setTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  // `torch` is supported by Chrome on Android but missing from the DOM typings.
  return track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
}

/**
 * Web: browsers have no camera flash, and expo-camera grabs a video frame instead of
 * firing one. The back camera uses the phone's torch where the browser exposes it
 * (Chrome on Android); the front camera lights the face with a white screen.
 */
export function useFlash(facing: CameraType): Flash {
  const [isOn, setIsOn] = useState(false);
  /** Torch support as reported by the camera that was ready; a switched camera starts unknown. */
  const [torch, setTorchSupport] = useState<{ facing: CameraType; isAvailable: boolean } | null>(null);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const viewfinderRef = useRef<View>(null);
  const isFront = facing === 'front';

  const checkTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const onCameraReady = useCallback(() => {
    checkTimers.current.forEach(clearTimeout);
    checkTimers.current = TORCH_CHECK_DELAYS_MS.map((delay) =>
      setTimeout(() => {
        setTorchSupport({ facing, isAvailable: hasTorch(videoTrackIn(viewfinderRef.current)) });
      }, delay)
    );
  }, [facing]);

  useEffect(() => () => checkTimers.current.forEach(clearTimeout), []);

  const isTorchAvailable = torch?.facing === facing && torch.isAvailable;
  const isSupported = isFront || isTorchAvailable;

  async function capture<T>(take: () => Promise<T>): Promise<T> {
    if (!isOn || !isSupported) return take();

    if (isFront) {
      setIsScreenFlashing(true);
      try {
        await wait(SCREEN_FLASH_MS);
        return await take();
      } finally {
        setIsScreenFlashing(false);
      }
    }

    const track = videoTrackIn(viewfinderRef.current);
    if (!track || !hasTorch(track)) return take();
    try {
      await setTorch(track, true);
      await wait(TORCH_WARMUP_MS);
    } catch (error) {
      console.error('Could not turn on the torch', error);
      return take();
    }
    try {
      return await take();
    } finally {
      setTorch(track, false).catch((error) => console.error('Could not turn off the torch', error));
    }
  }

  return {
    isSupported,
    isOn,
    toggle: () => setIsOn((on) => !on),
    cameraProps: {},
    capture,
    onCameraReady,
    overlay: isScreenFlashing ? <View style={styles.screenFlash} pointerEvents="none" /> : null,
    viewfinderRef,
  };
}

const styles = StyleSheet.create({
  screenFlash: { ...StyleSheet.absoluteFill, zIndex: 1000, backgroundColor: '#ffffff' },
});
