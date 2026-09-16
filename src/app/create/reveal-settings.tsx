import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const SAMPLES = [
  require('@/assets/images/samples/trvl_1.jpg'),
  require('@/assets/images/samples/trvl_2.jpg'),
];

const OPTIONS = [
  { id: 'during', icon: '⏹', label: 'During\nEvent' },
  { id: 'after', icon: '⏱', label: 'After\nEvent' },
  { id: 'delay', icon: '⏰', label: 'Additional\nDelay' },
];

export default function RevealSettingsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('during');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtnWrap} onPress={() => router.back()}>
          <View style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.headline}>When should we reveal{'\n'}your photos?</Text>
          <Text style={styles.subtext}>
            Photos are hidden by default during the event. You can select when the
            photos will be revealed.
          </Text>
        </View>

        <View style={styles.photoCards}>
          <View style={[styles.photoCard, { transform: [{ rotate: '-2deg' }] }]}>
            <Image source={SAMPLES[0]} style={styles.photoCardImg} contentFit="cover" />
            <Text style={styles.photoCardLabel}>Yen.K</Text>
          </View>
          <View style={[styles.photoCard, { transform: [{ rotate: '2deg' }], marginTop: 16 }]}>
            <Image source={SAMPLES[1]} style={styles.photoCardImg} contentFit="cover" />
            <Text style={styles.photoCardLabel}>Brian.S</Text>
          </View>
        </View>

        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.optCard, selected === opt.id && styles.optCardActive]}
              onPress={() => setSelected(opt.id)}>
              <Text style={[styles.optIcon, selected === opt.id && styles.optIconActive]}>
                {opt.icon}
              </Text>
              <Text style={[styles.optLabel, selected === opt.id && styles.optLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/create/guest-settings')}>
          <Text style={styles.nextBtnLabel}>Next</Text>
          <Text style={styles.nextBtnIcon}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  backBtnWrap: {},
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: C.onSurface },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  top: { alignItems: 'center', marginBottom: 24 },
  headline: {
    ...T.headlineLgMobile,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 12,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },

  photoCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  photoCardImg: { width: '100%', height: '100%' },
  photoCardLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    ...T.bodyMd,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  optionsGrid: { flexDirection: 'row', gap: 12 },
  optCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: C.surface,
  },
  optCardActive: {
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.outline,
  },
  optIcon: { fontSize: 24, color: C.outline },
  optIconActive: { color: C.onSurface },
  optLabel: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    lineHeight: 22,
  },
  optLabelActive: { color: C.onSurface },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceHighest,
  },
  dotActive: { backgroundColor: C.onSurface },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.secondaryFixed,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
  nextBtnLabel: {
    ...T.label,
    textTransform: 'uppercase',
    color: C.onSecondaryFixed,
  },
  nextBtnIcon: { fontSize: 16, color: C.onSecondaryFixed },
});
