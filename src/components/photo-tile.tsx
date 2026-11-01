import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text } from 'react-native';

import { C, T } from '@/constants/theme';

interface PhotoTileProps {
  url: string;
  authorName: string;
  width: number;
  height: number;
  onPress: () => void;
}

/** Rounded photo with the photographer's name tucked into the top-left corner. */
export function PhotoTile({ url, authorName, width, height, onPress }: PhotoTileProps) {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo by ${authorName}`}
      style={({ pressed }) => [styles.tile, { width, height }, pressed && styles.pressed]}
      onPress={onPress}>
      <Image
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
      <Text style={styles.author} numberOfLines={1}>
        {authorName}
      </Text>
    </Pressable>
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
  pressed: { opacity: 0.8 },
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
