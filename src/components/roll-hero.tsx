import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CoverImage } from '@/components/cover-image';
import { C, T } from '@/constants/theme';

const HERO_HEIGHT_RATIO = 0.52;
const HERO_MAX_HEIGHT = 520;

export interface HeroStat {
  value: string;
  label: string;
}

interface RollHeroProps {
  cover: string | null;
  /** Local image to show instead of `cover`, e.g. while designing a new roll. */
  coverSource?: ImageSource | number;
  eyebrow?: string;
  title: string;
  stats: HeroStat[];
}

/** Full-bleed cover fading into the page, with a centered serif title and italic stats. */
export function RollHero({ cover, coverSource, eyebrow, title, stats }: RollHeroProps) {
  const { height } = useWindowDimensions();
  const heroHeight = Math.min(height * HERO_HEIGHT_RATIO, HERO_MAX_HEIGHT);

  return (
    <View style={{ height: heroHeight }}>
      {coverSource ? (
        <Image source={coverSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <CoverImage cover={cover} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['rgba(15,15,16,0.15)', 'rgba(15,15,16,0.35)', C.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.text}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
  },
  eyebrow: { ...T.eyebrow, color: 'rgba(255,255,255,0.75)' },
  title: {
    ...T.headlineLgMobile,
    fontSize: 36,
    lineHeight: 42,
    color: C.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: 10 },
  stat: { alignItems: 'center', gap: 2, minWidth: 80 },
  statValue: { ...T.italic, fontSize: 24, lineHeight: 30, color: C.white },
  statLabel: { ...T.caption, fontSize: 14, color: C.textSoft },
});
