import { useRouter } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { FilmsArt, RevealArt, StackArt } from '@/components/onboarding/slide-art';
import { C, T } from '@/constants/theme';
import { markOnboardingSeen } from '@/lib/onboarding';

/** Widths from here up get the tablet layout: a centred column and bigger artwork. */
const TABLET_MIN_WIDTH = 600;
const COLUMN_MAX_WIDTH = 560;
const TABLET_ART_SCALE = 1.4;

interface Slide {
  key: string;
  art: (scale: number) => ReactNode;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'roll',
    art: (scale) => <StackArt scale={scale} />,
    title: 'One roll.\nEvery phone.',
    body: 'Start a roll for your party, wedding or trip. Friends join with a link or QR code and shoot from their own phones.',
  },
  {
    key: 'film',
    art: (scale) => <FilmsArt scale={scale} />,
    title: 'Shoot on\nreal film.',
    body: 'Pick a look for the whole roll: Disposable, Polaroid, Pinhole or clean Original. Every shot develops the same way.',
  },
  {
    key: 'reveal',
    art: (scale) => <RevealArt scale={scale} />,
    title: 'Nobody peeks\nuntil the end.',
    body: 'Shots stay hidden while the roll runs. When it ends, everything develops at once and everyone gets the album to keep.',
  },
];

/** First-launch slides, shown once per install before sign-in. */
export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const isTablet = width >= TABLET_MIN_WIDTH;
  const artScale = isTablet ? TABLET_ART_SCALE : 1;
  // Everything sits in one centred column so controls don't drift to the edges of a wide screen.
  const column = { width: '100%' as const, maxWidth: COLUMN_MAX_WIDTH, alignSelf: 'center' as const };

  function finish(mode: 'sign-in' | 'sign-up') {
    markOnboardingSeen();
    router.replace({ pathname: '/sign-in', params: { mode } });
  }

  function next() {
    if (isLast) {
      finish('sign-up');
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(page, 0), SLIDES.length - 1));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.topBar, column]}>
        <Logo size={36} />
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          onPress={() => finish('sign-in')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.slideColumn, column]}>
              {item.art(artScale)}
              <View style={styles.copy}>
                <Text style={[styles.title, isTablet && styles.titleTablet]} accessibilityRole="header">
                  {item.title}
                </Text>
                <Text style={[styles.body, isTablet && styles.bodyTablet]}>{item.body}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, column]}>
        <View
          style={styles.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.next, pressed && styles.pressed]}
          onPress={next}>
          <Text style={styles.nextLabel}>{isLast ? 'Get started' : 'Next'}</Text>
          <Icon ios="arrow.right" material="arrow_forward" size={16} color={C.onPrimary} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}
        onPress={() => finish('sign-in')}>
        <Text style={styles.signInText}>
          Already have an account? <Text style={styles.signInLink}>Sign in</Text>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  pressed: { opacity: 0.85 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skip: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { ...T.bodyMd, fontSize: 15, fontWeight: '600', color: C.textSoft },

  slide: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  slideColumn: { gap: 36 },
  copy: { gap: 14 },
  title: { ...T.headlineLg, fontSize: 38, lineHeight: 44 },
  titleTablet: { fontSize: 48, lineHeight: 56 },
  body: { ...T.bodyLg, fontSize: 17, lineHeight: 26, color: C.textSoft },
  bodyTablet: { fontSize: 20, lineHeight: 30 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  dotActive: { width: 22, backgroundColor: C.primary },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: C.primary,
  },
  nextLabel: { ...T.bodyMd, fontWeight: '700', color: C.onPrimary },

  signIn: { alignSelf: 'center', paddingVertical: 14 },
  signInText: { ...T.bodyMd, fontSize: 15, color: C.textMuted },
  signInLink: { color: C.primary, fontWeight: '700' },
});
