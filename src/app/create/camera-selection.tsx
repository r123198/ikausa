import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const CAMERAS = [
  {
    id: 'disposable',
    name: 'Disposable',
    label: 'Classic',
    desc: 'Authentic grainy film look with flash',
    shots: 27,
    image: require('@/assets/images/samples/trvl_1.jpg'),
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    label: 'Instant',
    desc: 'Square format with border and faded tones',
    shots: 10,
    image: require('@/assets/images/samples/trvl_2.jpg'),
  },
  {
    id: 'pinhole',
    name: 'Pinhole',
    label: 'Artistic',
    desc: 'Dreamy vignette with long exposure look',
    shots: 12,
    image: require('@/assets/images/samples/trvl_3.jpg'),
  },
];

export default function CameraSelectionScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('disposable');

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
        <Text style={styles.headline}>Which camera would{'\n'}you like to use?</Text>
        <Text style={styles.subtext}>Choose a camera that fits your style.</Text>

        <View style={styles.cameraList}>
          {CAMERAS.map((cam) => (
            <Pressable
              key={cam.id}
              style={[styles.cameraCard, selected === cam.id && styles.cameraCardActive]}
              onPress={() => setSelected(cam.id)}>
              <View style={styles.cameraPreview}>
                <Image source={cam.image} style={styles.cameraImg} contentFit="cover" />
                <View style={styles.cameraImgOverlay} />
                <View style={styles.cameraLabelBadge}>
                  <Text style={styles.cameraLabelText}>{cam.label}</Text>
                </View>
              </View>
              <View style={styles.cameraInfo}>
                <View>
                  <Text style={styles.cameraName}>{cam.name}</Text>
                  <Text style={styles.cameraDesc}>{cam.desc}</Text>
                </View>
                <View style={styles.cameraMeta}>
                  <Text style={styles.cameraShots}>{cam.shots} shots</Text>
                  {selected === cam.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/create/invitation-card')}>
          <Text style={styles.nextBtnLabel}>Continue</Text>
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
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },
  backIcon: { fontSize: 20, color: C.onSurface },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },

  headline: {
    ...T.headlineLgMobile,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 8,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
  },

  cameraList: { gap: 16 },
  cameraCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },
  cameraCardActive: {
    borderColor: C.primary,
    backgroundColor: C.surfaceHigh,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cameraPreview: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  cameraImg: { width: '100%', height: '100%' },
  cameraImgOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cameraLabelBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cameraLabelText: { ...T.label, color: C.onSurface },
  cameraInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cameraName: { ...T.headlineMd, fontSize: 20, color: C.onSurface, marginBottom: 4 },
  cameraDesc: { ...T.bodyMd, fontSize: 14, color: C.onSurfaceVariant, lineHeight: 20 },
  cameraMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cameraShots: { ...T.label, color: C.onSurfaceVariant },
  selectedBadge: {
    backgroundColor: `${C.primary}1a`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.primary,
  },
  selectedBadgeText: { ...T.label, color: C.primary },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.secondaryFixed,
    paddingVertical: 16,
    borderRadius: 100,
  },
  nextBtnLabel: { ...T.bodyMd, fontWeight: '600', color: C.onSecondaryFixed },
  nextBtnIcon: { fontSize: 18, color: C.onSecondaryFixed },
});
