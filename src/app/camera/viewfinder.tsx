import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

export default function ViewfinderScreen() {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      <SafeAreaView style={styles.safeInner}>
        <View style={styles.topBar}>
          <Text style={styles.eventName}>Pista sa Nayon</Text>
          <View style={styles.shotCounter}>
            <Text style={styles.shotCounterText}>12/24 shots left</Text>
            <Text style={styles.filmIcon}>◈</Text>
          </View>
        </View>

        <View style={styles.viewfinder}>
          <Image
            source={require('@/assets/images/samples/trvl_1.jpg')}
            style={styles.viewfinderImg}
            contentFit="cover"
          />
          <View style={styles.vignette} />
          <View style={styles.grain} />
        </View>

        <View style={styles.controls}>
          <View style={styles.filmRoll}>
            <View style={styles.filmRollBox}>
              <View style={styles.filmRollPerfs}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={styles.filmRollPerf} />
                ))}
              </View>
              <View style={styles.filmRollCenter}>
                <Text style={styles.filmCountTop}>12</Text>
                <View style={styles.filmCountDivider} />
                <Text style={styles.filmCountBottom}>24</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.shutter} onPress={() => {}}>
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable
            style={styles.galleryBtn}
            onPress={() => router.push('/gallery/current')}>
            <View style={styles.galleryStack}>
              <View style={[styles.galleryCard, styles.galleryCard3]} />
              <View style={[styles.galleryCard, styles.galleryCard2]} />
              <View style={[styles.galleryCard, styles.galleryCard1]}>
                <Image
                  source={require('@/assets/images/samples/trvl_2.jpg')}
                  style={styles.galleryCardImg}
                  contentFit="cover"
                />
              </View>
            </View>
            <Text style={styles.galleryLabel}>View developed{'\n'}photos</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1c1c1e' },
  safeInner: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  eventName: {
    fontFamily: 'HankenGrotesk',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#fff',
  },
  shotCounter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shotCounterText: {
    fontFamily: 'HankenGrotesk',
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  filmIcon: { fontSize: 20, color: '#9ca3af', opacity: 0.8 },

  viewfinder: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  viewfinderImg: { width: '100%', height: '100%', opacity: 0.9 },
  vignette: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    borderRadius: 16,
  },
  grain: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.03 },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 32,
    height: 128,
  },

  filmRoll: { width: 64, alignItems: 'center' },
  filmRollBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filmRollPerfs: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filmRollPerf: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 1,
  },
  filmRollCenter: { alignItems: 'center', paddingLeft: 8 },
  filmCountTop: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  filmCountDivider: { width: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 2 },
  filmCountBottom: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#9ca3af',
  },

  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  shutterInner: {
    flex: 1,
    width: '100%',
    borderRadius: 36,
    backgroundColor: '#fff',
  },

  galleryBtn: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  galleryStack: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCard: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: '#1c1c1e',
  },
  galleryCard3: { transform: [{ rotate: '6deg' }] },
  galleryCard2: { transform: [{ rotate: '-3deg' }], borderColor: 'rgba(255,255,255,0.8)' },
  galleryCard1: {
    borderColor: '#fff',
    zIndex: 10,
    overflow: 'hidden',
  },
  galleryCardImg: { width: '100%', height: '100%' },
  galleryLabel: {
    fontFamily: 'HankenGrotesk',
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 14,
  },
});
