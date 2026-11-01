import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
/** Pinching back to roughly 1× snaps out of zoom. */
const SNAP_BACK_SCALE = 1.05;

interface ZoomablePhotoProps {
  url: string;
  width: number;
  height: number;
  /** Pan only takes over from swiping once the photo is zoomed. */
  isZoomed: boolean;
  onZoomChange: (isZoomed: boolean) => void;
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

/** A photo you can pinch or double-tap to zoom, then drag around. */
export function ZoomablePhoto({ url, width, height, isZoomed, onZoomChange }: ZoomablePhotoProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // How far the zoomed photo can move before its edge leaves the screen edge.
  function clampOffset(s: number, offsetX: number, offsetY: number) {
    'worklet';
    const maxX = (width * (s - 1)) / 2;
    const maxY = (height * (s - 1)) / 2;
    return { x: clamp(offsetX, -maxX, maxX), y: clamp(offsetY, -maxY, maxY) };
  }

  function zoomTo(target: number) {
    'worklet';
    const offset = clampOffset(target, savedX.value, savedY.value);
    scale.value = withTiming(target);
    x.value = withTiming(offset.x);
    y.value = withTiming(offset.y);
    savedScale.value = target;
    savedX.value = offset.x;
    savedY.value = offset.y;
    scheduleOnRN(onZoomChange, target > 1);
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, MAX_SCALE);
    })
    .onEnd(() => {
      zoomTo(scale.value < SNAP_BACK_SCALE ? 1 : scale.value);
    });

  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .averageTouches(true)
    .onUpdate((e) => {
      const offset = clampOffset(scale.value, savedX.value + e.translationX, savedY.value + e.translationY);
      x.value = offset.x;
      y.value = offset.y;
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      zoomTo(savedScale.value > 1 ? 1 : DOUBLE_TAP_SCALE);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </GestureDetector>
  );
}
