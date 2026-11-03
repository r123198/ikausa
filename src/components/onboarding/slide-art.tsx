import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { FannedPhotos } from '@/components/fanned-photos';
import { C, T } from '@/constants/theme';
import { filmById } from '@/lib/film/films';

const ART_HEIGHT = 260;
const PRINT_WIDTH = 104;
const PRINT_RATIO = 1.25;
const REVEAL_BLUR = 14;
const FAN_SIZE = 150;

interface ArtProps {
  /** 1 on phones; larger on tablets so the artwork fills the wider column. */
  scale?: number;
}

/** A roll's last shots fanned out like prints: the home-screen motif, big. */
export function StackArt({ scale = 1 }: ArtProps) {
  const { samples } = filmById('original');
  return (
    <View style={[styles.art, { height: ART_HEIGHT * scale }]} accessible={false}>
      <FannedPhotos urls={samples} size={FAN_SIZE * scale} />
    </View>
  );
}

const FILM_TILTS = ['-6deg', '0deg', '6deg'];
const FILM_IDS = ['disposable', 'polaroid', 'pinhole'];

/** Three film stocks side by side, each with its own look applied. */
export function FilmsArt({ scale = 1 }: ArtProps) {
  const printStyle = { width: PRINT_WIDTH * scale };
  return (
    <View style={[styles.art, styles.row, { height: ART_HEIGHT * scale }]} accessible={false}>
      {FILM_IDS.map((id, i) => {
        const film = filmById(id);
        return (
          <View
            key={id}
            style={[styles.print, printStyle, { transform: [{ rotate: FILM_TILTS[i] }] }]}>
            <Image source={film.samples[0]} style={styles.printPhoto} contentFit="cover" />
            <Text style={styles.printLabel} numberOfLines={1}>
              {film.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Two shots still "undeveloped" next to one that has come through, with the countdown chip. */
export function RevealArt({ scale = 1 }: ArtProps) {
  const { samples } = filmById('polaroid');
  const printStyle = { width: PRINT_WIDTH * scale };
  return (
    <View style={[styles.art, styles.row, { height: ART_HEIGHT * scale }]} accessible={false}>
      {samples.map((sample, i) => {
        const isRevealed = i === 1;
        return (
          <View
            key={i}
            style={[styles.print, printStyle, isRevealed ? styles.printRaised : styles.printSunk]}>
            <Image
              source={sample}
              style={styles.printPhoto}
              contentFit="cover"
              blurRadius={isRevealed ? 0 : REVEAL_BLUR}
            />
            {!isRevealed && <View style={styles.printVeil} />}
          </View>
        );
      })}
      <View style={styles.chip}>
        <Text style={styles.chipText}>Reveals in 2h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { height: ART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  print: {
    width: PRINT_WIDTH,
    padding: 6,
    paddingBottom: 10,
    gap: 8,
    borderRadius: 10,
    backgroundColor: C.white,
  },
  printRaised: { transform: [{ translateY: -14 }, { rotate: '2deg' }] },
  printSunk: { transform: [{ translateY: 10 }] },
  printPhoto: { width: '100%', aspectRatio: 1 / PRINT_RATIO, borderRadius: 4 },
  printVeil: {
    ...StyleSheet.absoluteFill,
    margin: 6,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(15,15,16,0.35)',
  },
  printLabel: {
    ...T.italic,
    fontSize: 15,
    lineHeight: 18,
    color: C.black,
    textAlign: 'center',
  },
  chip: {
    position: 'absolute',
    bottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.primary,
  },
  chipText: { ...T.italic, fontSize: 16, lineHeight: 20, color: C.onPrimary },
});
