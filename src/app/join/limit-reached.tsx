import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

export default function LimitReachedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glowBg} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>◈</Text>
          <Text style={styles.headerTitle}>Barkada</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <View style={styles.iconCircleGrad} />
          <Text style={styles.icon}>⊘</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.eventLabel}>Brian's party</Text>
          <Text style={styles.headline}>Roll is Full</Text>
        </View>

        <Text style={styles.bodyText}>
          This film roll has reached its 5 participant limit. You can still view
          the photos once they are developed.
        </Text>

        <View style={styles.actionArea}>
          <Pressable
            style={styles.viewBtn}
            onPress={() => router.push('/developing/brians-party')}>
            <View style={styles.viewBtnShimmer} />
            <Text style={styles.viewBtnLabel}>View developing gallery</Text>
            <Text style={styles.viewBtnIcon}>→</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  glowBg: {
    position: 'absolute',
    width: 256,
    height: 256,
    top: '30%',
    left: '50%',
    marginLeft: -128,
    borderRadius: 128,
    backgroundColor: C.primary,
    opacity: 0.03,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    backgroundColor: 'rgba(19,19,19,0.8)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 20, color: C.primary },
  headerTitle: { ...T.headlineMd, fontSize: 20, color: C.primaryContainer },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outline}33`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconCircleGrad: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: C.surfaceHigh,
    opacity: 0.5,
  },
  icon: { fontSize: 48, color: C.onSurfaceVariant, position: 'relative', zIndex: 1 },

  textGroup: { alignItems: 'center', gap: 8 },
  eventLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.primary,
  },
  headline: { ...T.headlineLgMobile, color: C.onSurface, textAlign: 'center' },

  bodyText: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
  },

  actionArea: { width: '100%', paddingTop: 8 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${C.primaryFixed}80`,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  viewBtnShimmer: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  viewBtnLabel: {
    ...T.bodyMd,
    color: C.onPrimary,
    fontWeight: '500',
    position: 'relative',
    zIndex: 1,
  },
  viewBtnIcon: { fontSize: 18, color: C.onPrimary, zIndex: 1 },
});
