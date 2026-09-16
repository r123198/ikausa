import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, Fonts, T } from '@/constants/theme';

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

  const selectedCam =
    CAMERAS.find((cam) => cam.id === selected) || CAMERAS[0];

  return (
    <View style={styles.container}>
      {/* Background Image representing the active filter */}
      <Image
        source={selectedCam.image}
        style={styles.bgImage}
        contentFit="cover"
      />

      {/* Atmospheric dark overlays for readability */}
      <View style={styles.topVignette} />
      <View style={styles.darkOverlay} />
      <View style={styles.bottomVignette} />

      <SafeAreaView style={styles.safe}>
        {/* Bare back button */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        </View>

        {/* Title & Subtext */}
        <View style={styles.titleArea}>
          <Text style={styles.headline}>
            Which camera would{'\n'}you like to use?
          </Text>
          <Text style={styles.subtext}>Choose a camera that fits your style.</Text>
        </View>

        {/* Center space revealing the full filter preview */}
        <View style={styles.centerStage} />

        {/* Bottom Section: Camera Options in One Row (side-by-side) */}
        <View style={styles.bottomSection}>
          <View style={styles.optionsRow}>
            {CAMERAS.map((cam) => {
              const isActive = selected === cam.id;
              return (
                <Pressable
                  key={cam.id}
                  style={[
                    styles.cameraCard,
                    isActive && styles.cameraCardActive,
                  ]}
                  onPress={() => setSelected(cam.id)}>
                  {/* Miniature filter thumbnail */}
                  <View style={styles.thumbnailWrap}>
                    <Image
                      source={cam.image}
                      style={styles.thumbnailImg}
                      contentFit="cover"
                    />
                    {isActive && <View style={styles.thumbnailActiveBorder} />}
                  </View>

                  {/* Camera Name */}
                  <View style={styles.cardInfo}>
                    <Text
                      style={[
                        styles.cameraName,
                        isActive && styles.cameraNameActive,
                      ]}
                      numberOfLines={1}>
                      {cam.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Continue Button */}
          <Pressable
            style={styles.continueBtn}
            onPress={() => router.push('/create/invitation-card')}>
            <Text style={styles.continueBtnLabel}>Continue</Text>
            <Text style={styles.continueBtnIcon}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },

  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  /* Vignette and atmosphere overlays */
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(19, 19, 19, 0.78)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 310,
    backgroundColor: 'rgba(19, 19, 19, 0.88)',
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },

  /* Title Area */
  titleArea: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  headline: {
    ...T.headlineLgMobile,
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtext: {
    ...T.bodyMd,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Center Stage */
  centerStage: {
    flex: 1,
  },

  /* Bottom Section with One Row Options */
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 29, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    alignItems: 'center',
    gap: 8,
  },
  cameraCardActive: {
    backgroundColor: 'rgba(255, 196, 153, 0.14)',
    borderWidth: 1.5,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },

  thumbnailWrap: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailActiveBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 10,
  },

  cardInfo: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  cameraName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cameraNameActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  /* Continue Button */
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.secondaryFixed,
    paddingVertical: 15,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueBtnLabel: {
    ...T.bodyMd,
    fontSize: 16,
    fontWeight: '700',
    color: C.onSecondaryFixed,
  },
  continueBtnIcon: {
    fontSize: 18,
    color: C.onSecondaryFixed,
  },
});
