import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { C, T } from '@/constants/theme';

interface AvatarProps {
  url: string | null;
  name: string;
  size?: number;
}

export function Avatar({ url, name, size = 72 }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`${name}'s profile photo`}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42, lineHeight: size * 0.52 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryContainer,
  },
  initial: { ...T.headlineMd, color: C.onPrimaryContainer },
});
