import type { CameraType } from 'expo-camera';
import { useState } from 'react';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

// expo-camera's zoom is 0–1 of the device's max. On iOS that maps exponentially
// to the zoom factor (about 0.2 per doubling), on Android linearly, so cap iOS
// lower to stay out of unusable digital zoom.
const MAX_ZOOM = Platform.OS === 'ios' ? 0.5 : 1;
const PINCH_SENSITIVITY = 0.2;
// iOS reports lenses by name, e.g. "Back Ultra Wide Camera". Virtual
// multi-lens devices ("Back Dual Wide Camera") are not a single lens.
const ULTRA_WIDE = /ultra wide/i;
const VIRTUAL_LENS = /dual|triple/i;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(0, value));
}

/**
 * Pinch-to-zoom for the viewfinder, plus the iPhone ultra-wide (0.5×) lens
 * when the device has one. Android only gets pinch: expo-camera can't pick lenses there.
 */
export function useCameraZoom(facing: CameraType) {
  const [zoom, setZoom] = useState(0);
  const [lenses, setLenses] = useState<string[]>([]);
  const [isUltraWide, setIsUltraWide] = useState(false);
  const pinchStartZoom = useSharedValue(0);

  const ultraWideLens =
    facing === 'back'
      ? lenses.find((name) => ULTRA_WIDE.test(name) && !VIRTUAL_LENS.test(name))
      : undefined;
  const isOnUltraWide = isUltraWide && ultraWideLens !== undefined;

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      pinchStartZoom.set(zoom);
    })
    .onUpdate((e) => {
      setZoom(clampZoom(pinchStartZoom.get() + Math.log(e.scale) * PINCH_SENSITIVITY));
    });

  /** Switch between the 0.5× and 1× lens, starting unzoomed like the iPhone camera. */
  function selectLens(ultraWide: boolean) {
    setIsUltraWide(ultraWide);
    setZoom(0);
  }

  return {
    pinch,
    hasUltraWide: ultraWideLens !== undefined,
    isUltraWide: isOnUltraWide,
    isZoomed: zoom > 0,
    selectLens,
    cameraProps: {
      zoom,
      // Undefined falls back to the standard wide (1×) camera.
      selectedLens: isOnUltraWide ? ultraWideLens : undefined,
      onAvailableLensesChanged: ({ lenses: available }: { lenses: string[] }) =>
        setLenses(available),
    },
  };
}
