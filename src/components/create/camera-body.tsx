import { StyleSheet, View } from 'react-native';

import { C } from '@/constants/theme';
import type { Film } from '@/lib/film/films';

/** Tiny illustrated camera for the film picker; Original is drawn as a phone. */
export function CameraBody({ film, isSelected }: { film: Film; isSelected: boolean }) {
  const isPhone = film.lut === null;

  return (
    <View
      style={[
        styles.body,
        { backgroundColor: film.body },
        isSelected ? styles.selected : styles.idle,
      ]}>
      {isPhone ? (
        <>
          <View style={styles.phoneLenses}>
            <View style={styles.phoneLens} />
            <View style={styles.phoneLens} />
            <View style={styles.phoneLens} />
          </View>
          <View style={styles.phoneLogo} />
        </>
      ) : (
        <>
          <View style={[styles.stripe, { backgroundColor: film.stripe }]} />
          <View style={styles.flash} />
          <View style={styles.lensRing}>
            <View style={styles.lens} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    width: 72,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', opacity: 0.75 },
  selected: { borderWidth: 2.5, borderColor: C.white },
  stripe: { position: 'absolute', left: 0, right: 0, top: 16, height: 12 },
  flash: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 14,
    height: 7,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  lensRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#111',
    borderWidth: 3,
    borderColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lens: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2c3440' },
  phoneLenses: { position: 'absolute', left: 10, bottom: 8, flexDirection: 'row', flexWrap: 'wrap', width: 18, gap: 2 },
  phoneLens: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1c1c1e' },
  phoneLogo: { width: 12, height: 12, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.12)', marginLeft: 18 },
});
