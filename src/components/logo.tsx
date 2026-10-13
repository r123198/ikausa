import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { C, T } from '@/constants/theme';

const STAR = require('@/assets/icons/ikausa_no_bg.png');
const PULSE_MS = 900;

interface LogoProps {
  size?: number;
}

/**
 * The star on a white tile, same as the app icon. The gradient's dark tip
 * disappears on the app's black background, so the mark is never drawn bare.
 */
export function Logo({ size = 40 }: LogoProps) {
  return (
    <View
      style={[styles.tile, { width: size, height: size, borderRadius: size * 0.27 }]}
      accessibilityRole="image"
      accessibilityLabel="Ikausa">
      <Image source={STAR} style={{ width: size * 0.66, height: size * 0.66 }} contentFit="contain" />
    </View>
  );
}

/** Logo + serif name, used as the app header. */
export function Wordmark({ size = 34 }: LogoProps) {
  return (
    <View style={styles.wordmark} accessibilityRole="header" accessibilityLabel="Ikausa">
      <Logo size={size} />
      <Text style={[styles.name, { fontSize: size, lineHeight: size * 1.2 }]}>Ikausa</Text>
    </View>
  );
}

/** Gently breathing logo for loading states; still when reduce-motion is on. */
export function PulsingLogo({ size = 56 }: LogoProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Logo size={size} />
    </Animated.View>
  );
}

/** Faint mark for empty image slots (e.g. a roll without a cover). */
export function LogoWatermark() {
  return (
    <View style={styles.watermark} pointerEvents="none">
      <Image source={STAR} style={styles.watermarkStar} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { ...T.headlineLgMobile },
  watermark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  watermarkStar: { width: '28%', aspectRatio: 1, opacity: 0.18 },
});
