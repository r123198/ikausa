import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const PHOTOS = [
  { src: require('@/assets/images/samples/trvl_1.jpg'), author: 'You' },
  { src: require('@/assets/images/samples/trvl_2.jpg'), author: 'yebin' },
  { src: require('@/assets/images/samples/trvl_3.jpg'), author: 'brian' },
  { src: require('@/assets/images/samples/trvl_4.jpg'), author: 'ate' },
];

export default function RollScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventName = id?.replace(/-/g, ' ') ?? 'Brian\'s party';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <View style={styles.headerBtnInner}>
            <Text style={styles.headerBtnIcon}>←</Text>
          </View>
        </Pressable>
        <Pressable style={styles.headerBtn}>
          <View style={styles.headerBtnInner}>
            <Text style={styles.headerBtnIcon}>⚙</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.eventName}>{eventName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>◷</Text>
              <Text style={styles.metaText}>4d 2h left</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>◎</Text>
              <Text style={styles.metaText}>1 person joined</Text>
            </View>
          </View>
          <View style={styles.frameBox}>
            <View style={styles.frameBoxInner} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnIcon}>↓</Text>
            <Text style={styles.actionBtnLabel}>Export</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnIcon}>▦</Text>
            <Text style={styles.actionBtnLabel}>Invite</Text>
          </Pressable>
          <Pressable
            style={styles.cameraBtn}
            onPress={() => router.push('/camera/viewfinder')}>
            <Text style={styles.cameraBtnIcon}>◉</Text>
            <Text style={styles.cameraBtnLabel}>Camera</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          {PHOTOS.map((photo, i) => (
            <View key={i} style={styles.photoCard}>
              <Image source={photo.src} style={styles.photoImg} contentFit="cover" />
              <View style={styles.photoGrad} />
              <View style={styles.authorBadge}>
                <Text style={styles.authorText}>{photo.author}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerBtn: {},
  headerBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${C.outlineVariant}4d`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerBtnIcon: { fontSize: 20, color: C.onSurface },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 48 },

  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLeft: { gap: 8, flex: 1 },
  eventName: { ...T.headlineLgMobile, color: C.onSurface },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaIcon: { fontSize: 18, color: C.onSurfaceVariant, opacity: 0.8 },
  metaText: { ...T.bodyMd, color: C.onSurfaceVariant },
  frameBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}66`,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32,31,31,0.5)',
  },
  frameBoxInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    backgroundColor: `${C.surfaceLowest}cc`,
  },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}4d`,
  },
  actionBtnIcon: { fontSize: 16, color: C.onSurface },
  actionBtnLabel: { ...T.bodyMd, color: C.onSurface, fontWeight: '500' },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.secondaryFixed,
    shadowColor: 'rgba(230,226,214,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  cameraBtnIcon: { fontSize: 18, color: C.onSecondaryFixed },
  cameraBtnLabel: { ...T.bodyMd, fontWeight: '700', color: C.onSecondaryFixed },

  divider: { height: 1, backgroundColor: `${C.outlineVariant}4d`, marginBottom: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: {
    width: '47.5%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surfaceLow,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  photoImg: { width: '100%', height: '100%' },
  photoGrad: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'transparent',
  },
  authorBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(19,19,19,0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  authorText: {
    ...T.label,
    color: C.inverseSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
