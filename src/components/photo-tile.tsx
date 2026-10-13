import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { C, T } from '@/constants/theme';

interface PhotoTileProps {
  url: string;
  authorName: string;
  width: number;
  height: number;
}

/** Rounded photo with the photographer's name tucked into the top-left corner. */
export function PhotoTile({ url, authorName, width, height }: PhotoTileProps) {
  return (
    <View style={[styles.tile, { width, height }]}>
      <Image
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`Photo by ${authorName}`}
      />
      <Text style={styles.author} numberOfLines={1}>
        {authorName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  author: {
    ...T.caption,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
    paddingTop: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
