import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const STATS = [
  { value: '12', label: 'Rolls' },
  { value: '247', label: 'Photos' },
  { value: '8', label: 'Friends' },
];

const RECENT = [
  require('@/assets/images/samples/trvl_1.jpg'),
  require('@/assets/images/samples/trvl_2.jpg'),
  require('@/assets/images/samples/trvl_3.jpg'),
  require('@/assets/images/samples/trvl_4.jpg'),
  require('@/assets/images/samples/trvl_5.jpg'),
  require('@/assets/images/samples/trvl_1.jpg'),
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>Y</Text>
          </View>
          <Text style={styles.name}>yebin</Text>
          <Text style={styles.handle}>@yen.k</Text>

          <View style={styles.statsRow}>
            {STATS.map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.editBtn}>
              <Text style={styles.editBtnLabel}>Edit Profile</Text>
            </Pressable>
            <Pressable style={styles.settingsBtn}>
              <Text style={styles.settingsBtnIcon}>⚙</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          <Pressable onPress={() => router.push('/gallery/tagaytay-trip')}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.photoGrid}>
          {RECENT.map((src, i) => (
            <View key={i} style={styles.photoCell}>
              <Image source={src} style={styles.photoImg} contentFit="cover" />
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges</Text>
        </View>

        <View style={styles.badgeRow}>
          {['🎞️', '📷', '🌟', '🎬'].map((emoji, i) => (
            <View key={i} style={styles.badgeCard}>
              <Text style={styles.badgeEmoji}>{emoji}</Text>
              <Text style={styles.badgeLabel}>{['Film Buff', 'Sharpshooter', 'Star Shot', 'Debut'][i]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 120 },

  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 3,
    borderColor: `${C.primary}33`,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  avatarText: { ...T.headlineLgMobile, color: C.onPrimary },
  name: { ...T.headlineMd, color: C.onSurface },
  handle: { ...T.label, color: C.onSurfaceVariant, marginBottom: 8 },

  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
    marginBottom: 16,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...T.bodyLg, fontWeight: '700', color: C.onSurface },
  statLabel: { ...T.label, color: C.onSurfaceVariant },

  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceHigh,
  },
  editBtnLabel: { ...T.bodyMd, fontWeight: '500', color: C.onSurface },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnIcon: { fontSize: 18, color: C.onSurfaceVariant },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { ...T.headlineMd, fontSize: 18, color: C.onSurface },
  viewAll: { ...T.label, color: C.primary, textTransform: 'uppercase', letterSpacing: 1 },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 6,
    marginBottom: 24,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.surfaceLow,
  },
  photoImg: { width: '100%', height: '100%' },

  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    flexWrap: 'wrap',
  },
  badgeCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    minWidth: '22%',
  },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: { ...T.label, color: C.onSurfaceVariant, textAlign: 'center' },
});
