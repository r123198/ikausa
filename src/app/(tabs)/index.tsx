import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const SAMPLES = [
  require('@/assets/images/samples/trvl_1.jpg'),
  require('@/assets/images/samples/trvl_2.jpg'),
  require('@/assets/images/samples/trvl_3.jpg'),
  require('@/assets/images/samples/trvl_4.jpg'),
  require('@/assets/images/samples/trvl_5.jpg'),
];

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerIcon}>⬡</Text>
        <Text style={styles.headerTitle}>Handaan ni Lola</Text>
      </View>
      <Pressable style={styles.exportBtn}>
        <Text style={styles.exportBtnLabel}>Export Roll</Text>
      </Pressable>
    </View>
  );
}

interface CollageCardProps {
  source: any;
  title: string;
  height?: number;
  flex?: number;
  aspectRatio?: number;
  style?: any;
  onPress?: () => void;
}

function CollageCard({
  source,
  title,
  height,
  flex,
  aspectRatio,
  style,
  onPress,
}: CollageCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.collageCard,
        height !== undefined && { height },
        flex !== undefined && { flex },
        aspectRatio !== undefined && { aspectRatio },
        pressed && styles.cardPressed,
        style,
      ]}
      onPress={onPress}>
      <Image source={source} style={styles.cardImage} contentFit="cover" />
      <View style={styles.scrimOverlay}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

function HeroMemoryCard() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.heroCard,
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push('/gallery/bora-trip')}>
      <Image source={SAMPLES[0]} style={styles.heroImg} contentFit="cover" />

      {/* Decorative film perforations along top edge */}
      <View style={styles.heroPerfTrack}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.heroPerfHole} />
        ))}
      </View>

      {/* In-image label scrim */}
      <View style={styles.heroScrim}>
        <Text style={styles.heroTitle} numberOfLines={1}>
          Bora Trip 2024
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Featured Hero Memory */}
        <HeroMemoryCard />

        {/* Functional Button in gap */}
        <View style={styles.functionalRow}>
          <Pressable
            style={styles.functionalPill}
            onPress={() => router.push('/gallery/bora-trip')}>
            <Text style={styles.functionalPillText}>View Roll →</Text>
          </Pressable>
        </View>

        {/* Uneven Block 1: Tall Portrait (Left) + 2 Stacked Cards (Right) */}
        <View style={styles.collageRow}>
          <CollageCard
            source={SAMPLES[1]}
            title="Lola's 80th"
            flex={1.15}
            height={290}
            onPress={() => router.push('/gallery/bora-trip')}
          />

          <View style={styles.stackedCol}>
            <CollageCard
              source={SAMPLES[2]}
              title="Feast Table"
              height={144}
              onPress={() => router.push('/gallery/bora-trip')}
            />
            <CollageCard
              source={SAMPLES[3]}
              title="Barkada Toast"
              height={144}
              onPress={() => router.push('/gallery/bora-trip')}
            />
          </View>
        </View>

        {/* Panoramic Memory Breaker */}
        <CollageCard
          source={SAMPLES[4]}
          title="Family Gathering at Sunset"
          height={180}
          onPress={() => router.push('/gallery/bora-trip')}
        />

        {/* Uneven Block 2: 2 Stacked Cards (Left) + Tall Portrait (Right) */}
        <View style={styles.collageRow}>
          <View style={styles.stackedCol}>
            <CollageCard
              source={SAMPLES[0]}
              title="White Beach"
              height={144}
              onPress={() => router.push('/gallery/bora-trip')}
            />
            <CollageCard
              source={SAMPLES[2]}
              title="Sunset Docks"
              height={144}
              onPress={() => router.push('/gallery/bora-trip')}
            />
          </View>

          <CollageCard
            source={SAMPLES[3]}
            title="Ate's Wedding"
            flex={1.15}
            height={290}
            onPress={() => router.push('/gallery/bora-trip')}
          />
        </View>

        {/* Functional Button in gap */}
        <View style={styles.functionalRow}>
          <Pressable
            style={styles.functionalPill}
            onPress={() => router.push('/gallery/album')}>
            <Text style={styles.functionalPillText}>View Album →</Text>
          </Pressable>
        </View>

        {/* Triplet Row (1:1 tight mosaic) */}
        <View style={styles.tripletRow}>
          <CollageCard
            source={SAMPLES[1]}
            title="Cebu Walk"
            flex={1}
            aspectRatio={1}
            onPress={() => router.push('/gallery/bora-trip')}
          />
          <CollageCard
            source={SAMPLES[4]}
            title="Night Market"
            flex={1}
            aspectRatio={1}
            onPress={() => router.push('/gallery/bora-trip')}
          />
          <CollageCard
            source={SAMPLES[2]}
            title="Island Pier"
            flex={1}
            aspectRatio={1}
            onPress={() => router.push('/gallery/bora-trip')}
          />
        </View>

        {/* Closing Full-Bleed Card */}
        <CollageCard
          source={SAMPLES[0]}
          title="Bora Shoreline"
          height={180}
          onPress={() => router.push('/gallery/bora-trip')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 110,
    gap: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: `${C.background}ee`,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 20, color: C.primary },
  headerTitle: { ...T.headlineMd, fontSize: 20, color: C.onSurface },
  exportBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  exportBtnLabel: {
    ...T.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: C.onPrimary,
  },

  /* Functional Buttons in the gap */
  functionalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  functionalPill: {
    backgroundColor: 'rgba(32, 31, 31, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  functionalPillText: {
    ...T.bodyMd,
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
    letterSpacing: 0.2,
  },

  /* Hero Memory Card */
  heroCard: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  heroImg: { width: '100%', height: '100%' },
  heroPerfTrack: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.35,
  },
  heroPerfHole: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  heroTitle: {
    ...T.headlineMd,
    fontSize: 20,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* Collage Layout - tight 2px hairline gaps */
  collageRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'stretch',
  },
  stackedCol: {
    flex: 1,
    gap: 2,
    justifyContent: 'space-between',
  },
  tripletRow: {
    flexDirection: 'row',
    gap: 2,
  },

  /* Collage Card */
  collageCard: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: C.surface,
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardImage: { width: '100%', height: '100%' },
  scrimOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(10,10,10,0.52)',
  },
  cardTitle: {
    ...T.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});


