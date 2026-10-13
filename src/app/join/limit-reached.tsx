import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';

export default function LimitReachedScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glowBg} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <View style={styles.iconCircleGrad} />
          <Icon ios="person.2.slash" material="group_off" size={44} color={C.onSurfaceVariant} />
        </View>

        <View style={styles.textGroup}>
          {name && <Text style={styles.eventLabel}>{name}</Text>}
          <Text style={styles.headline}>Roll is full</Text>
        </View>

        <Text style={styles.bodyText}>
          This roll has reached its participant limit. Ask the host if they can make room for
          you.
        </Text>

        <View style={styles.actionArea}>
          <Pressable
            accessibilityRole="button"
            style={styles.viewBtn}
            onPress={() => router.replace('/')}>
            <View style={styles.viewBtnShimmer} />
            <Text style={styles.viewBtnLabel}>Back to home</Text>
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
});
