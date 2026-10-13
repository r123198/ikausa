import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { C } from '@/constants/theme';

const SLOTS = 3;
const ROTATIONS = ['-10deg', '-4deg', '4deg'];
const OFFSETS = [0, 14, 28];

interface FannedPhotosProps {
  /** Most recent first: remote/file uris or bundled images. Missing slots render blank. */
  urls: (string | number)[];
  size?: number;
}

/** The last few shots fanned out like prints, newest on top. */
export function FannedPhotos({ urls, size = 52 }: FannedPhotosProps) {
  const recent = urls.slice(0, SLOTS);
  // Draw oldest first so the newest ends up on top.
  const slots = Array.from({ length: SLOTS }, (_, i) => recent[SLOTS - 1 - i] ?? null);

  return (
    <View style={{ width: size + OFFSETS[SLOTS - 1], height: size * 1.2 }}>
      {slots.map((url, i) => (
        <View
          key={i}
          style={[
            styles.card,
            {
              width: size,
              height: size * 1.2,
              left: OFFSETS[i],
              transform: [{ rotate: ROTATIONS[i] }],
            },
          ]}>
          {url !== null && (
            <Image
              source={typeof url === 'string' ? { uri: url } : url}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.cardRaised,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },
});
