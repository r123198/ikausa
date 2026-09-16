import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const GRID_PHOTOS = [
  { src: require('@/assets/images/samples/trvl_1.jpg'), time: '2024-05-15 13:00', span: 'large' },
  { src: require('@/assets/images/samples/trvl_2.jpg'), time: '2024-05-15 14:15', span: 'tall' },
  { src: require('@/assets/images/samples/trvl_3.jpg'), time: '2024-05-15 16:30', span: 'small' },
  { src: require('@/assets/images/samples/trvl_4.jpg'), time: '2024-05-15 17:30', span: 'small' },
  { src: require('@/assets/images/samples/trvl_5.jpg'), time: '2024-05-15 12:30', span: 'wide' },
];

function TimeBadge({ time }: { time: string }) {
  return (
    <View style={styles.timeBadge}>
      <Text style={styles.timeBadgeText}>{time}</Text>
    </View>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Handaan ni Lola</Text>
        </View>
        <Pressable style={styles.exportBtn}>
          <Text style={styles.exportBtnLabel}>Export Roll</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.metaHeader}>
          <Text style={styles.rollLabel}>Barkada &amp; Pamilya Roll #042</Text>
          <Text style={styles.albumTitle}>The Feast of Lola's 80th</Text>
          <Text style={styles.albumDesc}>
            A shared digital scrapbook of the weekend's festivities. These moments
            are currently developing.{' '}
            <Text style={styles.tagline}>Wala pang ganap?</Text> Take more snaps!
          </Text>
        </View>

        <View style={styles.masonryGrid}>
          <View style={styles.masonryLeft}>
            <View style={[styles.photoCard, styles.photoLarge]}>
              <Image source={GRID_PHOTOS[0].src} style={styles.photoImg} contentFit="cover" />
              <TimeBadge time={GRID_PHOTOS[0].time} />
            </View>
            <View style={[styles.photoCard, styles.photoWide]}>
              <Image source={GRID_PHOTOS[4].src} style={styles.photoImg} contentFit="cover" />
              <TimeBadge time={GRID_PHOTOS[4].time} />
            </View>
          </View>
          <View style={styles.masonryRight}>
            <View style={[styles.photoCard, styles.photoTall]}>
              <Image source={GRID_PHOTOS[1].src} style={styles.photoImg} contentFit="cover" />
              <TimeBadge time={GRID_PHOTOS[1].time} />
            </View>
            <View style={[styles.photoCard, styles.photoSmall]}>
              <Image source={GRID_PHOTOS[2].src} style={styles.photoImg} contentFit="cover" />
              <TimeBadge time={GRID_PHOTOS[2].time} />
            </View>
            <View style={[styles.photoCard, styles.photoSmall]}>
              <Image source={GRID_PHOTOS[3].src} style={styles.photoImg} contentFit="cover" />
              <TimeBadge time={GRID_PHOTOS[3].time} />
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <View style={styles.filmCanister}>
              <View style={styles.canisterFill} />
              <Text style={styles.canisterLabel}>KODAK 400</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Developing the Roll...</Text>
              <Text style={styles.progressSubtext}>65% Processed · 14 Snaps remaining</Text>
            </View>
          </View>
          <View style={styles.progressActions}>
            <Pressable style={styles.addBtn}>
              <Text style={styles.addBtnLabel}>Add Photos</Text>
            </Pressable>
            <Pressable style={styles.finishBtn}>
              <Text style={styles.finishBtnLabel}>Finish Now</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: C.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: C.primary },
  headerTitle: { ...T.headlineMd, fontSize: 20, color: C.onSurface },
  exportBtn: {
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
  },
  exportBtnLabel: { ...T.bodyMd, fontWeight: '600', color: C.onPrimaryContainer },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: 24 },

  metaHeader: {
    borderLeftWidth: 2,
    borderLeftColor: C.primaryContainer,
    paddingLeft: 16,
    gap: 4,
  },
  rollLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.primary,
    marginBottom: 4,
  },
  albumTitle: {
    ...T.headlineLgMobile,
    fontSize: 28,
    fontStyle: 'italic',
    color: C.onSurface,
  },
  albumDesc: { ...T.bodyLg, color: C.onSurfaceVariant, opacity: 0.8 },
  tagline: { color: C.primary, fontStyle: 'italic' },

  masonryGrid: { flexDirection: 'row', gap: 12, height: 500 },
  masonryLeft: { flex: 1.1, gap: 12 },
  masonryRight: { flex: 0.9, gap: 12 },

  photoCard: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.surface,
    position: 'relative',
  },
  photoLarge: { flex: 2 },
  photoWide: { flex: 1 },
  photoTall: { flex: 2 },
  photoSmall: { flex: 1 },
  photoImg: { width: '100%', height: '100%' },

  timeBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeBadgeText: { ...T.label, fontSize: 10, color: C.onPrimaryFixed },

  progressCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: `${C.outline}1a`,
    gap: 16,
  },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  filmCanister: {
    width: 56,
    height: 72,
    backgroundColor: '#2d3132',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  canisterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: `${C.primary}66`,
  },
  canisterLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 7,
    color: C.primaryFixed,
    opacity: 0.6,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  progressInfo: { flex: 1, gap: 4 },
  progressTitle: { ...T.headlineMd, fontSize: 18, color: C.primaryFixed },
  progressSubtext: { ...T.bodyMd, fontSize: 13, color: C.onSurfaceVariant },
  progressActions: { flexDirection: 'row', gap: 12 },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 100,
  },
  addBtnLabel: { ...T.bodyMd, fontSize: 14, color: C.onSurface },
  finishBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: C.primary,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  finishBtnLabel: { ...T.bodyMd, fontSize: 14, fontWeight: '700', color: C.onPrimaryFixed },
});
