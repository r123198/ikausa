import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const ROLLS = [
  {
    id: 'brians-party',
    name: "Brian's party",
    status: 'active',
    photos: 3,
    capacity: 24,
    members: 1,
    image: require('@/assets/images/samples/trvl_1.jpg'),
  },
  {
    id: 'handaan-ni-lola',
    name: 'Handaan ni Lola',
    status: 'developing',
    photos: 18,
    capacity: 24,
    members: 5,
    image: require('@/assets/images/samples/trvl_2.jpg'),
  },
  {
    id: 'tagaytay-trip',
    name: 'Tagaytay Trip',
    status: 'ready',
    photos: 27,
    capacity: 27,
    members: 4,
    image: require('@/assets/images/samples/trvl_3.jpg'),
  },
];

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  developing: 'Developing',
  ready: 'Ready',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#4ade80',
  developing: '#fbbf24',
  ready: '#60a5fa',
};

export default function RollsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rolls</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{ROLLS.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {ROLLS.map((roll) => (
          <Pressable
            key={roll.id}
            style={styles.rollCard}
            onPress={() => router.push(`/roll/${roll.id}`)}>
            <View style={styles.rollImgWrap}>
              <Image source={roll.image} style={styles.rollImg} contentFit="cover" />
              <View style={styles.rollImgOverlay} />
              <View style={styles.filmPerf}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.filmPerfHole} />
                ))}
              </View>
            </View>

            <View style={styles.rollBody}>
              <View style={styles.rollTop}>
                <Text style={styles.rollName}>{roll.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[roll.status] }]} />
              </View>

              <Text style={styles.statusLabel}>{STATUS_LABEL[roll.status]}</Text>

              <View style={styles.rollMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{roll.photos}</Text>
                  <Text style={styles.metaLabel}>Photos</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{roll.members}</Text>
                  <Text style={styles.metaLabel}>Members</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{roll.capacity}</Text>
                  <Text style={styles.metaLabel}>Capacity</Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(roll.photos / roll.capacity) * 100}%` as `${number}%` },
                  ]}
                />
              </View>
            </View>
          </Pressable>
        ))}
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
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: { ...T.headlineMd, color: C.onSurface },
  countBadge: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },
  countText: { ...T.label, color: C.onSurfaceVariant },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: 16 },

  rollCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  rollImgWrap: { height: 160, position: 'relative' },
  rollImg: { width: '100%', height: '100%' },
  rollImgOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  filmPerf: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    gap: 4,
  },
  filmPerfHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  rollBody: { padding: 16, gap: 10 },
  rollTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rollName: { ...T.headlineMd, fontSize: 18, color: C.onSurface },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { ...T.label, textTransform: 'uppercase', letterSpacing: 1.5, color: C.onSurfaceVariant },

  rollMeta: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flex: 1, alignItems: 'center', gap: 2 },
  metaValue: { ...T.bodyMd, fontWeight: '600', color: C.onSurface },
  metaLabel: { ...T.label, color: C.onSurfaceVariant },
  metaDivider: { width: 1, height: 28, backgroundColor: `${C.outlineVariant}33` },

  progressBar: {
    height: 3,
    backgroundColor: `${C.outlineVariant}33`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 2,
  },
});
