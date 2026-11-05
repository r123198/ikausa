import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type AccessibilityActionEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/icon';
import { ZoomablePhoto } from '@/components/zoomable-photo';
import { C, T } from '@/constants/theme';
import { resistEdges, settleIndex } from '@/lib/swipe';

interface PhotoViewerProps {
  /** Most recent first. */
  urls: string[];
  /** Optional line under the counter for each photo, e.g. who took it. */
  captions?: string[];
  initialIndex: number;
  onClose: () => void;
}

/** Photos rendered on each side of the current one, so neighbours are loaded before you swipe. */
const NEIGHBOURS = 2;
const PAGE_TIMING = { duration: 260, reduceMotion: ReduceMotion.System };
/** Horizontal movement that starts a swipe; vertical movement that rules one out. */
const ACTIVATE_X = 12;
const FAIL_Y = 24;
const noop = () => {};

/** Mouse or trackpad: show previous/next buttons, which touch screens don't need. */
function hasFinePointer(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(hover: hover) and (pointer: fine)').matches === true
  );
}

/**
 * Full-screen photos you swipe left and right through and pinch to zoom, like the iPhone
 * Photos app. The swipe is a gesture rather than a scrolling list, so it behaves the same
 * on the web, where the zoom gesture would otherwise block the browser's scrolling.
 */
export function PhotoViewer({ urls, captions, initialIndex, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const count = urls.length;
  const start = Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0));
  const [index, setIndex] = useState(start);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showArrows] = useState(hasFinePointer);
  const position = useSharedValue(-start * width);
  const current = useSharedValue(start);
  const caption = captions?.[index];

  function goTo(target: number) {
    if (target < 0 || target >= count || target === index) return;
    current.set(target);
    position.set(withTiming(-target * width, PAGE_TIMING));
    setIndex(target);
  }

  // Keep the current photo in place when the window is resized or rotated.
  useEffect(() => {
    position.set(-current.get() * width);
  }, [width, position, current]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') goTo(index + 1);
      else if (event.key === 'ArrowLeft') goTo(index - 1);
      else if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const swipe = Gesture.Pan()
    .enabled(!isZoomed && count > 1)
    .maxPointers(1)
    .activeOffsetX([-ACTIVATE_X, ACTIVATE_X])
    .failOffsetY([-FAIL_Y, FAIL_Y])
    .onUpdate((e) => {
      position.set(-current.get() * width + resistEdges(e.translationX, current.get(), count));
    })
    .onEnd((e) => {
      const target = settleIndex({
        index: current.get(),
        translationX: e.translationX,
        velocityX: e.velocityX,
        width,
        count,
      });
      current.set(target);
      position.set(withTiming(-target * width, PAGE_TIMING));
      scheduleOnRN(setIndex, target);
    });

  const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() }] }));

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    if (event.nativeEvent.actionName === 'increment') goTo(index + 1);
    if (event.nativeEvent.actionName === 'decrement') goTo(index - 1);
  }

  const visible = urls
    .map((url, i) => ({ url, i }))
    .filter(({ i }) => Math.abs(i - index) <= NEIGHBOURS);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait']}>
      {/* Modals render outside the app's root view, so gestures need their own root. */}
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={swipe}>
          <Animated.View
            style={[styles.strip, stripStyle]}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={caption ? `Photo ${index + 1} of ${count}, ${caption}` : `Photo ${index + 1} of ${count}`}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={handleAccessibilityAction}>
            {visible.map(({ url, i }) => (
              <View key={url} style={[styles.slide, { width, height, left: i * width }]}>
                <ZoomablePhoto
                  url={url}
                  width={width}
                  height={height}
                  isZoomed={i === index && isZoomed}
                  onZoomChange={i === index ? setIsZoomed : noop}
                />
              </View>
            ))}
          </Animated.View>
        </GestureDetector>

        {showArrows && index > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous photo"
            style={({ hovered, pressed }) => [
              styles.arrow,
              styles.arrowLeft,
              (hovered || pressed) && styles.arrowActive,
            ]}
            onPress={() => goTo(index - 1)}>
            <Icon ios="chevron.left" material="chevron_left" size={26} color={C.white} />
          </Pressable>
        )}
        {showArrows && index < count - 1 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next photo"
            style={({ hovered, pressed }) => [
              styles.arrow,
              styles.arrowRight,
              (hovered || pressed) && styles.arrowActive,
            ]}
            onPress={() => goTo(index + 1)}>
            <Icon ios="chevron.right" material="chevron_right" size={26} color={C.white} />
          </Pressable>
        )}

        <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            style={styles.closeBtn}
            onPress={onClose}>
            <Icon ios="xmark" material="close" size={20} color={C.white} />
          </Pressable>
          <View style={styles.titleBlock} accessibilityLiveRegion="polite">
            <Text style={styles.counter}>
              {index + 1} of {count}
            </Text>
            {caption && (
              <Text style={styles.caption} numberOfLines={1}>
                {caption}
              </Text>
            )}
          </View>
          <View style={styles.closeBtn} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black, overflow: 'hidden' },
  strip: { flex: 1 },
  slide: { position: 'absolute', top: 0 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    width: 52,
    height: 52,
    marginTop: -26,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  arrowLeft: { left: 20 },
  arrowRight: { right: 20 },
  arrowActive: { backgroundColor: 'rgba(0,0,0,0.7)', transform: [{ scale: 1.06 }] },
  titleBlock: { flex: 1, alignItems: 'center', gap: 2 },
  counter: { ...T.caption, color: C.white, fontSize: 14 },
  caption: { ...T.caption, color: C.textSoft, fontSize: 13 },
});
