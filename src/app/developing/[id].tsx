import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

export default function DevelopingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventName = id?.replace(/-/g, ' ') ?? 'Brian\'s party';

  return (
    <View style={styles.safe}>
      <View style={styles.glow} />
      <SafeAreaView style={styles.safeInner}>
        <View style={styles.header}>
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back to Ganap</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>◉</Text>
            <Text style={styles.badgeText}>{eventName}</Text>
          </View>

          <Text style={styles.headline}>Film is Developing</Text>

          <View style={styles.timerRing}>
            <View style={styles.timerRingOuter}>
              <View style={styles.timerRingInner}>
                <Text style={styles.timerHours}>23</Text>
                <Text style={styles.timerSep}>:</Text>
                <Text style={styles.timerHours}>47</Text>
              </View>
            </View>
            <View style={styles.timerLabels}>
              <Text style={styles.timerLabel}>hours</Text>
              <Text style={styles.timerLabel}>mins</Text>
            </View>
          </View>

          <Text style={styles.subtext}>
            The event has ended. We're carefully developing the shots in the
            darkroom—check back soon to see the full roll!
          </Text>

          <Pressable style={styles.notifyBtn}>
            <Text style={styles.notifyIcon}>◎</Text>
            <Text style={styles.notifyLabel}>Notify me when ready</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  glow: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    top: '10%',
    left: '10%',
    borderRadius: 9999,
    backgroundColor: C.primaryContainer,
    opacity: 0.05,
    transform: [{ scaleX: 1.5 }],
  },
  safeInner: { flex: 1 },

  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow: { fontSize: 18, color: C.onSurfaceVariant },
  backLabel: {
    ...T.label,
    textTransform: 'uppercase',
    color: C.onSurfaceVariant,
    letterSpacing: 1.5,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
    gap: 24,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}4d`,
    backgroundColor: C.surfaceLow,
  },
  badgeIcon: { fontSize: 14, color: C.primary },
  badgeText: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.onSurfaceVariant,
  },

  headline: {
    ...T.headlineLgMobile,
    color: C.onSurface,
    textAlign: 'center',
  },

  timerRing: { alignItems: 'center', gap: 8 },
  timerRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: `${C.primaryContainer}33`,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  timerRingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerHours: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 40,
    color: C.onSurface,
    letterSpacing: -1,
  },
  timerSep: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 32,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  timerLabels: {
    flexDirection: 'row',
    gap: 32,
    paddingHorizontal: 24,
  },
  timerLabel: { ...T.label, color: C.onSurfaceVariant, letterSpacing: 1.5 },

  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },

  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.secondaryFixed,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  notifyIcon: { fontSize: 20, color: C.onSecondaryFixed },
  notifyLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onSecondaryFixed,
  },
});
