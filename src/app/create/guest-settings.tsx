import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const SHOT_OPTIONS = [5, 10, 16, 24, 36];
const SAMPLES = [
  require('@/assets/images/samples/trvl_3.jpg'),
  require('@/assets/images/samples/trvl_4.jpg'),
  require('@/assets/images/samples/trvl_5.jpg'),
];

export default function GuestSettingsScreen() {
  const router = useRouter();
  const [shots, setShots] = useState(24);
  const [visible, setVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtnWrap} onPress={() => router.back()}>
          <View style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>How many guests{'\n'}for your film?</Text>
        <Text style={styles.subtext}>
          Make sure all guests have a chance to take the most amazing photo from
          your event.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Up to{'\n'}5 Participants</Text>
            <Text style={styles.freeLabel}>Free</Text>
          </View>
          <View style={styles.slots}>
            <View style={styles.slotActive}>
              <Text style={styles.slotActiveIcon}>◎</Text>
            </View>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.slot} />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Shots per person</Text>

          <View style={styles.cameraWidget}>
            <View style={styles.filmCounter}>
              <Text style={styles.filmCounterIcon}>◈</Text>
              <Text style={styles.filmCounterTop}>{shots - 1}</Text>
              <View style={styles.filmCounterLine} />
              <Text style={styles.filmCounterBottom}>{shots}</Text>
            </View>
            <View style={styles.shutterBtn}>
              <View style={styles.shutterInner} />
            </View>
            <View style={styles.photoStack}>
              {SAMPLES.map((src, i) => {
                const rotations = [-12, 2, 14];
                return (
                  <Image
                    key={i}
                    source={src}
                    style={[
                      styles.photoStackItem,
                      { transform: [{ rotate: `${rotations[i]}deg` }] },
                      i === 1 && { zIndex: 10, top: 10 },
                      i === 2 && { zIndex: 5 },
                    ]}
                    contentFit="cover"
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.shotOptions}>
            {SHOT_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.shotOption, shots === opt && styles.shotOptionActive]}
                onPress={() => setShots(opt)}>
                <Text
                  style={[styles.shotOptionText, shots === opt && styles.shotOptionTextActive]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Visibility permissions</Text>
          <View style={styles.toggleRow}>
            <Switch
              value={visible}
              onValueChange={setVisible}
              trackColor={{ false: C.surfaceHighest, true: C.primaryContainer }}
              thumbColor={C.onSurface}
            />
            <Text style={styles.toggleLabel}>Everyone can see all photos.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={styles.createBtn}
          onPress={() => router.push('/create/camera-selection')}>
          <Text style={styles.createBtnLabel}>Create</Text>
          <Text style={styles.createBtnIcon}>→</Text>
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
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backIcon: { fontSize: 20, color: C.onSurface },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },

  headline: {
    ...T.headlineLgMobile,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 16,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  section: { gap: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: { ...T.headlineMd, fontSize: 26, color: C.onSurface, lineHeight: 32 },
  freeLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.onSurfaceVariant,
  },
  slots: { flexDirection: 'row', gap: 12 },
  slotActive: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: 'rgba(244,162,97,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActiveIcon: { fontSize: 20, color: C.primary },
  slot: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}66`,
    backgroundColor: C.surfaceLow,
  },

  divider: { height: 1, backgroundColor: `${C.outlineVariant}33`, marginVertical: 24 },

  sectionLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: C.onSurfaceVariant,
    marginBottom: 8,
  },

  cameraWidget: {
    height: 140,
    borderRadius: 32,
    backgroundColor: C.surfaceLowest,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  filmCounter: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}1a`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  filmCounterIcon: { fontSize: 16, color: C.onSurfaceVariant, marginBottom: 2 },
  filmCounterTop: { ...T.label, fontSize: 14, color: C.onSurface },
  filmCounterLine: { width: '100%', height: 1, backgroundColor: `${C.outlineVariant}4d` },
  filmCounterBottom: { ...T.label, fontSize: 14, color: C.onSurface },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.onSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  photoStack: {
    width: 96,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStackItem: {
    position: 'absolute',
    width: 48,
    height: 52,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: C.secondaryFixed,
  },

  shotOptions: { flexDirection: 'row', gap: 8 },
  shotOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shotOptionActive: {
    backgroundColor: 'rgba(244,162,97,0.1)',
    borderColor: C.primary,
    shadowColor: 'rgba(244,162,97,0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  shotOptionText: { ...T.label, color: C.onSurface },
  shotOptionTextActive: { color: C.primary },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleLabel: { ...T.bodyMd, fontSize: 15, color: C.onSurface },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
    backgroundImage: 'linear-gradient(to top, #131313, #131313cc, transparent)',
  },
  dots: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceHighest,
  },
  dotActive: {
    backgroundColor: C.onSurface,
    shadowColor: 'rgba(255,255,255,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    transform: [{ scale: 1.1 }],
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.onSurface,
    paddingLeft: 24,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createBtnLabel: { ...T.label, textTransform: 'uppercase', color: C.background },
  createBtnIcon: { fontSize: 18, color: C.background },
});
